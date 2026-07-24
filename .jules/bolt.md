## 2024-07-24 - ForceGraph Node Discovery Optimization
 **Learning:** Using Array.prototype.find() inside a loop over edges (especially in a high-frequency loop like requestAnimationFrame) causes an O(N*M) bottleneck, drastically hurting simulation and rendering performance for large graphs.
 **Action:** Precompute a Map of node IDs to node references before the edge loop. This changes the edge lookups to O(1) Map.prototype.get(), reducing total complexity to O(N + M) and yielding massive speed improvements (e.g. from ~3117ms to ~44ms in benchmarks).
