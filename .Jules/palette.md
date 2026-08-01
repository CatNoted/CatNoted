## 2024-07-28 - Missing ARIA labels in AllDocsView
**Learning:** Found multiple icon-only buttons (like Filter, Sort, Settings, Plus) in `AllDocsView` without `aria-label`s, which is a pattern that breaks accessibility for screen reader users.
**Action:** Always verify new views with icon-only buttons have appropriate `aria-label`s assigned. In `AllDocsView`, these were updated to "Filter documents", "Sort documents", "Document settings", "Create new document", and "Calendar settings" to provide meaningful context to screen readers.

## 2024-11-20 - Missing ARIA labels in AppLayout
**Learning:** Found multiple icon-only buttons (like Star, Trash, Minimize, Close, Copy, Duplicate Widget, Delete Widget) in `AppLayout` without `aria-label`s. This is a common pattern that breaks accessibility for screen reader users.
**Action:** Always verify new views with icon-only buttons have appropriate `aria-label`s assigned. In `AppLayout`, these were updated to match their `title` attribute to provide meaningful context to screen readers.
