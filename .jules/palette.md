## 2024-07-26 - Accessibility improvements and strict visual contracts
**Learning:** Icon-only buttons (such as floating action buttons or panel toggles) must include an 'aria-label' attribute, and 'aria-expanded' if they control a panel's visibility, to ensure screen reader accessibility. Modals inside the web application should follow strict visual contracts for primary buttons using vibrant blue palettes.
**Action:** Always verify `aria-label` and `aria-expanded` attributes are present for UI toggles without text content, and enforce design tokens like strict modal action button colors.
