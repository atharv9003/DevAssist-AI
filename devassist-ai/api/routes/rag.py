import os
import asyncio
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import get_db_session
from rag.retriever import CodebaseRetriever
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

def _get_repo_index_path(repo_name: str) -> str:
    """Generate deterministic FAISS index directory for a repository."""
    clean_name = repo_name.replace("/", "_").replace("\\", "_")
    return os.path.join("data", "faiss_index", clean_name)

@router.post("/search", response_model=RAGSearchResponse)
async def search_rag(req: RAGSearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search codebase context using Hybrid RAG vector index with repository scoping and AI synthesis."""
    try:
        settings = get_settings()
        index_path = settings.FAISS_INDEX_PATH
        
        # If a specific repository is selected, check if a dedicated or general index exists
        if req.repo_name:
            repo_specific_path = _get_repo_index_path(req.repo_name)
            if os.path.exists(repo_specific_path) and os.path.exists(os.path.join(repo_specific_path, "index.faiss")):
                index_path = repo_specific_path
            else:
                # Fallback to default index (which was built from the active repository)
                index_path = settings.FAISS_INDEX_PATH

        retriever = CodebaseRetriever(index_path=index_path)
        context = await asyncio.to_thread(retriever.get_context, req.query, k=req.top_k)

        answer = None
        if req.generate_answer and context.strip():
            try:
                router = LLMRouter()
                prompt = (
                    f"You are DevAssist AI, an expert software architect and technical lead.\n"
                    f"The user has asked the following question about the repository '{req.repo_name or 'the codebase'}':\n\n"
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
                    metadata={"query": req.query, "repo": req.repo_name or ""}
                )
                llm_resp = await asyncio.to_thread(router.generate, llm_req)
                if llm_resp and llm_resp.success and llm_resp.content:
                    answer = llm_resp.content
            except Exception as llm_err:
                logger.warning(f"RAG answer synthesis failed: {llm_err}")
                answer = None

        return RAGSearchResponse(
            query=req.query,
            top_k=req.top_k,
            repo_name=req.repo_name,
            context=context,
            answer=answer,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")

@router.get("/search", response_model=RAGSearchResponse)
async def search_rag_get(
    q: str = Query(..., description="Semantic search query"),
    k: int = Query(3, description="Number of chunks"),
    repo: Optional[str] = Query(None, description="Repository full name, e.g. atharv9003/transitops")
):
    """GET endpoint to search codebase context directly via browser URL."""
    return await search_rag(RAGSearchRequest(query=q, top_k=k, repo_name=repo))
