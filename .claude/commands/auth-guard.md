Add authentication protection to a route or component using Clerk.

What to protect: $ARGUMENTS

Tasks:
1. Read the existing auth patterns in the project (middleware.ts, existing protected pages/routes)
2. Determine if this is a page, API route, or component that needs protecting
3. For pages: use auth() from @clerk/nextjs/server and redirect to sign-in if not authenticated
4. For API routes: use auth() and return 401 JSON response if not authenticated
5. For components: use <SignedIn> / <SignedOut> wrappers or useUser() hook
6. Update middleware.ts matcher if the route needs to be added to protected paths

Rules:
- Import auth() from @clerk/nextjs/server (never @clerk/nextjs) for server-side checks
- Always use async/await with auth()
- Redirect to /sign-in for unauthenticated page access
- Return { error: 'Unauthorized' } with status 401 for API routes
- Never expose sensitive data before auth check
