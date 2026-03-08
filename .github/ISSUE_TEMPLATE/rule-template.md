---
name: Rule Template Request
about: Request a new reusable rule template for templates/rules/
title: "[RULE] <rule name>"
labels: rule-template, enhancement
assignees: ''
---

## Rule Name

**Proposed filename:** `<rule-name>.md` (lowercase-kebab-case)
**`alwaysApply`:** `true` | `false`

## What should this rule enforce?

<!-- Describe the coding standard, security requirement, or workflow policy this rule enforces -->

## Why is it not already covered by existing rules?

<!-- Check existing rules in templates/rules/ first -->

## Target audience

<!-- What kind of project or team would use this rule? -->
- [ ] All projects (framework-agnostic)
- [ ] Specific framework: ___
- [ ] Specific language: ___

## Draft content (optional)

<!-- If you have a draft of the rule content, paste it here -->

```markdown
---
name: <Rule Name>
description: <one sentence>
alwaysApply: false
triggerKeywords: []
---

# Rule content here
```

## Are you willing to contribute this rule?

- [ ] Yes — I'll open a PR following [CONTRIBUTING.md Path B](../../CONTRIBUTING.md)
- [ ] No — requesting community support
