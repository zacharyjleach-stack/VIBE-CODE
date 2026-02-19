Add polished animations and micro-interactions to the specified component or page.

Target: $ARGUMENTS

Read the file and existing CSS/animation patterns in the project first (globals.css, tailwind config, existing keyframes).

Add these types of animations where appropriate:
- **Entrance animations**: fade-in + slide-up for sections as they appear (use Intersection Observer or CSS animation-delay)
- **Hover effects**: scale, glow, color transitions on buttons and cards
- **Loading states**: skeleton screens or spinners for async content
- **Micro-interactions**: button press feedback, input focus rings, icon rotations
- **Scroll animations**: parallax, sticky elements, progress indicators
- **State transitions**: smooth height changes, color morphs between states

Rules:
- Respect prefers-reduced-motion - wrap animations in @media (prefers-reduced-motion: no-preference)
- Keep durations between 150ms (micro) and 600ms (entrance) - nothing slow
- Use CSS transforms and opacity only (never animate width/height/top/left directly - causes repaints)
- Use ease-out for entrances, ease-in for exits, ease-in-out for loops
- Don't add animations that distract from the content
