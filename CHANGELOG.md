# Changelog

All notable changes to the RNA Method schema and tooling are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Schema versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.2.0] — 2026-03-26

### Added
- 6 new `/rna.*` commands: `loop`, `recall`, `toon`, `compress`, `search`, `upgrade` — total command count: 15
- `/rna.upgrade` (alias: `/rna.resynk`) — snapshot current customizations, show version delta, update config, instruct adapter re-run while preserving project-level agent names, personas, rules, skills, and memory
- `/rna.loop <goal>` — autonomous iteration workspace with goal, metric, guard, and max-iteration config
- `/rna.recall <query>` — search memory observations index and timeline commits by keyword
- `/rna.toon` — toggle output format between verbose (default) and TOON (compressed abbreviations)
- `/rna.compress` — compress raw observation TSV into structured JSON, archive raw data, start fresh index
- `/rna.search <query>` — full-text search across all `_memory/` subdirectories (context, agents, rna-method, observations)
- `schema/rna-schema.json` — new top-level fields: `outputFormat`, `resilience{}`, `lifecycle{}`, `registry`
- `schema/rna-schema.json` — 3 new lifecycle hooks: `on-session-start`, `on-tool-complete`, `on-session-end`
- `schema/rna-schema.json` — new skill: `design-quality` (audit UI, normalize, polish, critique, distill, harden)
- `schema/rna-schema-definition.json` — expanded with all v1.2.0 optional fields while maintaining full backward compatibility with v1.0 schemas
- `templates/_base-agent.md` — 6 new §sections: `§lifecycle-hooks`, `§resilience` (Ralph Loop), `§progressive-context`, `§output-modes`, `§loop-protocol`, `§upgrade-protocol`
- `registry/capabilities.csv` — CSV-driven single-source-of-truth for all RNA capabilities (commands, skills, hooks, joining patterns)
- `templates/skill-types/` — 3 skill archetype templates: `advisory.md`, `generator.md`, `loop.md`
- **Designer agent** — 7th agent role: UI/UX & design system specialist with Figma MCP tools, design token management, component styling, visual QA, and accessibility
- `templates/full-collective/agents/designer.agent.md` — full agent template with design standards, Figma workflow, and session protocols
- `design-implement` joining pattern — designer → developer sequential flow for UI design then implementation
- `schema/rna-schema.json` — designer agent entry with persona, capabilities, and `/design` command
- **MCP / Tool Discovery** — auto-detect installed MCP servers and inject tools into agent configurations
- `tools/discover-tools.js` — standalone discovery module with known-server registry (~13 servers), platform config parsers, role-based tool assignment
- `.rna/tools-manifest.json` — generated manifest documenting all discovered servers, tools, and per-agent assignments
- `discoveredMcpServers[]` field in `.rna/config.json` — records which MCP servers were found at install time
- Copilot adapter fallback: auto-discovers MCP servers from `.vscode/mcp.json` when `mcpTools` not set in schema
- `install.sh` bash-native MCP discovery — parses workspace MCP configs and appends tools to agent frontmatter

### Changed
- Full collective expanded from 6 → 7 agents (added `designer`)
- `full-pipeline` joining pattern expanded to include `designer`: architect → designer → developer → reviewer
- `tools/init.js` — Phase 3.5 added: MCP/tool discovery between schema mutation and file write
- `adapters/copilot/copilot-adapter.js` — `run()` now auto-discovers MCP servers as fallback when `mcpTools` not in schema
- `tools/install.sh` — copilot frontmatter generation now scans workspace MCP config and appends discovered tools per agent role
- `docs/rna-commands.md` — `/rna.setup` protocol expanded from 7 → 8 steps (added step 6: Discover MCP servers and tools)
- `schema/rna-schema.json` — `rnaVersion` bumped from `1.1.0` → `1.2.0`
- `schema/rna-schema-definition.json` — relaxed `meta.platform` from enum to plain string for custom platform support
- `schema/rna-schema-definition.json` — relaxed `joiningPatterns` required fields (removed `file` from required)
- `tools/rna-commands.js` — help table expanded from 9 → 15 commands, router extended with 6 new cases + `resynk` alias
- `docs/rna-commands.md` — command reference table and agent instruction block updated with all v1.2.0 commands

### Research
- Competitive research audit across 14 repos (see `r&d/rna-enhancement-audit/`) — 22 actionable proposals distilled into 4 tiers
- Key influences: fabric patterns CLI, agentic-cursorrules, claude-engineer, cursor-boost, Agentfile spec, agentstack
- Backward compatibility validated: all new schema fields are optional, no breaking changes to existing collectives

---

## [1.1.0] — 2026-03-20

### Added
- `/rna.*` in-session command system — 9 agent-level commands: `setup`, `update`, `resync`, `signal`, `status`, `compact`, `gui`, `version`, `help`
- `tools/rna-commands.js` — CLI router implementing all `/rna.*` commands (pure Node.js, no deps)
- `tools/version-bump.js` — semver release tool; updates `schema/rna-schema.json.rnaVersion` and prepends `CHANGELOG.md` entry
- `docs/rna-commands.md` — full command spec and platform-agnostic agent instruction block
- `docs/context-compaction.md` — context compaction protocol with session summary format and `timeline.json.lastSession` spec
- `schema/rna-schema.json` — added `rnaVersion` top-level field for schema-level versioning separate from `version`
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1 with 4-level enforcement ladder
- `SECURITY.md` — private disclosure protocol (48h ack, 30d fix), path traversal + malicious schema injection as in-scope
- `CONTRIBUTING.md` — fork-only contributor workflow, Conventional Commits convention, PR requirements, tools reference
- `.github/pull_request_template.md` — three-section PR template (What changed / Why / Testing evidence)
- `.github/ISSUE_TEMPLATE/bug_report.yml` — YAML-format bug report with dropdown component picker
- `.github/ISSUE_TEMPLATE/feature_request.yml` — YAML-format feature request template
- `.github/workflows/pr-quality.yml` — 5-job PR quality workflow: fork check, JSON lint, registry validation, rna-commands smoke test, PR description check
- `.github/agents/rna-maintainer.agent.md` — release and review agent with adapter checklist, PR decision tree, and release protocol
- `.github/agents/rna-validator.agent.md` — schema compliance and adapter quality agent with full validation suite

### Changed
- `CONTRIBUTING.md` — versioning section updated to reference `tools/version-bump.js` and Conventional Commits
- `.github/ISSUE_TEMPLATE/bug-report.md` → superseded by `bug_report.yml` (YAML format)

### Research
- RNA Studio v1 shipped with live canvas, SSE pipeline, and full agent animation system (see `studio/`)
- Director/base-agent split: `_base-agent` is now the shared foundation tier across all agent collectives

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
