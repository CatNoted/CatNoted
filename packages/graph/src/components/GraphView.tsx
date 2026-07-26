import React, { useMemo, useRef, useState } from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { parseDocumentGraph } from '../utils/parser.js';
import { ForceGraph, ForceGraphRef } from './ForceGraph.js';
import { GraphNode } from '@catnoted/shared';
import { Network, Info, Download, Filter } from 'lucide-react';

interface GraphViewProps {
  onNavigateToNode: (nodeId: string) => void;
}

type FilterType = 'all' | 'page' | 'tag';

export const GraphView: React.FC<GraphViewProps> = ({ onNavigateToNode }) => {
  const { blocks, pages, deletedPages } = useDocumentStore();
  const graphRef = useRef<ForceGraphRef>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const { nodes, edges } = useMemo(() => {
    const deletedSet = new Set((deletedPages || []).map(p => p.id));
    const parsed = parseDocumentGraph(blocks, pages, deletedSet);

    // Apply filters
    if (filterType === 'all') {
      return parsed;
    }

    const filteredNodes = parsed.nodes.filter(n => n.id === 'root-doc-node' || n.type === filterType);
    const validNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = parsed.edges.filter(e => {
      const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
      return validNodeIds.has(srcId) && validNodeIds.has(tgtId);
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [blocks, filterType]);

  const handleNodeClick = (node: GraphNode) => {
    onNavigateToNode(node.id);
  };

  const handleExportPNG = () => {
    graphRef.current?.exportPNG();
  };

  const handleExportSVG = () => {
    graphRef.current?.exportSVG();
  };

  // Determine if canvas is effectively empty (only root node or no edges)
  const isEmpty = edges.length === 0;

  return (
    <div className="flex flex-col gap-4 h-full p-4">
      {/* Header bar and stats */}
      <div className="flex items-center justify-between px-2 flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Knowledge Graph Visualizer
          </h1>
          <p className="text-xs text-muted-foreground">
            Bidirectional page link connections extracted dynamically from document blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-card rounded-xl border border-border p-1 text-xs">
            <Filter className="w-3.5 h-3.5 mx-2 text-muted-foreground" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'all' ? 'bg-muted font-medium' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('page')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'page' ? 'bg-muted font-medium' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              Pages
            </button>
            <button
              onClick={() => setFilterType('tag')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'tag' ? 'bg-muted font-medium' : 'hover:bg-muted/50 text-muted-foreground'}`}
            >
              Tags
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl border border-border text-xs">
            <div>
              <span className="text-muted-foreground">Nodes: </span>
              <span className="font-semibold">{nodes.length}</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div>
              <span className="text-muted-foreground">Edges: </span>
              <span className="font-semibold">{edges.length}</span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border text-xs">
            <button
              onClick={handleExportPNG}
              className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              title="Export as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </button>
            <div className="h-4 w-px bg-border"></div>
            <button
              onClick={handleExportSVG}
              className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              title="Export as SVG"
            >
              <Download className="w-3.5 h-3.5" />
              SVG
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Force Graph */}
      <div className="flex-1 relative min-h-[400px]">
        <ForceGraph 
          nodes={nodes} 
          edges={edges} 
          onNodeClick={handleNodeClick} 
        />
        
        {/* Info Overlay */}
        {!isEmpty && (
          <div className="absolute bottom-4 left-4 p-3 bg-card/95 border border-border rounded-xl shadow-sm max-w-xs text-[10px] text-muted-foreground pointer-events-none flex gap-2">
            <Info className="w-4 h-4 shrink-0 text-primary" />
            <p>
              Drag nodes to change structure. Use scroll to zoom. Click node to navigate to the respective node reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
