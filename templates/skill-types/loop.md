# Skill Archetype: Loop

> Use this template for skills that **iterate autonomously** toward a
> measurable goal. Loop skills define a metric, a guard condition, and
> execute plan→act→measure→decide cycles until the goal is met or the
> guard stops execution.

## Metadata

```json
{
  "id": "{{SKILL_ID}}",
  "name": "{{Skill Name}}",
  "type": "loop",
  "triggerKeywords": ["optimize", "iterate", "converge", "loop", "improve"],
  "file": "skills/{{skill-id}}.md",
  "skillOutput": "_memory/loops/{{loop-id}}.json"
}
```

## Template

```markdown
# {{Skill Name}}

**Type:** Loop — autonomous iteration toward a measurable goal.

## Trigger

Activate when the user mentions any of: {{triggerKeywords list}}.
Can also be started explicitly via `/rna.loop <goal>`.

## Loop Configuration

| Parameter      | Required | Default | Description |
|----------------|----------|---------|-------------|
| goal           | yes      | —       | Natural language goal statement |
| metric         | yes      | —       | Measurable success criterion |
| guard          | no       | 5 iter  | Maximum iterations or stop condition |
| rollbackOnFail | no       | true    | Revert changes if iteration worsens metric |

## Protocol

1. **Initialize** — Parse goal, define metric function, set guard.
2. **Baseline** — Measure the metric at the starting state.
3. **Iterate** (repeat until guard or goal met):
   a. **Plan** — Identify the highest-impact change for this iteration.
   b. **Execute** — Apply the change.
   c. **Measure** — Re-evaluate the metric.
   d. **Decide** — If metric improved → keep. If worsened → rollback.
   e. **Log** — Record iteration result to the loop file.
4. **Report** — Output a summary table:

| Iteration | Action | Metric Before | Metric After | Kept? |
|-----------|--------|---------------|--------------|-------|
| 1         | …      | …             | …            | ✅/❌  |

5. **Finalize** — Write final loop state to `_memory/loops/`.

## Guard Conditions

- Maximum iteration count (default: 5)
- Metric plateau (no improvement for 2 consecutive iterations)
- Time budget exceeded
- Error threshold (3 consecutive failures → escalate via §resilience)

## Output Format

- Default: Iteration table + final metric summary
- TOON mode: One line per iteration (`#N | action | before→after | ✅/❌`)

## Boundaries

- Each iteration must be independently reversible.
- Never exceed the guard limit — hard stop, report partial progress.
- Log all iterations even if rolled back.
```

## When to Use

- Performance optimization (bundle size, load time, memory)
- Code quality convergence (lint score, test coverage)
- Design polish iterations (accessibility score, consistency)
- Refactoring with measurable quality gates
