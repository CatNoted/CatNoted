import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { GraphNode, GraphEdge } from '@catnoted/shared';
import { Ghost } from 'lucide-react';

export interface ForceGraphRef {
  exportPNG: () => void;
  exportSVG: () => void;
}

interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
  activeNodeId?: string;
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
  onNodeClick,
  activeNodeId
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<PhysNode[]>([]);
  const dragNodeRef = useRef<PhysNode | null>(null);
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Use refs for rapidly changing values to prevent re-renders and animation loop restarts
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef({ x: 300, y: 250 });
  const scaleRef = useRef(1);
  const hoverNodeRef = useRef<PhysNode | null>(null);

  const setPan = (val: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    panRef.current = typeof val === 'function' ? val(panRef.current) : val;
  };

  const setScale = (val: number | ((prev: number) => number)) => {
    const nextScale = typeof val === 'function' ? val(scaleRef.current) : val;
    scaleRef.current = Math.max(0.1, Math.min(4, nextScale));
  };

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

  // Auto-center view on first load if we have nodes
  useEffect(() => {
    if (inputNodes.length > 0 && canvasRef.current) {
      setPan({
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2
      });
    }
  }, [inputNodes.length]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const PAN_AMT = 30;
      if (e.key === 'ArrowUp') setPan(p => ({ ...p, y: p.y + PAN_AMT }));
      else if (e.key === 'ArrowDown') setPan(p => ({ ...p, y: p.y - PAN_AMT }));
      else if (e.key === 'ArrowLeft') setPan(p => ({ ...p, x: p.x + PAN_AMT }));
      else if (e.key === 'ArrowRight') setPan(p => ({ ...p, x: p.x - PAN_AMT }));
      else if (e.key === '+' || e.key === '=') setScale(s => Math.min(3, s + 0.1));
      else if (e.key === '-') setScale(s => Math.max(0.1, s - 0.1));
    };

    canvas.addEventListener('keydown', handleKeyDown);
    return () => canvas.removeEventListener('keydown', handleKeyDown);
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
      const bgColor = isDark ? '#141416' : '#ffffff';

      const nodeMap = new Map(nodesRef.current.map(n => [n.id, n]));

      const svgEdges = edges.map(edge => {
        const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
        const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
        const start = nodeMap.get(sourceId);
        const end = nodeMap.get(targetId);
        if (!start || !end) return '';

        const strokeColor = isDark ? 'rgba(39, 39, 42, 0.6)' : 'rgba(228, 228, 231, 0.6)';
        return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${strokeColor}" stroke-width="1" />`;
      }).join('\n');

      const svgNodes = nodesRef.current.map(node => {
        let fill = isDark ? '#818cf8' : '#4f46e5';
        if (node.id === 'root-doc-node') {
          fill = isDark ? '#c084fc' : '#7c3aed';
        } else if (node.type === 'tag') {
          fill = isDark ? '#34d399' : '#10b981';
        } else {
          fill = isDark ? '#a1a1aa' : '#71717a';
        }

        const labelFill = isDark ? '#a1a1aa' : '#71717a';

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
      const nodeMap = new Map(pNodes.map(n => [n.id, n]));

      // 1. Physics: Repulsion (anti-collision)
      for (let i = 0; i < pNodes.length; i++) {
        for (let j = i + 1; j < pNodes.length; j++) {
          const nA = pNodes[i];
          const nB = pNodes[j];
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          const distSq = dx * dx + dy * dy;
          // Obsidian-like stronger, longer repulsion
          const minDist = 180;
          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (minDist - dist) * 0.05;
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
          // Longer rest length for clearer graph
          const restLength = 150;
          const force = (dist - restLength) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          endNode.vx -= fx;
          endNode.vy -= fy;
          startNode.vx += fx;
          startNode.vy += fy;
        }
      });

      let totalMovement = 0;

      // 3. Physics: Center pulling gravity and updating positions
      pNodes.forEach(node => {
        if (node === dragNodeRef.current) return;

        // Gravity to origin (0,0) which is visual center via pan
        node.vx -= node.x * 0.003;
        node.vy -= node.y * 0.003;

        // Friction / damping
        node.vx *= 0.85;
        node.vy *= 0.85;

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
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

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
          
          const hoverNode = hoverNodeRef.current;
          const isRelatedToHover = hoverNode && (start.id === hoverNode.id || end.id === hoverNode.id);
          // Dark mode checks dynamically per frame
          const isDark = document.documentElement.classList.contains('dark');

          // Style backlinks/edges
          if (isRelatedToHover) {
             ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.8)' : 'rgba(99, 102, 241, 0.8)';
             ctx.lineWidth = 2;
          } else {
             ctx.strokeStyle = isDark ? 'rgba(39, 39, 42, 0.6)' : 'rgba(228, 228, 231, 0.6)';
             ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      });

      const isDark = document.documentElement.classList.contains('dark');

      // Draw Nodes
      pNodes.forEach(node => {
        const hoverNode = hoverNodeRef.current;
        const isHovered = hoverNode && hoverNode.id === node.id;
        const isRoot = node.id === 'root-doc-node';
        const isConnectedToHover = hoverNode && edges.some(e => {
            const sid = typeof e.source === 'object' ? (e.source as any).id : e.source;
            const tid = typeof e.target === 'object' ? (e.target as any).id : e.target;
            return (sid === hoverNode.id && tid === node.id) || (tid === hoverNode.id && sid === node.id);
        });
        const isActiveNode = activeNodeId && node.id === activeNodeId;

        const active = isHovered || isConnectedToHover || isActiveNode;

        ctx.beginPath();
        // Dynamic radius
        const r = node.radius + (isHovered ? 3 : (isConnectedToHover ? 1 : (isActiveNode ? 2 : 0)));
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        
        // Node styling colors based on Obsidian style theme
        if (isRoot) {
          ctx.fillStyle = isDark ? '#c084fc' : '#7c3aed'; // Violet
        } else if (node.type === 'tag') {
          ctx.fillStyle = isDark ? '#34d399' : '#10b981'; // Emerald
        } else {
          ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a'; // Muted Foreground
        }

        if (active) {
          ctx.fillStyle = isDark ? '#818cf8' : '#4f46e5'; // Indigo active
        }

        ctx.fill();

        // Node outline/glow for active
        if (active) {
          ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.4)' : 'rgba(99, 102, 241, 0.4)';
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Draw Labels
        // Only show labels for hovered, connected, or large nodes, or root
        if (active || isRoot || scaleRef.current > 1.2) {
          ctx.fillStyle = active
            ? (isDark ? '#ffffff' : '#17171a')
            : (isDark ? '#a1a1aa' : '#71717a');

          ctx.font = `${active ? 'bold' : 'normal'} ${10 / scaleRef.current}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y - r - (6 / scaleRef.current));
        }
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
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 15 / scaleRef.current;
    }) || null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const hit = detectNode(coords);

    hasDraggedRef.current = false;
    dragStartCoords.current = { x: e.clientX, y: e.clientY };

    if (hit) {
      dragNodeRef.current = hit;
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Check drag threshold
    if (!hasDraggedRef.current) {
        const dx = e.clientX - dragStartCoords.current.x;
        const dy = e.clientY - dragStartCoords.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 3) {
            hasDraggedRef.current = true;
        }
    }

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
    if (dragNodeRef.current && !hasDraggedRef.current) {
      // If drag threshold was low, trigger click
      onNodeClick(dragNodeRef.current);
    }
    dragNodeRef.current = null;
    isPanningRef.current = false;
    savePositions();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Prevent default scroll behavior on wheel for zooming if possible
    // Note: React synthetic onWheel doesn't support e.preventDefault() well,
    // but we handle scale changes
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale(prev => Math.max(0.2, Math.min(4, prev + direction * 0.1)));
  };

  // Passive event listener for wheel to prevent scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheelRaw = (e: WheelEvent) => {
        e.preventDefault();
    };
    canvas.addEventListener('wheel', onWheelRaw, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheelRaw);
  }, []);

  if (inputNodes.length === 0) {
    return (
      <div className="w-full h-full bg-muted/30 border border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
        <Ghost className="w-12 h-12 mb-4 text-muted-foreground/40" />
        <p className="text-sm">Graph is empty.</p>
        <p className="text-xs mt-2 opacity-75">Add wiki-links [[like this]] to your documents to see connections.</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full bg-muted/30 border border-border rounded-2xl shadow-inner cursor-grab active:cursor-grabbing"
      style={{ width: '100%', height: '100%' }}
    />
  );
});
