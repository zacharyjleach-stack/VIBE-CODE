Add or improve dark mode support across the project.

Target: $ARGUMENTS

Read the existing theme setup (globals.css, tailwind.config.js, CSS variables) to understand what's already in place.

Implement complete dark mode:

1. **CSS Variables approach** (preferred for this project):
   - Define :root variables for light mode
   - Define [data-theme="dark"] or .dark overrides for dark mode
   - Ensure all colors reference variables, never hardcoded hex

2. **Toggle mechanism**:
   - Store preference in localStorage ('theme' key)
   - Respect prefers-color-scheme on first visit
   - Apply class/attribute to <html> element
   - Create a ThemeToggle component (sun/moon icon button)

3. **Next.js SSR safe**:
   - Avoid flash of wrong theme (FOUC) - add inline script to <head> before React hydrates
   - Use suppressHydrationWarning on <html> if needed

4. **Sweep all components**:
   - Replace any hardcoded dark colors with variable equivalents
   - Check text contrast in both modes (WCAG AA: 4.5:1 ratio)
   - Ensure borders, shadows, and backgrounds all adapt

Show before/after for the key color variables.
