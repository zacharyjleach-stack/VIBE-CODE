Add a GDPR-compliant cookie consent banner to the application.

What to build: $ARGUMENTS

**Install:**
```bash
npm install js-cookie
```

**Cookie consent context (lib/cookies.ts):**
```ts
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CookieState {
  consent: 'accepted' | 'rejected' | 'pending';
  acceptAll: () => void;
  rejectAll: () => void;
  acceptSelected: (prefs: CookiePrefs) => void;
  prefs: CookiePrefs;
}

interface CookiePrefs {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const useCookies = create<CookieState>()(
  persist(
    (set) => ({
      consent: 'pending',
      prefs: { analytics: false, marketing: false, functional: true },
      acceptAll: () => set({ consent: 'accepted', prefs: { analytics: true, marketing: true, functional: true } }),
      rejectAll: () => set({ consent: 'rejected', prefs: { analytics: false, marketing: false, functional: true } }),
      acceptSelected: (prefs) => set({ consent: 'accepted', prefs }),
    }),
    { name: 'cookie-consent' }
  )
);
```

**Cookie banner component:**
```tsx
'use client';
import { useCookies } from '@/lib/cookies';
import { useState } from 'react';

export function CookieBanner() {
  const { consent, acceptAll, rejectAll, acceptSelected, prefs } = useCookies();
  const [showDetails, setShowDetails] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(prefs);

  if (consent !== 'pending') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto glass rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <p className="text-sm text-[#E8E8F0]">
              We use cookies to improve your experience and analyse site traffic.{' '}
              <button onClick={() => setShowDetails(!showDetails)} className="text-[#7C6AFF] underline">
                Manage preferences
              </button>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-sm text-[#8E8E96] border border-white/10 rounded-lg hover:bg-white/5 transition"
            >
              Reject all
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm bg-[#7C6AFF] text-white rounded-lg hover:bg-[#6A5AFF] transition font-medium"
            >
              Accept all
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid gap-4">
              {[
                { key: 'functional', label: 'Functional', desc: 'Required for the site to work properly', locked: true },
                { key: 'analytics', label: 'Analytics', desc: 'Help us understand how visitors use the site' },
                { key: 'marketing', label: 'Marketing', desc: 'Used to deliver relevant advertisements' },
              ].map(({ key, label, desc, locked }) => (
                <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-[#8E8E96]">{desc}</div>
                  </div>
                  <button
                    disabled={locked}
                    onClick={() => setLocalPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      (locked || localPrefs[key]) ? 'bg-[#7C6AFF]' : 'bg-white/10'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      (locked || localPrefs[key]) ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
            <button
              onClick={() => acceptSelected(localPrefs)}
              className="mt-4 w-full py-2 text-sm bg-[#7C6AFF]/20 text-[#7C6AFF] border border-[#7C6AFF]/30 rounded-lg hover:bg-[#7C6AFF]/30 transition"
            >
              Save preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Add to layout.tsx:**
```tsx
import { CookieBanner } from '@/components/CookieBanner';
// Inside <body>:
<CookieBanner />
```

**Conditionally load analytics based on consent:**
```tsx
'use client';
import { useEffect } from 'react';
import { useCookies } from '@/lib/cookies';

export function ConditionalAnalytics() {
  const { prefs } = useCookies();

  useEffect(() => {
    if (prefs.analytics) {
      // Load PostHog, GA, etc.
    }
  }, [prefs.analytics]);

  return null;
}
```

Build the cookie consent system with the specific requirements and styling requested.
