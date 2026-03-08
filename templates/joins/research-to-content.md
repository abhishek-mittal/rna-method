# Joining Pattern: Research to Content

**Pattern ID:** `research-build`
**Agents:** `researcher` → `developer`
**Flow type:** Pipeline (sequential handoff)

---

## Overview

Use this join when a task requires research findings to inform or drive implementation.

**Trigger:** A signal arrives that requires both exploration (unknown solution) and implementation (building the solution).

**Pipeline:**
```
@researcher <research question> → [Brief produced] → @developer <implement based on brief>
```

---

## Step 1: Researcher

**Input:** Research question or topic description
**Activation:** `@researcher [topic]`

**Researcher's tasks:**
1. Investigate the topic from primary sources
2. Produce a Research Brief (see `templates/full-collective/agents/researcher.agent.md` for format)
3. Include actionable recommendations
4. Write brief to `_memory/agents/researcher/YYYY-MM-DD_<topic-slug>_brief.md`

**Researcher's handoff output:**
```markdown
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From:     @researcher
To:       @developer
Pattern:  research-build
Context:  <2–3 sentences: what was found, key recommendation>
Artifact: _memory/agents/researcher/YYYY-MM-DD_<slug>_brief.md
Your task: Implement <specific task based on brief>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@developer [HANDOFF from @researcher] Implement <task>
```

---

## Step 2: Developer

**Input:** Research brief from `_memory/agents/researcher/`
**Activation:** `@developer [HANDOFF from @researcher] <task>`

**Developer's tasks:**
1. Read the research brief from the artifact path
2. Implement based on the brief's recommendations
3. Note which recommendations were adopted vs. deferred
4. Write session log to `_memory/agents/developer/YYYY-MM-DD_<slug>_session.md`

**Completion condition:** Implementation done, tests pass, PR opened.

---

## Example

```
Signal: "Evaluate and implement a rate-limiting strategy for the API"

@researcher → finds 3 approaches (token bucket, sliding window, fixed window)
              → recommends sliding window for our use case
              → artifacts: _memory/agents/researcher/2026-01-15_rate-limiting_brief.md

@developer  → reads brief
             → implements sliding window using recommended library
             → opens PR with architecture decision documented
```

---

## Abort Conditions

- Research brief yields no actionable recommendation → escalate to @architect
- Implementation requires a fundamental design change → escalate to @architect before continuing
