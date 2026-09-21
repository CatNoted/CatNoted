## 2026-08-11 - [UX Improvement] Replace Hardcoded UI Overlays with Semantic Tokens
**Learning:** For hover affordances across the UI, using semantic Tailwind tokens (e.g., `hover:bg-muted`) rather than raw hardcoded utility classes (e.g., `hover:bg-black/5` or `dark:hover:bg-white/5`) guarantees native support for both themes without manual overrides.
**Action:** When migrating UI components, replace manual opacity/color hover hacks with semantic variables like `bg-muted` and `bg-background` to ensure uniform dark and light mode rendering and alignment with the overarching token design system.

## $(date +%Y-%m-%d) - [AppLayout Hover and Flex Truncation Polish]
**Learning:** Applying `flex-1 min-w-0` to text spans inside a `flex-col` container forces them to stretch vertically, which breaks layout compactness when the intention is merely to truncate text horizontally. Additionally, hardcoded non-semantic tokens like `hover:bg-accent-soft` or `hover:text-accent` frequently fail to provide adequate contrast or native theming support compared to `hover:bg-muted` and `hover:text-foreground`.
**Action:** Use only `truncate` on text child elements inside `flex-col` wrappers if horizontal truncation is needed without vertical stretching. Uniformly prefer standard semantic hover tokens (`hover:bg-muted text-muted-foreground hover:text-foreground`) to guarantee contrast and correct aesthetic behavior across both light and dark modes.

## $(date +%Y-%m-%d) - [Dropdown Menu Accessibility Patterns]
**Learning:** Icon-only buttons used as menu triggers often lack screen-reader context if `aria-label`, `aria-haspopup`, and `aria-expanded` are missing. Furthermore, the dropdown containers themselves must employ `role="menu"` and their child interactive items `role="menuitem"` to enable proper semantic navigation. The use of `focus-visible:` utilities over global `focus:` ensures focus rings are strictly visible during keyboard navigation (preventing unsightly outlines on mouse clicks).
**Action:** When implementing custom dropdowns (like block action menus or floating toolbars), ensure the trigger button explicitly states its purpose (`aria-label`) and state (`aria-expanded`). The container and its actionable items must always carry `role="menu"` and `role="menuitem"` respectively, and employ `focus-visible` styling for robust keyboard accessibility.
## 2026-08-14 - [Layout truncation and contrast fixes]
**Learning:** Found remaining anti-patterns with `flex-1 min-w-0` used on children of `flex-col` wrappers, which breaks vertical layout. Also found `PageHeader.tsx` using `hover:text-destructive-foreground` on a hardcoded dark background (`bg-black/60`).
**Action:** When truncating inside `flex-col`, only apply `truncate` and remove `flex-1 min-w-0`. When applying foreground text color on hardcoded dark backgrounds, use `text-white` or `hover:text-white` to prevent WCAG contrast failures in light mode.
## 2026-08-16 - [UX improvement] Fix semantic active states and flex layout anti-patterns
**Learning:** Found several anti-patterns including usage of `bg-accent-soft text-accent` for active/selected states which can have bad contrast compared to the standard `bg-muted text-foreground`. Also found cases of `flex-1 min-w-0` correctly being removed from text nodes inside `flex-col` containers (like in AppLayout and KanbanBlock) to prevent unwanted layout stretching.
**Action:** Replace all `bg-accent-soft` combined with `text-accent` in interactive elements with `bg-muted` and `text-foreground`. Ensure `flex-1 min-w-0` is not applied on children of `flex-col` containers unless the flex direction is row.
## $(date +%Y-%m-%d) - [UX Improvement] Replace Hardcoded UI Overlays with Semantic Tokens in Editor and Layout
**Learning:** Hardcoded classes like `bg-accent/10 text-accent` and `dark:bg-accent/10` break structural theming logic and can cause contrast issues. Standard semantic active/selected states (`bg-muted text-foreground`) and hover states (`hover:bg-muted text-foreground`) automatically resolve contrast problems and scale better natively across light and dark modes.
**Action:** Always prefer standard semantic tokens (`bg-muted text-foreground`, `hover:bg-muted`) over raw arbitrary combinations like `bg-accent/10` or conditionally switching `text-accent` for active affordances. Remove conditional `text-accent` logic when indicating selected items unless specifically instructed by design.
## 2024-08-16 - Missing ARIA Labels on Modal Close Buttons
**Learning:** Found an accessibility issue pattern specific to modal components in this application (e.g., `SettingsModal.tsx`) where icon-only close buttons lacked descriptive `aria-label`s. Screen reader users would just hear "button" without understanding its purpose.
**Action:** When implementing or refactoring modals or any component utilizing icon-only buttons, always ensure an `aria-label` (e.g., `aria-label="Close settings"`) is included on the `<button>` element.
## $(date +%Y-%m-%d) - Fix flex truncation anti-pattern
**Learning:** Adding `truncate` directly to an element inside a flex row container (`flex items-center`) does not work natively in Tailwind. The element will still stretch or overflow. It must be combined with `flex-1 min-w-0` to guarantee correct truncation and responsive shrinking.
**Action:** Always combine `truncate` with `flex-1 min-w-0` on text child elements inside `flex items-center` row layouts.
## 2026-08-17 - Standardize semantic active and hover UI affordances (final sweep)
**Learning:** Overuse of the `accent` design token (e.g., `text-accent`, `bg-accent`) for active states, selected states, and inactive functional icons caused contrast issues and violated the semantic design system rules (where `accent` is reserved for subtle hover backgrounds mapping to light gray in light mode).
**Action:** When updating active or selected UI states, always use standardized semantic Tailwind tokens such as `bg-primary text-primary-foreground` for primary actions, `bg-muted text-foreground` for selected list items/tabs, and `text-success` for positive/active indicators. For inactive functional icons, default to `text-muted-foreground` and change to `text-foreground` on hover or active states.

