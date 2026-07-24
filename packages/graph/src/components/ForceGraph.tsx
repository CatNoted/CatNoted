import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GraphNode, GraphEdge } from '@catnoted/shared';

export interface ForceGraphRef {
  exportPNG: () => void;
  exportSVG: () => void;
}

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
}

interface PhysNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const ForceGraph = forwardRef<ForceGraphRef, ForceGraphProps>(({
  nodes: inputNodes,
  edges,
  onNodeClick
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<PhysNode[]>([]);
  const dragNodeRef = useRef<PhysNode | null>(null);

  // Use refs for rapidly changing values to prevent re-renders and animation loop restarts
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 300, y: 250 });
  const scaleRef = useRef(1);
  const hoverNodeRef = useRef<PhysNode | null>(null);

  // Keep track of all known positions even if filtered out
  const knownPositionsRef = useRef<Record<string, {x: number, y: number}>>({});

  // Initialize known positions from localStorage only once
  useEffect(() => {
    const persistedStr = localStorage.getItem('catnoted:graph-positions');
    if (persistedStr) {
      try {
        const persisted = JSON.parse(persistedStr);
        knownPositionsRef.current = { ...persisted, ...knownPositionsRef.current };
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Sync input nodes to physics simulation references
  useEffect(() => {
    const existing = new Map(nodesRef.current.map(n => [n.id, n]));
    
    nodesRef.current = inputNodes.map((n) => {
      const prev = existing.get(n.id);
      if (prev) return { ...prev, label: n.label, type: n.type };

      const saved = knownPositionsRef.current[n.id];
      const startX = saved ? saved.x : 300 + (Math.random() - 0.5) * 150;
      const startY = saved ? saved.y : 250 + (Math.random() - 0.5) * 150;

      return {
        ...n,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        radius: n.type === 'page' ? 8 : 6
      };
    });
  }, [inputNodes]);

  const savePositions = () => {
    nodesRef.current.forEach(n => {
      knownPositionsRef.current[n.id] = { x: n.x, y: n.y };
    });
    localStorage.setItem('catnoted:graph-positions', JSON.stringify(knownPositionsRef.current));
  };

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      if (!canvasRef.current) return;
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'graph.png';
      link.href = dataUrl;
      link.click();
    },
    exportSVG: () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#09090b' : '#f8fafc'; // zinc-950 or slate-50

      const nodeMap = new Map(nodesRef.current.map(n => [n.id, n]));

      const svgEdges = edges.map(edge => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
        const start = nodeMap.get(sourceId);
        const end = nodeMap.get(targetId);
        if (!start || !end) return '';

        return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="rgba(203, 213, 225, 0.4)" stroke-width="1" />`;
      }).join('\n');

      const svgNodes = nodesRef.current.map(node => {
        let fill = '#6366f1';
        if (node.id === 'root-doc-node') {
          fill = '#4f46e5';
        } else if (node.type === 'tag') {
          fill = '#10b981';
        }

        const labelFill = isDark ? '#cbd5e1' : '#475569';

        return `
          <g>
            <circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${fill}" />
            <text x="${node.x}" y="${node.y - node.radius - 6}" font-family="sans-serif" font-size="10px" fill="${labelFill}" text-anchor="middle">${node.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
          </g>
        `;
      }).join('\n');

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background-color: ${bgColor};">
          <g transform="translate(${panRef.current.x}, ${panRef.current.y}) scale(${scaleRef.current})">
            ${svgEdges}
            ${svgNodes}
          </g>
        </svg>
      `;

      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'graph.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }));

  // Main physics & rendering animation loop
  useEffect(() => {
    let animId: number;
    let lastSaveTime = 0;

    const tick = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pNodes = nodesRef.current;
      const pan = panRef.current;
      const scale = scaleRef.current;
      const hoverNode = hoverNodeRef.current;

      // O(N) precomputation of node map for O(1) edge lookups later
      const nodeMap = new Map(pNodes.map(n => [n.id, n]));

      // 1. Physics: Repulsion (anti-collision)
      for (let i = 0; i < pNodes.length; i++) {
        for (let j = i + 1; j < pNodes.length; j++) {
          const nA = pNodes[i];
          const nB = pNodes[j];
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 100;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.08;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nB.vx += fx;
            nB.vy += fy;
            nA.vx -= fx;
            nA.vy -= fy;
          }
        }
      }

      // 2. Physics: Attraction along links
      edges.forEach(edge => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

        const startNode = nodeMap.get(sourceId);
        const endNode = nodeMap.get(targetId);

        if (startNode && endNode) {
          const dx = endNode.x - startNode.x;
          const dy = endNode.y - startNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const restLength = 110;
          const force = (dist - restLength) * 0.02;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          endNode.vx -= fx;
          endNode.vy -= fy;
          startNode.vx += fx;
          startNode.vy += fy;
        }
      });

      // 3. Physics: Center pulling gravity and updating positions
      const centerX = canvas.width / (2 * scale) - pan.x / scale;
      const centerY = canvas.height / (2 * scale) - pan.y / scale;

      let totalMovement = 0;

      pNodes.forEach(node => {
        if (node === dragNodeRef.current) return;

        // Weak gravity to center
        node.vx += (centerX - node.x) * 0.005;
        node.vy += (centerY - node.y) * 0.005;

        // Friction / damping
        node.vx *= 0.82;
        node.vy *= 0.82;

        node.x += node.vx;
        node.y += node.vy;

        totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
      });

      // Periodically save positions when graph settles
      if (timestamp - lastSaveTime > 2000 && totalMovement < pNodes.length * 0.1) {
        savePositions();
        lastSaveTime = timestamp;
      }

      // 4. DRAWING
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply pan & zoom
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Draw Edges
      edges.forEach(edge => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

        const start = nodeMap.get(sourceId);
        const end = nodeMap.get(targetId);

        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          
          const isRelatedToHover = hoverNode && (start.id === hoverNode.id || end.id === hoverNode.id);
          ctx.strokeStyle = isRelatedToHover 
            ? 'rgba(99, 102, 241, 0.8)' 
            : 'rgba(203, 213, 225, 0.4)';
          ctx.lineWidth = isRelatedToHover ? 1.5 : 1;
          ctx.stroke();
        }
      });

      // Draw Nodes
      pNodes.forEach(node => {
        const isHovered = hoverNode && hoverNode.id === node.id;
        const isRoot = node.id === 'root-doc-node';

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isHovered ? 2 : 0), 0, 2 * Math.PI);
        
        // Node styling colors
        if (isRoot) {
          ctx.fillStyle = '#4f46e5'; // Indigo
        } else if (node.type === 'tag') {
          ctx.fillStyle = '#10b981'; // Emerald
        } else {
          ctx.fillStyle = '#6366f1'; // Indigo light
        }

        ctx.fill();

        // Node outline/glow
        if (isHovered) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Draw Labels
        ctx.fillStyle = isHovered ? '#4f46e5' : '#475569';
        // Check dark mode
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          ctx.fillStyle = isHovered ? '#818cf8' : '#cbd5e1';
        }

        ctx.font = `${isHovered ? 'bold' : 'normal'} 10px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - node.radius - 6);
      });

      ctx.restore();

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      savePositions();
    };
  }, [edges]); // Only re-run effect if edges array identity changes (GraphView handles memoization)

  // Handle pointer coordinates projection taking pan & scale into account
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - panRef.current.x) / scaleRef.current,
      y: (clientY - panRef.current.y) / scaleRef.current
    };
  };

  const detectNode = (coords: { x: number; y: number }) => {
    return nodesRef.current.find(node => {
      const dx = node.x - coords.x;
      const dy = node.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 12;
    }) || null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const hit = detectNode(coords);

    if (hit) {
      dragNodeRef.current = hit;
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Drag node logic
    if (dragNodeRef.current) {
      dragNodeRef.current.x = coords.x;
      dragNodeRef.current.y = coords.y;
      return;
    }

    // Pan viewport logic
    if (isPanningRef.current) {
      panRef.current = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      };
      return;
    }

    // Hover detection
    const hit = detectNode(coords);
    hoverNodeRef.current = hit;
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNodeRef.current) {
      onNodeClick(dragNodeRef.current);
    }
    dragNodeRef.current = null;
    isPanningRef.current = false;
    savePositions();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const direction = e.deltaY < 0 ? 1 : -1;
    scaleRef.current = Math.max(0.4, Math.min(2.5, scaleRef.current + direction * 0.05));
  };

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={480}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-inner cursor-grab active:cursor-grabbing"
    />
  );
});
