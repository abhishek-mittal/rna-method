# Failure Modes

Documented failure patterns in RNA Method installations, with diagnosis and fixes.

---

## FM-001: Agent Ignores System Context

**Symptom:** Agent responds like a generic assistant — ignores the agent file, doesn't follow protocols, doesn't state its identity at session start.

**Causes:**
- The agent file doesn't exist at the path declared in `receptors.json`
- The platform adapter was not re-run after the schema changed
- The `@agent-name` syntax isn't supported in this editor's version

**Diagnosis:**
```bash
node tools/validate-registry.js
# Look for: ✗ [agent-files-exist] Agent "developer" file missing
```

**Fix:**
1. Re-run the adapter: `node adapters/<platform>/<platform>-adapter.js rna-schema.json ./`
2. Restart the AI editor's context (close and reopen chat)
3. If the `@agent-name` syntax is not supported: paste the agent file content directly into the conversation context, or start with: `"You are Developer. Read your agent file: [paste content]"`

---

## FM-002: Rules Not Applied

**Symptom:** Agent doesn't follow coding standards — produces nested conditionals, ignores TypeScript strict mode, skips JSDoc requirements.

**Causes:**
- Rule file missing from the expected path
- Rule has `alwaysApply: false` and the trigger keyword wasn't in the conversation
- Rule file content is malformed (bad frontmatter)

**Diagnosis:**
```bash
node tools/validate-registry.js
# Look for: ✗ [rule-files-exist] Rule "coding-standards" file missing
```

**Fix:**
1. Verify the rule file exists at the path in `receptors.json`
2. For `alwaysApply: false` rules, include a trigger keyword in your message: "Review this PR for security issues"
3. Check that the rule file's frontmatter is valid YAML

**Prevention:** Keep 2–3 critical rules as `alwaysApply: true`. Rely on trigger keywords for the rest.

---

## FM-003: Signals Not Resolving (Zombie Signals)

**Symptom:** `timeline.json` accumulates signals that are never marked as resolved. Agents report stale context at session start.

**Causes:**
- Agent session ended without updating `timeline.json`
- Agent crashed or was interrupted mid-session
- Signal was assigned to an agent that was never invoked

**Diagnosis:**
```bash
node tools/validate-registry.js
# Look for: ⚠ [no-stale-checkpoints]
# Also inspect: _memory/rna-method/timeline.json → signalQueue[]
```

**Fix:**
1. Open `timeline.json` and manually audit `signalQueue` — remove or resolve completed signals
2. For interrupted sessions: read the most recent agent memory file in `_memory/agents/<id>/` to reconstruct stopping point
3. Add a session end reminder to the agent file: "Always update `timeline.json` before ending the session"

---

## FM-004: Context Window Overflow

**Symptom:** AI editor starts truncating or ignoring instructions mid-conversation. Agent forgets earlier context. Quality degrades as conversation grows.

**Causes:**
- Too many `alwaysApply: true` rules — each one is loaded into context on every turn
- Large agent files with excessive boilerplate
- Long conversation threads without checkpointing

**Fix:**
1. Reduce `alwaysApply: true` rules to 2–3 maximum — move less-critical rules to trigger-keyword activation
2. Trim agent files — remove duplicated examples; reference external files instead of inlining them
3. Use checkpoints: when a session exceeds ~20 turns, write a checkpoint to `_memory/rna-method/checkpoints/` and start a fresh thread with `[RESUME: <task-slug>]`

---

## FM-005: Joining Pipeline Stalls

**Symptom:** A pipeline started (e.g., `research-build`) but the handoff never reached the next agent. The terminal agent's output was never picked up.

**Causes:**
- Handoff block was not formatted correctly
- The "To: @next-agent" line was missed
- The next agent has `requiresDirectorApproval: true` and director wasn't invoked

**Fix:**
1. Check that the handoff block in the previous agent's output contains the required `To:`, `Pattern:`, and `Your task:` fields
2. For director-approval requirements: explicitly invoke `@director` before continuing the pipeline
3. If the pipeline is completely stalled: reconstruct state from agent memory files and restart the next stage manually

**Prevention:** When starting a join, tell your editor:
```
Starting join: research-build
researcher → developer
researcher is on step 1 of 2
```
This keeps the AI editor aware of the pipeline context throughout.

---

## FM-006: Hook Not Firing

**Symptom:** The `rna-updated-validate` hook (or any other hook) doesn't execute when expected.

**Causes:**
- `hook.enabled` is `false` in `receptors.json`
- Platform doesn't support automated hook execution (Codex, Kimi)
- Script path is incorrect

**Diagnosis:**
```bash
node tools/validate-registry.js
# Look for: ✗ [hook-targets-valid]
```

**Fix:**
1. Verify `"enabled": true` in the hook definition in `receptors.json`
2. Check the `scriptPath` resolves from the project root
3. For platforms that don't support automation: run the hook script manually after the triggering event

**Platform hook support matrix:**

| Platform | Hook Automation |
|---|---|
| Cursor | ✅ via `.cursor/rules/` |
| Copilot | ✅ via `.github/instructions/` |
| Claude Code | ✅ inline in `CLAUDE.md` |
| Codex | ⚠️ Advisory only |
| Kimi | ❌ Manual only |

---

## General Debugging Sequence

When something isn't working:

1. Run `node tools/validate-registry.js` — fix all failures
2. Re-run the platform adapter — `node adapters/<platform>/... rna-schema.json ./`
3. Restart the AI editor's context window
4. If still broken: check `_memory/rna-method/timeline.json` for stale or conflicting state
5. If still broken: open a [GitHub Issue](https://github.com/abhishekmittal/rna-method/issues) with the `bug-report.md` template