## 2026-08-18 - Fix flex truncation bugs in flex-row layouts
**Learning:** Applying `.truncate` on a child element within a `flex flex-row` layout often requires `.flex-col` wrapper on the text components to avoid stretching and breaking container boundaries.
**Action:** When mapping lists of rich elements like bookmarks and slash commands, wrap the text details in `flex-col flex-1 min-w-0` to enforce strict layout boundaries.
## $(date +%Y-%m-%d) - [Dropdown Menu Accessibility Patterns]
**Learning:** Icon-only buttons used as menu triggers often lack screen-reader context if `aria-label`, `aria-haspopup`, and `aria-expanded` are missing. Furthermore, the dropdown containers themselves must employ `role="menu"` and their child interactive items `role="menuitem"` to enable proper semantic navigation. The use of `focus-visible:` utilities over global `focus:` ensures focus rings are strictly visible during keyboard navigation (preventing unsightly outlines on mouse clicks).
**Action:** When implementing custom dropdowns (like block action menus or floating toolbars), ensure the trigger button explicitly states its purpose (`aria-label`) and state (`aria-expanded`). The container and its actionable items must always carry `role="menu"` and `role="menuitem"` respectively, and employ `focus-visible` styling for robust keyboard accessibility.
## $(date +%Y-%m-%d) - [UX improvement] Final cleanup of hardcoded semantic combinations
**Learning:** Found scattered instances of `bg-accent/5`, `bg-accent/10`, and `bg-accent` used as functional indicators (e.g. active dots) or background overlays which failed contrast standards natively and broke structural design semantic mapping compared to robust tokens like `bg-muted` and `bg-primary`.
**Action:** Always prefer standardized tokens (`bg-muted` for background highlights, `bg-primary` for active state dots or indicators) over hardcoding alpha-modified semantic values like `bg-accent/5`.
## 2026-08-20 - [Standardized affordances for active UI states]
**Learning:** Found instances where semantic active state styling (`bg-warning-soft text-warning`) was used for active toggles (like the Star favorite button), causing poor contrast and visual inconsistency in dark mode. The UI should use consistent semantic tokens that inherently support light and dark theme mode adaptation gracefully.
**Action:** Replace `bg-warning-soft text-warning` and `hover:text-warning hover:bg-warning-soft` combinations on active elements with standard `bg-muted text-foreground` and `text-foreground hover:bg-muted` across both themes to ensure native contrast and uniform hover affordances.
## 2026-08-21 - Standardize shadows, focus rings, and eliminate accent anti-patterns
**Learning:** Hardcoded `--accent` usage across layout and interactive elements (like `ring-accent`, `shadow-accent`, and `border-accent`) breaks semantic design integrity and causes unexpected rendering bugs (like WCAG failures in focus states) when transitioning between themes. Use generic semantic tokens like `border-border`, `shadow-sm`, and `ring-border` to rely on Tailwind's native handling.
**Action:** Always map focus rings to standard tokens (`ring-border` or `ring-ring`), replace alpha shadows (`shadow-accent/20`) with discrete shadow scales (`shadow-sm`), and drop `border-accent` entirely for general container elements.
## 2026-08-21 - Fix semantic contrast on static dark backgrounds
**Learning:** Hardcoding `bg-white` on a semantic `bg-primary` active indicator fails WCAG contrast in light mode when the primary color isn't sufficiently dark.
**Action:** Always map overlay elements on semantic backgrounds to their corresponding foreground tokens (e.g., `bg-primary-foreground` on `bg-primary`).
## $(date +%Y-%m-%d) - [UX improvement] Fix foreground contrast on dark hardcoded background
**Learning:** Overusing semantic foreground tokens (like `text-destructive-foreground`) directly on components that have a hardcoded dark background (`bg-black/60`) creates a high risk of WCAG contrast failures in light mode. This is because semantic tokens automatically invert, but the hardcoded background does not.
**Action:** When a background is strictly hardcoded to a dark overlay, ensure the corresponding text utilities (including active and hover states) are strictly tied to static light colors like `text-white` or `hover:text-white` to guarantee high contrast across all themes.
## 2025-05-15 - Hover-only actions are invisible focus traps
**Learning:** Hover-only action buttons (`opacity-0 group-hover:opacity-100`) across the workspace become invisible focus traps for keyboard users.
**Action:** Always pair `opacity-0 group-hover:opacity-100` with `focus-within:opacity-100` on the container (or `focus-visible:opacity-100` on the button) to ensure keyboard navigation reveals the actions.
## $(date +%Y-%m-%d) - [Invisible Focus Traps on Hover Actions]
**Learning:** Elements styled with hover-only visibility utilities (e.g., `opacity-0 group-hover:opacity-100`) become invisible focus traps for keyboard users navigating via Tab.
**Action:** Always pair `opacity-0 group-hover:opacity-100` on the container with `focus-within:opacity-100` (so the container reveals its contents on internal focus) and ensure the actionable child (like a `<button>`) includes `focus-visible:opacity-100` alongside a proper semantic focus ring (e.g., `focus-visible:ring-2 focus-visible:ring-border`).
## $(date +%Y-%m-%d) - [Active States on Hardcoded Dark Backgrounds]
**Learning:** Found an anti-pattern where a semantic foreground token (`text-destructive-foreground`) and semantic alpha background (`bg-destructive-accent`) was overlaid on a static dark semantic background (`bg-destructive`). This can cause WCAG contrast failure if the theme is strictly light or dark in the active state.
**Action:** Always map overlay elements on static dark backgrounds directly to standard static white contrasts (`text-white`, `text-white/70`, `hover:bg-white/20`) to guarantee legibility regardless of the semantic theme active.

