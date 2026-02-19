Set up transactional email with Resend.

What to build: $ARGUMENTS

**Install:**
```bash
npm install resend @react-email/components
```

**Setup (lib/resend.ts):**
```ts
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Create email templates (emails/*.tsx):**
```tsx
import { Html, Head, Body, Container, Text, Button, Heading } from '@react-email/components';

export function WelcomeEmail({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4' }}>
        <Container style={{ padding: '20px', backgroundColor: '#fff' }}>
          <Heading>Welcome, {name}!</Heading>
          <Text>Thanks for signing up.</Text>
          <Button href={url} style={{ backgroundColor: '#7C6AFF', color: '#fff' }}>
            Get Started
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

**Send email (API route):**
```ts
import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

await resend.emails.send({
  from: 'Aegis <noreply@aegissolutions.co.uk>',
  to: email,
  subject: 'Welcome to Aegis',
  react: WelcomeEmail({ name, url }),
});
```

**Preview emails locally:**
```bash
npx email dev
```

Build the specific email template and sending logic requested.
