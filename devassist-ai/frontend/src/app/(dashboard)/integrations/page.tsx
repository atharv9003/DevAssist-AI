"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Plus, Trash2, Shield, Settings, Server, Terminal, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/shared";
import { useDashboardStore } from "@/lib/stores/dashboardStore";

const SUGGESTED_INTEGRATIONS = [
  { name: "Notion", domain: "mcp.notion.com", icon: "N", command: "npx", args: "-y @modelcontextprotocol/server-notion" },
  { name: "Linear", domain: "mcp.linear.app", icon: "L", command: "npx", args: "-y @modelcontextprotocol/server-linear" },
  { name: "GitHub", domain: "mcp.github.com", icon: "G", command: "npx", args: "-y @modelcontextprotocol/server-github" },
  { name: "Sentry", domain: "mcp.sentry.dev", icon: "S", command: "npx", args: "-y @modelcontextprotocol/server-sentry" },
];

export default function Integrations() {
  const { mcpServers, loadingMcp, fetchMcpServers, addMcpServer, removeMcpServer } = useDashboardStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMcpServers();
  }, [fetchMcpServers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !command) {
      setError("Name and command are required.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await addMcpServer({
        name,
        transport_type: "stdio",
        command,
        args: args ? JSON.stringify(args.split(" ")) : "[]",
      });
      setName("");
      setCommand("");
      setArgs("");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  };

  const handleAddSuggested = async (suggested: typeof SUGGESTED_INTEGRATIONS[0]) => {
    setError(null);
    try {
      await addMcpServer({
        name: suggested.name.toLowerCase(),
        transport_type: "stdio",
        command: suggested.command,
        args: JSON.stringify(suggested.args.split(" ")),
      });
    } catch (err) {
      alert("Failed to add suggested integration: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this MCP server connection?")) {
      try {
        await removeMcpServer(id);
      } catch (err) {
        alert("Failed to remove server: " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Model Context Protocol (MCP)"
        subtitle="Manage stdio/SSE external context servers and developer tooling bridges for automated code reviews."
        icon={Server}
        action={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddForm ? "Cancel" : "Add MCP Server"}</span>
          </button>
        }
      />

      {showAddForm && (
        <div className="dev-card p-5 animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Register Custom MCP Server
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect external tools via local stdio process execution
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Server Name
              </label>
              <input
                type="text"
                placeholder="e.g., local-db, sentry, linear"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                  Executable Command
                </label>
                <input
                  type="text"
                  placeholder="e.g., node, python, npx"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                  Arguments (Space separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., -y @mcp/server-github"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-xs items-center font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground transition-colors cursor-pointer disabled:opacity-60"
              >
                {adding ? "Connecting..." : "Register Server"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information Banner */}
      <div className="dev-card p-4 flex gap-3 items-start border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Model Context Protocol (MCP) server connections enable DevAssist's multi-agent review pipeline to dynamically query external developer context (issue trackers, databases, log servers) during code analysis.
        </p>
      </div>

      <Tabs defaultValue="mcp" className="w-full">
        <TabsList className="bg-muted p-1 mb-4 rounded-lg border border-border">
          <TabsTrigger value="mcp" className="text-xs font-medium px-3.5 py-1.5">
            Active MCP Servers ({mcpServers.length})
          </TabsTrigger>
          <TabsTrigger value="suggested" className="text-xs font-medium px-3.5 py-1.5">
            Suggested Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mcp" className="space-y-4">
          {loadingMcp ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner label="Loading active MCP servers..." />
            </div>
          ) : mcpServers.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No MCP servers registered"
              description="Register an external MCP context server (like Notion, Linear, or GitHub) to give DevAssist AI enriched issue tracking and documentation context."
              action={
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register First Server</span>
                </button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {mcpServers.map((server) => (
                <div key={server.id} className="dev-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <Terminal className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-foreground font-mono truncate">{server.name}</h3>
                        <span className="text-[10px] font-mono font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                          Active stdio
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                        {server.command} {server.args ? JSON.parse(server.args).join(" ") : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(server.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Remove Server"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="grid gap-3 sm:grid-cols-2">
          {SUGGESTED_INTEGRATIONS.map((integration) => {
            const isInstalled = mcpServers.some((s) => s.name === integration.name.toLowerCase());
            return (
              <div key={integration.name} className="dev-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border text-foreground font-bold text-sm shrink-0">
                    {integration.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-foreground truncate">{integration.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{integration.domain}</p>
                  </div>
                </div>
                {isInstalled ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddSuggested(integration)}
                    className="flex items-center gap-1 rounded-md border border-border bg-card hover:bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Quick Add</span>
                  </button>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