## $(date +%Y-%m-%d) - [Focus Traps with Group Hover & Button Children]
**Learning:** Hover-only (`opacity-0 group-hover:opacity-100`) utility text within a `<button>` structure creates an invisible focus trap because keyboard users trigger `focus-visible` on the button, not the child span.
**Action:** When child UI elements should become visible when their parent is focused (like text labels in buttons), use `group-focus-visible:opacity-100` alongside `opacity-0 group-hover:opacity-100` rather than applying `focus-within` directly to the child span.

## 2026-10-31 - Fix invisible focus traps and semantic contrast for destructive buttons
**Learning:** Hardcoded dark backgrounds (like `bg-destructive`) require static light text (like `text-white`) instead of semantic tokens like `text-destructive-foreground` to ensure WCAG legibility in light mode. Also, `opacity-0 group-hover:opacity-100` patterns create invisible focus traps unless paired with `focus-within:opacity-100` and `group-focus-visible:opacity-100`.
**Action:** Use static text tokens on hardcoded semantic backgrounds, and always add `focus-within`/`focus-visible` states to hover-only action elements.
## 2024-09-05 - Missing labels on inline edit inputs
**Learning:** Inline edit inputs (like image URLs or Kanban column titles) are often rendered conditionally without `<label>` elements, creating a silent accessibility gap for screen reader users who navigate via form inputs.
**Action:** Always add `aria-label` to visually apparent form inputs when an explicit `<label>` tag is structurally inappropriate or omitted.
## $(date +%Y-%m-%d) - [Missing aria-label on stateful toggle buttons]
**Learning:** Icon-only toggle buttons that change state (e.g., between "Edit" and "Done" states using icons) often lack descriptive `aria-label`s, rendering them inaccessible to screen readers. For instance, the math block editor toggle button relied solely on visual cues.
**Action:** When creating or modifying stateful icon-only toggle buttons, always provide a dynamic `aria-label` that reflects the current action (e.g., `aria-label={isEditing ? 'Save' : 'Edit'}`) to ensure clear communication of the button's purpose to assistive technologies.
## $(date +%Y-%m-%d) - [File Upload Accessibility]
**Learning:** Hiding file inputs using CSS `display: none` or Tailwind's `hidden` removes the element from the accessibility tree, making it un-focusable for keyboard users.
**Action:** When styling custom file upload labels (e.g., `<label><input type="file" className="sr-only"></label>`), use Tailwind's `sr-only` class on the input instead of `hidden`. Apply `focus-within:` styles (e.g. `focus-within:ring-2`) to the parent label to visually indicate keyboard focus when the invisible input is active.
## 2026-09-11 - Audit Clean Run Verification
**Learning:** Monorepo UI components adhere strongly to Tailwind CSS conventions, dynamic dark/light mode token replacements (`text-foreground`, `bg-card`, etc.), and structural guidelines without severe anti-patterns breaking UX layout flow. Hard-coded classes like `bg-black/60` and `text-white` were specifically verified as intentional contrast layers against variable background images, ensuring WCAG contrast compliance.
**Action:** Always cross-reference static overlay classes against their contextual background content to rule out WCAG contrast regressions instead of arbitrarily flagging them as token violations.
## $(date +%Y-%m-%d) - [UX improvement] Replace hardcoded semantic tokens for native scaling
**Learning:** Hardcoded combinations of semantic utility classes (like `bg-danger-soft text-danger`, `hover:bg-danger-soft`, `bg-warning-soft text-warning`, and `bg-success-soft`) break automatic theme resolution logic natively provided by the Tailwind token system (like `bg-muted text-destructive` or `text-success`) and create subtle contrast regressions.
**Action:** Always prefer standard semantic tokens natively resolving in light and dark mode, such as `bg-muted text-foreground`, `hover:bg-muted text-destructive`, and mapping borders to `border-border`, rather than raw `*-soft` tokens on interactive states.

