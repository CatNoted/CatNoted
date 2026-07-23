# Document Editor Blocksuite — Agent Workspace Guidelines

This package (`packages/editor`) is responsible for rendering the document block hierarchy.

---

## 1. Responsibilities

- **Block Rendering Engine**: Outputs Text, Headings, Lists, and AI Widget containers based on `BlockNode` specs.
- **State Management**: Orchestrates the Yjs CRDT instance (`Y.Doc`) to allow real-time changes and conflict resolutions.
- **CRUD Operations Hook**: Implements `useDocumentStore` for adding, modifying, rearranging, or deleting document blocks.

---

## 2. Technical Stack & Constraints

- **CRDT Backend**: Yjs.
- **UI Components**: Standard Tailwind-styled editor inputs.
- **Widget Integration**: Must render active AI widget blocks using the `<SandboxFrame>` exported from `@catnoted/agent-runtime` when `block.properties.srcDoc` is present.
