Make the specified component or page fully responsive across all screen sizes.

Target: $ARGUMENTS

Read the file(s) first, then apply responsive improvements:

Breakpoints to handle:
- Mobile: 320px - 480px (stack everything, full-width buttons, larger tap targets)
- Tablet: 481px - 768px (2-column grids, side-by-side where sensible)
- Desktop: 769px+ (current layout, multi-column)
- Wide: 1280px+ (max-width containers, no stretching)

Rules:
- Use Tailwind responsive prefixes (sm:, md:, lg:, xl:) if the project uses Tailwind
- Ensure touch targets are minimum 44x44px on mobile
- Stack horizontal layouts vertically on mobile
- Adjust font sizes (smaller headings on mobile)
- Ensure modals/popups don't overflow on small screens
- Test nav (hamburger menu or simplified nav on mobile)
- Images should never overflow their containers
- No horizontal scroll at any breakpoint

After changes, list every breakpoint change made.
