Build a changelog or release notes page for the product.

What to build: $ARGUMENTS

**File-based changelog (content/changelog/*.mdx):**
```mdx
---
version: "1.2.0"
date: "2024-03-15"
tags: ["feature", "improvement"]
---

## What's new in 1.2.0

### New features
- Added real-time collaboration mode
- Token Sentry dashboard with usage graphs
- Export sessions to PDF or Markdown

### Improvements
- 40% faster relay startup
- Better error messages when API key is invalid

### Bug fixes
- Fixed HUD overlay flickering on Windows
```

**Changelog page (app/changelog/page.tsx):**
```tsx
import { getAllChangelogs } from '@/lib/changelog';

const TAG_COLORS = {
  feature: 'bg-[#7C6AFF]/20 text-[#7C6AFF]',
  improvement: 'bg-blue-500/20 text-blue-400',
  bugfix: 'bg-red-500/20 text-red-400',
  security: 'bg-yellow-500/20 text-yellow-400',
  breaking: 'bg-orange-500/20 text-orange-400',
};

export default async function ChangelogPage() {
  const entries = await getAllChangelogs();

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Changelog</h1>
        <p className="text-[#8E8E96]">Every update, improvement, and fix — all in one place.</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />

        <div className="space-y-16">
          {entries.map(entry => (
            <div key={entry.version} className="pl-8 relative">
              {/* Timeline dot */}
              <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-[#7C6AFF]" />

              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[#7C6AFF] font-bold">v{entry.version}</span>
                <span className="text-[#8E8E96] text-sm">{entry.date}</span>
                <div className="flex gap-2">
                  {entry.tags?.map(tag => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] || 'bg-white/10 text-white'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-[#8E8E96] prose-li:text-[#8E8E96] prose-strong:text-white">
                  {/* Render MDX content */}
                  {entry.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Subscribe to updates widget:**
```tsx
export function ChangelogSubscribe() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10 sticky top-8">
      <h3 className="font-semibold text-white mb-2">Stay updated</h3>
      <p className="text-[#8E8E96] text-sm mb-4">Get notified when we ship new updates.</p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8E8E96] focus:outline-none focus:border-[#7C6AFF]"
        />
        <button className="bg-[#7C6AFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6A5AFF] transition">
          Subscribe
        </button>
      </div>
    </div>
  );
}
```

**RSS feed (app/changelog/feed.xml/route.ts):**
```ts
export async function GET() {
  const entries = await getAllChangelogs();
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Aegis Changelog</title>
    <link>https://yourdomain.com/changelog</link>
    ${entries.map(e => `
    <item>
      <title>v${e.version}</title>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <link>https://yourdomain.com/changelog#v${e.version}</link>
    </item>`).join('')}
  </channel>
</rss>`;
  return new Response(rss, { headers: { 'Content-Type': 'application/xml' } });
}
```

Build the complete changelog experience with the specific features requested.
