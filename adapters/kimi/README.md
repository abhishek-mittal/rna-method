# Kimi Code Adapter (Experimental)

> ⚠️ **Experimental — v0.1** ⚠️
> 
> This adapter is experimental. Kimi Code has limited multi-agent support and no native hook automation. See the Known Limitations section before using.

Generates an approximation of RNA Method configuration for [Kimi Code](https://kimi.moonshot.cn/chat) by Moonshot AI.

## Requirements

- Kimi Code access (web or desktop app)
- A `rna-schema.json` file configured with `"platform": "kimi"`

## Generated Output

```
KIMI.md                  ← primary context file
.kimi/
  agents/
    developer.md         ← one file per agent
    reviewer.md
    ...
  rules/
    coding-standards.md  ← one file per rule
    ...
```

## Usage

```bash
node adapters/kimi/kimi-adapter.js [schema-path] [output-dir]

# Examples:
node adapters/kimi/kimi-adapter.js rna-schema.json ./
node adapters/kimi/kimi-adapter.js schema/rna-schema.json /path/to/project
```

## Known Limitations

| Limitation | Impact |
|---|---|
| No native `@agent-name` syntax | Must manually specify which agent you want via `@file` or pasting content |
| No hook automation | All hook scripts must be run manually |
| No native instruction files | Rules are inlined in `KIMI.md` or loaded via `@file` |
| Context loading is manual | You must tell Kimi which agent file to load at session start |
| Multi-agent pipelines are advisory only | Handoff instructions are present but not enforced by the platform |

## Platform Notes

| Feature | Support |
|---|---|
| Named agent files | ⚠️ Manual via `@file` — load `.kimi/agents/developer.md` explicitly |
| Always-apply rules | ⚠️ In `KIMI.md`; must be included in context manually |
| Hook automation | ❌ Not supported |
| Script hooks | ❌ Manual only |
| Joining patterns | ⚠️ Advisory — documented but not automated |

## Workaround for Agent Switching

Since Kimi Code does not support `@agent-name` syntax natively, use one of these approaches:

**Option 1 — Direct file load (recommended if your Kimi version supports `@file`):**
```
@file .kimi/agents/developer.md
Build the user authentication endpoint.
```

**Option 2 — Paste agent content:**
At the start of a new conversation, paste the contents of `.kimi/agents/developer.md` as your first message, then proceed with the task.

**Option 3 — Use `KIMI.md` as global context:**
At the start of a session, load `KIMI.md` as context. It contains the routing table and abbreviated agent definitions.

## Contributing

If you have more experience with Kimi Code's latest API or context loading features, please open an [adapter-request issue](../../.github/ISSUE_TEMPLATE/adapter-request.md) with updated platform capabilities.
