Build a social proof section - testimonials, logos, stats, and reviews.

What to build: $ARGUMENTS

**Scrolling logo wall (auto-scroll, no JS):**
```tsx
const LOGOS = ['vercel.svg', 'nextjs.svg', 'stripe.svg', 'openai.svg', 'github.svg'];

export function LogoWall() {
  return (
    <div className="overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
      <div className="flex gap-16 animate-[scroll_20s_linear_infinite] w-max">
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <img key={i} src={`/logos/${logo}`} alt="" className="h-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition" />
        ))}
      </div>
    </div>
  );
}
// CSS: @keyframes scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
```

**Testimonial cards with avatars:**
```tsx
const TESTIMONIALS = [
  {
    quote: "Aegis completely changed how I work with multiple AI tools. No more context switching.",
    name: "Sarah Chen",
    role: "Senior Engineer @ Stripe",
    avatar: "/avatars/sarah.jpg",
    rating: 5,
  },
];

export function TestimonialCard({ quote, name, role, avatar, rating }) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-[#7C6AFF]/40 transition">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
      </div>
      <p className="text-[#E8E8F0] leading-relaxed mb-6">"{quote}"</p>
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div>
          <div className="font-semibold text-white text-sm">{name}</div>
          <div className="text-[#8E8E96] text-xs">{role}</div>
        </div>
      </div>
    </div>
  );
}
```

**Stats bar:**
```tsx
const STATS = [
  { value: '5,000+', label: 'Developers' },
  { value: '2.4M', label: 'Tokens processed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Average rating' },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-y border-white/10">
      {STATS.map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{value}</div>
          <div className="text-[#8E8E96] text-sm">{label}</div>
        </div>
      ))}
    </div>
  );
}
```

**Tweet wall** (embed real tweets as cards matching the dark theme).

Build all social proof components requested with animated number counters using IntersectionObserver.
