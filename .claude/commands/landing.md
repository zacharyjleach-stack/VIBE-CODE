Build a high-converting landing page section or full landing page.

What to build: $ARGUMENTS

Read the existing landing page (packages/web/src/app/page.tsx) and components to match the design system.

Landing page best practices to apply:
- **Hero**: Bold headline (problem → solution format), subheading, primary CTA button, social proof stat
- **Features grid**: 3 or 6 cards, icon + title + description, alternating or grid layout
- **How it works**: 3-step numbered process, simple and scannable
- **Pricing**: Clear tier comparison, highlight the recommended plan with a glow/border
- **Testimonials/Social proof**: Quotes, logos, or stats with sources
- **FAQ**: Accordion-style, answer the top objections
- **CTA section**: Final push with headline + button before footer

Design rules:
- Dark glassmorphic theme matching existing design (--bg-dark, --accent, glass utility class)
- Animations: fade-in on scroll with CSS animation-delay staggering
- Mobile-first responsive layout
- CTAs use the accent purple (#7C6AFF)
- Every section should have a clear purpose and drive toward signup/purchase

Make it feel premium and modern, not generic SaaS template.
