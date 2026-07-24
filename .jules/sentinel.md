## 2025-03-02 - [Fix] XSS Vulnerability in Todo Widget Template
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability found in `packages/agent-runtime/src/llm/client.ts` where user input (`input.value`) was directly concatenated into an HTML string and assigned to `innerHTML` without sanitization.
**Learning:** Hardcoded string HTML templates used in widgets (`SandboxFrame`) are vulnerable to XSS if they directly inject unsanitized user inputs. Even if it's "just a widget," it runs within the user's browser session.
**Prevention:** Always escape HTML entities (`&`, `<`, `>`, `"`, `'`) when using `innerHTML` with string concatenation, or prefer safer DOM APIs like `document.createElement()` and `node.textContent` when dynamically generating elements from user input.
