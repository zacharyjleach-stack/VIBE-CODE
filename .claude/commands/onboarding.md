Build a complete onboarding flow for new users after signup.

What to build: $ARGUMENTS

**Multi-step onboarding wizard:**
```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['profile', 'usecase', 'install', 'done'] as const;
type Step = typeof STEPS[number];

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>('profile');
  const [data, setData] = useState({});
  const router = useRouter();

  const progress = ((STEPS.indexOf(step) + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F]">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8">
          <div
            className="h-full bg-[#7C6AFF] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {step === 'profile' && <ProfileStep onNext={(d) => { setData(d); setStep('usecase'); }} />}
        {step === 'usecase' && <UseCaseStep onNext={(d) => { setData(d); setStep('install'); }} />}
        {step === 'install' && <InstallStep onNext={() => setStep('done')} />}
        {step === 'done' && <DoneStep onFinish={() => router.push('/dashboard')} />}
      </div>
    </div>
  );
}
```

**Onboarding steps to build:**
1. **Profile** - Name, role (indie dev / team / agency)
2. **Use case** - What are you building? (select options with icons)
3. **Install** - Show CLI install command with copy button, animated terminal
4. **Done** - Confetti, summary of what they set up, CTA to dashboard

**Animated terminal component:**
```tsx
function Terminal({ lines }: { lines: string[] }) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  useEffect(() => {
    lines.forEach((line, i) => {
      setTimeout(() => setDisplayed(prev => [...prev, line]), i * 800);
    });
  }, []);
  return (
    <div className="bg-black rounded-xl p-6 font-mono text-sm">
      <div className="flex gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      {displayed.map((line, i) => (
        <div key={i} className="text-green-400">$ {line}</div>
      ))}
    </div>
  );
}
```

**Save progress to database** so users can resume if they close the tab.

Build the complete onboarding flow for the use case described.
