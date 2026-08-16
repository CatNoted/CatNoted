💡 What:
Replaced anti-pattern active states and hover affordances (e.g. `bg-accent/10 text-accent`, `dark:bg-accent/10`, conditional `text-accent` for selected items) with standardized semantic design tokens (`bg-muted text-foreground`, `hover:bg-muted`) across `AppLayout.tsx`, `SlashCommandMenu.tsx`, `DocumentEditor.tsx`, and `AllDocsView.tsx`.

🎯 Why: To standardize UI affordances natively across both light and dark mode contexts. Hardcoded alpha channels (`bg-accent/10`) and conditional active colors (`text-accent`) often fail to provide adequate contrast and break semantic design consistency. Standardizing to `bg-muted` and `text-foreground` ensures perfect accessibility compliance.

📊 Before/After: Before, several active UI tabs, menu selections, and empty state buttons used hardcoded combinations that could blend into backgrounds or fail WCAG contrast ratios in dark mode. After, interactive and selected elements natively map to robust `muted` and `foreground` semantic variants.

♿ Accessibility: Preserves WCAG contrast ratios natively configured in the application's global design palette without arbitrary overrides.
