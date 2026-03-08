# Joining Pattern: Design to Build

**Pattern ID:** `build-review`
**Agents:** `developer` → `reviewer`
**Flow type:** Sequential (review gate)

---

## Overview

Use this join for any non-trivial implementation that requires a code review before merging.

**Trigger:** A development task is completed and is ready for review.

**Pipeline:**
```
@developer <implement task> → [PR opened] → @reviewer <review PR>
```

This is the most common join in a standard development cycle.

---

## Step 1: Developer

**Input:** Feature or fix description
**Activation:** `@developer <task>`

**Developer's tasks:**
1. Implement the feature or fix
2. Ensure all tests pass
3. Open a PR with the required three-section description (see `review-gate.md`)
4. Write session log to `_memory/agents/developer/YYYY-MM-DD_<slug>_session.md`

**Developer's handoff output:**
```markdown
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From:     @developer
To:       @reviewer
Pattern:  build-review
Context:  <2–3 sentences: what was built, key decisions made>
PR:       <PR title or branch name>
Artifact: _memory/agents/developer/YYYY-MM-DD_<slug>_session.md
Your task: Review PR and verify against coding standards and security gate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@reviewer [HANDOFF from @developer] Review PR: <title>
```

---

## Step 2: Reviewer

**Input:** PR title/branch and developer session log
**Activation:** `@reviewer [HANDOFF from @developer] Review PR: <title>`

**Reviewer's tasks:**
1. Read the developer's session log for context
2. Run the full pre-merge checklist (see `review-gate.md`)
3. Run the security gate checklist (see `security-gate.md`)
4. Output structured review findings
5. Archive review to `_memory/agents/reviewer/YYYY-MM-DD_<slug>_review.md`

**Review verdicts:**
- `APPROVE` → merge is cleared; update `timeline.json` signal to resolved
- `REQUEST_CHANGES` → hand back to @developer with specific blockers listed
- `NEEDS_DISCUSSION` → escalate to @architect or @director

---

## Example

```
Signal: "Add pagination to the /api/posts route"

@developer → implements cursor-based pagination
            → opens PR "feat(api/posts): add cursor-based pagination"
            → session log: _memory/agents/developer/2026-01-20_pagination_session.md

@reviewer  → reads session log
            → runs checklist: ✅ tests pass, ✅ no secrets, ⚠️ missing JSDoc on new helper
            → verdict: REQUEST_CHANGES
            → @developer adds JSDoc, updates PR

@reviewer  → second pass: ✅ all checks pass
            → verdict: APPROVE
```

---

## Abort Conditions

- Reviewer finds architectural issue → escalate to @architect
- Reviewer finds security vulnerability → block merge, notify @director
- Developer cannot address blockers → escalate to @director
