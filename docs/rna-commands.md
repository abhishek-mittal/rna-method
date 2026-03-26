# `/rna.*` Command System

In-session directives for the RNA Method agent collective. Type any `/rna.*` command anywhere in your agent chat — the active agent recognizes the pattern and executes the correct protocol.

---

## Introduction

`/rna.*` commands are **instruction-file-taught directives** — not CLI commands, not GUI slash commands wired to a plugin API, but natural-language-embedded patterns that agents learn from their instruction files.

When you paste `/rna.setup` into your Cursor / Copilot / Claude Code chat, the active agent does not intercept it at the OS or application level. The agent's instruction file (`_base-agent.md`, `CLAUDE.md`, or `AGENTS.md`) contains explicit recognition rules: *"When the user types `/rna.<command>`, follow the protocol below exactly."* The agent reads those rules on every invocation and applies them when it sees the pattern in the conversation.

**Why this design?**

[fact] Most AI editors do not expose a plugin API for registering custom slash commands at the application level. Cursor `.cursor/commands/` exist but are platform-specific and have limited action scope. The `/rna.*` namespace uses a pattern that works identically across Cursor, Copilot, Claude Code, Codex, and Kimi because the recognition logic lives in a Markdown instruction file — not in platform code.

[inference] This also means that as AI models improve instruction-following precision, these commands become more reliable automatically — no adapter updates required.

---

## How Agents Learn These Commands

Every agent that inherits `_base-agent` receives the `/rna.*` command protocols as part of its foundation layer.

