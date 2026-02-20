Add GSAP (GreenSock) animations — the industry standard for high-end web animation.

What to animate: $ARGUMENTS

**Install:**
```bash
npm install gsap
```

**Core GSAP patterns:**

*Basic tween:*
```ts
import gsap from 'gsap';
gsap.to('.hero', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
gsap.from('.card', { opacity: 0, y: 40, stagger: 0.15, duration: 0.6 });
```

*ScrollTrigger (scroll-driven animations):*
```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.fromTo('.section', 
  { opacity: 0, y: 60 },
  {
    opacity: 1, y: 0,
    scrollTrigger: {
      trigger: '.section',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    }
  }
);
```

*Timeline (sequenced animations):*
```ts
const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
tl.from('.logo', { opacity: 0, x: -30, duration: 0.5 })
  .from('.nav-links', { opacity: 0, y: -20, stagger: 0.1 }, '-=0.2')
  .from('.hero-title', { opacity: 0, y: 40, duration: 0.8 }, '-=0.1')
  .from('.hero-cta', { opacity: 0, scale: 0.9 }, '-=0.3');
```

*TextPlugin (animated text):*
```ts
import { TextPlugin } from 'gsap/TextPlugin';
gsap.registerPlugin(TextPlugin);
gsap.to('.typewriter', { text: 'Hello World', duration: 2, ease: 'none' });
```

*React integration (useGSAP hook):*
```tsx
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP);

function Component() {
  const container = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from('.item', { opacity: 0, y: 30, stagger: 0.1 });
  }, { scope: container });
  return <div ref={container}><div className="item">Hello</div></div>;
}
```

**Easing cheatsheet:**
- power1-4.out = smooth deceleration
- elastic.out(1, 0.3) = springy
- back.out(1.7) = slight overshoot
- expo.out = dramatic deceleration
- bounce.out = physical bounce

Apply the specific animation requested. Wrap all animations in useGSAP for React. Always use ScrollTrigger for scroll-driven effects. Clean up with gsap.context().revert() on unmount.
