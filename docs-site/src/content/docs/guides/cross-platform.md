---
title: "Cross-Platform Guide"
description: "Implement the RNA + Pluribus pattern across different AI editors and operating systems."
---

**Companion to:** [RNA & Pluribus Research Paper](RNA-Pluribus-Research-Paper.md)
**Purpose:** Exact file paths, formats, and code samples for replicating the RNA + Pluribus pattern on Claude Code, GitHub Copilot, OpenAI Codex, VS Code, and Kimi Code.

---

## Reference: Cursor IDE (POC Implementation)

The POC uses these Cursor-specific primitives:

| Concept | File Format | Location | Notes |
|---------|-------------|----------|-------|
| Agent definitions | Markdown (`.md`) | `.cursor/agents/` | YAML frontmatter optional |
| Rules | MDC (`.mdc`) | `.cursor/rules/` | YAML frontmatter with `alwaysApply`, `description`, `globs` |
| Skills | Markdown (`.md`) | `.cursor/skills/<name>/SKILL.md` | Multi-file with sub-docs |
| Commands | Markdown (`.md`) | `.cursor/commands/` | Slash-command invocation |
| Signal registry | JSON | `_memory/rna-method/receptors.json` | Receptor registry, read by agents (POC: `work/_team-nav/pluribus.json`) |
| Intelligence hub | JSON | `_memory/rna-method/timeline.json` | Team profiles + entries + signal queue (POC: `work/_team-nav/timeline.json`) |

---

## 1. Claude Code

### 1.1 Agent Definitions

Claude Code does not have a native multi-agent registry. The closest pattern is an **orchestrator agent** defined in the project-level `CLAUDE.md` that delegates to sub-agents using the `Task` tool.

**File:** `CLAUDE.md` (project root)

```markdown
# Pluribus Agent Collective

You are the Director (Abhishek) of a multi-agent collective. When a task arrives,
route it to the right specialist by spawning a sub-agent with the Task tool.

## Agent Registry

| Agent | Role | When to Invoke |
|-------|------|----------------|
| Orion | Developer | Build, implement, code tasks |
| Lyra | QA | Test creation, coverage, validation |
| Kael | Architect | Design, schema, API contracts |
| Soren | Reviewer | Code review, PR creation |
| Mara | Scribe | Jira, docs, callouts |
| Reese | Scout | Research, exploration |
| Vex | DataDoc | Excel, PDF, document processing |
| Axel | Ops | Daily ops, transcripts |

## Routing Rules

- For build tasks: spawn a Task with Orion's persona prompt
- For reviews: spawn a Task with Soren's persona prompt
- For multi-agent joins: spawn sequential Tasks
```

**Sub-agent invocation:**

```javascript
// In a Task tool call, include the agent persona in the prompt:
Task({
  description: "Orion: implement endpoint",
  prompt: `You are Orion, the full-stack developer of the Pluribus Collective.
           Follow development-standards rules. Build the following: ...`
})
```

---

### 1.2 Rules

**Project rules:** `CLAUDE.md` at project root (auto-loaded for every conversation)
**User rules:** `~/.claude/CLAUDE.md`

```markdown
<!-- CLAUDE.md -->
# Development Standards (alwaysApply equivalent)

- Write simple, readable code
- Use early returns
- Minimal code changes - only modify what's needed
- Prefix event handlers with "handle"

# Pluribus Persona

Address the user as "Abhi" normally, "Sir" for warnings, "Boss" for approvals.
Never auto-execute destructive operations. Always suggest first.

# Smart Context Router

Before responding, check if the request matches:
- Testing -> follow testing standards section
- Jira -> follow Jira documentation section
- PR -> follow PR description section
```

---

### 1.3 Skills

Claude Code supports MCP tools for extended capabilities:

```bash
# Add MCP server for Excel processing
claude mcp add excel-processor -- node /path/to/excel-mcp-server.js

# Add MCP server for Jira integration
claude mcp add jira-tools -- node /path/to/jira-mcp-server.js
```

Alternatively, define skills as detailed sections within `CLAUDE.md` that the orchestrator agent follows.

### 1.4 Commands

