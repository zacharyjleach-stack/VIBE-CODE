Add analytics and tracking to the application.

What to track: $ARGUMENTS

**PostHog (recommended - open source, self-hostable):**
```bash
npm install posthog-js posthog-node
```

```tsx
// lib/posthog.ts
import PostHog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    PostHog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false, // Manual for App Router
    });
  }
}

// Track events
export function track(event: string, properties?: Record<string, unknown>) {
  PostHog.capture(event, properties);
}
```

```tsx
// providers/PostHogProvider.tsx
'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import posthog from 'posthog-js';

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, searchParams]);
  return null;
}
```

**Track key events:**
```ts
track('signup_completed', { plan: 'free', source: 'landing_page' });
track('upgrade_clicked', { from_plan: 'free', to_plan: 'pro' });
track('vibe_check_run', { score: 87, route: '/dashboard' });
track('checkout_started', { plan: 'pro', price: 20 });
track('checkout_completed', { plan: 'pro', revenue: 20 });
```

**Plausible (simple, privacy-first alternative):**
```tsx
// next.config.js
// Add to _document or layout:
<Script defer data-domain="aegissolutions.co.uk" src="https://plausible.io/js/script.js" />
```

**Vercel Analytics (zero-config):**
```bash
npm install @vercel/analytics
```
```tsx
import { Analytics } from '@vercel/analytics/react';
<Analytics /> // Add to layout.tsx
```

**Environment variables to add:**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Implement the analytics setup requested with event tracking for all key user actions.
