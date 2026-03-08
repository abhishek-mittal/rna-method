# Claude Code Adapter

Generates RNA Method configuration for [Claude Code](https://docs.anthropic.com/claude/docs/claude-code) (Anthropic's CLI AI agent).

## Requirements

- Claude Code CLI installed and authenticated
- A `rna-schema.json` file configured with `"platform": "claude-code"`

## Generated Output

```
CLAUDE.md            ← single hub file with all agent, rule, and skill content
```

Claude Code uses a single `CLAUDE.md` file as its primary context. The adapter generates a structured, well-sectioned document:

```
CLAUDE.md
  ├── Session Protocol    — start + end protocol for all agents
  ├── Always-Apply Rules  — inlined rule content
  ├── Agent Roster        — routing table with @agent-name triggers
  ├── Agent Definitions   — full content for each agent
  ├── Domain Rules        — trigger-keyword rule content
  ├── Skills              — skill references
  └── Joining Patterns    — pipeline handoff protocols
```

## Usage

```bash
node adapters/claude-code/claude-code-adapter.js [schema-path] [output-dir]

# Examples:
node adapters/claude-code/claude-code-adapter.js rna-schema.json ./
node adapters/claude-code/claude-code-adapter.js schema/rna-schema.json /path/to/project
```

## Platform Notes

| Feature | Support |
|---|---|
| Named agent switching | ✅ via `@agent-name` routing table in `CLAUDE.md` |
| Always-apply rules | ✅ inlined in `CLAUDE.md` |
| Trigger-keyword rules | ✅ inlined in `CLAUDE.md` |
| Skills | ✅ inlined in `CLAUDE.md` |
| Git hook automation | ✅ via `CLAUDE.md` hook instructions |
| Script hooks | ✅ Claude Code can execute scripts natively |

## Invoking Agents

In the Claude Code CLI:
```
@developer Implement the user profile endpoint
@reviewer Run the security gate checklist on the current PR
```

Claude Code reads `CLAUDE.md` automatically. No additional setup is required after running the adapter.

## Single-File vs Multi-File

Claude Code only reads `CLAUDE.md`. All RNA content is consolidated into this single file. This is by design — Claude Code's context loading is file-path based and does not support the multi-file instruction architecture that Cursor and Copilot use.

If your `CLAUDE.md` grows large (>300 lines), consider reducing the number of agents or moving detailed content into referenced files and adding file-read instructions at session start.
