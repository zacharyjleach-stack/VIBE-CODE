Run a full vibe check on the project - code quality, UI consistency, and overall health.

Focus area (optional): $ARGUMENTS

Do a comprehensive sweep:

**UI Vibe:**
- Read the main pages and components - does everything match the design system?
- Are there any hardcoded colours that should use CSS variables?
- Inconsistent spacing, fonts, or border-radius?
- Any placeholder text like "Lorem ipsum" or "TODO" left in?
- Are all buttons and links styled consistently?

**Code Vibe:**
- Any console.log() left in production code?
- Any commented-out code blocks?
- Any files that are imported but don't exist yet?
- TypeScript errors or @ts-ignore hacks?
- Any obvious missing error handling?

**Content Vibe:**
- Are page titles and meta descriptions set?
- Do all images have alt text?
- Are there broken internal links?
- Any "Coming Soon" features that block the user?

**Security Vibe:**
- Any API routes missing auth checks?
- Any hardcoded secrets or keys in source files?

Output a scorecard:
🟢 Passing | 🟡 Needs attention | 🔴 Fix before launch

Then fix the 🔴 issues immediately.
