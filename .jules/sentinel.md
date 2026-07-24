## 2024-07-24 - Fix eval() vulnerability in calculator widget
 **Vulnerability:** Dangerous use of `eval()` on unsanitized user input in the calculator widget.
 **Learning:** The calculator widget used `eval()` to compute math expressions, which is inherently dangerous as it can execute arbitrary JavaScript code. This could lead to XSS or sandbox escapes.
 **Prevention:** Use safe alternatives like `new Function` coupled with strict input validation (e.g., regex `^[0-9+\-*/. ]+$`) to ensure only safe math expressions are evaluated.

## 2025-02-28 - Insecure Storage of API Keys in localStorage
 **Vulnerability:** Unencrypted LLM API keys were being stored directly in `localStorage` in `SettingsModal.tsx`.
 **Learning:** Client-side storage like `localStorage` is accessible to any script running on the page, making it vulnerable to Cross-Site Scripting (XSS) attacks. Storing sensitive data like API keys in plain text significantly increases the risk of them being stolen.
 **Prevention:** Sensitive credentials should not be stored in `localStorage` in plaintext. Use secure storage mechanisms or encrypt the data before storing it client-side. In this case, the keys are now encrypted using the E2EE passphrase before being saved to `localStorage` and decrypted upon retrieval.
