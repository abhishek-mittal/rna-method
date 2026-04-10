---
title: "Obsidian Vault"
description: "Use Obsidian as a knowledge graph for your RNA agent collective, with [[wikilinks]] for cognitive inter-linkage."
---

The Obsidian Vault feature generates a graph-navigable knowledge base inside `_memory/` for your agent collective. Agents and joining patterns are interlinked with `[[wikilinks]]`, enabling Obsidian's graph view to visualise the relationships between agents, patterns, and project memory.

---

## Enabling Obsidian Vault

### During Installation

When running `init.js` or `install.sh`, you'll be asked:

```
⑤ Obsidian Vault
Enable Obsidian Vault? (agent knowledge graph with [[wikilinks]])
  ▸ yes — generate Obsidian vault in _memory/
    no  — skip for now (can add later with /rna.obsidian)
```

You can also pass the flag directly:

```bash
node tools/init.js --obsidian=true
# or
bash tools/install.sh --obsidian=true
```

### After Installation

Run the `/rna.obsidian` command to generate (or regenerate) the vault at any time:

```bash
node tools/rna-commands.js /rna.obsidian
```

This reads your current `_memory/rna-method/receptors.json` and `.rna/rna-schema.json` to produce up-to-date notes.

---

## What Gets Generated

| Path | Contents |
|------|----------|
| `_memory/.obsidian/` | Obsidian config (app, graph colors, core plugins) |
| `_memory/agents/<id>/profile.md` | Agent profile note with role, capabilities, team links |
| `_memory/rna-method/joins/<id>.md` | Join pattern notes with step-by-step agent links |
| `_memory/rna-method/receptors.md` | Agent registry index table |
| `_memory/rna-method/joining-patterns.md` | Join pattern index |
| `_memory/rna-method/timeline.md` | Timeline overview note |
| `_memory/Welcome.md` | Map of Content (MOC) — vault entry point |

---

## Opening the Vault

1. Open [Obsidian](https://obsidian.md/)
2. **Open folder as vault** → select the `_memory/` directory
3. Press `Ctrl/Cmd+G` to open **Graph View**

The graph is color-coded:
- **Blue** — Agents
- **Orange** — RNA Method files
- **Green** — Context and memory
- **Yellow** — Documentation

---

## Wikilinks in Agent Templates

When Obsidian is enabled, the Pluribus agent protocol (`_base-agent.md`) uses `[[wikilinks]]` for cross-referencing:

```markdown
Read [[agent-context|_memory/rna-method/agent-context.json]] → find matching joinId
Read [[timeline|_memory/rna-method/timeline.json]] → note activePhase
```

Join pattern templates also link agents:

```markdown
**Agents:** [[architect/profile|architect]] → [[developer/profile|developer]] → [[reviewer/profile|reviewer]]
```

This increases cognitive navigability — every reference is a clickable link in Obsidian's editor.

---

## Schema Configuration

The `obsidian` section in `rna-schema.json`:

```json
{
  "obsidian": {
    "enabled": true,
    "vaultRoot": "_memory/",
    "wikilinks": true
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `false` | Whether Obsidian vault is active |
| `vaultRoot` | string | `_memory/` | Vault root relative to project |
| `wikilinks` | boolean | `true` | Use `[[wikilinks]]` in generated templates |

---

## Regenerating

To regenerate after adding new agents or join patterns:

```bash
node tools/rna-commands.js /rna.obsidian
```

This will:
1. Recreate `.obsidian/` config
2. Generate new agent profile notes
3. Update join pattern notes
4. Refresh the Welcome.md index
5. Inject `[[wikilinks]]` into existing markdown files

Existing hand-edited notes are preserved — only generated files are overwritten.
