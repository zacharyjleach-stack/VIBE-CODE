Add toast notifications, alerts, and in-app notification system.

What to build: $ARGUMENTS

**Install (Sonner - best toast library):**
```bash
npm install sonner
```

**Setup in layout.tsx:**
```tsx
import { Toaster } from 'sonner';

// In your root layout, add:
<Toaster
  position="bottom-right"
  theme="dark"
  toastOptions={{
    style: {
      background: '#1A1A2E',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#E8E8F0',
    },
  }}
/>
```

**Trigger toasts anywhere:**
```ts
import { toast } from 'sonner';

// Success
toast.success('Saved successfully!');

// Error
toast.error('Something went wrong.');

// Loading → resolved
const id = toast.loading('Saving...');
// later:
toast.success('Saved!', { id });

// Custom with action
toast('New message from Sarah', {
  action: {
    label: 'View',
    onClick: () => router.push('/messages'),
  },
  icon: '💬',
});

// Promise (auto loading → success/error)
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save.',
});
```

**In-app notification bell (component):**
```tsx
'use client';
import { useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
}

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/5 transition">
        <Bell className="w-5 h-5 text-[#8E8E96]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#7C6AFF] rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass rounded-2xl border border-white/10 overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <span className="font-semibold text-white">Notifications</span>
            <button className="text-xs text-[#7C6AFF]">Mark all read</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map(n => (
              <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition ${!n.read ? 'bg-[#7C6AFF]/5' : ''}`}>
                {!n.read && <div className="w-1.5 h-1.5 bg-[#7C6AFF] rounded-full float-right mt-1" />}
                <div className="font-medium text-white text-sm">{n.title}</div>
                <div className="text-[#8E8E96] text-xs mt-0.5">{n.body}</div>
                <div className="text-[#8E8E96] text-xs mt-1 opacity-60">{n.time}</div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 text-center text-[#8E8E96] text-sm">No notifications yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**API route for notifications (app/api/notifications/route.ts):**
```ts
export async function GET(req: Request) {
  // Fetch from DB, return user's notifications
  const notifications = await db.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return Response.json(notifications);
}

export async function PATCH(req: Request) {
  // Mark all as read
  await db.notification.updateMany({ where: { userId }, data: { read: true } });
  return Response.json({ ok: true });
}
```

Build the specific notification feature requested with proper UX.
