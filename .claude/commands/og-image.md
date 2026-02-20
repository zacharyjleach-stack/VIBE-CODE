Generate dynamic Open Graph images for social sharing.

What to create: $ARGUMENTS

**Next.js ImageResponse (built-in, no dependencies):**

Create app/api/og/route.tsx:
```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Aegis - Universal Agentic Bridge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Aegis';
  const description = searchParams.get('description') || 'The Universal Agentic Bridge';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0D0D0F 0%, #1a0a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: 80, marginBottom: 24, color: '#7C6AFF' }}>⬡</div>
        {/* Brand */}
        <div style={{ fontSize: 28, letterSpacing: 12, color: '#8E8E96', marginBottom: 40 }}>
          AEGIS
        </div>
        {/* Title */}
        <div style={{ fontSize: 64, fontWeight: 700, color: '#E8E8F0', textAlign: 'center', marginBottom: 24, lineHeight: 1.1 }}>
          {title}
        </div>
        {/* Description */}
        <div style={{ fontSize: 28, color: '#8E8E96', textAlign: 'center', maxWidth: 800 }}>
          {description}
        </div>
        {/* Bottom bar */}
        <div style={{ position: 'absolute', bottom: 48, display: 'flex', alignItems: 'center', gap: 12, color: '#8E8E96', fontSize: 22 }}>
          <span style={{ color: '#7C6AFF' }}>⬡</span>
          aegissolutions.co.uk
        </div>
      </div>
    ),
    { ...size }
  );
}
```

**Dynamic OG per page:**
```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    openGraph: {
      images: [{
        url: `/api/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.excerpt)}`,
        width: 1200,
        height: 630,
      }],
    },
  };
}
```

**Preview your OG images:**
- Visit: https://og-playground.vercel.app
- Or locally: http://localhost:3000/api/og?title=Your+Title

Build the specific OG image template requested with the project's brand colors and style.