Claude Code has built-in slash commands and supports `--agents` CLI flag:

```bash
# Invoke with specific agent context
claude --agents '{"developer": {"prompt": "You are Orion..."}}'
```

Custom slash commands can be registered in Claude Code's configuration.

### 1.5 Signals

No native signal network. Implement via:
- Orchestrator agent reads `receptors.json` at conversation start
- Agent checks for pending signals in `timeline.json`
- File-based signal queue (same as POC)

### 1.6 Gap Analysis

| Feature | Support | Workaround |
|---------|---------|------------|
| Multi-agent | Partial - Task tool spawns sub-agents | Orchestrator pattern in CLAUDE.md |
| alwaysApply rules | Yes - root CLAUDE.md auto-loads | Direct equivalent |
| Granular rules | No - single CLAUDE.md file | Use sections with clear headers |
| Commands UI | Limited - CLI flags | Define in CLAUDE.md as routing instructions |
| Signal network | No | File-based polling (same as POC) |
| Model-per-agent | No - single model per session | Use Task tool; model inherits from parent |

**Migration difficulty: Medium**

---

## 2. GitHub Copilot

### 2.1 Agent Definitions

**File:** `.github/agents/<name>.agent.md`

```markdown
---
name: orion-developer
description: "Full-stack developer for building features, APIs, and Lambda handlers"
tools:
  - shell
  - file_editor
mcp-servers:
  - excel-processor
---

# Orion - Developer

You are Orion, the full-stack developer of the Pluribus Collective.

## Standards
- Follow development-standards from `.github/copilot-instructions.md`
- Minimal code changes principle
- Always suggest before executing destructive operations

## Capabilities
- Build Lambda handlers (Node.js + Sequelize)
- Build React components with AG-Grid
- OpenSearch query construction
```

### 2.2 Rules

**Repo-wide rules:** `.github/copilot-instructions.md`

```markdown
# Development Standards

Write simple, readable code. Use early returns. Minimal changes only.

# Pluribus Persona

Address the user contextually: Abhi (normal), Sir (warnings), Boss (approvals).
```

**Path-specific rules:** `.github/instructions/<name>.instructions.md`

```markdown
---
applyTo: "api/web/lambdas/**"
---

# Lambda Development Rules

- Use V2 class-based service pattern for new lambdas
- Always validate input before processing
- Return standardized error responses
```

### 2.3 Skills

MCP extensions via agent frontmatter:

```yaml
mcp-servers:
  - name: excel-processor
    command: node
    args: ["/path/to/excel-mcp-server.js"]
```

### 2.4 Commands

No native command equivalent. Agents are either auto-invoked by Copilot or manually selected in the chat panel. Users can `@agent-name` to invoke a specific agent.

### 2.5 Signals

GitHub Actions can trigger the Copilot coding agent via API:

```yaml
# .github/workflows/signal-router.yml
on:
  issues:
    types: [labeled]

jobs:
  route-signal:
    if: github.event.label.name == 'blocker'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            // Trigger Copilot coding agent for blocker response
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '@copilot Please investigate this blocker and suggest a fix.'
            })
```

### 2.6 Gap Analysis

| Feature | Support | Workaround |
|---------|---------|------------|
| Multi-agent | Yes - `.agent.md` files | Flat hierarchy; no director pattern |
| alwaysApply rules | Yes - `.agent.md` + `copilot-instructions.md` | Direct equivalent |
| Granular rules | Yes - `applyTo` glob patterns | Good path-specific support |
| Commands | No | `@agent-name` mention in chat |
| Signal network | Partial - GitHub Actions webhooks | Can trigger agents on repo events |
| Model-per-agent | No | All agents use the same model |

**Migration difficulty: Medium-Hard**

---

## 3. OpenAI Codex

### 3.1 Agent Definitions

Codex uses built-in roles and `AGENTS.md` for customization:

**File:** `AGENTS.md` (project root)

