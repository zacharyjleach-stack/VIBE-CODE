Create a stunning video background hero section.

Details: $ARGUMENTS

Build a full-screen video hero with these elements:

**HTML5 Video Background:**
```tsx
export function VideoHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video Layer */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero.webm" type="video/webm" />
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
        <h1>Your Headline</h1>
        <p>Subheading text</p>
        <button>Call to Action</button>
      </div>
    </section>
  );
}
```

**Performance optimizations:**
- Use WebM format first (50% smaller than MP4)
- Keep video under 10MB - loop a 5-10 second clip
- Add `preload="metadata"` if above the fold is slow
- Provide a poster image as fallback: `poster="/images/hero-poster.jpg"`

**Reduced motion fallback:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Show static poster image instead of video if true
```

**YouTube/Vimeo embed as background:**
```tsx
// For existing video content
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=VIDEO_ID&controls=0&showinfo=0"
    className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  />
</div>
```

**CSS-only animated gradient alternative (no video file needed):**
```css
.animated-hero {
  background: linear-gradient(-45deg, #0d0d0f, #1a0a2e, #0d0d0f, #0a1628);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

Build the complete hero component with animations, overlay, and content slots. Mobile-first and fully accessible.
