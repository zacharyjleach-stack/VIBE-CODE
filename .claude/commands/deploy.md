Prepare and execute a production deployment for this project.

Target/notes: $ARGUMENTS

Work through this checklist:

**Pre-deploy checks:**
1. Read package.json scripts - identify the build command
2. Run the build and fix any TypeScript or compilation errors
3. Check for any hardcoded localhost URLs or dev-only config
4. Verify all required environment variables are documented in .env.example
5. Check .gitignore excludes .env files, node_modules, .next, dist

**Railway-specific (this project's deployment):**
1. Verify the correct start/build commands for the service
2. List every environment variable that must be set in Railway dashboard
3. Check DATABASE_URL format matches the Railway PostgreSQL addon format
4. Ensure NEXT_PUBLIC_ vars are set (Railway must expose them at build time)

**Final steps:**
1. Commit any outstanding changes
2. Push to the branch: claude/iris-aegis-architecture-SIcFr
3. List the Railway dashboard steps to trigger the deploy
4. Provide the health check URL to verify the deploy succeeded

Show the user a deploy checklist they can tick off.
