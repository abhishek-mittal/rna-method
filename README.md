# RNA Method

> **Reusable Neural Activators** — A schema-driven system for turning AI coding assistants into a coordinated agent collective.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Schema Version](https://img.shields.io/badge/Schema-v1.0.0-green.svg)](schema/rna-schema.json)
[![Platforms](https://img.shields.io/badge/Platforms-Cursor%20%7C%20Copilot%20%7C%20Claude%20%7C%20Codex-brightgreen.svg)](adapters/README.md)

---

## What is this?

Most AI coding setups use one agent doing everything. RNA Method structures your AI assistant into a **network of specialized agents** — a developer, a reviewer, an architect, a researcher, an ops agent — each with a defined role, domain, and escalation path.

You define the collective once in a single JSON schema. Platform adapters translate it into native files for Cursor, GitHub Copilot, Claude Code, OpenAI Codex, or Kimi Code.

**No runtime infrastructure required.** No APIs, no message queues. Just your AI editor, a schema file, and a memory folder.

**MCP auto-discovery.** During init, RNA scans your workspace for installed MCP servers (Figma, Tavily, Playwright, Snyk, etc.) and injects the right tools into each agent's configuration based on role relevance.

---

## Quick Start

### Option A — Bash (recommended, zero dependencies)

**No clone, no Node required.** Only bash 4.0+ and curl:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/install.sh)
```

Or, if you have the repo cloned:

```bash
bash tools/install.sh
```

The wizard asks 7 questions across 3 sections (Project Identity, Collective Setup, Stack & Output),
writes everything, and prints a token footprint report.

**Common flags:**

```bash
# Re-run on an existing install (cleans stale platform files):
bash tools/install.sh --update

# Preview what would be written without touching disk:
bash tools/install.sh --dry-run

# Fully scripted (CI / onboarding automation):
bash tools/install.sh --non-interactive \
  --platform=copilot --collective=minimal --project-name=my-project
```

### Option B — Node.js (Node 18+)

**No clone required.**

```bash
node -e "$(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/init.js)"
```

Or, if you have the repo cloned:

```bash
node tools/init.js
```

Supports the same flags: `--update`, `--dry-run`, `--non-interactive`, `--platform`, `--collective`, etc.

### After init — personalise your collective

The install wizard writes **template files**. Before you start using agents, open a new chat in your AI editor and run:

```
/rna.setup
```

The agent reads your `package.json`, scans for existing platform files, then asks **5 targeted questions** (all at once — not one at a time):

1. What domain is this project in? *(e.g. web app, data pipeline, CLI tool)*
2. How many people + AI agents will work on it?
3. Which AI platform is your primary driver? *(Cursor / Copilot / Claude Code / Codex / Kimi)*
4. What is your most frequent pain point with AI assistants right now?
5. What is the project phase? *(greenfield / active / maintenance / refactor)*

It then rewrites `_memory/rna-method/receptors.json`, `timeline.json`, and re-runs the platform adapter — producing agent files, skill files, and instruction files tuned to your answers. Think of `install.sh` as scaffolding and `/rna.setup` as the fit-out.

> **Subsequent changes** — if you add teammates, change platform, or shift phase, run `/rna.update` instead. It preserves your existing customisations and only updates what changed.

### Then — invoke your first agent

The trigger syntax depends on your platform:

| Platform | Example |
|---|---|
| Copilot / Codex | `/developer Implement a user auth endpoint` |
| Cursor | `@developer Implement a user auth endpoint` |
| Claude Code | Assigned via Task API — no prefix needed |

The install wizard sets `schema.meta.triggerPrefix` and rewrites all `agent.command` values automatically, so adapters emit the correct prefix for your platform.

Your AI editor loads the Developer agent's identity, rules, and protocols automatically.

> **Manual install?** See [docs/getting-started.md](docs/getting-started.md) for the step-by-step approach.

---

## `_base-agent` — Foundation Encapsulation

Every RNA collective has a hidden layer: the **shared behavioral contracts** every agent must honor — handoff format, checkpoint rules, memory conventions, persona, limits. RNA Method makes this explicit through `_base-agent`.

`_base-agent` is a **foundation template** — all specialized agents declare `[inherits: _base-agent]` and only override what makes them different. It is **never invoked directly** by humans.

The human entry point is the **Director** agent. Every RNA collective should have one agent marked `isPrimaryDirector: true`. The Director is the only agent humans invoke — it orchestrates all join patterns and agent activation.

In the RNA Studio canvas, `_base-agent` appears anchored below the agent orbit — amber, dashed-bordered, labeled `§base`, with a footer reading *"base encapsulation — not invoked directly"*. The Director node is highlighted with a crown (👑) and a `§director` tier badge.

→ Full explainer: [docs/base-agent-signal-hub.md](docs/base-agent-signal-hub.md)

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
├── studio/
│   ├── src/                         # Vite 6 + React 19 + TypeScript source
│   ├── dist/                        # Built assets (served by server.js)
│   └── server.js                    # Pure-Node SSE server (port 7337)
│
├── tools/
│   ├── init.js                      # Node.js questionnaire (multi-adapter)
│   ├── discover-tools.js            # MCP server & tool auto-discovery
│   └── validate-registry.js         # Registry health checker
│
├── docs/
│   ├── getting-started.md
│   ├── schema-reference.md
│   ├── cross-platform-guide.md
│   ├── failure-modes.md
│   ├── base-agent-signal-hub.md     # _base-agent explainer
│   ├── rna-folder-architecture.md   # .rna/ folder design + roadmap
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
| `full-collective` | director + developer + reviewer + architect + researcher + ops + designer | Team project, full development lifecycle |

---

## Joining Patterns

Joining patterns are multi-agent pipelines where agents hand off work to each other:

| Pattern | ID | Agents | Use when |
|---|---|---|---|
| Research-to-Content | `rtc` | researcher → developer | Implementation requires prior research |
| Design-to-Build | `dtb` | developer → reviewer → developer | Standard PR review cycle |
| Full Feature | `ff` | director → researcher → developer → reviewer | Complex features requiring upfront design |
| Continuous Dev Cycle | `cdc` | conductor → developer → [reviewer →] conductor | Ticket-to-PR pipeline |
| R&D Synthesis | `rds` | lab → [researcher →] [lab →] [curator] | Deep research + synthesis |
| Design-Implement | `design-implement` | designer → developer | UI design then implementation |

See [templates/joins/](templates/joins/) for complete handoff protocol documentation.

---

## RNA Studio

RNA Studio is a visual canvas for your agent collective — see who is active, which joins are in progress, and inspect agent capabilities.

```bash
# From your project root (after init)
npm run rna:studio
# Opens at http://localhost:7337
```

Features:
- **Live agent graph** — React Flow canvas with tier-based colors and animated edges
- **Jira-style status lozenges** — In Progress (blue spinner) and Pending (amber pulse) badges on active agent nodes
- **Director node** — Crown (👑) + `§director` badge + green "● human entry point" indicator
- **Base substrate** — `_base-agent` anchored below the orbit with dashed border and `§base` badge
- **Live activity** — agents write `_memory/agents/<id>/activity.json`; studio SSE-streams changes in real time
- **Join panels** — signal console, memory browser, schema explorer, platform switcher

→ Source: `studio/` — Vite 6 + React 19 + TypeScript, served by a pure-Node SSE server on port 7337

---

## `.rna/` — Project-Scoped Config

After running `init`, a `.rna/config.json` is written at your project root:

```json
{
  "projectName": "my-project",
  "adapter": "copilot",
  "adapters": ["copilot", "cursor"],
  "studioPort": 7337,
  "rnaVersion": "1.0.0",
  "installedAt": "2026-03-20T00:00:00.000Z"
}
```

The questionnaire supports **multi-adapter selection** — choose a primary platform and optionally generate for additional platforms in the same run. `.rna/config.json` records all active adapters.

---

## Live Agent Activity Protocol

Agents can report their own status by writing to `_memory/agents/<agentId>/activity.json`:

```json
{
  "agentId": "samba",
  "status": "in-progress",
  "currentTask": "Implement animated edge system",
  "currentJoinId": "ff-2026-03-20-canvas",
  "updatedAt": "2026-03-20T12:00:00.000Z",
  "signals": [
    { "type": "checkpoint", "message": "Edge colors done, starting markers", "ts": "2026-03-20T11:45:00.000Z" }
  ]
}
```

The RNA Studio server watches `_memory/agents/` recursively and SSE-broadcasts changes. Agent-written `activity.json` takes precedence over orchestrator-derived `activeJoins` state.

**Valid status values:** `in-progress` | `pending` | `idle`

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
- [Base Agent & Signal Hub](docs/base-agent-signal-hub.md) — `_base-agent` as foundation encapsulation
- [RNA Folder Architecture](docs/rna-folder-architecture.md) — `.rna/` folder design and roadmap
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
