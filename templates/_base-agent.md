# §base — Shared Agent Protocol

> All agents in this collective inherit these standard sections.
> Only overrides and unique content go in individual agent files.

---

## §Step1 — Intake Protocol

On every invocation, before doing anything else:

1. **HANDOFF check**: If invoked with `[HANDOFF from @<agent>]`:
   - Read `_memory/rna-method/agent-context.json` → find matching `joinId`
   - Load every file in `artifacts[]` — this is your full context
   - Proceed directly with the assigned task

2. **RESUME check**: If invoked with `[RESUME: <task-slug>]`:
   - Read `_memory/rna-method/agent-context.json` → find checkpoint matching `<task-slug>`
   - Read the checkpoint file at `path`
   - Reconstruct from `decisions[]`, `filesChanged[]`, `remainingWork[]`
   - Continue from first `remainingWork[]` item

3. **Normal invocation**: Read relevant context (memory, conventions, codebase).

---

## §Handoff — Protocol

When handing off to the next agent in a join:

```
§handoff(from:@<self>, to:@<next>, join:<joinId>, step:N/M)
  context: <1-2 sentences: what was done, key decisions>
  artifacts: <comma-separated file paths>
  task: <exactly what the next agent should do>
→ @<next> [HANDOFF from @<self>] <task line>
```

Before handing off:
1. Complete your memory write (§memory-write below)
2. Update `agent-context.json` — add step to `completedSteps[]`, artifacts to `artifacts[]`
3. Output the handoff block above
4. Tell user: copy last line → fresh chat thread

---

## §JoinComplete — Terminal Agent Close

If you are the terminal agent in a join:

```
§join-complete(id:<joinId>, pattern:<name>)
  agents: @a → @b → @c
  built: [file list]
  open: [follow-ups]
```

Then: remove join from `agent-context.json` `activeJoins[]`, delete checkpoint file if any.

---

## §Checkpoint — Context Hygiene

Checkpoint when: >20 turns, >5 files read, or losing thread.

```
§checkpoint(slug:<task-slug>)
  decisions: [d1, d2]
  files: [f1, f2]
  remaining: [r1, r2]
→ Resume: @<self> [RESUME: <task-slug>]
```

Write to `_memory/rna-method/checkpoints/<YYYY-MM-DD>_<task-slug>.json`.
Add pointer to `agent-context.json` `checkpoints[]`.

---

## §memory-write — Session Log

After completing work, write a dated session log:

```
Path: _memory/agents/<agent-id>/YYYY-MM-DD_<task-slug>_session.md
```

Contents: what was done, decisions made, files changed, follow-ups.

---

## §rna-state — RNA Network State Hygiene

Keeping `_memory/rna-method/` current is **mandatory** — single source of truth for the team.

### Before every task
1. Read `_memory/rna-method/timeline.json` → note `activePhase`, `recentDecisions`, open questions.
2. Read `_memory/rna-method/agent-context.json` → note active joins, open checkpoints, blockers.

### After every task
1. Write session log (§memory-write above).
2. Append to `timeline.json` `recentDecisions[]`:
   `{ "date": "YYYY-MM-DD", "agent": "<id>", "decision": "<what>", "rationale": "<why>" }`
3. If `projectState` changed: update `timeline.json` `projectState`.
4. Clear resolved items: remove completed checkpoints from `agent-context.json`.
5. Output the §task-complete block.

---

## §task-complete — Post-Task Output

After every task, output:

```
§task-complete(@<agent>)
  status:    ✅ Done | ⚠️ Partial | ❌ Blocked
  what:      <1-2 sentences: what was delivered>
  files:     [<created / modified paths>]
  decisions: [<key decisions made>]
  next-actions:
    - [@<agent> or You] <specific action>
  open:      [<blocker or follow-up question>]
```

Rules:
- Output for **every task**, including small ones.
- `next-actions` MUST have at least one item.
- For join handoffs: output §task-complete first, then §handoff.

---

## §limits — Common Hard Limits

- Never skip reading existing code/context before acting
- Never commit credentials, secrets, or API keys
- Never leave `console.log` / `debugger` in production paths
- Be honest about gaps — say "I don't know" rather than hallucinate
- Follow the project's type system strictly — no `any` without justification
- Keep context usage efficient — see TOON registry for canonical abbreviations
