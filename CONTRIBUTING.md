# Contributing to RNA Method

Thank you for contributing to the RNA Method open-source project.

This guide describes the three contribution paths, the review process, and the code standards expected from all contributors.

---

## Contribution Paths

### Path A — Add a New Platform Adapter

A platform adapter translates `rna-schema.json` into platform-native agent, rule, and skill files.

**Requirements for a new adapter:**

1. Location: `adapters/<platform-name>/<platform-name>-adapter.js`
2. The adapter must be pure Node.js — no external dependencies beyond `fs` and `path`.
3. CLI interface: `node adapters/<platform>/<platform>-adapter.js [schema-path] [output-dir]`
4. The adapter must generate all of the following from the schema:
   - Agent files (one per agent in `agents[]`)
   - Rule/instruction files (one per rule in `rules[]`)
   - An index or manifest file (registry, routing table, or instructions hub)
5. The adapter's output directory must not collide with existing adapters.
6. Include a `adapters/<platform>/README.md` with:
   - Platform requirements (version, plan, etc.)
   - What files are generated and where
   - Known limitations
7. Include test instructions — manually run the adapter against `templates/minimal-collective/` and verify the output is valid.

**Getting started:**
Copy `adapters/cursor/cursor-adapter.js` as a starting point. It is the most thoroughly commented adapter.

---

### Path B — Contribute a Rule Template

A rule template is a reusable `.md` file in `templates/rules/` that agents can reference.

**Requirements:**

1. File location: `templates/rules/<rule-name>.md`
2. Include frontmatter:
   ```yaml
   ---
   name: Human-readable Rule Name
   description: One-sentence summary of what this rule enforces.
   alwaysApply: true | false
   triggerKeywords: [keyword1, keyword2]  # optional
   ---
   ```
3. The rule must be framework-agnostic (no Next.js-specific, Rails-specific, etc. content unless clearly scoped in the filename — e.g. `nextjs-routing-conventions.md`).
4. Include the rule simultaneously in `templates/full-collective/rules/` by copying it.

---

### Path C — Document a Joining Pattern

A joining pattern describes how two or more agents hand off work to each other.

**Requirements:**

1. File location: `templates/joins/<pattern-name>.md`
2. Required sections:
   - Overview (trigger, pipeline diagram, flow type)
   - Step N for each agent (input, tasks, handoff output format)
   - Example (a concrete scenario)
   - Abort Conditions (what halts the pipeline)
3. The pattern must be generic — no project-specific names or domains.

---

## PR Requirements

Every PR must:

1. Pass the registry validator: `node tools/validate-registry.js --json` must exit `0`.
2. TypeScript (if any `.ts` files are added): `tsc --noEmit` must pass.
3. Include a complete PR description with all three sections:

   ```markdown
   ## What changed
   ## Why
   ## Testing evidence
   ```

4. Not introduce new `npm` dependencies unless absolutely necessary. Open a discussion issue first.

---

## Code Style

- **JavaScript:** Vanilla Node.js, no transpilation. 2-space indentation.
- **Template Markdown:** Frontmatter required for all agent and rule files.
- **JSON:** 2-space indentation. No trailing commas.
- **Filenames:** `lowercase-kebab-case` throughout.
- **No console.log in adapters unless verbose/debug mode.** Use `if (VERBOSE) console.log(...)`.

---

## Development Setup

```bash
# Clone the repo
git clone https://github.com/abhishekmittal/rna-method.git
cd rna-method

# No install step needed — pure Node.js
# Test an adapter against the minimal template:
node adapters/copilot/copilot-adapter.js schema/rna-schema.json ./test-output/

# Validate the registry files:
node tools/validate-registry.js --receptors templates/minimal-collective/receptors.json
```

---

## Versioning

RNA Method follows [Semantic Versioning](https://semver.org/):

- `PATCH` — bug fixes in adapters, typo fixes in templates/docs
- `MINOR` — new adapters, new rules, new joining patterns (backward-compatible)
- `MAJOR` — schema changes that break existing `rna-schema.json` files

When bumping the schema, update `meta.schemaVersion` in `schema/rna-schema.json` and add an entry to `CHANGELOG.md`.

---

## Questions

Open a [GitHub Issue](https://github.com/abhishekmittal/rna-method/issues) with one of the provided templates:

- `adapter-request.md` — Request a new platform adapter
- `rule-template.md` — Request a new rule template
- `bug-report.md` — Report a bug in an existing adapter or tool
