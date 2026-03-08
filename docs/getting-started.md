# Getting Started with RNA Method

This guide walks you from zero to a working multi-agent collective in approximately 30 minutes.

---

## Prerequisites

- A supported AI editor: Cursor, GitHub Copilot (VS Code), Claude Code, OpenAI Codex, or Kimi Code
- Node.js 18 or later
- A project you want to set up with the RNA Method

---

## Step 1 — Copy the Schema Template

Choose a starting template based on your team size:

| Template | When to use |
|---|---|
| `minimal-collective` | Solo project, learning RNA Method |
| `full-collective` | Team project, full development lifecycle |

```bash
# For a solo/minimal setup:
cp -r templates/minimal-collective _memory/rna-method

# For a full-team setup:
cp -r templates/full-collective _memory/rna-method
```

Your project will now have:
```
_memory/
  rna-method/
    receptors.json     ← signal routing and agent registry
    timeline.json      ← project state and signal queue
```

---

## Step 2 — Copy and Edit the Schema

```bash
cp schema/rna-schema.json my-rna-schema.json
```

Open `my-rna-schema.json` and update the `meta` section:

```json
{
  "meta": {
    "projectName": "my-app",
    "platform": "copilot",
    "schemaVersion": "1.0.0",
    "lastUpdated": "2026-01-01",
    "director": "Director"
  }
}
```

**Platform values:** `cursor` | `copilot` | `claude-code` | `codex` | `kimi`

The rest of the schema defines your agents, rules, skills, hooks, and joining patterns. You can leave the defaults in place and customize later.

---

## Step 3 — Run the Adapter

From your project root, run the adapter for your platform:

```bash
# GitHub Copilot
node path/to/rna-method/adapters/copilot/copilot-adapter.js my-rna-schema.json ./

# Cursor
node path/to/rna-method/adapters/cursor/cursor-adapter.js my-rna-schema.json ./

# Claude Code
node path/to/rna-method/adapters/claude-code/claude-code-adapter.js my-rna-schema.json ./

# OpenAI Codex
node path/to/rna-method/adapters/codex/codex-adapter.js my-rna-schema.json ./
```

The adapter will generate platform-native files in your project directory. For Copilot, this creates:
- `.github/agents/` — one agent file per agent
- `.github/copilot-instructions.md` — routing hub
- `.github/instructions/` — rule instruction files

---

## Step 4 — Verify the Installation

Run the registry validator:

```bash
node path/to/rna-method/tools/validate-registry.js
```

A healthy installation shows:
```
✓ [agent-files-exist] All 2 agent files found
✓ [rule-files-exist] All 3 rule files found
✓ [hook-targets-valid] All 1 hook targets valid
```

Fix any failures before proceeding.

---

## Step 5 — Invoke Your First Agent

Open a new chat window in your AI editor and invoke an agent:

```
@developer Implement a user profile API endpoint with GET /users/:id
```

The agent will:
1. Introduce itself and state its active signals
2. Implement the feature following the coding standards in its agent file
3. At the end of the session, update the project memory

---

## Step 6 — Understand the Signal Flow

Agents communicate via the `signalQueue` in `_memory/rna-method/timeline.json`. When a task is created, it becomes a signal:

```json
{
  "signalQueue": [
    {
      "id": "sig-001",
      "type": "sprint",
      "priority": "high",
      "assignedTo": "developer",
      "description": "Implement user profile API",
      "status": "active",
      "createdAt": "2026-01-01"
    }
  ]
}
```

Agents pick up signals at the start of each session and mark them resolved when done.

---

## Step 7 (Optional) — Set Up a Joining Pipeline

For tasks that span multiple agents, use a joining pattern:

```
@researcher Research the best caching strategy for our API

# After researcher produces a brief:
@developer [HANDOFF from @researcher] Implement Redis cache per the brief
```

See [templates/joins/](../templates/joins/) for the full handoff protocol.

---

## Next Steps

- [Schema Reference](schema-reference.md) — understand every field in `rna-schema.json`
- [Cross-Platform Guide](cross-platform-guide.md) — platform-specific behaviors and tips
- [Failure Modes](failure-modes.md) — if something isn't working right
- [CONTRIBUTING.md](../CONTRIBUTING.md) — add a new adapter or rule

---

## Common Questions

**Q: Do I need to re-run the adapter every time I change the schema?**
Yes — the adapter generates static files. Re-run it whenever `rna-schema.json` changes.

**Q: Can I use different agents on different platforms?**
Yes — each `rna-schema.json` is per-project and per-platform. You can have a Copilot schema and a Cursor schema for the same project.

**Q: How do agents remember context between sessions?**
Through `_memory/rna-method/timeline.json` (signal queue + project state) and `_memory/agents/<agent-id>/` session log files. Agents write to these at the end of each session.

**Q: What if my AI editor doesn't support `@agent-name` syntax?**
Use the agent file directly (e.g., paste the agent file path in your context, or start the conversation with the agent's Session Start Protocol). See [Failure Modes](failure-modes.md) for more.
