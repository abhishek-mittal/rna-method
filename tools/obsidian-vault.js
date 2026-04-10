#!/usr/bin/env node

/**
 * RNA Method — Obsidian Vault Generator
 *
 * Scaffolds an Obsidian vault inside _memory/ for graph-based agent
 * inter-linkage. Generates .obsidian/ config, agent profile notes with
 * [[wikilinks]], join pattern notes, and a Welcome.md Map of Content.
 *
 * Usage:
 *   node tools/obsidian-vault.js                       (uses cwd)
 *   node tools/obsidian-vault.js /path/to/project      (explicit root)
 *   node tools/obsidian-vault.js --dry-run              (preview only)
 *
 * Called automatically by init.js / install.sh when the user opts in.
 * Can also be called standalone to add Obsidian to an existing RNA install.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CLI ─────────────────────────────────────────────────────────────────────

const argv    = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const ROOT    = path.resolve(argv.find(a => !a.startsWith('-')) || process.cwd());
const MEMORY  = path.join(ROOT, '_memory');

// ─── Colours ─────────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const c = (k, t) => `${C[k]}${t}${C.reset}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  if (DRY_RUN) {
    const lines = content.split('\n').length;
    console.log(c('gray', `  [dry-run] write ${path.relative(ROOT, filePath)} (${lines} lines)`));
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function fileExists(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
function dirExists(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}

// ─── Obsidian Config ─────────────────────────────────────────────────────────

function writeObsidianConfig() {
  const obsDir = path.join(MEMORY, '.obsidian');
  ensureDir(obsDir);

  writeFile(path.join(obsDir, 'app.json'), JSON.stringify({
    useMarkdownLinks: false,
    showFrontmatter: true,
    defaultViewMode: 'source',
    livePreview: true,
    attachmentFolderPath: 'assets',
  }, null, 2) + '\n');

  writeFile(path.join(obsDir, 'graph.json'), JSON.stringify({
    collapse_filter: false,
    search: '',
    showTags: true,
    showAttachments: false,
    hideUnresolved: false,
    showOrphans: true,
    collapse_color: false,
    colorGroups: [
      { query: 'path:agents',     color: { a: 1, rgb: 3447003 } },  // blue
      { query: 'path:rna-method', color: { a: 1, rgb: 16744448 } }, // orange
      { query: 'path:context',    color: { a: 1, rgb: 3329330 } },  // green
      { query: 'path:docs',       color: { a: 1, rgb: 16776960 } }, // yellow
    ],
    collapse_display: false,
    lineSizeMultiplier: 1,
    nodeSizeMultiplier: 1,
    collapse_forces: false,
    centerStrength: 0.5,
    repelStrength: 10,
    linkStrength: 1,
    linkDistance: 250,
    scale: 1,
    close: false,
  }, null, 2) + '\n');

  writeFile(path.join(obsDir, 'workspace.json'), JSON.stringify({
    main: {
      type: 'split',
      children: [{
        type: 'leaf',
        state: { type: 'graph', state: {} },
      }],
    },
  }, null, 2) + '\n');

  writeFile(path.join(obsDir, 'core-plugins.json'), JSON.stringify([
    'file-explorer', 'global-search', 'graph', 'backlink',
    'outgoing-link', 'tag-pane', 'page-preview', 'starred',
    'command-palette', 'switcher',
  ], null, 2) + '\n');
}

// ─── Agent Profile Notes ─────────────────────────────────────────────────────

function buildAgentProfile(agent) {
  const id = agent.id || agent.name;
  const name = agent.name || id;
  const role = agent.role || '';
  const model = agent.modelTier || agent.model || 'balanced';
  const command = agent.command || `/${id}`;
  const cats = (agent.matchCategories || []).join(', ');
  const caps = (agent.capabilities || agent.matchKeywords || []).join(', ');

  let md = `---
type: agent
id: ${id}
tags: [agent, ${model}]
---

# ${name}

**Role:** ${role}
**Model:** ${model}
**Command:** \`${command}\`
**Signal Categories:** ${cats || '—'}
**Capabilities:** ${caps || '—'}

## Relationships

`;

  return { id, content: md };
}

function generateAgentProfiles(receptors) {
  const agents = receptors.agents || [];
  const profiles = [];

  for (const agent of agents) {
    const { id, content } = buildAgentProfile(agent);
    let md = content;

    // Add links to other agents
    const otherAgents = agents.filter(a => (a.id || a.name) !== id);
    if (otherAgents.length > 0) {
      md += '### Team\n';
      for (const other of otherAgents) {
        const otherId = other.id || other.name;
        md += `- [[${otherId}/profile|${other.name || otherId}]] — ${other.role || ''}\n`;
      }
      md += '\n';
    }

    profiles.push({ id, md });
  }

  return profiles;
}

// ─── Join Pattern Notes ──────────────────────────────────────────────────────

function generateJoinPatterns(schema) {
  const patterns = schema.joiningPatterns || [];
  const notes = [];

  for (const jp of patterns) {
    const id = jp.id || jp.name;
    const steps = jp.steps || [];
    let md = `---
type: joining-pattern
id: ${id}
tags: [joining-pattern]
---

# ${jp.name || id}

${jp.description || ''}

## Steps

`;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const agentLink = s.agent ? `[[${s.agent}/profile|@${s.agent}]]` : '—';
      md += `${i + 1}. ${agentLink} — ${s.action || s.description || s.task || ''}\n`;
    }

    md += '\n## Instances\n\n_Add links to join instances here._\n';
    notes.push({ id, md });
  }

  return notes;
}

// ─── RNA Overview Notes ──────────────────────────────────────────────────────

function generateRNAOverview(receptors, schema) {
  const notes = [];
  const agents = receptors.agents || [];

  // Receptors index
  let receptorsMd = `---
type: rna-index
id: receptors
tags: [rna-index, agents]
---

# Receptors — Agent Registry

| Agent | Role | Model | Command |
|-------|------|-------|---------|
`;
  for (const a of agents) {
    const id = a.id || a.name;
    receptorsMd += `| [[${id}/profile\\|${a.name || id}]] | ${a.role || ''} | ${a.modelTier || a.model || ''} | \`${a.command || ''}\` |\n`;
  }
  receptorsMd += '\n## See Also\n\n- [[joining-patterns]]\n- [[timeline]]\n';
  notes.push({ name: 'receptors', md: receptorsMd });

  // Joining patterns index
  const patterns = schema.joiningPatterns || [];
  let jpMd = `---
type: rna-index
id: joining-patterns
tags: [rna-index, joining-pattern]
---

# Joining Patterns

`;
  for (const jp of patterns) {
    const id = jp.id || jp.name;
    jpMd += `- [[${id}]] — ${jp.description || jp.name || ''}\n`;
  }
  jpMd += '\n## See Also\n\n- [[receptors]]\n';
  notes.push({ name: 'joining-patterns', md: jpMd });

  // Timeline
  let tlMd = `---
type: rna-index
id: timeline
tags: [rna-index, timeline]
---

# Timeline — Project State

_This file is auto-generated. See \`_memory/rna-method/timeline.json\` for live data._

## Links

- [[receptors]]
- [[joining-patterns]]
`;
  notes.push({ name: 'timeline', md: tlMd });

  return notes;
}

// ─── Welcome.md (Map of Content) ────────────────────────────────────────────

function generateWelcome(receptors, schema) {
  const agents = receptors.agents || [];
  const patterns = schema.joiningPatterns || [];

  let md = `---
type: moc
title: RNA Agent Collective
---

# 🧠 RNA Agent Collective — Knowledge Graph

Open the **Graph View** (Ctrl/Cmd+G) to explore connections between agents,
joining patterns, and project memory.

---

## Agents

| Agent | Role |
|-------|------|
`;
  for (const a of agents) {
    const id = a.id || a.name;
    md += `| [[${id}/profile\\|${a.name || id}]] | ${a.role || ''} |\n`;
  }

  md += `
---

## Joining Patterns

`;
  for (const jp of patterns) {
    const id = jp.id || jp.name;
    md += `- [[${id}]] — ${jp.description || jp.name || ''}\n`;
  }

  md += `
---

## RNA Overview

- [[receptors]] — Agent registry
- [[joining-patterns]] — Multi-agent sequences
- [[timeline]] — Project state

---

## How to Navigate

1. **Graph View** — See agent clusters and join connections
2. **Backlinks** — Every note shows what links to it
3. **Tags** — Filter by \`#agent\`, \`#joining-pattern\`, \`#rna-index\`
4. **Search** — Ctrl/Cmd+Shift+F to find any topic
`;

  return md;
}

// ─── Wikilink Injector ───────────────────────────────────────────────────────
// Scans existing markdown files in _memory/ and adds [[wikilinks]] for known
// agent names and pattern references.

function injectWikilinks(agentIds) {
  if (!dirExists(MEMORY)) return;

  const mdFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.obsidian') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md') && entry.name !== 'Welcome.md') {
        // Skip profile files we just generated
        if (entry.name === 'profile.md') continue;
        mdFiles.push(full);
      }
    }
  }
  walk(MEMORY);

  // Build replacement patterns: @agentName or plain agentName references
  // Only replace in inline text, not in frontmatter or code blocks
  for (const file of mdFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    for (const id of agentIds) {
      // Match @agentId that's not already inside [[ ]]
      const atPattern = new RegExp(`(?<!\\[\\[)@${id}(?!\\|)(?![^\\[]*\\]\\])`, 'g');
      const replaced = content.replace(atPattern, `[[${id}/profile|@${id}]]`);
      if (replaced !== content) {
        content = replaced;
        changed = true;
      }
    }

    if (changed) {
      if (DRY_RUN) {
        console.log(c('gray', `  [dry-run] wikilink ${path.relative(ROOT, file)}`));
      } else {
        fs.writeFileSync(file, content, 'utf-8');
      }
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('');
  console.log(c('bold', '  ─ Obsidian Vault Generator ──────────────────────'));

  // Locate data sources
  const receptorsPath = path.join(MEMORY, 'rna-method', 'receptors.json');
  const schemaPath    = path.join(ROOT, '.rna', 'rna-schema.json');
  const altSchemaPath = path.join(ROOT, 'rna-schema.json');

  const receptors = readJSON(receptorsPath) || { agents: [] };
  const schema    = readJSON(schemaPath) || readJSON(altSchemaPath) || { joiningPatterns: [] };

  if (receptors.agents.length === 0) {
    console.log(c('gray', '  ⚠ No receptors.json found — generating minimal vault config only.'));
  }

  // 1. Obsidian config
  writeObsidianConfig();
  console.log(`  ${c('green', '✓')} .obsidian/ config (app, graph, workspace, core-plugins)`);

  // 2. Agent profiles
  const profiles = generateAgentProfiles(receptors);
  for (const { id, md } of profiles) {
    const dir = path.join(MEMORY, 'agents', id);
    writeFile(path.join(dir, 'profile.md'), md);
  }
  console.log(`  ${c('green', '✓')} ${profiles.length} agent profile notes`);

  // 3. Join pattern notes
  const joinNotes = generateJoinPatterns(schema);
  for (const { id, md } of joinNotes) {
    writeFile(path.join(MEMORY, 'rna-method', 'joins', `${id}.md`), md);
  }
  console.log(`  ${c('green', '✓')} ${joinNotes.length} joining pattern notes`);

  // 4. RNA overview notes
  const overviewNotes = generateRNAOverview(receptors, schema);
  for (const { name, md } of overviewNotes) {
    writeFile(path.join(MEMORY, 'rna-method', `${name}.md`), md);
  }
  console.log(`  ${c('green', '✓')} ${overviewNotes.length} RNA overview notes`);

  // 5. Welcome.md
  writeFile(path.join(MEMORY, 'Welcome.md'), generateWelcome(receptors, schema));
  console.log(`  ${c('green', '✓')} Welcome.md (Map of Content)`);

  // 6. Inject wikilinks into existing MD files
  const agentIds = (receptors.agents || []).map(a => a.id || a.name);
  injectWikilinks(agentIds);
  console.log(`  ${c('green', '✓')} Wikilinks injected into existing markdown files`);

  console.log('');
  console.log(c('green', c('bold', '  ✓ Obsidian vault ready!')));
  console.log(`    Open ${c('cyan', '_memory/')} as a vault in Obsidian to see the agent graph.`);
  console.log('');
}

main();
