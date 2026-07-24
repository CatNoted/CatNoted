# CatNoted - Blackbox Test Specification Matrix

This document defines the functional and non-functional **Blackbox Test Suite** for the CatNoted web application. Blackbox testing validates system features, user interface flows, and operational boundaries purely from the perspective of external inputs and expected visual/behavioral outputs, without relying on knowledge of internal source code implementation.

---

## 1. Document & Block Editor (AFFiNE-Style Hybrid Editor)

| Test Case ID | Test Case Title | Preconditions | Input / User Action | Expected Output | Boundary & Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLK-001** | Create New Text Block | Document editor is loaded with default title. | Press `Enter` key at the end of an existing block. | A new empty text paragraph block is instantiated immediately below the focused block. | Focus transfers automatically to the new block. Cursor is ready for typing. |
| **TC-BLK-002** | Trigger Slash Command Menu | Editor has focus on an empty block. | Type `/` into the text area. | The Slash Command overlay menu opens displaying block types (Heading, List, Code, Quote, Widget). | Menu positions directly below the typing cursor. Keyboard navigation active. |
| **TC-BLK-003** | Convert Block to Heading 1 | Slash menu is visible. | Type `h1` and press `Enter`. | Block changes visual formatting to large bold Heading 1 font. | Block type updates to `heading` with `level: 1`. Slash menu closes. |
| **TC-BLK-004** | Insert Live AI Widget Block | Slash menu is visible. | Type `widget` and select `AI Widget`. | A sandboxed widget placeholder card is rendered inside the document flow. | Widget container receives unique ID, ready for LLM code injection. |

---

## 2. Edgeless Infinite Canvas Engine

| Test Case ID | Test Case Title | Preconditions | Input / User Action | Expected Output | Boundary & Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLK-005** | Spatial Card Pan & Drag | Canvas mode active with at least 2 spatial cards. | Mouse drag on card header element to coordinate `(x: 350, y: 500)`. | Card moves smoothly across the canvas viewport to target coordinates. | Card `(x, y)` state updates without overflowing canvas viewport bounds. |
| **TC-BLK-006** | Canvas Viewport Zooming | Infinite canvas displayed. | Scroll mouse wheel / pinch gesture inside canvas canvas area. | Viewport scale transforms smoothly in range `[0.2x, 3.0x]`. | Rendered canvas elements scale proportionally around cursor position. |
| **TC-BLK-007** | Connector Line Rendering | Two spatial cards present on canvas (`Card A`, `Card B`). | Click "Add Connector" and drag handle from `Card A` to `Card B`. | A Bezier connection line appears linking `Card A` and `Card B`. | Line updates path coordinates dynamically when either card is repositioned. |

---

## 3. Obsidian-Style Knowledge Graph Engine

| Test Case ID | Test Case Title | Preconditions | Input / User Action | Expected Output | Boundary & Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLK-008** | Dynamic Wiki-Link Node Generation | Document editor active. | Type `[[CatNoted Architecture]]` into a text block. | Graph view automatically adds node `📄 CatNoted Architecture` with an edge linked to the current document. | Graph updates in real-time without requiring full page refresh. |
| **TC-BLK-009** | Hashtag Node Association | Document editor active. | Type `#knowledge-graph` in any note block. | Graph view creates tag node `#knowledge-graph` with edge connecting note. | Duplicate hashtags resolve to the same node ID in graph view. |

---

## 4. Space Agent Browser Runtime & VFS Sandbox

| Test Case ID | Test Case Title | Preconditions | Input / User Action | Expected Output | Boundary & Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLK-010** | VFS Persistence Isolation | Application running in browser. | Save skill file `skills/custom_tool.md` via Space Agent runtime. | File content is stored in local IndexedDB / LocalStorage under prefix `catnoted_vfs:`. | File survives page reload and is inaccessible to cross-origin domains. |
| **TC-BLK-011** | Sandboxed Widget Execution | Agent generates HTML/JS snippet. | Render widget inside `SandboxFrame` iframe. | Widget executes inside isolated iframe (`sandbox="allow-scripts"`). | Iframe cannot access top-level window DOM or parent storage directly. |

---

## 5. End-to-End Encrypted BYOK Vault Settings

| Test Case ID | Test Case Title | Preconditions | Input / User Action | Expected Output | Boundary & Pass Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLK-012** | BYOK Master Passphrase Encryption | BYOK settings modal open. | Enter master passphrase `CatNotedVault2026!` and click "Encrypt Vault". | Local data payload is encrypted with AES-GCM 256-bit key via PBKDF2 derivation. | Plaintext notes are replaced with encrypted byte array. |
