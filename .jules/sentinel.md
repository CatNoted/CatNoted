## 2024-07-24 - Fix Insecure Randomness for ID Generation
 **Vulnerability:** Used `Math.random()` to generate IDs.
 **Learning:** `Math.random()` is predictable and not cryptographically secure, which could lead to ID collisions and predictability risks in critical components.
 **Prevention:** Always use `crypto.randomUUID()` or other securely designed UUID generators instead of `Math.random()` when creating unique identifiers, especially for stateful objects like CRDT nodes.
