Set up, audit, or document environment variables for this project.

Task: $ARGUMENTS

Read all config files, .env.example, and source files that reference process.env to:

1. **Audit existing vars**: List every env var used in the codebase and whether it's documented in .env.example
2. **Find missing vars**: Identify any process.env.SOMETHING that isn't in .env.example
3. **Categorise by service**: Group vars by Clerk, Stripe, OpenAI, Database, App config etc.
4. **Check security**: Flag any NEXT_PUBLIC_ vars that contain secrets (they're exposed to the browser)
5. **Update .env.example**: Add missing vars with clear placeholder values and comments explaining what each is for and where to get it
6. **Railway checklist**: List every var that must be set in the Railway dashboard for production

Format the output as a table:
| Variable | Required | Where to get it | Exposed to browser? |
|----------|----------|-----------------|---------------------|

Never output real values - placeholders only.
