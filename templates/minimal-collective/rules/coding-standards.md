---
alwaysApply: true
description: "Core coding guidelines for this project"
---

# Development Standards

## Code Quality

- Write simple, readable code. Prefer clarity over cleverness.
- Use early returns. Fail fast; happy path last. No nested conditionals deeper than 2 levels.
- Minimal diffs — change only what the current task requires. Do not refactor adjacent code silently.
- DRY principle. No copy-pasted logic. Extract shared code to `lib/` or a designated utility directory.

## Naming & Events

- Prefix event handler names with `handle` (e.g., `handleSave`, `handleKeyDown`, `handleSubmit`).
- Use lowercase-kebab-case for filenames.
- Use PascalCase for component names, camelCase for functions and variables.

## Documentation

- Add JSDoc to all public functions in `lib/` and API handlers. Single-line `/** ... */` is sufficient for simple functions.
- Do not add comments that merely describe what the code does. Comments should explain *why*.

## Session Memory

At the end of every session, update `_memory/rna-method/timeline.json`:
- Add new decisions to `knownDecisions[]`
- Remove resolved items from `openQuestions[]`
- Update `lastTask` for the active agent in `teamProfiles[]`

This is non-negotiable. The hub is the team's institutional memory.