## $(date +%Y-%m-%d) - [UX improvement] Fix invisible focus traps for keyboard users on resize handles
**Learning:** An interactive resize handle styled with hover-only visibility utilities (`opacity-0 hover:opacity-100`) without being natively focusable (`tabIndex`) or having keyboard states becomes an invisible focus trap, or is completely inaccessible via keyboard.
**Action:** Always make interactive UI elements focusable (`tabIndex={0}`) and pair `opacity-0 hover:opacity-100` with `focus-visible:opacity-100` to reveal interactive elements on keyboard navigation.
## $(date +%Y-%m-%d) - [UX improvement] Fix invisible focus traps for keyboard users on SVG ConnectorLine
**Learning:** SVG paths styled with hover-only visibility utilities on their adjacent `<text>` labels (`opacity-0 group-hover:opacity-100` where the `<svg>` is the `.group`) act as invisible focus traps if the path isn't natively focusable or doesn't trigger the group's focus state.
**Action:** Make interactive SVG elements focusable (`tabIndex={0}`) and add keyboard handlers (`onKeyDown`), while applying `group-focus-within:opacity-100` to the adjacent `<text>` label to ensure it becomes visible on keyboard focus.

## 2026-09-12 - Fix flex-1 min-w-0 on flex-col text nodes and *-soft backgrounds
**Learning:** Found an instance in DocumentEditor where `flex-1 min-w-0` was used on a text node inside a `flex-col` container, which prevents horizontal truncation and forces vertical stretching. Also identified remaining hardcoded `-soft` backgrounds (like `bg-warning-soft`) used directly on interactive/foreground UI like Toasts and CalloutBlocks.
**Action:** Always omit `flex-1 min-w-0` on children of `flex-col` containers when text truncation is desired, applying only `truncate`. Replace specific `*-soft` tokens in standard components with `bg-muted` and tinted borders to rely on Tailwind's native handling.
## $(date +%Y-%m-%d) - [UX improvement] Replace hardcoded semantic tokens for native scaling
**Learning:** Hardcoded combinations of semantic utility classes (like `bg-danger-soft text-danger`, `hover:bg-danger-soft`, `bg-warning-soft text-warning`, and `bg-success-soft`) break automatic theme resolution logic natively provided by the Tailwind token system (like `bg-muted text-destructive` or `text-success`) and create subtle contrast regressions.
**Action:** Always prefer standard semantic tokens natively resolving in light and dark mode, such as `bg-muted text-foreground`, `hover:bg-muted text-destructive`, and mapping borders to `border-border`, rather than raw `*-soft` tokens on interactive states.

