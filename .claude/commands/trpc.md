Set up tRPC for type-safe API calls between client and server.

What to build: $ARGUMENTS

**Install:**
```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod
```

**Server setup (src/server/trpc/):**

1. trpc.ts - Initialize tRPC with context
```ts
import { initTRPC } from '@trpc/server';
const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```

2. routers/*.ts - Define your API procedures
```ts
export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => { ... }),
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => { ... }),
});
```

3. root.ts - Merge all routers
4. [trpc]/route.ts - Next.js API handler

**Client setup:**
1. lib/trpc.ts - Create typed hooks with createTRPCReact
2. TRPCProvider wrapper with QueryClient

**Usage:**
```tsx
const { data, isLoading } = trpc.user.getById.useQuery({ id: "123" });
const mutation = trpc.user.create.useMutation();
```

Build the complete tRPC setup for the requested feature with full inference.
