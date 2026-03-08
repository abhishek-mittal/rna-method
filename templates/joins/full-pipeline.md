# Joining Pattern: Full Pipeline

**Pattern ID:** `full-pipeline`
**Agents:** `architect` → `developer` → `reviewer`
**Flow type:** Pipeline (3-stage)

---

## Overview

Use this join for complex features that require design before implementation and review after.

**Trigger:** A feature is non-trivial enough that building it without an upfront design phase carries significant rework risk. Usually triggered by @director during sprint planning.

**Pipeline:**
```
@architect <design task> → [ADR produced] → @developer <implement> → [PR opened] → @reviewer <review>
```

---

## Step 1: Architect

**Input:** Feature description + constraints
**Activation:** `@architect <design task>`

**Architect's tasks:**
1. Define the API contract (if applicable)
2. Produce an Architecture Decision Record (ADR)
3. Specify implementation constraints for @developer
4. Write ADR to `_memory/agents/architect/YYYY-MM-DD_<slug>_adr.md`
5. Update `projectState.knownDecisions` in `timeline.json`

**Architect's handoff output:**
```markdown
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From:     @architect
To:       @developer
Pattern:  full-pipeline
Step:     1 of 3
Context:  <2–3 sentences: what was designed, key constraints>
Artifact: _memory/agents/architect/YYYY-MM-DD_<slug>_adr.md
Your task: Implement <feature> following the ADR. Key constraint: <constraint>.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@developer [HANDOFF from @architect] Implement <feature> per ADR
```

---

## Step 2: Developer

**Input:** ADR from `_memory/agents/architect/`
**Activation:** `@developer [HANDOFF from @architect] <task>`

**Developer's tasks:**
1. Read the ADR — do not deviate without flagging back to @architect
2. Implement according to the design
3. If a design assumption proves wrong, pause and return to @architect before continuing
4. Open PR with reference to the ADR in the description
5. Write session log to `_memory/agents/developer/YYYY-MM-DD_<slug>_session.md`

**Developer's handoff output:**
```markdown
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From:     @developer
To:       @reviewer
Pattern:  full-pipeline
Step:     2 of 3
Context:  <2–3 sentences: what was built, any ADR deviations>
PR:       <PR title or branch name>
ADR:      _memory/agents/architect/YYYY-MM-DD_<slug>_adr.md
Your task: Review PR. Verify implementation matches ADR contracts.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@reviewer [HANDOFF from @developer] Review PR: <title> (full-pipeline step 3)
```

---

## Step 3: Reviewer

**Input:** PR + developer session log + original ADR
**Activation:** `@reviewer [HANDOFF from @developer] Review PR: <title>`

**Reviewer's additional check for full-pipeline:**
- [ ] Implementation matches the API contract in the ADR
- [ ] No undocumented deviations from the design
- [ ] If there are deviations, they are justified in the PR description and acceptable to @architect

**Completion:** APPROVE → signal resolved; update `timeline.json`; notify @director.

---

## Example

```
Signal: "Implement multi-tenant authentication"

@architect → designs: JWT with tenant claim, middleware validator, rate-limit per tenant
            → ADR: _memory/agents/architect/2026-02-01_auth_adr.md

@developer → implements JWT + middleware + rate-limit
             → opens PR "feat(api/auth): multi-tenant JWT authentication"
             → session log: _memory/agents/developer/2026-02-03_auth_session.md

@reviewer  → checks PR against ADR contracts: ✅ all matches
            → security gate: ✅ secrets in env, ✅ Zod validation
            → verdict: APPROVE
```

---

## Abort Conditions

- ADR is missing → @architect must complete it before @developer begins
- ADR design proves unimplementable → return to @architect with specific blockage
- Reviewer finds implementation diverges from ADR without justification → block merge
- Any agent discovers a security issue → halt, notify @director

---

## Terminal Agent: Reviewer

On pipeline completion:
1. Archive review to `_memory/agents/reviewer/YYYY-MM-DD_<slug>_review.md`
2. Update `timeline.json` — mark all pipeline signals resolved
3. Notify @director: "Full-pipeline complete: <feature>. PR approved."
