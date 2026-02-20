Add Lottie animations to the project.

What to animate: $ARGUMENTS

**Install:**
```bash
npm install lottie-react
# or for lightweight version:
npm install @lottiefiles/dotlottie-react
```

**Basic usage:**
```tsx
import Lottie from 'lottie-react';
import animationData from '@/assets/animations/success.json';

export function SuccessAnimation() {
  return (
    <Lottie
      animationData={animationData}
      loop={false}
      autoplay={true}
      style={{ width: 200, height: 200 }}
    />
  );
}
```

**Controlled playback:**
```tsx
import Lottie from 'lottie-react';
import { useRef } from 'react';

function ControlledAnimation() {
  const lottieRef = useRef();
  return (
    <>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
      />
      <button onClick={() => lottieRef.current.play()}>Play</button>
      <button onClick={() => lottieRef.current.stop()}>Stop</button>
    </>
  );
}
```

**Play on hover:**
```tsx
<div
  onMouseEnter={() => lottieRef.current.play()}
  onMouseLeave={() => { lottieRef.current.stop(); lottieRef.current.goToAndStop(0, true); }}
>
  <Lottie lottieRef={lottieRef} animationData={data} autoplay={false} loop={false} />
</div>
```

**Free Lottie animation sources:**
- https://lottiefiles.com/featured
- https://lottiefiles.com/search (search "success", "loading", "rocket", etc.)
- Download as JSON and place in public/animations/ or src/assets/animations/

**DotLottie format (lighter, newer):**
```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
<DotLottieReact src="/animations/hero.lottie" loop autoplay />
```

Implement the specific animation requested. Suggest the best Lottie animation to download from LottieFiles for the use case.
