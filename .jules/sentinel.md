## 2024-07-24 - Fix eval() vulnerability in calculator widget
 **Vulnerability:** Dangerous use of `eval()` on unsanitized user input in the calculator widget.
 **Learning:** The calculator widget used `eval()` to compute math expressions, which is inherently dangerous as it can execute arbitrary JavaScript code. This could lead to XSS or sandbox escapes.
 **Prevention:** Use safe alternatives like `new Function` coupled with strict input validation (e.g., regex `^[0-9+\-*/. ]+$`) to ensure only safe math expressions are evaluated.

## 2025-02-28 - Mocked Authentication Bypass
 **Vulnerability:** The application used a mocked frontend authentication process that allowed users to bypass authentication simply by waiting out a timeout without any real credential validation.
 **Learning:** Mocking critical security components like authentication on the frontend can easily leave applications vulnerable to bypass attacks since the client has full control.
 **Prevention:** Always connect authentication flows directly to a secure, real backend authentication service (like Supabase) before deploying to production.
