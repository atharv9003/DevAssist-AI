import os
import asyncio
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import get_db_session
from models.entities import Repository
from models.repositories import RepositoryRepo
from rag.retriever import CodebaseRetriever
from rag.hybrid_retriever import HybridRetriever
from rag.embeddings import get_embedding_model
from core.config import get_settings
from core.logger import get_logger
from llm.router import LLMRouter
from llm.schemas import LLMRequest

logger = get_logger("api.routes.rag")

router = APIRouter(prefix="/rag", tags=["RAG"])

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 3
    repo_name: Optional[str] = None
    generate_answer: bool = True

class RAGSearchResponse(BaseModel):
    query: str
    top_k: int
    repo_name: Optional[str] = None
    context: str
    answer: Optional[str] = None

async def _retrieve_context_for_repo(
    repo_name: Optional[str],
    query: str,
    top_k: int,
    session: AsyncSession
) -> tuple[str, Optional[str]]:
    """Retrieve code chunks accurately scoped to the requested repository."""
    settings = get_settings()
    repo_entity = None
    target_repo_name = repo_name.strip() if repo_name else None

    # 1. Lookup repository in database
    if target_repo_name:
        stmt = (
            select(Repository)
            .where(func.lower(Repository.full_name) == target_repo_name.lower())
            .order_by(Repository.is_active.desc(), Repository.id.desc())
            .limit(1)
        )
        res = await session.execute(stmt)
        repo_entity = res.scalar_one_or_none()
    else:
        # Fall back to first active repository if no repository specified
        active_repos = await RepositoryRepo.get_all_active(session)
        if active_repos:
            repo_entity = active_repos[0]
            target_repo_name = repo_entity.full_name

    # 2. Try loading hybrid RAG v2 index for this repository (dense + BM25)
    if repo_entity:
        rag_v2_dir = os.path.join("data", "rag_v2", f"repo_{repo_entity.id}")
        dense_index_file = os.path.join(rag_v2_dir, "dense", "index.faiss")
        if os.path.exists(dense_index_file):
            try:
                embeddings = get_embedding_model()
                retriever = HybridRetriever(embeddings)
                loaded = await asyncio.to_thread(retriever.load, rag_v2_dir)
                if loaded and retriever.is_built:
                    results = await asyncio.to_thread(retriever.retrieve, query, k=top_k)
                    if results:
                        parts = []
                        for r in results:
                            c = r.chunk
                            header = f"--- File: {c.file_path} ---"
                            meta_tags = []
                            if c.symbol_name:
                                meta_tags.append(f"symbol: {c.symbol_name}")
                            if c.start_line and c.end_line:
                                meta_tags.append(f"lines: {c.start_line}-{c.end_line}")
                            if meta_tags:
                                header += f"\n# [{', '.join(meta_tags)}]"
                            parts.append(f"{header}\n{c.content}")
                        return "\n\n".join(parts), target_repo_name
            except Exception as e:
                logger.warning(f"Failed to load HybridRetriever for repo {repo_entity.id}: {e}")

    # 3. Check legacy per-repo FAISS directory: data/faiss_index/{clean_name}
    if target_repo_name:
        clean_name = target_repo_name.replace("/", "_").replace("\\", "_")
        repo_faiss_path = os.path.join("data", "faiss_index", clean_name)
        if os.path.exists(os.path.join(repo_faiss_path, "index.faiss")):
            try:
                retriever = CodebaseRetriever(index_path=repo_faiss_path)
                context = await asyncio.to_thread(retriever.get_context, query, k=top_k)
                if context.strip():
                    return context, target_repo_name
            except Exception as e:
                logger.warning(f"Failed to query legacy FAISS index at {repo_faiss_path}: {e}")

    # 4. Only use default TransitOps index if explicitly asking for TransitOps or no specific repo
    if not target_repo_name or "transitops" in target_repo_name.lower():
        default_index = settings.FAISS_INDEX_PATH
        if os.path.exists(os.path.join(default_index, "index.faiss")):
            try:
                retriever = CodebaseRetriever(index_path=default_index)
                context = await asyncio.to_thread(retriever.get_context, query, k=top_k)
                return context, target_repo_name or "atharv9003/transitops"
            except Exception as e:
                logger.warning(f"Failed to query default FAISS index: {e}")

    # 5. If repository is recognized but index is not ready yet:
    if repo_entity:
        try:
            from workers.rag_worker import update_repo_rag_index
            update_repo_rag_index.delay(repo_entity.id)
        except Exception:
            pass
        return (
            f"Repository '{target_repo_name}' is currently being indexed by DevAssist AI. "
            f"AST chunking and vector indexing are running in the background. Please retry in a few moments.",
            target_repo_name
        )

    return (
        f"No vector index found for repository '{target_repo_name}'. "
        f"Please add and synchronize this repository in DevAssist AI to query its codebase.",
        target_repo_name
    )

@router.post("/search", response_model=RAGSearchResponse)
async def search_rag(req: RAGSearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search codebase context using Hybrid RAG vector index with repository scoping and AI synthesis."""
    try:
        context, resolved_repo = await _retrieve_context_for_repo(
            req.repo_name,
            req.query,
            req.top_k,
            session
        )

        answer = None
        has_real_context = (
            context.strip()
            and not context.startswith("Repository '")
            and not context.startswith("No vector index found")
        )

        if req.generate_answer and has_real_context:
            try:
                router = LLMRouter()
                prompt = (
                    f"You are DevAssist AI, an expert software architect and technical lead.\n"
                    f"The user has asked the following question about the repository '{resolved_repo or req.repo_name or 'the codebase'}':\n\n"
                    f"Question: {req.query}\n\n"
                    f"Here are the most relevant code and documentation chunks retrieved from the repository index:\n"
                    f"```\n{context[:6000]}\n```\n\n"
                    f"Instructions:\n"
                    f"1. Directly answer and explain the user's question clearly based on the retrieved code and documentation.\n"
                    f"2. Mention key files, architectural components, tech stack, and business logic involved where appropriate.\n"
                    f"3. Structure your response with clean Markdown (headings, bullet points, code snippets if helpful).\n"
                    f"4. Be concise, authoritative, and direct."
                )
                llm_req = LLMRequest(
                    task_type="general",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    metadata={"query": req.query, "repo": resolved_repo or req.repo_name or ""}
                )
                llm_resp = await asyncio.to_thread(router.generate, llm_req)
                if llm_resp and llm_resp.success and llm_resp.content:
                    answer = llm_resp.content
            except Exception as llm_err:
                logger.warning(f"RAG answer synthesis failed: {llm_err}")
                answer = None
        elif not has_real_context:
            answer = context

        return RAGSearchResponse(
            query=req.query,
            top_k=req.top_k,
            repo_name=resolved_repo or req.repo_name,
            context=context,
            answer=answer,
        )
    except Exception as e:
        logger.error(f"RAG search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")

@router.get("/search", response_model=RAGSearchResponse)
async def search_rag_get(
    q: str = Query(..., description="Semantic search query"),
    k: int = Query(3, description="Number of chunks"),
    repo: Optional[str] = Query(None, description="Repository full name, e.g. atharv9003/keploy"),
    session: AsyncSession = Depends(get_db_session)
):
    """GET endpoint to search codebase context directly via browser URL."""
    return await search_rag(RAGSearchRequest(query=q, top_k=k, repo_name=repo), session=session)