```markdown
# Pluribus Agent Collective

## Roles

### Director (Abhishek)
Orchestrates all agents. Routes tasks based on category and priority.
Spawns workers for implementation, reviewers for code quality.

### Developer (Orion)
Full-stack implementation, Node.js & React + AWS Lambda.
Follow development-standards below.

### QA (Lyra)
Test creation and validation. Jest unit tests, HTTP integration tests.

### Architect (Kael)
System design, API contracts, DB schemas, V2 migration patterns.

## Development Standards
[same content as development-standards.mdc]

## Routing Rules
- Build tasks -> Developer role
- Test tasks -> QA role
- Design tasks -> Architect role
```

**Directory-level overrides:** `api/AGENTS.override.md`

```markdown
# API-Specific Rules

- Use V2 class-based service pattern for Lambda handlers
- Sequelize ORM only - no raw SQL
- Validate all inputs with express-validator
```

### 3.2 Rules

Rules are embedded in `AGENTS.md` sections. No separate rule files. The `alwaysApply` equivalent is content in the root `AGENTS.md` (always loaded).

### 3.3 Skills

Codex Skills & Automations provide reusable workflows. MCP integration via Codex CLI:

```bash
# Codex as MCP server
codex mcp serve --tools excel-extract,jira-create
```

### 3.4 Commands

No slash-command equivalent. All invocation is prompt-based. Users describe what they want, and Codex auto-routes to the appropriate worker.

### 3.5 Signals

Codex has native multi-agent spawning - it can automatically create worker agents for parallelizable tasks. The signal network can be approximated by having the root agent read `receptors.json` and spawn workers accordingly.

### 3.6 Gap Analysis

| Feature | Support | Workaround |
|---------|---------|------------|
| Multi-agent | Native - automatic worker spawning | Strongest multi-agent support |
| alwaysApply rules | Yes - root AGENTS.md | Direct equivalent |
| Granular rules | Yes - directory overrides | Good hierarchical support |
| Commands | No | Prompt-based invocation |
| Signal network | Partial - native multi-agent can approximate | Orchestrator reads receptors.json |
| Model-per-agent | No - Codex selects model | No user control per agent |
| Named personas | No | Roles are generic, not persona-based |

**Migration difficulty: Medium**

---

## 4. VS Code (Copilot Agent Mode)

### 4.1 Agent Definitions

**File:** `.agent.md` in workspace or user profile

```markdown
---
name: orion
description: "Full-stack developer for the Pluribus Collective"
---

# Orion - Developer

Build features, APIs, Lambda handlers, and React components.
Follow development standards from AGENTS.md.
```

### 4.2 Rules

**Primary:** `AGENTS.md` at workspace root
**Supplementary:** `.github/copilot-instructions.md` (repo-wide)
**Path-specific:** `.github/instructions/<name>.instructions.md`

```markdown
<!-- AGENTS.md -->
# Pluribus Agent Collective

## Development Standards
[content from development-standards.mdc]

## Pluribus Persona
[content from pluribus-persona.mdc]

## Agent Definitions
[agent table and routing rules]
```

### 4.3 Skills

MCP tools and agent skills are supported natively in VS Code's Copilot agent mode.

### 4.4 Commands & Handoff Protocol

VS Code Copilot does not use slash-command files like Cursor (`.cursor/commands/*.md`). Instead, multi-agent coordination is achieved through the **Handoff Protocol** — a structured, human-relayed mechanism that preserves full join semantics without a signal server.

#### Handoff Block Format

Each agent outputs a formatted block at the end of its step:

```
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From:     @<current-agent>
To:       @<next-agent>
Join ID:  <taskId from agent-context.json>
Step:     <N> of <total>
Context:  <1–3 sentences: what was done, key decisions>
Artifacts: <bullet list of file paths written>
Your task: <exactly what the next agent should do>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@<next-agent> [HANDOFF from @<current-agent>] <Your task>
```

The user copies only the **last line** and opens a fresh thread. This is the sole manual step.

#### Shared State via agent-context.json

Join state persists in `_memory/rna-method/agent-context.json`. Each receiving agent reads this file to reconstruct full context — the conversation history is never relied upon. The receiving agent:
1. Reads `agent-context.json` — finds `joinId`, loads `completedSteps[]` and `artifacts[]`.
2. Reads each artifact path. This is its full context.
3. Proceeds directly with its task.

