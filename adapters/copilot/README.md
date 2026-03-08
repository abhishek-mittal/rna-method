# GitHub Copilot Adapter

Generates RNA Method agent and instruction files for [GitHub Copilot](https://github.com/features/copilot) in VS Code or JetBrains.

## Requirements

- GitHub Copilot extension in VS Code (1.90+) or JetBrains IDE
- Copilot plan: Free tier or higher
- A `rna-schema.json` file configured with `"platform": "copilot"`

## Generated Output

```
.github/
  agents/
    developer.agent.md        ← one file per agent in rna-schema.json agents[]
    reviewer.agent.md
    ...
  copilot-instructions.md     ← always-apply hub: routing table + always-apply rules
  instructions/
    coding-standards.instructions.md  ← one file per rule with alwaysApply: false
    security-gate.instructions.md
    ...
  skills/
    smart-dev-agent/
      SKILL.md
```

## Usage

```bash
node adapters/copilot/copilot-adapter.js [schema-path] [output-dir]

# Examples:
node adapters/copilot/copilot-adapter.js rna-schema.json ./
node adapters/copilot/copilot-adapter.js schema/rna-schema.json /path/to/project
```

## Platform Notes

| Feature | Support |
|---|---|
| Named agent files (`@agent-name`) | ✅ via `.github/agents/*.agent.md` |
| Always-apply instructions | ✅ via `.github/copilot-instructions.md` |
| File-glob instructions | ✅ via `.github/instructions/*.instructions.md` with `applyTo` frontmatter |
| Skills | ✅ via `.github/skills/` |
| Pre/post-commit hooks | ✅ via instruction rule files |
| Script hooks | ⚠️ Manual |

## Invoking Agents

In VS Code Copilot Chat:
```
@developer Implement a pagination endpoint for GET /posts
@reviewer Review this PR against the security gate checklist
@architect Design the multi-tenant database schema
```

The `copilot-instructions.md` doubles as a routing hub — it includes the agent roster and always-apply rules.

## Frontmatter in Instructions Files

The adapter generates instruction files with Copilot-compatible frontmatter:

```yaml
---
applyTo: "app/api/**"
description: "API conventions for route handlers"
---
```

`applyTo: "**"` means always apply; a glob pattern means apply only when the user's file matches.
