# Subagents

Place subagent `.md` files here to make them available project-wide.
These are shared with the team (committed to git).

For personal subagents available across all projects, place them in
`~/.claude/agents/` inside the container (persisted via the named volume).

## Example subagent file structure

```markdown
---
name: expo-tester
description: Runs Expo tests and checks for TypeScript errors
tools:
  - Bash
  - Read
  - Write
---

You are a testing specialist for an Expo/React Native project.
Your job is to run tests, check types, and report issues clearly.

Always run in this order:
1. `npm run typecheck` (or `tsc --noEmit`)
2. `npm test`
3. Report all failures with file + line number
```

## Subagent communication

Subagents can communicate by writing to shared files or via the
orchestrating agent's context. Up to 10 subagents can run in parallel.
See: https://code.claude.com/docs/en/sub-agents
