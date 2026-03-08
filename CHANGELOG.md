# Changelog

All notable changes to the RNA Method schema and tooling are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Schema versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-03-08

### Added
- `schema/rna-schema.json` — v1 canonical platform-neutral schema with 6 top-level keys: `agents`, `rules`, `skills`, `commands`, `hooks`, `routes`
- `schema/rna-schema-definition.json` — JSON Schema validator for any `rna-schema.json` file
- Adapters for Cursor, GitHub Copilot, Claude Code, OpenAI Codex (v1) and Kimi Code (experimental)
- `templates/minimal-collective/` — single-agent starter kit (developer + 1 rule + hub files)
- `templates/full-collective/` — 5-agent generic starter kit (developer, reviewer, architect, researcher, ops)
- `templates/rules/` — 4 standalone reusable rule files
- `templates/joins/` — 3 documented joining patterns
- `tools/validate-registry.js` — 7-check registry health scanner with `--fix` and `--json` modes
- `docs/getting-started.md` — standalone "30 min to working collective" guide
- `docs/research-paper.md` — full RNA + Pluribus research paper
- `docs/cross-platform-guide.md` — per-platform implementation reference
- `docs/schema-reference.md` — annotated walkthrough of all 6 schema keys
- `docs/failure-modes.md` — 5 documented failure modes with fixes
- GitHub Actions workflow: `rna-validate.yml` — runs validator on schema/template changes
- GitHub Issue templates: adapter-request, rule-template, bug-report

### Research
- POC ran on Cursor IDE over 4-week production sprint, March 2026
- 9 specialist agents + 1 director, 5 platform adapters, `rna-schema-v1` finalized

---

## Versioning Policy

**`schema/rna-schema.json` version** (`"version"` field inside the file):
- Patch `1.0.x` — backward-compatible additions (new optional fields)
- Minor `1.x.0` — new top-level keys with backward compatibility
- Major `x.0.0` — breaking changes to existing key structure

**Adapters** are versioned independently per adapter directory.

**`tools/validate-registry.js`** follows schema version compatibility.