The `_base-agent.md` file (or its platform equivalent: `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) contains an `## /rna.* Commands` section. That section defines:

1. The pattern to match: any user message starting with `/rna.`
2. The exact steps to execute for each command subtype
3. What files to read, what files to write, what to print

Agents that **do not** inherit `_base-agent` (e.g., external agents, fresh installations, projects on a different AI platform) can still get this capability by pasting the instruction block from [The Agent Instruction Block](#the-agent-instruction-block) directly into their instruction file.

---

## Command Reference

| Command | Description |
|---|---|
| `/rna.setup` | Full interactive setup: reads project, asks 5 questions, writes all RNA files |
| `/rna.update` | Re-run setup preserving existing customizations — updates only changed fields |
| `/rna.resync` | Re-read project source (package.json, git log) and update `timeline.json` + regenerate platform files |
| `/rna.signal <message>` | Append a signal entry to `agent-context.json` `signalQueue[]` |
| `/rna.status` | Print team status table from `agent-context.json` + all `activity.json` files |
| `/rna.compact` | Compact current session context to `_memory/context/<date>_session-summary.md` |
| `/rna.gui` | Print instructions to start RNA Studio and the studio URL |
| `/rna.version` | Print installed RNA Method version and schema version |
| `/rna.loop <goal>` | Start an autonomous iteration loop with goal, metric, and guard (v1.2.0) |
| `/rna.recall <query>` | Search memory index and observations for matching entries (v1.2.0) |
| `/rna.toon` | Toggle output format between verbose and TOON compressed mode (v1.2.0) |
| `/rna.compress` | Compress raw observations into structured memory entries (v1.2.0) |
| `/rna.search <query>` | Search knowledge bases and memory files by keyword (v1.2.0) |
| `/rna.upgrade` | Upgrade agents to latest RNA release, preserving project customizations (v1.2.0) |
| `/rna.help` | Print this table |

---

## Command Specifications

### `/rna.setup`

**Purpose:** Full interactive setup from scratch. Use once per project, or when RNA Method was never initialized.

**Steps:**

1. **Read project context**
   - Read `package.json` (name, dependencies, scripts)
   - Check for `.cursor/rules/`, `.github/instructions/`, `CLAUDE.md`, `AGENTS.md`
   - Check for existing `_memory/rna-method/receptors.json` and `timeline.json`
   - Read `_memory/rna-method/agent-context.json` if present

2. **Ask 5 targeted questions** — present all at once, do not ask one at a time
   - Q1: What domain is this project in? (e.g., web app, data pipeline, CLI tool, design system)
   - Q2: How many people + AI agents will work on it? List names or roles if known.
   - Q3: Which AI platform is your primary driver? (Cursor / Copilot / Claude Code / Codex / Kimi)
   - Q4: What is your most frequent pain point with AI assistants right now?
   - Q5: What is the project phase? (greenfield / active / maintenance / refactor)

3. **Write `_memory/rna-method/receptors.json`**
   - Define agent entries tuned to project domain and team structure (answers from Q1–Q2)
   - Always include `_base-agent` as `isSignalHub: true`

4. **Write `_memory/rna-method/timeline.json`**
   - Set `meta.project`, `meta.currentPhase` (from Q5), `meta.projectDescription`
   - Populate `teamProfiles[]` from Q2 answers

5. **Run the platform adapter**
   - Based on Q3, run the matching adapter: `adapters/copilot/`, `adapters/cursor/`, etc.
   - Adapter regenerates platform-specific instruction files from `receptors.json`

6. **Discover MCP servers and tools**
   - Scan platform MCP config files (`.vscode/mcp.json`, `.cursor/mcp.json`, `.mcp.json`)
   - Match discovered servers against the known registry (`tools/discover-tools.js`)
   - Assign MCP tools to agents based on role relevance (e.g., Figma → designer, Tavily → researcher)
   - Write `mcpTools[]` per agent into `rna-schema.json`
   - Write `.rna/tools-manifest.json` with full discovery results
   - Add `discoveredMcpServers[]` to `.rna/config.json`

7. **Write `.rna/config.json`**
   ```json
   {
     "projectName": "<name from package.json>",
     "adapter": "<Q3 platform>",
     "adapters": ["<Q3 platform>"],
     "discoveredMcpServers": ["<server-key>", "..."],
     "studioPort": 7337,
     "rnaVersion": "1.0.0",
     "installedAt": "<ISO 8601 timestamp>"
   }
   ```

8. **Print setup summary**
   ```
   ✓ RNA Method setup complete
   Platform:       <platform>
   Agents created: <n> (<list of agent ids>)
   Files written:  receptors.json, timeline.json, .rna/config.json
   Adapter output: <path(s)>
   Next:           type /rna.gui to start the visual studio
   ```

**Reads:** `package.json`, existing agent/instruction files, platform MCP config (`.vscode/mcp.json`, etc.)  
**Writes:** `_memory/rna-method/receptors.json`, `_memory/rna-method/timeline.json`, `.rna/config.json`, `.rna/tools-manifest.json`, platform adapter output  
**Prints:** setup summary

---

### `/rna.update`

**Purpose:** Re-run setup preserving existing customizations. Use after adding new dependencies, teammates, or agents.

**Steps:**

1. Read existing `receptors.json`, `timeline.json`, `.rna/config.json`
2. Read current `package.json` and project structure for changes since last setup
3. Ask only about **changed or new** fields — do not re-ask questions the user already answered
4. Merge answers into existing files (update mode — do not overwrite fields that were not mentioned)
5. Re-run the platform adapter to regenerate platform files from updated `receptors.json`
6. Print a diff summary: which fields changed, which were preserved

**Reads:** all RNA files + updated project files  
**Writes:** same files as `/rna.setup` — merge/update mode only  
**Prints:** diff summary of changed fields

---

### `/rna.resync`

**Purpose:** Fast context refresh. Re-read project source and update `timeline.json` without touching any agent definitions.

**Steps:**

1. Read `package.json` and top-level directory structure
2. Run `git log --oneline -20` — skip silently if git is unavailable
3. Update `timeline.json` `meta.lastUpdated` and `projectState` fields with current observations
4. Do **not** modify `receptors.json` or any agent definitions
5. Re-run the platform adapter to regenerate platform files from current `receptors.json`
6. Print: `✓ Resync complete — timeline.json updated, platform files regenerated`

**Target:** agent should complete all steps in under 10 seconds of work (one response).  
**Reads:** `package.json`, `git log`, `_memory/rna-method/timeline.json`  
**Writes:** `_memory/rna-method/timeline.json` (`projectState` fields only), platform adapter output  
**Prints:** one-line confirmation

---

### `/rna.signal <message>`

**Purpose:** Append a signal breadcrumb so agents can communicate asynchronously across chat windows.

**Steps:**

1. Read `_memory/rna-method/agent-context.json`
2. Locate or create the `signalQueue[]` array
3. Append a new entry:
   ```json
   {
     "from": "<current agent id — use 'user' if unknown>",
     "message": "<the <message> argument verbatim>",
     "ts": "<ISO 8601 timestamp>"
   }
   ```
4. Write the updated `agent-context.json`
5. Print: `✓ Signal written — from: <agentId> | "<message>"`

**Reads:** `_memory/rna-method/agent-context.json`  
**Writes:** `_memory/rna-method/agent-context.json` (appends to `signalQueue[]`)  
**Prints:** confirmation line

---

### `/rna.status`

**Purpose:** Print a live snapshot of team activity without opening any files manually.

**Steps:**

1. Read `_memory/rna-method/agent-context.json` → extract `activeJoins[]`
2. Glob `_memory/agents/*/activity.json` — read each file
   - Fields used: `agentId`, `status`, `currentTask`, `updatedAt`
3. Print status table:

   ```
   Agent             Status      Current Task                            Updated
   ─────────────────────────────────────────────────────────────────────────────
   <agentId>         <status>    <currentTask>                           <updatedAt>
   ```

4. Below the table, print active joins:
   ```
   Active Joins: <joinId> (<pattern>) — <status>
   ```
   If no active joins: `Active Joins: none`

**Reads:** `_memory/rna-method/agent-context.json`, `_memory/agents/*/activity.json`  
**Writes:** nothing  
**Prints:** status table + active joins

---

### `/rna.compact`

**Purpose:** Compress current session context into a durable summary before closing the chat window.

See [context-compaction.md](context-compaction.md) for the full specification of this command, including session summary format and best practices.

**Steps:**

1. Read `_memory/rna-method/timeline.json` for project context anchor
2. Collect current session context: what was discussed, decisions made, files changed, open questions
3. Write `_memory/context/<YYYY-MM-DD>_session-summary.md` — max 500 words
4. Update `timeline.json` → set `lastSession` field (see below)
5. Print the full summary to the chat so the user can verify before closing the window

**`lastSession` field format:**
```json
"lastSession": {
  "date": "YYYY-MM-DD",
  "summaryFile": "_memory/context/YYYY-MM-DD_session-summary.md",
  "agents": ["<agentId>", "..."],
  "topic": "<one-line session title>",
  "keyDecisions": ["<1-line summary>", "..."],
  "filesChanged": ["path/to/file", "..."]
}
```

**Reads:** `_memory/rna-method/timeline.json`, session context  
**Writes:** `_memory/context/<YYYY-MM-DD>_session-summary.md`, `_memory/rna-method/timeline.json` (`lastSession` only)  
**Prints:** the full session summary

---

### `/rna.gui`

**Purpose:** Get instructions to start RNA Studio without leaving the chat.

**Steps:**

1. Check if `.rna/config.json` exists
2. If it exists, read `studioPort` (default: 7337) and `adapter` fields
3. Print:
   ```
   RNA Studio
   ──────────
   Start: npm run rna:studio
          (or: node .rna/studio/server.js)
   URL:   http://localhost:<studioPort>

   The studio shows your agent collective as a live network graph.
   Open it in your browser after starting the server.
   ```
4. If `.rna/config.json` does not exist, print:
   ```
   .rna/config.json not found — run /rna.setup first.
   ```

**Reads:** `.rna/config.json` (optional)  
**Writes:** nothing  
**Prints:** studio start instructions

---

### `/rna.version`

**Purpose:** Print current RNA Method version for debugging and upgrade planning.

**Steps:**

1. Read `.rna/config.json` → extract `rnaVersion`, `installedAt`
2. Check if `open-source/rna-method/schema/rna-schema.json` exists → read `meta.schemaVersion`
   - If not present, use `"N/A"`
3. Print:
   ```
   RNA Method
   ──────────
   Installed version: <rnaVersion>
   Schema version:    <schemaVersion or N/A>
   Installed at:      <installedAt>
   Config:            .rna/config.json
   ```

**Reads:** `.rna/config.json`, `open-source/rna-method/schema/rna-schema.json` (if available)  
**Writes:** nothing  
**Prints:** version block

---

### `/rna.help`

**Purpose:** Quick reference without leaving the chat.

**Steps:**

Print the following table exactly:

```
/rna.* Commands
─────────────────────────────────────────────────────────────────────────────
/rna.setup             Full interactive setup — reads project, writes all RNA files
/rna.update            Re-run setup preserving existing customizations
/rna.resync            Refresh timeline.json from current project state (fast)
/rna.signal <msg>      Append a signal breadcrumb to agent-context.json
/rna.status            Print team activity table from activity.json files
/rna.compact           Compress session to _memory/context/ summary file
/rna.gui               Print instructions to start RNA Studio
/rna.version           Print installed RNA Method and schema versions
/rna.loop <goal>       Start an autonomous iteration loop
/rna.recall <query>    Search memory index and observations
/rna.toon              Toggle output format (verbose ↔ TOON)
/rna.compress          Compress raw observations into structured entries
/rna.search <query>    Search knowledge bases and memory files
/rna.upgrade           Upgrade to latest RNA release (preserves customizations)
/rna.help              Print this table
─────────────────────────────────────────────────────────────────────────────
Type any command above in your agent chat to execute.
```

**Reads:** nothing  
**Writes:** nothing  
**Prints:** help table

---

### `/rna.loop <goal>` *(v1.2.0)*

**Purpose:** Start an autonomous iteration loop that works toward a measurable goal with guard rails.

**Steps:**

1. Parse the `<goal>` argument — this is the natural language goal statement
2. Create `_memory/loops/<date>_<slug>.json` with structure:
   ```json
   {
     "goal": "<goal>",
     "metric": "(define measurable target)",
     "guard": "(define stop condition)",
     "maxIterations": 5,
     "iterations": [],
     "status": "initialized",
     "createdAt": "<ISO 8601>"
   }
   ```
3. Print the loop workspace location and instruct the agent to edit `metric` and `guard` before iterating
4. When iterating: plan → execute → measure → decide (keep/rollback) → log → repeat until guard met

**Reads:** nothing  
**Writes:** `_memory/loops/<date>_<slug>.json`  
**Prints:** loop workspace confirmation with file path

---

### `/rna.recall <query>` *(v1.2.0)*

**Purpose:** Search memory index and observation logs for entries matching the query keywords.

**Steps:**

1. Read `_memory/observations/index.tsv` — search each line for the query string (case-insensitive)
2. Search `_memory/rna-method/timeline.json` recent commits for matching entries
3. Print matching entries (max 20 from observations, max 10 from timeline)
4. If no matches: print `No matches for "<query>"`

**Reads:** `_memory/observations/index.tsv`, `_memory/rna-method/timeline.json`  
**Writes:** nothing  
**Prints:** matching observation entries and timeline commits

---

### `/rna.toon` *(v1.2.0)*

**Purpose:** Toggle the output format between `verbose` (full prose) and `toon` (compressed abbreviations using the TOON registry).

**Steps:**

1. Read `.rna/config.json` — get current `outputFormat` (default: `verbose`)
2. Toggle: `verbose` → `toon`, `toon` → `verbose`
3. Write updated `.rna/config.json`
4. Print: `✓ Output format toggled: <old> → <new>`

**Reads:** `.rna/config.json`  
**Writes:** `.rna/config.json` (`outputFormat` field)  
**Prints:** toggle confirmation

---

### `/rna.compress` *(v1.2.0)*

**Purpose:** Compress raw observations (TSV) into structured JSON entries and start a fresh observation index.

**Steps:**

1. Read `_memory/observations/index.tsv`
2. Parse each line (tab-separated: timestamp, agent, type, summary)
3. Write structured JSON to `_memory/observations/<date>_compressed.json`
4. Archive the raw TSV to `_memory/observations/<date>_index-archive.tsv`
5. Start a fresh empty `index.tsv`
6. Print entry count, output path, and archive path

**Reads:** `_memory/observations/index.tsv`  
**Writes:** `_memory/observations/<date>_compressed.json`, archive, fresh index  
**Prints:** compression summary

---

### `/rna.search <query>` *(v1.2.0)*

**Purpose:** Full-text search across all memory files — context summaries, agent data, timeline, and observations.

**Steps:**

1. Recursively search these directories for `.json`, `.md`, `.tsv`, `.txt` files:
   - `_memory/context/`
   - `_memory/agents/`
   - `_memory/rna-method/`
   - `_memory/observations/`
2. For each file, check if the content contains the query string (case-insensitive)
3. Extract a snippet (±50 chars around the first match) for context
4. Print results: file path + snippet (max 20 results)

**Reads:** all `_memory/` subdirectories  
**Writes:** nothing  
**Prints:** search results with file paths and snippets

---

### `/rna.upgrade` *(v1.2.0)*

**Purpose:** Upgrade the project's RNA installation to the latest release while preserving all project-level customizations (agent names, personas, rules, skills, memory).

**Alias:** `/rna.resynk`

**Steps:**

1. **Snapshot** — Save current config, receptors, timeline, and agent-context to `_memory/upgrade-snapshots/<id>/`
2. **Version delta** — Show current vs latest RNA version
3. **Update config** — Write new `rnaVersion`, `lastUpgrade`, and `upgradeSnapshotId` to `.rna/config.json`
4. **Adapter re-run** — Instruct the user to run `node tools/init.js` (update mode) to regenerate platform files with new features while preserving agent customizations
5. **Log** — Append upgrade entry to `_memory/rna-method/upgrade-log.json`

**Reads:** `.rna/config.json`, `schema/rna-schema.json`, `_memory/rna-method/receptors.json`, `_memory/rna-method/timeline.json`, `_memory/rna-method/agent-context.json`  
**Writes:** `_memory/upgrade-snapshots/<id>/` (snapshot), `.rna/config.json` (version bump), `_memory/rna-method/upgrade-log.json`  
**Prints:** step-by-step upgrade progress

---

## The Agent Instruction Block

Paste this block into `_base-agent.md`, `CLAUDE.md`, `AGENTS.md`, or any platform instruction file to teach the agent all `/rna.*` commands. The block is **self-contained and platform-agnostic** — no tooling or plugin required.

---

```markdown
## /rna.* Commands

When the user types any message starting with `/rna.`, execute the corresponding
protocol below exactly. Do not ask for confirmation before starting — begin immediately.

---

### /rna.setup

1. Read `package.json`, any existing `.cursor/rules/`, `.github/instructions/`,
   `CLAUDE.md`, `AGENTS.md`, `_memory/rna-method/receptors.json`, `_memory/rna-method/timeline.json`
2. Ask the following 5 questions **all at once** (not one at a time):
   - Q1: What domain is this project in? (e.g., web app, data pipeline, CLI tool)
   - Q2: Who works on it? Names or roles (human + AI agents)
   - Q3: Which AI platform is your primary driver? (Cursor / Copilot / Claude Code / Codex / Kimi)
   - Q4: What is your biggest current pain point with AI assistants?
   - Q5: What is the project phase? (greenfield / active / maintenance / refactor)
3. Write `_memory/rna-method/receptors.json` with agent definitions tuned to the project
   (always include `_base-agent` as `isSignalHub: true`)
4. Write `_memory/rna-method/timeline.json` with `meta.project`, `meta.currentPhase`,
   `meta.projectDescription`, `teamProfiles[]`
5. Run the platform adapter matching Q3 to regenerate platform-specific instruction files
6. Write `.rna/config.json`:
   ```json
   {
     "projectName": "<name from package.json>",
     "adapter": "<Q3 platform>",
     "adapters": ["<Q3 platform>"],
     "studioPort": 7337,
     "rnaVersion": "1.0.0",
     "installedAt": "<ISO 8601 timestamp>"
   }
7. Print:
   ✓ RNA Method setup complete
   Platform:       <platform>
   Agents created: <n> (<ids>)
   Files written:  receptors.json, timeline.json, .rna/config.json
   Next:           type /rna.gui to start the visual studio

---

### /rna.update

1. Read existing `receptors.json`, `timeline.json`, `.rna/config.json`
2. Read current `package.json` and project tree for what changed since last setup
3. Ask only about new or changed fields — skip anything already configured
4. Merge answers into existing files (update mode — do not overwrite unchanged fields)
5. Re-run the platform adapter to regenerate platform files from updated `receptors.json`
6. Print a diff summary: which fields changed, which were preserved

---

### /rna.resync

1. Read `package.json` and top-level directory structure
2. Run `git log --oneline -20` (skip silently if git unavailable)
3. Update `_memory/rna-method/timeline.json` `meta.lastUpdated` and `projectState` fields —
   do NOT touch `receptors.json` or any agent definitions
4. Re-run the platform adapter to regenerate platform files from current `receptors.json`
5. Print: `✓ Resync complete — timeline.json updated, platform files regenerated`

Complete in one response.

---

### /rna.signal <message>

1. Read `_memory/rna-method/agent-context.json`
2. Locate or create `signalQueue[]` array
3. Append:
   { "from": "<your agent id, or 'user' if unknown>", "message": "<message>", "ts": "<ISO 8601>" }
4. Write the updated file
5. Print: `✓ Signal written — from: <agentId> | "<message>"`

---

### /rna.status

1. Read `_memory/rna-method/agent-context.json` → extract `activeJoins[]`
2. Read each `_memory/agents/*/activity.json` file
3. Print a Markdown table: Agent | Status | Current Task | Updated
4. Below the table, print: `Active Joins: <list>` or `Active Joins: none`

---

### /rna.compact

1. Read `_memory/rna-method/timeline.json`
2. Summarize the current session: what was worked on, key decisions, files changed, open questions
3. Write `_memory/context/<YYYY-MM-DD>_session-summary.md` — max 500 words:
   ---
   date: YYYY-MM-DD
   agents: [list of agents active this session]
   topic: <one-line session title>
   ---
   ## What Happened
   ## Key Decisions
   ## Files Changed
   ## Open Questions
4. Update `timeline.json` `lastSession`:
   {
     "date": "YYYY-MM-DD",
     "summaryFile": "_memory/context/YYYY-MM-DD_session-summary.md",
     "agents": ["..."],
     "topic": "...",
     "keyDecisions": ["..."],
     "filesChanged": ["..."]
   }
5. Print the full summary to the chat so the user can verify before closing the window

---

### /rna.gui

1. Read `.rna/config.json` if it exists → get `studioPort` (default: 7337)
2. If config exists, print:
   RNA Studio
   ──────────
   Start: npm run rna:studio
   URL:   http://localhost:<studioPort>
3. If config missing, print: `.rna/config.json not found — run /rna.setup first.`

---

### /rna.version

1. Read `.rna/config.json` → `rnaVersion`, `installedAt`
2. Read `open-source/rna-method/schema/rna-schema.json` → `meta.schemaVersion` (or "N/A")
3. Print:
   RNA Method
   ──────────
   Installed version: <rnaVersion>
   Schema version:    <schemaVersion or N/A>
   Installed at:      <installedAt>

---

### /rna.help

Print:
/rna.* Commands
─────────────────────────────────────────────────────────────────────────────
/rna.setup             Full interactive setup — reads project, writes all RNA files
/rna.update            Re-run setup preserving existing customizations
/rna.resync            Refresh timeline.json from current project state (fast)
/rna.signal <msg>      Append a signal breadcrumb to agent-context.json
/rna.status            Print team activity table from activity.json files
/rna.compact           Compress session to _memory/context/ summary file
/rna.gui               Print instructions to start RNA Studio
/rna.version           Print installed RNA Method and schema versions
/rna.loop <goal>       Start an autonomous iteration loop
/rna.recall <query>    Search memory index and observations
/rna.toon              Toggle output format (verbose ↔ TOON)
/rna.compress          Compress raw observations into structured entries
/rna.search <query>    Search knowledge bases and memory files
/rna.upgrade           Upgrade to latest RNA release (preserves customizations)
/rna.help              Print this table
─────────────────────────────────────────────────────────────────────────────

---

### /rna.loop <goal>

1. Parse the `<goal>` argument
2. Create `_memory/loops/<date>_<slug>.json` with: goal, metric (placeholder), guard (placeholder), maxIterations: 5
3. Print the loop workspace location
4. When iterating: plan → execute → measure → decide (keep/rollback) → log

---

### /rna.recall <query>

1. Read `_memory/observations/index.tsv` and search for matching lines (case-insensitive)
2. Search `timeline.json` recent commits for matches
3. Print matching entries (max 20 observations, max 10 timeline)

---

### /rna.toon

1. Read `.rna/config.json` → get `outputFormat` (default: `verbose`)
2. Toggle: `verbose` → `toon`, `toon` → `verbose`
3. Write updated config
4. Print: `✓ Output format toggled: <old> → <new>`

---

### /rna.compress

1. Read `_memory/observations/index.tsv`
2. Parse TSV lines into structured entries
3. Write `_memory/observations/<date>_compressed.json`
4. Archive raw TSV, start fresh index

---

### /rna.search <query>

1. Recursively search `_memory/context/`, `_memory/agents/`, `_memory/rna-method/`, `_memory/observations/`
2. Match `.json`, `.md`, `.tsv`, `.txt` files containing the query (case-insensitive)
3. Print file path + snippet for each match (max 20)

---

### /rna.upgrade

Also available as `/rna.resynk`.

1. Snapshot current config, receptors, timeline, agent-context to `_memory/upgrade-snapshots/<id>/`
2. Show version delta (current vs latest)
3. Update `.rna/config.json` with new rnaVersion
4. Instruct user to re-run `node tools/init.js` to regenerate platform files with new features
5. Log upgrade to `_memory/rna-method/upgrade-log.json`
```

---

*For the full `/rna.compact` specification — session summary format, context window strategy, and best practices — see [context-compaction.md](context-compaction.md).*
