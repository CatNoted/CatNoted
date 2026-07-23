# Infinite Canvas Edgeless Whiteboard — Agent Workspace Guidelines

This package (`packages/canvas`) manages the spatial rendering engine.

---

## 1. Responsibilities

- **2D Viewport Matrix**: Implements viewport matrix calculations (Pan with drag/middle-click, Zoom with wheel).
- **Dot-grid Background**: Renders a dynamic background grid responding to scale and coordinate offsets.
- **Canvas Cards**: Renders interactive document blocks as floating 2D cards (`CanvasCard`).
- **Connectors**: Renders line connectors linking multiple canvas cards together.

---

## 2. Technical Stack & Constraints

- **Viewport Hook**: `useCanvasViewport` for managing zoom limits and coordinate space conversions.
- **Styling & Render Loop**: Clean Tailwind CSS utility classes and React-rendered SVGs/divs. Maintain GPU-accelerated transforms (`transform: translate3d(x,y,0) scale(s)`).
