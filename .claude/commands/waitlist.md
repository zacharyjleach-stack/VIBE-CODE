Build a waitlist / early access signup page or component.

What to create: $ARGUMENTS

**Full waitlist page with:**
- Email capture form with validation
- Social sharing to grow virally
- Referral tracking (give users a unique link)
- Real-time position counter ("You're #247 on the waitlist")
- Confirmation email via Resend

**Component:**
```tsx
'use client';
import { useState } from 'react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setPosition(data.position);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3>You're on the list!</h3>
        <p>You're <strong>#{position}</strong> on the waitlist.</p>
        <button onClick={() => {
          navigator.share?.({ title: 'Join Aegis', url: window.location.href });
        }}>
          Share to move up →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
      />
      <button type="submit" disabled={status === 'loading'} className="px-6 py-3 bg-[#7C6AFF] rounded-xl font-bold">
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  );
}
```

**API route (app/api/waitlist/route.ts):**
- Save to database (Prisma or Supabase)
- Return position number (count of signups before this one)
- Send confirmation email with Resend
- Track referral source

**Database model:**
```prisma
model WaitlistEntry {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  position  Int      @default(autoincrement())
  referrer  String?
  createdAt DateTime @default(now())
}
```

Build complete waitlist system with viral sharing mechanics.
