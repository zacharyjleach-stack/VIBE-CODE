Debug and fix the issue described below. Be thorough.

Issue: $ARGUMENTS

Steps to follow:
1. Read the relevant files mentioned in the error or related to the feature
2. Identify the root cause - don't just treat the symptom
3. Check for related issues that might break when you fix this one
4. Apply the fix
5. Verify the fix makes sense end-to-end

Rules:
- Fix the actual root cause, not just the error message
- Don't add unnecessary try/catch to hide errors
- Don't change unrelated code
- If the fix requires a type change, update all affected files
- After fixing, run any relevant build/type checks if possible

Explain what was wrong and why the fix works.
