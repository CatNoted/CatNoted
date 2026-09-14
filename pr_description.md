🎨 Palette: [UX improvement] Fix layout breaks and semantic contrast issues

Removed `flex-1 min-w-0` from text nodes in `EmbedBlock.tsx` to fix vertical layout stretching inside `flex-col` containers.
Replaced remaining `-soft` background semantic tokens (e.g. `border-warning-soft`) in `AppLayout.tsx` and completely removed legacy `-soft` CSS utility classes from `index.css` to fix automatic theme resolution and contrast regressions.