## $(date +%Y-%m-%d) - [UX improvement] Fix flex-1 min-w-0 on flex-col text nodes and *-soft backgrounds
**Learning:** Found an instance in DocumentEditor where `flex-1 min-w-0` was used on a text node inside a `flex-col` container, which prevents horizontal truncation and forces vertical stretching. Also identified remaining hardcoded `-soft` backgrounds (like `bg-warning-soft`) used directly on interactive/foreground UI like Toasts and CalloutBlocks.
**Action:** Always omit `flex-1 min-w-0` on children of `flex-col` containers when text truncation is desired, applying only `truncate`. Replace specific `*-soft` tokens in standard components with `bg-muted` and tinted borders to rely on Tailwind's native handling.

## 2024-05-18 - Improve Screen Reader Accessibility of Graph Filter and Export Buttons
**Learning:** Found a recurring accessibility issue where interactive icon-only or text-only buttons in the Graph visualizer control bar lacked descriptive text and ARIA pressed states. Screen reader users would just hear "PNG" or "All" without understanding context like "Export graph as PNG" or that it functions as a toggle state.
**Action:** Always include explicit `aria-label` attributes on icon-only or ambiguous text buttons, and use `aria-pressed` for toggleable filter states.
## 2026-11-17 - Fix accent contrast issues on checkboxes
**Learning:** `accent-accent` is an invalid semantic anti-pattern for checkboxes, as the `accent` token is reserved for subtle hover states and maps to a light gray hue in light mode, causing contrast failures.
**Action:** Replace `accent-accent` with standard `accent-primary` for semantic brand color checkboxes without contrast issues.
## $(date +%Y-%m-%d) - Fix invisible focus traps on hover-only elements
**Learning:** Elements that use hover-only visibility utilities (e.g., `opacity-0 group-hover:opacity-100` or `hover:opacity-100`) become invisible focus traps when navigated to via keyboard.
**Action:** Always pair hover-only utilities with their corresponding focus utilities (e.g., `group-focus-visible:opacity-100`, `focus-visible:opacity-100`, or `group-focus-within:opacity-100`) to ensure they remain visible and accessible during keyboard navigation.
## $(date +%Y-%m-%d) - [Focus Traps with opacity-0 group-hover]
**Learning:** Found several places (e.g. `AllDocsView.tsx` document items, `TableBlock.tsx` drag handle) using `opacity-0 group-hover:opacity-100` that were completely invisible and inaccessible to keyboard users because the underlying container lacked `tabIndex={0}` and corresponding `focus-visible` styles.
**Action:** When creating hover-only interactive or informational elements via `opacity-0`, ensure the element itself (or its parent container) has `tabIndex={0}` and a visible focus ring (e.g. `focus-visible:ring-2 focus-visible:opacity-100 focus:outline-none`) to avoid breaking keyboard accessibility.
