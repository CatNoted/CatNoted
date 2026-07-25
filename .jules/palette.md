## 2024-07-25 - Missing aria-labels on icon-only actions
**Learning:** Found a pattern of missing `aria-label`s on floating and secondary icon-only actions, specifically around the Space Agent FAB and panel controls. Screen reader users would have no context for what these buttons do.
**Action:** Always ensure that icon-only buttons have an `aria-label` describing their action, and use `aria-expanded` when the button toggles a panel or menu.
