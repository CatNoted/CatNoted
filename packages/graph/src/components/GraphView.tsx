import React, { useMemo } from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { parseDocumentGraph } from '../utils/parser.js';
import { ForceGraph } from './ForceGraph.js';
import { GraphNode } from '@catnoted/shared';
import { Network, Info } from 'lucide-react';

interface GraphViewProps {
  onNavigateToNode: (nodeLabel: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onNavigateToNode }) => {
  const { blocks } = useDocumentStore();

  const { nodes, edges } = useMemo(() => {
    return parseDocumentGraph(blocks);
  }, [blocks]);

  const handleNodeClick = (node: GraphNode) => {
    if (node.id === 'root-doc-node') return;
    // Extract label title (removing emoji)
    const cleanLabel = node.label.replace(/^[📄#]\s*/, '');
    onNavigateToNode(cleanLabel);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header bar and stats */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-500" />
            Knowledge Graph Visualizer
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Bidirectional page link connections extracted dynamically from document blocks.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-slate-400">Nodes: </span>
            <span className="font-semibold">{nodes.length}</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800"></div>
          <div>
            <span className="text-slate-400">Edges: </span>
            <span className="font-semibold">{edges.length}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Force Graph */}
      <div className="h-[60vh] relative min-h-[400px]">
        <ForceGraph 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={handleNodeClick} 
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm max-w-xs text-[10px] text-slate-400 dark:text-zinc-500 pointer-events-none flex gap-2">
          <Info className="w-4 h-4 shrink-0 text-indigo-500" />
          <p>
            Drag nodes to change structure. Use scroll to zoom. Click node to navigate to the respective node reference.
          </p>
        </div>
      </div>
    </div>
  );
};
