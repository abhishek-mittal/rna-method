# Cursor Adapter

Generates RNA Method agent and rule files for [Cursor](https://cursor.sh).

## Requirements

- Cursor 0.40 or later
- A `rna-schema.json` file configured with `"platform": "cursor"`

## Generated Output

```
.cursor/
  agents/
    developer.md        ← one file per agent in rna-schema.json agents[]
    reviewer.md
    ...
    _registry.md        ← agent roster with routing keywords
  rules/
    coding-standards.md ← one file per rule in rna-schema.json rules[]
    ...
  skills/
    smart-dev-agent/
      SKILL.md          ← one directory per skill
  commands/
    rna-signal.md       ← signal queue helper command
```

## Usage

```bash
node adapters/cursor/cursor-adapter.js [schema-path] [output-dir]

# Examples:
node adapters/cursor/cursor-adapter.js rna-schema.json ./
node adapters/cursor/cursor-adapter.js schema/rna-schema.json /path/to/project
```

Arguments default to:
- `schema-path` → `../../schema/rna-schema.json` (relative to the adapter file)
- `output-dir` → the current working directory

## Platform Notes

| Feature | Support |
|---|---|
| Named agent files (`@agent-name`) | ✅ via `.cursor/agents/` |
| Always-apply rules | ✅ via `.cursor/rules/` with `alwaysApply: true` |
| Trigger-keyword rules | ✅ via `.cursor/rules/` |
| Skills | ✅ via `.cursor/skills/` |
| Pre/post-commit hooks | ✅ via `.cursor/rules/` instruction rules |
| Script hooks | ⚠️ Manual — Cursor does not auto-execute scripts |

## Invoking Agents

In Cursor's chat interface:
```
@developer Implement a user authentication endpoint
@reviewer Review this PR for security issues
@architect Design the caching layer for our API
```

The `_registry.md` file provides an index of all agents and their routing keywords.
