import React, { useRef, useEffect, useState } from 'react';
import { GraphNode, GraphEdge } from '@catnoted/shared';

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

export const ForceGraph: React.FC<ForceGraphProps> = ({
  nodes: inputNodes,
  edges,
  onNodeClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<PhysNode[]>([]);
  const dragNodeRef = useRef<PhysNode | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const [pan, setPan] = useState({ x: 300, y: 250 });
  const [scale, setScale] = useState(1);
  const [hoverNode, setHoverNode] = useState<PhysNode | null>(null);

  // Sync input nodes to physics simulation references
  useEffect(() => {
    const existing = new Map(nodesRef.current.map(n => [n.id, n]));
    
    nodesRef.current = inputNodes.map((n) => {
      const prev = existing.get(n.id);
      if (prev) return { ...prev, label: n.label, type: n.type };
      // Otherwise assign random coordinates near center
      return {
        ...n,
        x: 300 + (Math.random() - 0.5) * 150,
        y: 250 + (Math.random() - 0.5) * 150,
        vx: 0,
        vy: 0,
        radius: n.type === 'page' ? 8 : 6
      };
    });
  }, [inputNodes]);

  // Main physics & rendering animation loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pNodes = nodesRef.current;

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

        const startNode = pNodes.find(n => n.id === sourceId);
        const endNode = pNodes.find(n => n.id === targetId);

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
      });

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

        const start = pNodes.find(n => n.id === sourceId);
        const end = pNodes.find(n => n.id === targetId);

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
    return () => cancelAnimationFrame(animId);
  }, [edges, pan, scale, hoverNode]);

  // Handle pointer coordinates projection taking pan & scale into account
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / scale,
      y: (clientY - pan.y) / scale
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
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
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
    if (isPanning.current) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
      return;
    }

    // Hover detection
    const hit = detectNode(coords);
    setHoverNode(hit);
  };

  const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNodeRef.current) {
      // If drag threshold was low, trigger click
      onNodeClick(dragNodeRef.current);
    }
    dragNodeRef.current = null;
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale(prev => Math.max(0.4, Math.min(2.5, prev + direction * 0.05)));
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
};
