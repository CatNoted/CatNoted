## 2024-07-24 - Fix eval() vulnerability in calculator widget
 **Vulnerability:** Dangerous use of `eval()` on unsanitized user input in the calculator widget.
 **Learning:** The calculator widget used `eval()` to compute math expressions, which is inherently dangerous as it can execute arbitrary JavaScript code. This could lead to XSS or sandbox escapes.
 **Prevention:** Use safe alternatives like `new Function` coupled with strict input validation (e.g., regex `^[0-9+\-*/. ]+$`) to ensure only safe math expressions are evaluated.
## 2024-05-24 - Testing improvement in AppLayout
**Goal:** Test edge case where JSON parse fails during widget import.
**Action:** Add test to mock file upload and assert alert mock was called.
