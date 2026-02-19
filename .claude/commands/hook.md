Create a custom React hook for reusable logic.

What the hook should do: $ARGUMENTS

Read existing hooks in the project (look for useXxx files in src/hooks/ or packages/) to match patterns.

Build a complete, production-ready hook:
- Name it useXxx following React conventions
- Use TypeScript with full type safety - no `any`
- Handle loading, error, and success states
- Clean up side effects in useEffect return functions (clear timers, abort fetch, close sockets)
- Use useCallback and useMemo to prevent unnecessary re-renders where appropriate
- Handle edge cases: unmounted component updates, race conditions in async hooks
- Export a typed return object (not a tuple, unless it's a simple [value, setter] pattern)

Include:
1. The hook file with full implementation
2. A usage example showing how to use it in a component
3. The TypeScript interface for the return value

Place in the appropriate hooks directory for this project.
