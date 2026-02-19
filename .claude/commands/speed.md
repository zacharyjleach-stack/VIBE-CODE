Audit and improve the performance of the specified page or the whole app.

Target: $ARGUMENTS

Read the relevant files and apply these optimisations:

**Next.js specific:**
- Convert client components to server components where possible (remove unnecessary 'use client')
- Add next/image for all <img> tags (automatic WebP, lazy loading, no CLS)
- Add next/font for Google Fonts (eliminates font flash, self-hosts)
- Use dynamic() imports with { loading: () => <Skeleton /> } for heavy components
- Add generateStaticParams for dynamic routes that can be pre-rendered

**Bundle size:**
- Find and replace heavy libraries with lighter alternatives
- Use tree-shakeable imports (import { specific } from 'lib' not import lib from 'lib')
- Move large dependencies to dynamic imports

**Data fetching:**
- Deduplicate fetch calls (Next.js caches by URL - use the same fetch config)
- Add revalidate to static data fetches
- Use Suspense boundaries for streaming

**CSS:**
- Remove unused CSS classes
- Ensure critical CSS is inlined

**Images:**
- Add width and height to all images to prevent layout shift
- Add priority prop to above-the-fold images
- Use placeholder="blur" for images

Show estimated impact for each change (High/Medium/Low).
