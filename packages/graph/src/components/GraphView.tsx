import React, { useMemo, useRef, useState } from 'react';
import { useDocumentStore } from '@catnoted/editor';
import { parseDocumentGraph } from '../utils/parser.js';
import { ForceGraph, ForceGraphRef } from './ForceGraph.js';
import { GraphNode } from '@catnoted/shared';
import { Network, Info, Download, Filter, Check, X } from 'lucide-react';

interface GraphViewProps {
  onNavigateToNode: (nodeId: string) => void;
}

type FilterType = 'all' | 'page' | 'tag';

export const GraphView: React.FC<GraphViewProps> = ({ onNavigateToNode }) => {
  const { blocks, pages } = useDocumentStore();
  const graphRef = useRef<ForceGraphRef>(null);
  const [filterType, setFilterType] = useState<FilterType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('catnoted:graph-filter');
      if (saved === 'all' || saved === 'page' || saved === 'tag') {
        return saved;
      }
    }
    return 'all';
  });

  const [pngStatus, setPngStatus] = useState<'idle' | 'success' | 'failure'>('idle');
  const [svgStatus, setSvgStatus] = useState<'idle' | 'success' | 'failure'>('idle');

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('catnoted:graph-filter', type);
    }
  };

  const { nodes, edges } = useMemo(() => {
    const parsed = parseDocumentGraph(blocks, pages);

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
    if (pngStatus !== 'idle') return;
    const success = graphRef.current?.exportPNG();
    if (success) {
      setPngStatus('success');
    } else {
      setPngStatus('failure');
    }
    setTimeout(() => setPngStatus('idle'), 2000);
  };

  const handleExportSVG = () => {
    if (svgStatus !== 'idle') return;
    const success = graphRef.current?.exportSVG();
    if (success) {
      setSvgStatus('success');
    } else {
      setSvgStatus('failure');
    }
    setTimeout(() => setSvgStatus('idle'), 2000);
  };

  // Determine if canvas is effectively empty (only root node or no edges)
  const isEmpty = edges.length === 0;

  return (
    <div className="flex flex-col gap-4 h-full p-4">
      {/* Header bar and stats */}
      <div className="flex items-center justify-between px-2 flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-500" />
            Knowledge Graph Visualizer
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Bidirectional page link connections extracted dynamically from document blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-1 text-xs">
            <Filter className="w-3.5 h-3.5 mx-2 text-slate-400" />
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'all' ? 'bg-slate-100 dark:bg-zinc-800 font-medium' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500'}`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('page')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'page' ? 'bg-slate-100 dark:bg-zinc-800 font-medium' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500'}`}
            >
              Pages
            </button>
            <button
              onClick={() => handleFilterChange('tag')}
              className={`px-2 py-1 rounded-lg transition-colors ${filterType === 'tag' ? 'bg-slate-100 dark:bg-zinc-800 font-medium' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500'}`}
            >
              Tags
            </button>
          </div>

          {/* Stats */}
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

          {/* Export Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              onClick={handleExportPNG}
              disabled={pngStatus !== 'idle'}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                pngStatus === 'success'
                  ? 'text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30'
                  : pngStatus === 'failure'
                  ? 'text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
              title="Export as PNG"
            >
              {pngStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Saved</span>
                </>
              ) : pngStatus === 'failure' ? (
                <>
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </>
              )}
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800"></div>
            <button
              onClick={handleExportSVG}
              disabled={svgStatus !== 'idle'}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                svgStatus === 'success'
                  ? 'text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30'
                  : svgStatus === 'failure'
                  ? 'text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
              title="Export as SVG"
            >
              {svgStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Saved</span>
                </>
              ) : svgStatus === 'failure' ? (
                <>
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG</span>
                </>
              )}
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
          <div className="absolute bottom-4 left-4 p-3 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm max-w-xs text-[10px] text-slate-400 dark:text-zinc-500 pointer-events-none flex gap-2">
            <Info className="w-4 h-4 shrink-0 text-indigo-500" />
            <p>
              Drag nodes to change structure. Use scroll to zoom. Click node to navigate to the respective node reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
