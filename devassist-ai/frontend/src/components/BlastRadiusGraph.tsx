"use client";

import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, Node, Edge, MarkerType, Panel } from "reactflow";
import "reactflow/dist/style.css";
import { AlertTriangle, FileCode2, Network } from "lucide-react";

interface BlastRadiusGraphProps {
  changedFiles: string[];
  affectedFiles: string[];
  callers: Record<string, string[]>;
}

export function BlastRadiusGraph({
  changedFiles,
  affectedFiles,
  callers,
}: BlastRadiusGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Create nodes for changed files (Roots)
    changedFiles.forEach((file, index) => {
      initialNodes.push({
        id: file,
        position: { x: 40, y: 40 + index * 90 },
        data: {
          label: (
            <div className="flex items-center gap-2 px-2.5 py-1.5 font-mono text-xs font-semibold text-rose-500 dark:text-rose-400">
              <FileCode2 className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[200px]">{file}</span>
            </div>
          ),
        },
        style: {
          background: "rgba(244, 63, 94, 0.12)",
          border: "1px solid rgba(244, 63, 94, 0.35)",
          borderRadius: "8px",
          color: "currentColor",
        },
      });
    });

    // Create nodes for affected files
    affectedFiles.forEach((file, index) => {
      if (!initialNodes.find((n) => n.id === file)) {
        initialNodes.push({
          id: file,
          position: { x: 380, y: 40 + index * 90 },
          data: {
            label: (
              <div className="flex items-center gap-2 px-2.5 py-1.5 font-mono text-xs font-semibold text-orange-500 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[200px]">{file}</span>
              </div>
            ),
          },
          style: {
            background: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.35)",
            borderRadius: "8px",
            color: "currentColor",
          },
        });
      }
    });

    // Create edges based on callers / dependencies
    Object.entries(callers).forEach(([symbol, callerList], idx) => {
      changedFiles.forEach((changed) => {
        affectedFiles.forEach((affected) => {
          const edgeId = `e-${changed}-${affected}-${idx}`;
          if (!initialEdges.find((e) => e.source === changed && e.target === affected)) {
            initialEdges.push({
              id: edgeId,
              source: changed,
              target: affected,
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 1.75 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#6366f1",
              },
            });
          }
        });
      });
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [changedFiles, affectedFiles, callers]);

  return (
    <div className="h-[400px] w-full rounded-xl border border-border bg-card/60 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-transparent"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(148, 163, 184, 0.15)" gap={16} />
        <Controls className="fill-foreground bg-card border-border shadow-xs" />
        <Panel
          position="top-left"
          className="bg-card/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-md m-3 font-mono text-xs"
        >
          <div className="flex items-center gap-2 mb-2 font-semibold text-foreground">
            <Network className="h-3.5 w-3.5 text-primary" />
            <span className="uppercase text-[11px] tracking-wider">Dependency Graph</span>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Direct Modified Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Blast Radius Impact</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
