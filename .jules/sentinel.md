## Learnings - E2EE Sync Passphrase (Vulnerability Fix)
- We replaced the hardcoded 'super-secret-default-passphrase' with an empty string and initialized it properly from localStorage.
- The default passphrase completely broke confidentiality of the broadcasted ciphertext by relying on a known key.
- Yjs updates should explicitly abort (`if (!passphrase) return;`) instead of falling back to default keys, to guarantee true E2EE before transmission to Supabase channels.
