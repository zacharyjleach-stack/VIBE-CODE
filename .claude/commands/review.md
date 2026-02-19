Do a thorough code review of the specified file or feature.

Target: $ARGUMENTS

Read all relevant files, then review against these criteria:

**Security:**
- SQL injection, XSS, CSRF vulnerabilities
- Exposed secrets or API keys
- Missing auth checks on sensitive routes
- Unvalidated user input being used in queries or commands

**Performance:**
- N+1 database queries
- Missing database indexes
- Large bundles being imported unnecessarily
- Missing React memoization where it would help
- Images without width/height causing layout shift

**Correctness:**
- Edge cases not handled (empty arrays, null values, network failures)
- Race conditions in async code
- Missing error handling
- TypeScript `any` types hiding real type errors

**Code quality:**
- Duplicated logic that should be extracted
- Functions doing too many things
- Variables with unclear names
- Dead code / unused imports

**Output format:**
- 🔴 Critical issues (must fix before shipping)
- 🟡 Warnings (should fix soon)
- 🟢 Suggestions (nice to have)

Be direct and specific. Reference exact line numbers.
