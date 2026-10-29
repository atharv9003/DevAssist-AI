"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Code2,
  FileCode,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  GitBranch,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Terminal,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Filter,
} from "lucide-react";
import { PageHeader, LoadingSpinner } from "@/components/ui/shared";
import { apiFetch } from "@/lib/api";

interface SearchResponse {
  query: string;
  top_k: number;
  repo_name?: string | null;
  context: string;
}

interface RepositoryItem {
  id: number;
  full_name: string;
  is_active: boolean;
}

interface ParsedChunk {
  file: string;
  code: string;
  language: string;
  lineRange?: string;
}

function detectLanguage(filePath: string): string {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "javascript";
  if (filePath.endsWith(".py")) return "python";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".sql")) return "sql";
  return "text";
}

function cleanDisplayPath(rawPath: string): string {
  const match = rawPath.match(/(?:repos[\\/][a-f0-9]+|local_repo)[\\/](.+)$/i);
  if (match) return match[1].replace(/\\/g, "/");
  return rawPath.replace(/\\/g, "/");
}

function parseContextChunks(contextStr: string): ParsedChunk[] {
  if (!contextStr) return [];
  const parts = contextStr.split("--- File: ");
  const chunks: ParsedChunk[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(" ---");
    if (separatorIndex !== -1) {
      const rawFile = trimmed.slice(0, separatorIndex).trim();
      const file = cleanDisplayPath(rawFile);
      const code = trimmed.slice(separatorIndex + 4).trim();
      chunks.push({
        file,
        code,
        language: detectLanguage(file),
      });
    } else {
      chunks.push({
        file: "Code Snippet",
        code: trimmed,
        language: "text",
      });
    }
  }

  return chunks;
}

export default function CodeSearchPage() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPathIndex, setCopiedPathIndex] = useState<number | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load repositories from backend
  useEffect(() => {
    async function fetchRepos() {
      try {
        const repos = await apiFetch<RepositoryItem[]>("/api/v3/repositories");
        setRepositories(repos);
        if (repos.length > 0 && !selectedRepo) {
          setSelectedRepo(repos[0].full_name);
        }
      } catch {
        setRepositories([{ id: 1, full_name: "atharv9003/transitops", is_active: true }]);
        setSelectedRepo("atharv9003/transitops");
      }
    }
    fetchRepos();
  }, []);

  // URL query parameter support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const r = params.get("repo");
      if (r) setSelectedRepo(r);
      if (q) {
        setQuery(q);
        handleSearch(q, r || undefined);
      }
    }
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categorizedSuggestions = [
    { label: "Auth & Security", query: "user login jwt token authentication and validation" },
    { label: "Pricing Logic", query: "fare calculation and pricing formula" },
    { label: "Database ORM", query: "database models schema and query optimization" },
    { label: "Vulnerabilities", query: "input sanitization and sql injection mitigation" },
  ];

  async function handleSearch(searchQuery?: string, repoOverride?: string) {
    const q = searchQuery ?? query;
    if (!q.trim()) return;
    if (searchQuery) setQuery(searchQuery);

    setLoading(true);
    setError(null);
    setResults(null);
    const startTime = performance.now();

    const targetRepo = repoOverride ?? selectedRepo;

    try {
      const data = await apiFetch<SearchResponse>("/api/v3/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          top_k: topK,
          repo_name: targetRepo || undefined,
        }),
        timeoutMs: 120_000,
      });
      setResults(data);
      setSearchTime(Math.round(performance.now() - startTime));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to execute semantic search";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(code: string, idx: number) {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleCopyPath(path: string, idx: number) {
    navigator.clipboard.writeText(path);
    setCopiedPathIndex(idx);
    setTimeout(() => setCopiedPathIndex(null), 2000);
  }

  const chunks = results ? parseContextChunks(results.context) : [];

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Codebase Semantic Search"
        subtitle="Dense vector embeddings combined with AST boundary chunking to query repository architecture, business logic, and security rules."
        icon={Database}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-primary/10 text-primary border border-primary/20 font-medium">
            <Sparkles className="h-3 w-3" />
            Hybrid RAG
          </span>
        }
      />

      {/* Query Engine Box */}
      <div className="dev-card p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-4"
        >
          {/* Controls Bar: Repo & Top-K */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-muted-foreground font-mono text-[11px]">TARGET REPO:</span>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer font-mono"
              >
                {repositories.length === 0 && (
                  <option value="atharv9003/transitops">atharv9003/transitops</option>
                )}
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                FAISS Vector Index Synced
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Context Chunks:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="rounded border border-border bg-muted/60 px-2 py-1 text-foreground text-xs focus:outline-none cursor-pointer font-mono"
              >
                <option value={2}>k = 2 chunks</option>
                <option value={3}>k = 3 chunks</option>
                <option value={5}>k = 5 chunks</option>
                <option value={8}>k = 8 chunks</option>
                <option value={10}>k = 10 chunks</option>
              </select>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask a natural language query about ${selectedRepo || "the codebase"}... (Press '/' to focus)`}
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-28 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Retrieving</span>
                </>
              ) : (
                <>
                  <span>Query RAG</span>
                </>
              )}
            </button>
          </div>

          {/* Query Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">SUGGESTIONS:</span>
            {categorizedSuggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSearch(item.query)}
                className="rounded bg-muted/60 border border-border px-2.5 py-1 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors font-mono text-[11px] cursor-pointer"
              >
                <span className="text-foreground/70 font-semibold">{item.label}:</span>{" "}
                <span className="text-muted-foreground">{item.query.slice(0, 28)}…</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="dev-card p-10 text-center space-y-3">
          <LoadingSpinner size="lg" label="Searching AST vector embeddings..." />
          <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto">
            Computing dense semantic similarity with FAISS vector index & expanding syntax AST boundaries
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {results && !loading && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <span>
                Retrieved <strong className="text-foreground font-mono">{chunks.length}</strong> matching AST chunks from{" "}
                <strong className="text-primary font-mono">{results.repo_name || selectedRepo}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
              {searchTime !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {searchTime}ms
                </span>
              )}
              <span>FAISS &bull; all-MiniLM-L6-v2</span>
            </div>
          </div>

          <div className="space-y-4">
            {chunks.map((chunk, idx) => (
              <div key={idx} className="dev-card overflow-hidden border-border">
                {/* File Header Bar */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-mono text-foreground font-medium truncate">
                      {chunk.file}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase bg-background px-1.5 py-0.2 rounded border border-border">
                      {chunk.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyPath(chunk.file, idx)}
                      className="hidden sm:flex items-center gap-1 rounded bg-background border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-mono"
                      title="Copy file path"
                    >
                      {copiedPathIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Path Copied</span>
                        </>
                      ) : (
                        <span>Copy Path</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(chunk.code, idx)}
                      className="flex items-center gap-1 rounded bg-background border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer font-mono"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Body with Developer Formatting */}
                <div className="p-4 bg-muted/20 overflow-x-auto text-xs font-mono text-foreground/90 leading-relaxed">
                  <pre className="grid grid-cols-1 gap-0">
                    <code>{chunk.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="dev-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              Syntax-Aware AST Chunking
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Splits code along functions, classes, and interface definitions rather than arbitrary token breaks.
            </p>
          </div>
          <div className="dev-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-cyan-500" />
              Repository-Scoped Index
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Filter searches by specific microservice or repository without cross-contaminating retrieval context.
            </p>
          </div>
          <div className="dev-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              Automated PR Grounding
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provides the exact grounding context ingested by Gemini 2.5 during automated PR code reviews.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
