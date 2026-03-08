# RNA Method

> **Role-Networked Agent Architecture** — A schema-driven system for turning AI coding assistants into a coordinated agent collective.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Schema Version](https://img.shields.io/badge/Schema-v1.0.0-green.svg)](schema/rna-schema.json)
[![Platforms](https://img.shields.io/badge/Platforms-Cursor%20%7C%20Copilot%20%7C%20Claude%20%7C%20Codex-brightgreen.svg)](adapters/README.md)

---

## What is this?

Most AI coding setups use one agent doing everything. RNA Method structures your AI assistant into a **network of specialized agents** — a developer, a reviewer, an architect, a researcher, an ops agent — each with a defined role, domain, and escalation path.

You define the collective once in a single JSON schema. Platform adapters translate it into native files for Cursor, GitHub Copilot, Claude Code, OpenAI Codex, or Kimi Code.

**No runtime infrastructure required.** No APIs, no message queues. Just your AI editor, a schema file, and a memory folder.

---

## Quick Start (4 steps)

**Step 1 — Copy the minimal template into your project:**

```bash
cp -r path/to/rna-method/templates/minimal-collective _memory/rna-method
```

**Step 2 — Edit the schema to match your project:**

```bash
# Open schema/rna-schema.json and set:
#   meta.projectName  → your project name
#   meta.platform     → cursor | copilot | claude-code | codex | kimi
```

**Step 3 — Run the adapter for your platform:**

```bash
# GitHub Copilot example
node adapters/copilot/copilot-adapter.js schema/rna-schema.json ./

# Cursor
node adapters/cursor/cursor-adapter.js schema/rna-schema.json ./

# Claude Code
node adapters/claude-code/claude-code-adapter.js schema/rna-schema.json ./
```

**Step 4 — Invoke your first agent:**

```
@developer Implement a user authentication endpoint
```

Your AI editor will now load the Developer agent's identity, rules, and protocols automatically.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   rna-schema.json                   │
│  (canonical source: agents, rules, skills, hooks)   │
└──────────────────────────┬──────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐   ┌──────────┐   ┌──────────┐
      │  cursor  │   │  copilot │   │  claude  │
      │ adapter  │   │ adapter  │   │  adapter │
      └────┬─────┘   └────┬─────┘   └────┬─────┘
           │              │              │
           ▼              ▼              ▼
    .cursor/agents/ .github/agents/ CLAUDE.md
    .cursor/rules/  .github/instr.  (single doc)
           │              │              │
           └──────────────┼──────────────┘
                          ▼
              ┌─────────────────────┐
              │  _memory/rna-method │
              │  receptors.json     │  ← signal routing
              │  timeline.json      │  ← project state
              │  agent-context.json │  ← checkpoints
              └─────────────────────┘
```

---

## Platform Support

| Platform | Adapter | Native Agent Support | Hook Automation | Status |
|---|---|---|---|---|
| [Cursor](adapters/cursor/) | `cursor-adapter.js` | ✅ `.cursor/agents/` | ✅ `.cursor/rules/` | Stable |
| [GitHub Copilot](adapters/copilot/) | `copilot-adapter.js` | ✅ `.github/agents/` | ✅ `.github/instructions/` | Stable |
| [Claude Code](adapters/claude-code/) | `claude-code-adapter.js` | ✅ `CLAUDE.md` sections | ✅ Inline rules | Stable |
| [OpenAI Codex](adapters/codex/) | `codex-adapter.js` | ✅ `AGENTS.md` sections | ⚠️ Advisory only | Stable |
| [Kimi Code](adapters/kimi/) | `kimi-adapter.js` | ⚠️ Manual switching | ❌ Not automated | Experimental |

See [adapters/README.md](adapters/README.md) for usage and platform-specific notes.

---

## Repo Structure

```
rna-method/
├── schema/
│   ├── rna-schema.json              # Canonical schema (edit this)
│   └── rna-schema-definition.json  # JSON Schema validator
│
├── adapters/
│   ├── cursor/                      # Cursor adapter
│   ├── copilot/                     # GitHub Copilot adapter
│   ├── claude-code/                 # Claude Code adapter
│   ├── codex/                       # OpenAI Codex adapter
│   └── kimi/                        # Kimi Code adapter (experimental)
│
├── templates/
│   ├── minimal-collective/          # 1-agent starter (developer only)
│   ├── full-collective/             # 6-agent full setup
│   ├── rules/                       # Standalone reusable rules
│   └── joins/                       # Joining pattern documentation
│
├── tools/
│   └── validate-registry.js         # Registry health checker
│
├── docs/
│   ├── getting-started.md
│   ├── schema-reference.md
│   ├── cross-platform-guide.md
│   ├── failure-modes.md
│   └── research-paper.md
│
├── examples/
│   ├── nextjs-app/                  # Next.js App Router example
│   └── node-api/                    # Node.js REST API example
│
└── .github/
    └── workflows/
        └── rna-validate.yml         # CI validation
```

---

## Templates

| Template | Agents | Use when |
|---|---|---|
| `minimal-collective` | developer | Solo project, learning RNA Method |
| `full-collective` | director + developer + reviewer + architect + researcher + ops | Team project, full development lifecycle |

---

## Joining Patterns

Joining patterns are multi-agent pipelines where agents hand off work to each other:

| Pattern | Agents | Use when |
|---|---|---|
| `research-to-content` | researcher → developer | Implementation requires prior research |
| `design-to-build` | developer → reviewer | Standard PR review cycle |
| `full-pipeline` | architect → developer → reviewer | Complex features requiring upfront design |

See [templates/joins/](templates/joins/) for complete handoff protocol documentation.

---

## Validation

Keep your registry healthy with the built-in validator:

```bash
# From your project root
node tools/validate-registry.js

# With repair suggestions
node tools/validate-registry.js --fix

# JSON output for CI
node tools/validate-registry.js --json
```

The validator checks that all agent files, skill files, rule files, and hook targets exist, and flags orphaned or stale checkpoints.

---

## Documentation

- [Getting Started](docs/getting-started.md) — 30-minute walkthrough
- [Schema Reference](docs/schema-reference.md) — Every field explained
- [Cross-Platform Guide](docs/cross-platform-guide.md) — Platform-specific behaviors and trade-offs
- [Failure Modes](docs/failure-modes.md) — Known failure patterns and fixes
- [Research Paper](docs/research-paper.md) — Theory and design rationale

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution paths:

- **Path A** — Add a new platform adapter
- **Path B** — Contribute a rule template
- **Path C** — Document a joining pattern

---

## License

[MIT](LICENSE) — Copyright 2026 Abhishek Mittal
