# Obsidian-style Knowledge Graph — Agent Workspace Guidelines

This package (`packages/graph`) handles structural relation mapping and 2D node-edge rendering.

---

## 1. Responsibilities

- **Reference Extractor**: Scans block notes and VFS text nodes using regular expressions to extract `[[backlinks]]` and `#tags`.
- **Force Simulation**: Utilizes D3 force engines (or light-weight canvas layouts) to calculate node charges, link distances, and center gravitational pulls.
- **Interactive Visualisation**: Renders interactive nodes and edges using a 2D Canvas or SVG, allowing pan, zoom, click-to-focus, and node dragging.

---

## 2. Technical Stack & Constraints

- **Engine**: Light force-directed mathematical layout engine or D3-force simulation.
- **Rendering**: Optimized HTML5 `<canvas>` rendering loop to handle large graph networks efficiently without lagging the browser main thread.
