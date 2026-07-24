## 2024-07-24 - Optimization of ForceGraph Animation Loop
 **Learning:** In high-frequency animation loops (like `requestAnimationFrame`), using `Array.prototype.find()` nested within iteration can cause significant performance degradation (O(N^2) or worse) due to repeated linear scans.
 **Action:** Convert the array to a Map at the beginning of the frame/loop to reduce lookup complexity from O(N) to O(1), minimizing CPU overhead and preventing frame drops.
