# `.rna/` Folder Architecture

**Status:** Planned — Phase 1 foundation files created, full migration in Phase 2  
**Date:** 2026-03-20

---

## Problem Statement

Currently the RNA Method has three separate homes that users must know about:

| Location | Contents | Problem |
|---|---|---|
| `open-source/rna-method/studio/` | Vite SPA + server.js | Only accessible after cloning the open-source repo |
| `open-source/rna-method/adapters/` | Platform adapters | Same — not co-located with installed project |
| `_memory/rna-method/` | Runtime state (receptors.json, etc.) | Correct — already project-local |

The result: after running `init.js` there is no single "installed" location the user can point to for the live studio.

---

## Solution: `.rna/` — The Local Install Directory

After `tools/init.js` runs, the project gets a `.rna/` directory:

```
<project-root>/
  .rna/
    README.md          ← quick-start guide
    config.json        ← adapter selection, port, installed-at
    studio/
      server.js        ← copied/symlinked from open-source/rna-method/studio/
      dist/            ← pre-built SPA (npm run build → copy here)
    adapters/          ← selected adapters (subset of all adapters)
      copilot/
      cursor/          ← if multi-selected during init
```

The `open-source/rna-method/` tree is the **source**; `.rna/` is the **installed artefact**.

---

## Phase Roadmap

### Phase 1 — Foundation ✅ DONE (this session)

- [x] `.rna/config.json` written by `init.js` (Phase 4.5 step)
- [x] `.rna/README.md` created
- [x] `init.js` questionnaire: multi-select additional adapters
- [x] `init.js` runs all selected adapters (not just primary)
- [x] `server.js` reads `.rna/config.json` via `/api/rna-config` endpoint
- [x] Studio GUI shows per-agent live status from `activity.json`

### Phase 2 — Studio Migration (next session)

1. **Add install step to `init.js`** — copy `open-source/rna-method/studio/server.js` → `.rna/studio/server.js`
2. **Copy pre-built dist** — add a post-`npm run build` step: `cp -r dist/ ../../.rna/studio/dist/`
3. **Update `package.json` npm scripts** — `rna:studio` points to `.rna/studio/server.js` instead of `open-source/rna-method/studio/server.js`
4. **Add selected adapters to `.rna/adapters/`** — copy only selected adapters, not all

### Phase 3 — Agent Activity Protocol (next-next session)

Each agent writes `_memory/agents/<id>/activity.json` when it starts/updates/finishes work:

```json
{
  "agentId": "samba",
  "status": "in-progress",
  "currentTask": "Implement animated edges in RNA Studio canvas",
  "currentJoinId": "ff-2026-03-20-rna-studio-animations",
  "updatedAt": "2026-03-20T12:30:00.000Z",
  "signals": [
    { "type": "checkpoint", "message": "edges built, CSS pending", "ts": "2026-03-20T12:25:00.000Z" }
  ]
}
```

The server already serves these via `/api/agent-activity` (live in Phase 1).  
Agents write these manually or via the platform adapter's post-task hook.

---

## `.rna/config.json` Schema (v1)

```json
{
  "projectName": "my-project",
  "adapter": "copilot",
  "adapters": ["copilot", "cursor"],
  "studioPort": 7337,
  "rnaVersion": "1.0.0",
  "installedAt": "2026-03-20T00:00:00.000Z"
}
```

| Field         | Source           | Purpose                                         |
|---------------|------------------|-------------------------------------------------|
| `adapter`     | init.js Phase ①  | Primary active platform                         |
| `adapters`    | init.js Phase ①b | All selected adapters (multi-run during init)   |
| `studioPort`  | env or default   | Overridable via `RNA_STUDIO_PORT`               |
| `rnaVersion`  | schema.meta      | Tracks which RNA version installed this project |
| `installedAt` | `new Date()`     | When was init last run                          |

---

## `npm run rna:studio` — Current vs. Target

| | Current (Phase 1) | Target (Phase 2+) |
|---|---|---|
| Server location | `open-source/rna-method/studio/server.js` | `.rna/studio/server.js` |
| Dist location | `open-source/rna-method/studio/dist/` | `.rna/studio/dist/` |
| Adapters | `open-source/rna-method/adapters/` | `.rna/adapters/` (selected subset) |
| Config | none | `.rna/config.json` (read by studio) |

---

## Suggested Improvements (backlog)

See the improvements list in the session message for full detail. Top candidates for Phase 2:

1. **Activity timeline panel** — vertical feed of all agent signals (like GitHub activity feed)
2. **Join progress bar** — overlay on CDC/FF edges, shows current step/total
3. **"Copy §handoff" button** — click a node, get a pre-filled handoff prompt in clipboard
4. **Agent health watchdog** — flag agents with `activity.json` older than N hours as stale
5. **Studio banner** — reads `.rna/config.json`, shows project name + active adapter in GUI header
6. **`.rna/adapters` isolation** — each adapter only gets the subset of schema it was configured for
7. **Broadcast channel** — signal hub that agents write to for cross-agent state announcements
8. **Dry-run mode in studio** — preview which agents would be activated given a query
