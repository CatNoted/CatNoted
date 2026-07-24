## 2025-05-15 - Sidebar Roving Tabindex & Accessibility

**Learning:** Grouped navigation controls (such as sidebar links and utility actions) should be structured with WAI-ARIA landmark roles, explicit keyboard focus rules, and a roving tabindex (`tabIndex={focused ? 0 : -1}`) to ensure only a single interactive control is part of the sequential tab focus. Pressing arrow keys can then easily cycle through the remaining elements.

**Action:** Separate sidebar buttons into semantic "navigation" and "toolbar" groups, managing focused indices inside React state, assigning `ref` callbacks to DOM elements, and implementing robust `onKeyDown` handlers with `ArrowUp`/`ArrowDown`/`Home`/`End` support to programmatically transfer keyboard focus.
