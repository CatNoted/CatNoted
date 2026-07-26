## 2026-07-26 - Command Palette visual noise reduction

**Learning:** Reducing visual clutter (such as bulky square backgrounds behind item icons and vertically stacked metadata) in command palettes directly enhances readability and speed of cognitive scanning. Aligning descriptive metadata to the right margin yields a cleaner vertical text alignment on the left, making user interaction feel significantly faster and more modern.

**Action:** Refactored `CommandPalette.tsx` to directly render Lucide icons with custom sizes, aligned subtitles to the far right, thinned group header fonts, and streamlined the interactive key helper footer to look modern, lightweight, and precise.
