Set up or extend Supabase integration for this project.

What to build: $ARGUMENTS

**Initial setup (if not installed):**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Environment variables (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**Client setup:**
1. Create lib/supabase/client.ts - Browser client with createBrowserClient()
2. Create lib/supabase/server.ts - Server client with createServerClient() + cookies
3. Create lib/supabase/middleware.ts - For session refresh

**Common patterns:**

*Auth:*
- supabase.auth.signInWithOAuth({ provider: 'google' })
- supabase.auth.signUp/signInWithPassword
- getUser() in server components

*Database:*
- supabase.from('table').select('*').eq('id', id)
- .insert(), .update(), .delete()
- Realtime: .channel().on('postgres_changes', ...).subscribe()

*Storage:*
- supabase.storage.from('bucket').upload/download/getPublicUrl

*Row Level Security:*
- Always define RLS policies in Supabase dashboard
- Use service_role key only in secure server contexts

Generate the specific implementation requested with full TypeScript types.
