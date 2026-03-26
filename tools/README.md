# Tools

This directory contains utility scripts for managing and validating your RNA Method installation.

---

## init.js — Interactive Project Init

One-command scaffolding. Asks you 7 questions and writes everything: `_memory/` config files,
platform agent/rule files, and validates the result.

### Run modes

**Embedded** (from inside the cloned repo):
```bash
node tools/init.js
```

**Remote** (no clone needed — fetches templates from GitHub on the fly):
```bash
node -e "$(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/init.js)"
```

**Non-interactive / CI** (all answers via flags):
```bash
node tools/init.js --non-interactive \
  --platform=copilot \
  --collective=minimal \
  --project-name=my-project \
  --stack=TypeScript \
  --framework="Next.js"
```

### Flags

| Flag | Values | Default |
|---|---|---|
| `--platform` | `cursor` `copilot` `claude-code` `codex` `kimi` | Interactive |
| `--collective` | `minimal` `full` | Interactive |
| `--agents` | comma-separated IDs | From collective |
| `--rules` | comma-separated IDs | All 4 rules |
| `--project-name` | string | `basename(cwd)` |
| `--stack` | string | `TypeScript` |
| `--framework` | string | `Node.js` |
| `--output` | dir path | `cwd` |
| `--non-interactive` | flag | off |

**Valid agent IDs:** `director` `developer` `reviewer` `architect` `researcher` `ops` `designer`

**Valid rule IDs:** `coding-standards` `security-gate` `review-gate` `docs-standards`

### What it creates

```
<output>/
  rna-schema.json                     ← schema (source of truth)
  _memory/
    rna-method/
      receptors.json                  ← agent registry
      timeline.json                   ← project state
      checkpoints/                    ← created empty, ready
  <platform-specific files>           ← from the adapter
```

### Re-running

Re-run after editing `rna-schema.json` to regenerate platform config:
```bash
# Re-run the adapter only (faster than full init)
node adapters/copilot/copilot-adapter.js rna-schema.json ./
```

### Debug

```bash
RNA_DEBUG=1 node tools/init.js   # print full stack traces on error
```

---

---

## validate-registry.js

Runtime health checker for your RNA registry files (`receptors.json` and `agent-context.json`).

### What it checks

| Check | Description |
|---|---|
| `agent-files-exist` | All agent `.agent.md` files referenced in `receptors.json` actually exist |
| `skill-files-exist` | All skill canonical files referenced in `receptors.json` actually exist |
| `rule-files-exist` | All rule instruction files referenced in `receptors.json` actually exist |
| `hook-targets-valid` | Hook scripts exist and hook instruction references resolve to known rule IDs |
| `agent-ids-unique` | No duplicate agent IDs within `receptors.json` |
| `no-orphaned-checkpoints` | All checkpoint pointers in `agent-context.json` resolve to existing files |
| `no-stale-checkpoints` | No checkpoints older than 7 days (potential zombie tasks) |

### Usage

```bash
# Standard scan (from your project root)
node tools/validate-registry.js

# With auto-repair suggestions
node tools/validate-registry.js --fix

# Machine-readable JSON output (for CI integration)
node tools/validate-registry.js --json

# Custom project root
node tools/validate-registry.js --root /path/to/project

# Custom file paths (if your RNA files are in non-default locations)
node tools/validate-registry.js \
  --receptors path/to/receptors.json \
  --context path/to/agent-context.json
```

### Default file locations

The tool looks for RNA files relative to the current working directory:

```
<project-root>/
  _memory/
    rna-method/
      receptors.json          ← default --receptors target
      agent-context.json      ← default --context target
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | All checks passed (warnings are allowed) |
| `1` | One or more checks failed |

### Example output

```
═══ RNA Method Registry Validator ═══
    Root: /Users/me/my-project

✓ [agent-files-exist] All 3 agent files found
✓ [skill-files-exist] All 2 skill canonical files found
✓ [rule-files-exist] All 4 rule files found
✓ [hook-targets-valid] All 2 hook targets valid
✓ [agent-ids-unique] All 3 agent IDs are unique
⚠ [no-orphaned-checkpoints] Orphaned checkpoint: taskSlug="auth-refactor" → file missing
✓ [no-stale-checkpoints] No stale checkpoints found

─── Summary ──────────────────────────────────────────
  Passed:   6
  Warnings: 1
  Failed:   0

Passed with warnings. Registry is functional but has gaps.
```

### CI Integration

Add to your GitHub Actions workflow (see `.github/workflows/rna-validate.yml`):

```yaml
- name: Validate RNA Registry
  run: node tools/validate-registry.js --json
```

The `--json` flag outputs machine-readable results and exits with code 1 on failure.
