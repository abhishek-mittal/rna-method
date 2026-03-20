# Context Compaction

The practice and protocol for compressing long agent sessions into structured memory before closing the chat window. Implemented as `/rna.compact`.

---

## Why Context Compaction Matters

[fact] All major AI coding assistants — Cursor, GitHub Copilot, Claude Code, Codex — operate within a fixed context window. Limits range from 64K to 200K tokens depending on the model and platform. A multi-hour development session with file reads, code generation, debugging cycles, and iterative back-and-forth can consume the full window before the work is done.

[fact] Closing a chat window and opening a new one discards all in-memory context. The agent starts cold. Without a structured summary, the next session requires the user to re-explain the entire situation — or the agent makes decisions inconsistent with the previous session's choices.

[inference] The longer the session, the more likely the agent is to lose coherence near the end as early context falls out of its effective window. The agent starts giving shorter responses, contradicts earlier decisions, or asks questions it already answered two hours ago. Proactive compaction at natural pause points costs ~2 minutes of agent work but saves the next session's first 10 minutes.

**The RNA Method treats this as `§compact` — a first-class protocol, not an afterthought.**

---

## The `/rna.compact` Workflow

Triggered by typing `/rna.compact` in any agent chat. The agent completes all steps in a single response.

### Step 1 — Read project context

Read `_memory/rna-method/timeline.json` to anchor the summary in the project's known stable state. This prevents the agent from overwriting facts that are already recorded and limits the summary to what is genuinely new from this session.

### Step 2 — Collect current session context

The agent reflects across the current conversation and identifies:

- What the user asked for at the start of the session
- What was built, researched, or decided
- Which files were created or significantly modified
- Any open questions or blockers that were not resolved
- Any handoffs or `/rna.signal` messages sent to other agents

### Step 3 — Write the session summary file

Output path: `_memory/context/<YYYY-MM-DD>_session-summary.md`

If a file with the same date already exists (multiple sessions in one day), append a counter suffix: `<YYYY-MM-DD>_session-summary-2.md`, `<YYYY-MM-DD>_session-summary-3.md`, etc.

Maximum length: **500 words**. Include only what a new agent session would need to resume correctly. Omit code samples, long deliberation that was already resolved, and intermediate error states.

### Step 4 — Update `timeline.json`

Update the `lastSession` field in `_memory/rna-method/timeline.json`. Do not modify any other field.

### Step 5 — Print for verification

The agent prints the full summary to the chat so the user can read it and confirm it is accurate before closing the window. If anything is wrong, the user types corrections — the agent re-writes the file with the corrections applied. Only close the window after the summary is confirmed.

---

## Session Summary Format

```markdown
---
date: 2026-03-20
agents: [shino, samba]
topic: RNA commands spec — design + documentation
---

## What Happened

[2–5 sentences: the session's main arc — what was started, what was completed,
what shape the work took. Write for an agent that was not present.]

## Key Decisions

- [Decision 1]: [1-line rationale]
- [Decision 2]: [1-line rationale]

## Files Changed

- `path/to/file` — [what changed and why]
- `path/to/file` — [what changed and why]

## Open Questions

- [Question or blocker that needs resolution in the next session]

## Signals Sent

- [agentId]: [signal message and timestamp] (omit section if none)
```

### Field guidelines

| Field | What to include | What to omit |
|---|---|---|
| `date` | Session date (ISO `YYYY-MM-DD`) | — |
| `agents` | Agent IDs active this session | Human user unless acting as an agent |
| `topic` | One-line session title that uniquely identifies this session | Details — that belongs in "What Happened" |
| `What Happened` | Main narrative: intent, execution, outcome | Deliberation, rejected approaches, intermediate states |
| `Key Decisions` | Irreversible or design-shaping choices | Tactical micro-decisions (e.g., "used forEach instead of map") |
| `Files Changed` | Every file written or significantly modified | Files only read, not changed |
| `Open Questions` | Unresolved blockers or deferred decisions | Questions answered during the session |
| `Signals Sent` | Any `/rna.signal` messages sent this session | — |

---

## `timeline.json` `lastSession` Format

After compaction, `_memory/rna-method/timeline.json` gains or overwrites the `lastSession` field:

```json
"lastSession": {
  "date": "2026-03-20",
  "summaryFile": "_memory/context/2026-03-20_session-summary.md",
  "agents": ["shino", "samba"],
  "topic": "RNA commands spec — design + documentation",
  "keyDecisions": [
    "/rna.* commands are instruction-file-taught, not CLI commands",
    "compact() writes max 500-word summary to _memory/context/"
  ],
  "filesChanged": [
    "open-source/rna-method/docs/rna-commands.md",
    "open-source/rna-method/docs/context-compaction.md"
  ]
}
```

`lastSession` is the **entry point for next-session cold starts**. When a new agent opens and reads `timeline.json`, this field tells it exactly where to find the most recent context without having to load the full summary file unless needed. It is a pointer, not the content itself.

---

## Best Practices

### When to compact

- **Before closing the chat window** — always, even for partial sessions. A partial summary is better than no summary.
- **Before switching to a new feature** — preserve decisions about the current feature before the next feature's context pollutes the window.
- **After a major architectural or API decision** — write it down before it gets buried.
- **Around turn 40–50 in a long session** — proactive compaction before the window fills. Early signs the window is filling: the agent gives shorter responses, starts forgetting earlier decisions, or begins contradicting earlier choices.

### What to include vs omit

**Include:**
- Decisions that shape downstream work (architecture, schema, API contracts, naming)
- Files that agents in the next session will need to know about
- Unresolved blockers that will affect the next session's first action
- In-progress join IDs (`joinId` from `agent-context.json`)

**Omit:**
- Deliberation that was settled (record only the conclusion)
- Code that can be found by reading the file directly
- Intermediate error states that were resolved
- Long prose that reproduces what is already written in the files

### The 500-word ceiling

[inference] The 500-word limit (~750 tokens) is not arbitrary. A summary this size is cheap enough to include in every new session's preamble without consuming meaningful context budget. Summaries longer than this tend to be selectively read at best, ignored at worst — which defeats their purpose.

If 500 words feels insufficient, the session was too long or too unfocused. The correct fix is to compact at natural pause points rather than waiting until the window is near full.

### Multiple sessions per day

Use the counter suffix pattern: `2026-03-20_session-summary-2.md`. Always update `timeline.json` `lastSession` to point to the most recent summary file. Previous summaries are never deleted — they form a searchable history in `_memory/context/` that spans the project's lifetime.

### What `/rna.compact` does not replace

Compaction preserves **session narrative** — the story of what happened. It is not a substitute for structured memory files:

| File | Purpose | Write protocol |
|---|---|---|
| `receptors.json` | Agent definitions | Written by `/rna.setup` or `/rna.update` |
| `timeline.json` | Project state + team profiles | Written by setup / resync / compact (`lastSession` only) |
| `agent-context.json` | Live join state + signal queue | Written by agents directly, managed by director |
| `_memory/context/*.md` | Session narrative history | Written by `/rna.compact` |

`/rna.compact` writes only to `_memory/context/` and updates a single field (`lastSession`) in `timeline.json`. It does not modify `receptors.json`, `agent-context.json`, or any platform adapter output.

### Compact before handoff

[inference] If an agent is about to hand off to another agent in a different chat window (§Handoff protocol), running `/rna.compact` first ensures the receiving agent can use the summary file as supplementary context. Include the `summaryFile` path in the handoff's `artifacts[]` list.
