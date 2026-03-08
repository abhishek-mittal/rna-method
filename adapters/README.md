# Adapter README

Each adapter translates `schema/rna-schema.json` into the native configuration format for a specific AI IDE. The canonical schema never changes; adapters are the translation layer.

## Supported Platforms

| Adapter | Platform | Difficulty | Output |
|---------|----------|-----------|--------|
| [`cursor/`](cursor/) | [Cursor IDE](https://cursor.sh) | Low | `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/`, `.cursor/commands/` |
| [`copilot/`](copilot/) | [GitHub Copilot](https://github.com/features/copilot) | Medium | `.github/agents/`, `.github/copilot-instructions.md`, `.github/instructions/` |
| [`claude-code/`](claude-code/) | [Claude Code](https://claude.ai/code) | Medium | `CLAUDE.md` |
| [`codex/`](codex/) | [OpenAI Codex](https://openai.com/codex) | Medium | `AGENTS.md`, `api/AGENTS.override.md` |
| [`kimi/`](kimi/) | [Kimi Code](https://kimi.moonshot.cn) | Hard ⚠️ experimental | `KIMI.md`, `.kimi/agents/`, `.kimi/rules/` |

## Running an Adapter

All adapters share the same interface:

```bash
node adapters/<platform>/<platform>-adapter.js [schema-path] [output-dir]
```

**Examples:**

```bash
# Cursor — generates into .cursor/
node adapters/cursor/cursor-adapter.js schema/rna-schema.json /path/to/project/.cursor

# Copilot — generates into .github/
node adapters/copilot/copilot-adapter.js schema/rna-schema.json /path/to/project/.github

# Claude Code — generates CLAUDE.md
node adapters/claude-code/claude-code-adapter.js schema/rna-schema.json /path/to/project/CLAUDE.md

# Codex — generates AGENTS.md
node adapters/codex/codex-adapter.js schema/rna-schema.json /path/to/project

# Kimi (experimental) — generates KIMI.md + .kimi/
node adapters/kimi/kimi-adapter.js schema/rna-schema.json /path/to/project
```

When `schema-path` and `output-dir` are omitted, adapters default to the canonical schema in `schema/rna-schema.json` and the current working directory.

## Writing a New Adapter

See [CONTRIBUTING.md](../CONTRIBUTING.md) Path A for the full checklist. The minimal contract:

1. Read `schema/rna-schema.json` (or a user-provided schema path)
2. Translate all 6 top-level keys: `agents`, `rules`, `skills`, `commands`, `hooks`, `routes`
3. Include the Session Start Protocol and Session End Protocol in all generated files
4. Print a summary of what was generated to stdout
5. Add a `README.md` to your adapter folder with platform-specific notes