#### Three Canonical Join Pipelines

Pre-defined pipelines are in `.github/agents/joins/`:

| Pattern | Agents | Steps |
|---------|--------|-------|
| `research-to-content` | @shino → @curator | 2 |
| `design-to-build` | @twilight → @samba → @twilight | 3 |
| `full-feature` | @riko → @shino → @samba → @twilight | 4 |

For full protocol design, comparison with signal-driven joins, and the GitHub Actions upgrade path, see **§8 of the research paper** (`RNA-Pluribus-Research-Paper.md`).

### 4.5 Signals

No native signal layer. File-based polling is the only option.

### 4.6 Gap Analysis

| Feature | Support | Workaround |
|---------|---------|------------|
| Multi-agent | Partial - handoffs between agents | Manual sequential workflows |
| alwaysApply rules | Yes - root AGENTS.md | Direct equivalent |
| Granular rules | Yes - path-specific instructions | Good support |
| Commands | Partial - handoff syntax | Not slash-command based |
| Signal network | No | File-based polling |
| Model-per-agent | No | Single model for all agents |

**Migration difficulty: Medium**

---

## 5. Kimi Code

### 5.1 Agent Definitions

**File:** YAML agent files

```yaml
# agents/orion.yaml
name: orion-developer
description: "Full-stack developer for the Pluribus Collective"
system_prompt_path: "./prompts/orion.md"
tools:
  - file_editor
  - shell
subagents:
  - name: lyra-qa
    agent_file: "./agents/lyra.yaml"
    trigger: "after implementation complete"
```

### 5.2 Rules

Rules are system prompt files referenced by agents:

```markdown
<!-- prompts/development-standards.md -->
# Development Standards

Write simple, readable code. Use early returns. Minimal changes only.
Prefix event handlers with "handle". DRY principle.
```

### 5.3 Skills

Skills are defined as `subagents` in YAML configuration:

```yaml
subagents:
  - name: excel-processor
    agent_file: "./agents/vex.yaml"
    trigger: "when user uploads Excel/PDF/CSV"
```

### 5.4 Commands

No command equivalent. Agents are invoked via `--agent-file` CLI flag:

```bash
kimi --agent-file ./agents/orion.yaml "Build the endpoint"
```

### 5.5 Signals

No native signal support. File-based polling is the only option.

### 5.6 Gap Analysis

| Feature | Support | Workaround |
|---------|---------|------------|
| Multi-agent | Partial - subagents in YAML | Limited orchestration |
| alwaysApply rules | Partial - system prompt args | Manual configuration |
| Granular rules | No | Separate prompt files |
| Commands | No | CLI `--agent-file` |
| Signal network | No | File-based polling |
| Model-per-agent | Unknown | YAML may support model field |

**Migration difficulty: Hard**

---

## Migration Decision Matrix

| Starting Point | Best Target | Rationale |
|----------------|-------------|-----------|
| Cursor > Claude Code | Medium effort | Closest model; CLAUDE.md = rules + agents; Task tool = sub-agents |
| Cursor > GitHub Copilot | Medium-Hard | Good agent files; lacks director pattern and model routing |
| Cursor > OpenAI Codex | Medium | Strongest native multi-agent; needs persona customization |
| Cursor > VS Code | Medium | Handoffs approximate joins; growing agent support |
| Cursor > Kimi | Hard | Least mature; YAML-only; limited multi-agent |

## Recommended Migration Order

For teams adopting RNA + Pluribus on a new platform:

1. **Rules first** - Port `development-standards`, `pluribus-persona`, and `smart-context-router` as platform-native rules/instructions
2. **Agent definitions second** - Create agent files for Developer, Reviewer, and Director (minimum viable collective)
3. **Skills third** - Port the most-used skills (smart-dev-agent, git-review-agent) as MCP tools or instruction sections
4. **Commands fourth** - Map slash commands to platform-native invocation (if supported)
5. **Signals last** - File-based polling works on all platforms; upgrade to native signals when available

---

*Guide version: 1.0 - March 2026*
*Companion: [RNA & Pluribus Research Paper](RNA-Pluribus-Research-Paper.md) | [README](README.md)*
