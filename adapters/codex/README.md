# OpenAI Codex Adapter

Generates RNA Method configuration for [OpenAI Codex](https://platform.openai.com/docs/assistants) CLI agent (`codex` CLI tool).

## Requirements

- Codex CLI installed (see [openai/codex](https://github.com/openai/codex))
- An OpenAI API key
- A `rna-schema.json` file configured with `"platform": "codex"`

## Generated Output

```
AGENTS.md                 ← primary hub file (root-level)
api/
  AGENTS.override.md      ← API-specific overrides (if api/ directory exists)
```

Codex reads `AGENTS.md` from the project root and from subdirectory overrides. The adapter generates:

- **`AGENTS.md`** — agent roster, session protocol, always-apply rules, routing table, joining patterns
- **`api/AGENTS.override.md`** — API-specific rule overrides

## Usage

```bash
node adapters/codex/codex-adapter.js [schema-path] [output-dir]

# Examples:
node adapters/codex/codex-adapter.js rna-schema.json ./
node adapters/codex/codex-adapter.js schema/rna-schema.json /path/to/project
```

## Platform Notes

| Feature | Support |
|---|---|
| Named agent files | ✅ via `AGENTS.md` sections |
| Always-apply rules | ✅ inlined in `AGENTS.md` |
| Subdirectory overrides | ✅ via `api/AGENTS.override.md` |
| Hook automation | ⚠️ Advisory only — Codex does not execute hook scripts automatically |
| Script hooks | ⚠️ Manual — must be triggered by the user explicitly |

## Hook Advisory

Codex does not support automated hook execution. The adapter generates `AGENTS.md` with hook sections that instruct the agent:

> "After every `git commit`, run: `node tools/validate-registry.js`"

The agent will advise you to run the script but will not run it automatically.

## Invoking Agents

In Codex CLI, prefix with the agent name:
```
codex "Developer: Implement the user authentication endpoint"
codex "Reviewer: Run the security gate checklist on the current diff"
```

The routing table in `AGENTS.md` maps keywords to agent identities.
