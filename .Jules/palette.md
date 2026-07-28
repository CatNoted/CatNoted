## 2024-07-28 - Missing ARIA labels in AllDocsView
**Learning:** Found multiple icon-only buttons (like Filter, Sort, Settings, Plus) in `AllDocsView` without `aria-label`s, which is a pattern that breaks accessibility for screen reader users.
**Action:** Always verify new views with icon-only buttons have appropriate `aria-label`s assigned. In `AllDocsView`, these were updated to "Filter documents", "Sort documents", "Document settings", "Create new document", and "Calendar settings" to provide meaningful context to screen readers.
