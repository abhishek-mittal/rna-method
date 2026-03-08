# Standalone Rules

This directory contains reusable rule files that can be added individually to any RNA-managed collective — without adopting the full `full-collective` template.

## Usage

Copy any rule file from this directory into your project's platform-specific rules directory:

**Cursor:** `.cursor/rules/<rule-name>.md`
**Copilot:** `.github/instructions/<rule-name>.instructions.md`
**Claude Code:** Add content inline to `CLAUDE.md`
**Codex:** Add content inline to `AGENTS.md`

Then reference the rule in your `receptors.json`:

```json
{
  "rules": [
    {
      "id": "coding-standards",
      "name": "Coding Standards",
      "alwaysApply": true,
      "file": ".github/instructions/coding-standards.instructions.md"
    }
  ]
}
```

## Available Rules

| File | alwaysApply | Purpose |
|---|---|---|
| `coding-standards.md` | `true` | Core code quality, TypeScript, commit hygiene |
| `security-gate.md` | `false` | Security review checklist for PRs |
| `review-gate.md` | `false` | PR description format and merge criteria |
| `docs-standards.md` | `false` | Documentation quality and freshness |
