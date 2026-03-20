# `_base-agent` — The Master Signal Hub

> **What every RNA collective has but most never document.**

---

## The Problem

Every multi-agent setup eventually produces the same undocumented file: a shared template that all other agents secretly copy from. Handoff protocols, checkpoint formats, memory conventions, persona rules — they live somewhere, usually in one agent's file, and silently drift out of sync as the collective grows.

RNA Method names this explicitly: **`_base-agent`**.

---

## What `_base-agent` Is

`_base-agent` is the **foundation receptor** of the RNA network. It is not a specialist. It has no domain. It holds only the cross-cutting behavioral contracts that every agent in the collective must implement:

| §-Reference       | What It Governs                                   |
|-------------------|---------------------------------------------------|
| `§Step1`          | Intake protocol — handoff / resume / cold start   |
| `§Handoff`        | Inter-agent pass-off format and pre-conditions    |
| `§JoinComplete`   | Terminal agent close for multi-agent join patterns|
| `§Checkpoint`     | Context hygiene at 20+ turns                      |
| `§Memory`         | Session log write format and storage paths        |
| `§Limits`         | Hard behavioral limits all agents share           |
| `§SHR`            | Shu-Ha-Ri epistemology for design decisions       |
| `§Persona`        | Address conventions (Abhi / Sir / Boss)           |
| `§Tools`          | Full VS Code + MCP toolset reference              |

Any agent that declares `[inherits: _base-agent]` in its frontmatter **activates all nine of these protocols automatically**. It only needs to define what makes it different.

---

## The Single-Agent Master Mode

`_base-agent` can also be invoked **directly** — not as a foundation for inheritance, but as a **standalone master agent** that does everything.

This is the "one agent to rule them all" pattern for users who:

- Are onboarding and don't know which specialist to call
- Want a single unified context window without agent-switching overhead
- Are running the RNA Method in a platform that doesn't support multiple custom agents
- Need a signal point that bridges between all Pluribus nodes

When you invoke `_base-agent` directly, you get an agent that can orient, research, build, design, and curate — because it holds the behavioral substrate all specialists are built on top of.

---

## `_base-agent` in the Pluribus System

> **Pluribus** (from *singled to many*) is the pattern where one AI platform instance coordinates a collective of virtual specialists, all sharing a codebase and memory, but each activating a different subset of behaviors.

`_base-agent` is the **signal point** in this architecture:

```
                    ┌────────────────────────┐
                    │      _base-agent       │
                    │   (Master Signal Hub)  │
                    │  §Step1 §Handoff §SHR  │
                    └──────────┬─────────────┘
            ┌─────────────────┼──────────────────┐
            ▼                 ▼                   ▼
        [riko]           [conductor]          [twilight]
    Context Oracle    CDC Orchestrator     UI/UX Designer
    inherits base      inherits base        inherits base
            ▼                 ▼                   ▼
        [shino]           [samba]            [lab / shrc]
```

Every signal that enters the collective — whether it is a user prompt, a handoff token, a resume instruction, or an auto-trigger — passes through the `§Step1` intake protocol that `_base-agent` defined. Every signal that exits — as a handoff, a checkpoint, or a session log — uses the format `_base-agent` owns.

This is why `_base-agent` is labeled `isSignalHub: true` in `receptors.json`. It is not *between* the agents in the flow — it is *beneath* all of them.

---

## Visual Representation in RNA Studio

In the RNA Studio canvas, `_base-agent` appears anchored at the **bottom-center** of the graph — below the orbiting specialist layer — with:

- **Amber/gold color** (`#d97706`) — reads as "substrate" or "ground truth"
- **Dashed border** — signals that it is a template/foundation, not a runtime specialist
- **Reverse-spinning outer ring** — distinct from the director's orbit ring; slower, reversed
- **`§hub` tier badge** — in place of a model tier name  
- **"all agents inherit ↗" footer** — confirms its role
- **Thin dashed downward edges** from every other agent to `_base-agent` — the inheritance topology made visible

---

## Adding `_base-agent` to Your Own Collective

In `receptors.json`, declare it as:

```json
{
  "id": "_base-agent",
  "name": "_base-agent",
  "role": "Master Signal Hub — shared §protocol foundation all agents inherit",
  "modelTier": "foundation",
  "file": ".github/agents/_base-agent.md",
  "isSignalHub": true,
  "inheritable": true,
  "autoApprove": true,
  "capabilities": ["§Step1", "§Handoff", "§JoinComplete", "§Checkpoint", "§Memory", "§Limits", "§SHR", "§Persona", "§Tools"]
}
```

In each specialist agent file, add the inheritance declaration:

```markdown
---
name: my-agent
inherits: _base-agent
---
```

The agent then **only needs to define its specialty** — role, domain, tools, and persona overrides. Everything else is inherited.

---

## Design Principle

`_base-agent` embodies the **Shu** level of the Shu-Ha-Ri framework: *follow the rule*.

Before any specialist agent can break a pattern (Ha) or transcend it (Ri), it must be able to articulate what the canonical baseline is. `_base-agent` is that baseline — written down, versioned, and visible in the network topology.

When a new agent is created in your RNA collective, the first question is always: *what does this agent do that `_base-agent` cannot?* If the answer is "nothing", you don't need a new agent.
