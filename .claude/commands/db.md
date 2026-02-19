Create or update a database model and its associated API.

What to build: $ARGUMENTS

Read the existing Prisma schema (prisma/schema.prisma) and any existing models to understand conventions.

Tasks:
1. Add or update the model in prisma/schema.prisma with correct field types, relations, and indexes
2. Create a migration plan (list the prisma commands to run)
3. Generate the CRUD API routes:
   - GET (list with pagination)
   - GET /:id (single record)
   - POST (create with validation)
   - PATCH /:id (partial update)
   - DELETE /:id (soft delete preferred)
4. Add TypeScript types that match the Prisma schema
5. Create a service/helper function for common queries

Rules:
- Always add createdAt and updatedAt timestamps
- Use soft deletes (deletedAt field) for important user data
- Add database indexes on foreign keys and frequently queried fields
- Never expose password hashes, keys, or secrets in API responses
- Use transactions for operations that touch multiple tables

End with the exact commands to run: `npx prisma generate && npx prisma db push`
