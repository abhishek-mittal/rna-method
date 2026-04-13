---
title: "Director Plan Mode"
description: "Structured planning before execution — the Director's /plan command produces agent-routed execution plans."
---

> **Plan first, execute never.** Plan Mode ensures every task is decomposed, routed, and sequenced before any agent starts work.

---

## The Problem

Multi-agent collectives often jump straight into execution. The Director receives a request, picks the first available agent, and work begins — sometimes in the wrong order, sometimes by the wrong agent, sometimes with unclear inputs. The result: wasted sessions, rework, and blocked pipelines.

---

## What Plan Mode Is

Plan Mode is a structured planning protocol built into the Director agent. When triggered by the `/plan` command, the Director **pauses execution** and produces a complete routing plan that shows:

- What work items exist
- Which agent handles each item
- What the dependencies are
- What size each item is (S/M/L)
- What each agent needs as input and what they deliver as output

No agent is activated. No join is started. The plan exists as a reviewable artifact before any work begins.

---

## Usage

```
/plan <goal or requirement — natural language>
```

**Example:**

```
/plan Add a dark mode toggle to the dashboard with design tokens and tests
```

---

## Plan Output Format

The Director produces a structured `§plan` block:

```
§plan(dark-mode-toggle)
  goal:     Add a dark mode toggle to the dashboard using design tokens, with unit and visual tests.
  status:   📋 Planned
  items:
    1. [@designer] Design token audit — Review existing color tokens, propose dark variants
       size: S
       depends: —
       inputs:  Current design-system/tokens/
       outputs: Dark mode token map (new tokens + modified tokens)
    2. [@developer] Implement toggle component — Build the toggle UI and theme switching logic
       size: M
       depends: 1
       inputs:  Dark mode token map from designer
       outputs: DarkModeToggle component + theme context provider
    3. [@developer] Dashboard integration — Wire toggle into dashboard layout
       size: S
       depends: 2
       inputs:  DarkModeToggle component
       outputs: Updated dashboard with toggle in header
    4. [@reviewer] Code review + test coverage — Review implementation, write missing tests
       size: S
       depends: 2, 3
       inputs:  Feature branch with toggle implementation
       outputs: Review approval + test suite
  joins:    [dtb (items 1→2)]
  risks:    [Existing tokens may not have 1:1 dark variants — designer flags gaps in item 1]
  approval: [Item 2 — new feature, requires director sign-off]
```

---

## Plan Mode Protocol

The Director follows five steps when producing a plan:

### 1. Decompose

Break the goal into discrete, ordered work items. Each item should be completable in one agent session.

### 2. Route

Assign each work item to the correct agent based on domain expertise:

| Domain | Agent |
|---|---|
| UI/UX, design tokens, visual design | `@designer` |
| Implementation, refactoring, bug fixes | `@developer` |
| Code review, quality gates | `@reviewer` |
| Architecture decisions, ADRs | `@architect` |
| Research, competitive analysis | `@researcher` |
| Infrastructure, automation, deployment | `@ops` |

If no agent fits, flag it as a **gap** in the plan.

### 3. Sequence

Determine dependencies between items. Items without dependencies can run in parallel. Items that depend on others must wait.

### 4. Estimate

Flag each item as:

| Size | Meaning |
|---|---|
| **S** | Less than 1 session |
| **M** | 1–2 sessions |
| **L** | 3+ sessions (consider splitting further) |

### 5. Output

Produce the `§plan` block and write it to `_memory/agents/director/YYYY-MM-DD_plan_<slug>.md`.

---

## From Plan to Execution

After the plan is reviewed and approved:

1. The Director activates any **join patterns** identified in the plan (e.g., `dtb` for design-to-build sequences).
2. Each step is kicked off with a **§handoff** block to the assigned agent.
3. Progress is tracked in `_memory/rna-method/agent-context.json` under the join entry.
4. On scope changes, the Director issues a revised plan (`rev 2`, `rev 3`, etc.) before resuming.

---

## Rules

- **Plan Mode only produces plans** — it never activates agents or starts work.
- **Every item must have an agent.** Unassigned items are flagged as gaps.
- **Dependencies must be explicit.** No implicit ordering.
- **Plans are stored.** Written to `_memory/agents/director/` for future reference.
- **Re-plan on scope change.** New information → revised plan, not ad-hoc adjustments.

---

## Why This Matters

Plan Mode gives teams a reviewable, auditable execution strategy before any tokens are spent on implementation. It prevents:

- Wrong-agent routing (developer doing design work)
- Missing dependencies (reviewer starting before code is written)
- Scope creep (unplanned items sneaking in mid-execution)
- Wasted sessions (agents working on items that get invalidated)

The plan is the contract between the Director and the collective.
