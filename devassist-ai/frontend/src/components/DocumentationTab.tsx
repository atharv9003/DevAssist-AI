"use client";

import { useEffect, useState } from "react";
import { FileCode2, CheckCircle2, XCircle, FileText, ChevronRight, Copy, Check } from "lucide-react";
import { EmptyState } from "./ui/shared";

interface DocItem {
  file: string;
  updated_code: string;
  markdown: string;
  changes_made: number;
  items_documented: string[];
}

export function DocumentationTab({
  reviewId,
  isCompleted,
}: {
  reviewId: number;
  isCompleted: boolean;
}) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isCompleted) {
      setLoading(false);
      return;
    }

    fetch(`/api/v3/reviews/${reviewId}/documentation`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocs(data);
          if (data.length > 0) {
            setSelectedDoc(data[0]);
          }
        } else {
          setDocs([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch documentation:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [reviewId, isCompleted]);

  const handleCopy = () => {
    if (selectedDoc) {
      navigator.clipboard.writeText(selectedDoc.updated_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isCompleted) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || docs.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No Documentation Updates Needed"
        description="All modified functions and classes in this pull request already have complete docstrings and type annotations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: File List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase font-mono px-1">
            Generated Docstrings ({docs.length})
          </h3>
          <div className="space-y-1.5">
            {docs.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedDoc?.file === doc.file
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <FileText
                  className={`h-4 w-4 shrink-0 ${
                    selectedDoc?.file === doc.file ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <div className="overflow-hidden min-w-0 flex-1">
                  <p className="text-xs font-mono font-medium truncate text-foreground">
                    {doc.file}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {doc.changes_made} item(s) documented
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="dev-card overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary">
                  <FileCode2 className="h-4 w-4" />
                  <span>{selectedDoc.file}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-mono"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span>Copied</span>
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
              <div className="p-4 overflow-auto bg-muted/20 max-h-[500px]">
                <pre className="text-xs font-mono text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedDoc.updated_code}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center border border-border border-dashed rounded-lg bg-muted/10 p-6 text-center">
              <p className="text-xs text-muted-foreground font-mono">
                Select a file from the list to view generated documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
