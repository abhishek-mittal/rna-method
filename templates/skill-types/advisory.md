# Skill Archetype: Advisory

> Use this template for skills that **analyze, critique, and recommend** without
> directly modifying artifacts. Advisory skills read context, evaluate against
> criteria, and produce structured observations or recommendations.

## Metadata

```json
{
  "id": "{{SKILL_ID}}",
  "name": "{{Skill Name}}",
  "type": "advisory",
  "triggerKeywords": ["audit", "review", "analyze", "critique", "evaluate"],
  "file": "skills/{{skill-id}}.md"
}
```

## Template

```markdown
# {{Skill Name}}

**Type:** Advisory — read-only analysis, no artifact mutation.

## Trigger

Activate when the user mentions any of: {{triggerKeywords list}}.

## Protocol

1. **Gather** — Read the target files / context specified in the user request.
2. **Evaluate** — Apply the criteria below to each item.
3. **Report** — Output a structured table:

| Item | Status | Finding | Recommendation |
|------|--------|---------|----------------|
| …    | ✅/⚠️/❌ | …       | …              |

4. **Summarize** — One paragraph with the overall health assessment.

## Criteria

<!-- Define 3–7 evaluation criteria specific to this skill -->

- Criterion 1: …
- Criterion 2: …
- Criterion 3: …

## Output Format

- Default: Markdown table + summary paragraph
- TOON mode: Compressed single-line per item (`status | item | finding`)

## Boundaries

- Do NOT modify any files — advisory only.
- If a fix is needed, recommend which agent should handle it and suggest the /rna.signal message.
```

## When to Use

- Code review / quality audits
- Design system compliance checks
- Accessibility audits
- Security posture reviews
- Documentation coverage analysis
