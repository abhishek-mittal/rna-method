#!/usr/bin/env node

/**
 * RNA Method — /rna.* Command Router
 *
 * Reference implementation of the /rna.* command protocols. Run directly:
 *
 *   node tools/rna-commands.js /rna.help
 *   node tools/rna-commands.js /rna.status
 *   node tools/rna-commands.js /rna.version
 *   node tools/rna-commands.js /rna.compact
 *   node tools/rna-commands.js /rna.resync
 *   node tools/rna-commands.js "/rna.signal My task is done"
 *   node tools/rna-commands.js /rna.gui
 *   node tools/rna-commands.js "/rna.loop Reduce bundle size below 200KB"
 *   node tools/rna-commands.js "/rna.recall schema update"
 *   node tools/rna-commands.js /rna.toon
 *   node tools/rna-commands.js /rna.compress
 *   node tools/rna-commands.js "/rna.search design tokens"
 *   node tools/rna-commands.js /rna.upgrade
 *   node tools/rna-commands.js /rna.setup
 *   node tools/rna-commands.js /rna.update
 */

'use strict';

const fs             = require('fs');
const path           = require('path');
const { execSync }   = require('child_process');

// ─── Colors (same pattern as init.js) ────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  red:    '\x1b[31m',
};

const c = (k, t) => `${C[k]}${t}${C.reset}`;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

// ─── File helpers ─────────────────────────────────────────────────────────────

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ─── Command: /rna.help ───────────────────────────────────────────────────────

function cmdHelp() {
  const COL = 28;
  const rows = [
    ['/rna.setup',          'Full interactive setup: reads project, asks questions, writes all RNA files'],
    ['/rna.update',         'Re-run setup preserving existing customizations'],
    ['/rna.resync',         'Re-read project source (package.json, git log) and update timeline.json'],
    ['/rna.signal <msg>',   'Append a signal entry to agent-context.json signalQueue[]'],
    ['/rna.status',         'Print team status table from agent-context.json + activity.json files'],
    ['/rna.compact',        'Compact current session context to _memory/context/<date>_session-summary.md'],
    ['/rna.gui',            'Print instructions to start RNA Studio and the studio URL'],
    ['/rna.version',        'Print installed RNA Method version and schema version'],
    ['/rna.loop <goal>',    'Start an autonomous iteration loop with goal, metric, and guard'],
    ['/rna.recall <query>', 'Search memory index and observations for matching entries'],
    ['/rna.toon',           'Toggle output format between verbose and TOON (compressed)'],
    ['/rna.compress',       'Compress raw observations into structured memory entries'],
    ['/rna.search <query>', 'Search knowledge bases and memory files by keyword'],
    ['/rna.upgrade',        'Upgrade agents to latest RNA release, preserving project customizations'],
    ['/rna.tools',          'Re-discover MCP servers and inject tools into agent files'],
    ['/rna.obsidian',       'Generate or regenerate the Obsidian vault in _memory/ with [[wikilinks]]'],
    ['/rna.help',           'Print this table'],
  ];

  console.log('\n' + c('bold', 'RNA Method — Command Reference') + '\n');
  for (const [cmd, desc] of rows) {
    console.log(`  ${c('cyan', cmd.padEnd(COL))} ${desc}`);
  }
  console.log('');
}

// ─── Command: /rna.version ───────────────────────────────────────────────────

function cmdVersion() {
  const rnaConfig = readJSON(path.join(ROOT, '.rna', 'config.json'));
  const schema    = readJSON(path.join(ROOT, 'schema', 'rna-schema.json'));

  const schemaVersion = schema?.version ?? '(not set)';
  const rnaVersion    = rnaConfig?.rnaVersion ?? rnaConfig?.version ?? schemaVersion;

  console.log('');
  console.log(`  ${c('bold', 'RNA Version')}:    ${c('cyan', rnaVersion)}`);
  console.log(`  ${c('bold', 'Schema Version')}: ${c('cyan', schemaVersion)}`);
  console.log('');
}

// ─── Command: /rna.status ─────────────────────────────────────────────────────

function cmdStatus() {
  const contextPath = path.join(ROOT, '_memory', 'rna-method', 'agent-context.json');
  const context     = readJSON(contextPath);
  const activeJoins = context?.activeJoins ?? [];

  const agentsDir = path.join(ROOT, '_memory', 'agents');
  const activityFiles = [];

  if (fs.existsSync(agentsDir)) {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(agentsDir, entry.name, 'activity.json');
      if (fs.existsSync(candidate)) {
        activityFiles.push(candidate);
      }
    }
  }

  if (activityFiles.length === 0) {
    console.log(c('yellow', '\n  No agent activity files found.\n'));
    return;
  }

  const COL = { agent: 18, status: 12, task: 42 };
  const header =
    'Agent'.padEnd(COL.agent) + ' ' +
    'Status'.padEnd(COL.status) + ' ' +
    'Current Task'.padEnd(COL.task) + ' ' +
    'Updated';

  console.log('');
  console.log(c('bold', '  ' + header));
  console.log('  ' + '─'.repeat(header.length));

  for (const file of activityFiles) {
    const data = readJSON(file);
    if (!data) continue;
    const agent  = String(data.agentId    ?? '—').padEnd(COL.agent);
    const status = String(data.status     ?? '—').padEnd(COL.status);
    const task   = String(data.currentTask ?? '—').slice(0, COL.task - 2).padEnd(COL.task);
    const upd    = String(data.updatedAt  ?? '—');
    console.log(`  ${agent} ${c('green', status)} ${task} ${c('gray', upd)}`);
  }

  console.log('');

  if (activeJoins.length === 0) {
    console.log(c('gray', '  Active Joins: none'));
  } else {
    for (const j of activeJoins) {
      const id      = j.joinId   ?? '?';
      const pattern = j.pattern  ?? '?';
      const status  = j.status   ?? '?';
      console.log(`  Active Joins: ${c('cyan', id)} (${pattern}) — ${status}`);
    }
  }

  console.log('');
}

// ─── Command: /rna.signal <message> ──────────────────────────────────────────

function cmdSignal(args) {
  const message = args.join(' ').trim();

  if (!message) {
    console.log(c('yellow', '\n  Usage: node tools/rna-commands.js "/rna.signal <your message>"\n'));
    return;
  }

  const contextPath = path.join(ROOT, '_memory', 'rna-method', 'agent-context.json');
  const context     = readJSON(contextPath) ?? {};

  if (!Array.isArray(context.signalQueue)) {
    context.signalQueue = [];
  }

  context.signalQueue.push({
    from:    'human',
    message,
    ts:      new Date().toISOString(),
  });

  writeJSON(contextPath, context);

  console.log(c('green', `\n  ✓ Signal written — from: human | "${message}"\n`));
}

// ─── Command: /rna.compact ───────────────────────────────────────────────────

function cmdCompact() {
  const timelinePath = path.join(ROOT, '_memory', 'rna-method', 'timeline.json');
  const timeline     = readJSON(timelinePath) ?? {};

  const date    = new Date().toISOString().slice(0, 10);
  const outDir  = path.join(ROOT, '_memory', 'context');
  const outFile = `${date}_session-summary.md`;
  const outPath = path.join(outDir, outFile);

  const agentsDir = path.join(ROOT, '_memory', 'agents');
  let agentsActive = [];
  if (fs.existsSync(agentsDir)) {
    agentsActive = fs
      .readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }

  const agentsYaml = agentsActive.length
    ? `[${agentsActive.map(a => `"${a}"`).join(', ')}]`
    : '[]';

  const content = [
    '---',
    `session: "${date}"`,
    `date: "${date}"`,
    `agentsActive: ${agentsYaml}`,
    'keyDecisions: []',
    'nextSteps: []',
    '---',
    '',
    `# Session Summary — ${date}`,
    '',
    '## Key Decisions',
    '',
    '- (fill in)',
    '',
    '## Next Steps',
    '',
    '- (fill in)',
    '',
  ].join('\n');

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');

  timeline.lastSession = {
    date,
    summaryFile: path.relative(ROOT, outPath),
  };
  writeJSON(timelinePath, timeline);

  console.log(c('green', `\n  ✓ Session summary written: ${path.relative(ROOT, outPath)}\n`));
}

// ─── Command: /rna.resync ─────────────────────────────────────────────────────

function cmdResync() {
  const timelinePath = path.join(ROOT, '_memory', 'rna-method', 'timeline.json');
  const timeline     = readJSON(timelinePath) ?? {};
  const pkg          = readJSON(path.join(ROOT, 'package.json')) ?? {};
  const now          = new Date().toISOString();

  let recentCommits = [];
  try {
    const raw = execSync('git log --oneline -10', { cwd: ROOT, encoding: 'utf8' });
    recentCommits = raw.trim().split('\n').filter(Boolean);
  } catch {
    // git unavailable — skip silently
  }

  if (!timeline.projectContext) timeline.projectContext = {};
  timeline.projectContext.lastResync    = now;
  timeline.projectContext.projectName   = pkg.name ?? timeline.projectContext.projectName;
  timeline.projectContext.recentCommits = recentCommits;

  writeJSON(timelinePath, timeline);

  console.log(c('green', '\n  ✓ Resync complete'));
  console.log(`  ${c('bold', 'Project')}: ${pkg.name ?? '(unknown)'}`);
  console.log(`  ${c('bold', 'Commits')}: ${recentCommits.length} entries read`);
  console.log(`  ${c('bold', 'Updated')}: projectContext.lastResync, projectContext.recentCommits\n`);
}

// ─── Command: /rna.gui ───────────────────────────────────────────────────────

function cmdGui() {
  const config = readJSON(path.join(ROOT, '.rna', 'config.json'));
  const port   = config?.studioPort ?? 7337;

  console.log('');
  console.log(c('bold', '  RNA Studio'));
  console.log(`  Run: ${c('cyan', 'npm run rna:studio')}`);
  console.log(`  URL: ${c('cyan', `http://localhost:${port}`)}`);
  console.log('');
}

// ─── Command: /rna.loop <goal> ────────────────────────────────────────────────

function cmdLoop(args) {
  const goal = args.join(' ').trim();

  if (!goal) {
    console.log(c('yellow', '\n  Usage: /rna.loop <goal description>\n'));
    console.log('  Example: /rna.loop "Reduce bundle size below 200KB"\n');
    return;
  }

  const loopsDir = path.join(ROOT, '_memory', 'loops');
  const ts       = new Date().toISOString();
  const slug     = goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const loopFile = path.join(loopsDir, `${ts.slice(0, 10)}_${slug}.json`);

  const loopConfig = {
    goal,
    metric:        '(define measurable target)',
    guard:         '(define stop condition)',
    maxIterations: 5,
    iterations:    [],
    status:        'initialized',
    createdAt:     ts,
  };

  writeJSON(loopFile, loopConfig);

  console.log(c('green', '\n  ✓ Loop workspace created'));
  console.log(`  ${c('bold', 'Goal')}:  ${goal}`);
  console.log(`  ${c('bold', 'File')}:  ${path.relative(ROOT, loopFile)}`);
  console.log(`  ${c('bold', 'Max')}:   ${loopConfig.maxIterations} iterations`);
  console.log(`\n  Edit the file to set ${c('cyan', 'metric')} and ${c('cyan', 'guard')} before starting.\n`);
}

// ─── Command: /rna.recall <query> ────────────────────────────────────────────

function cmdRecall(args) {
  const query = args.join(' ').trim().toLowerCase();

  if (!query) {
    console.log(c('yellow', '\n  Usage: /rna.recall <search terms>\n'));
    return;
  }

  const indexPath = path.join(ROOT, '_memory', 'observations', 'index.tsv');
  const results   = [];

  if (fs.existsSync(indexPath)) {
    const lines = fs.readFileSync(indexPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      if (line.toLowerCase().includes(query)) {
        results.push(line);
      }
    }
  }

  // Also search timeline for matching entries
  const timelinePath = path.join(ROOT, '_memory', 'rna-method', 'timeline.json');
  const timeline     = readJSON(timelinePath);
  const timelineHits = [];

  if (timeline?.projectContext?.recentCommits) {
    for (const commit of timeline.projectContext.recentCommits) {
      if (commit.toLowerCase().includes(query)) {
        timelineHits.push(commit);
      }
    }
  }

  console.log('');
  if (results.length === 0 && timelineHits.length === 0) {
    console.log(c('yellow', `  No matches for "${query}"`));
  } else {
    if (results.length > 0) {
      console.log(c('bold', `  Observations (${results.length} matches):`));
      for (const r of results.slice(0, 20)) {
        console.log(`  ${r}`);
      }
    }
    if (timelineHits.length > 0) {
      console.log(c('bold', `  Timeline commits (${timelineHits.length} matches):`));
      for (const h of timelineHits.slice(0, 10)) {
        console.log(`  ${h}`);
      }
    }
  }
  console.log('');
}

// ─── Command: /rna.toon ──────────────────────────────────────────────────────

function cmdToon() {
  const configPath = path.join(ROOT, '.rna', 'config.json');
  const config     = readJSON(configPath) ?? {};

  const current = config.outputFormat ?? 'verbose';
  const next    = current === 'verbose' ? 'toon' : 'verbose';

  config.outputFormat = next;
  writeJSON(configPath, config);

  console.log(c('green', `\n  ✓ Output format toggled: ${c('cyan', current)} → ${c('bold', next)}\n`));

  if (next === 'toon') {
    console.log('  Agents will use compressed TOON abbreviations (see §output-modes).\n');
  } else {
    console.log('  Agents will use full verbose output.\n');
  }
}

// ─── Command: /rna.compress ──────────────────────────────────────────────────

function cmdCompress() {
  const obsDir   = path.join(ROOT, '_memory', 'observations');
  const indexTsv = path.join(obsDir, 'index.tsv');

  if (!fs.existsSync(indexTsv)) {
    console.log(c('yellow', '\n  No observations index found at _memory/observations/index.tsv'));
    console.log('  Run sessions with lifecycle hooks enabled to generate observations.\n');
    return;
  }

  const lines   = fs.readFileSync(indexTsv, 'utf8').split('\n').filter(Boolean);
  const ts      = new Date().toISOString();
  const outFile = path.join(obsDir, `${ts.slice(0, 10)}_compressed.json`);

  const entries = lines.map(line => {
    const parts = line.split('\t');
    return {
      timestamp: parts[0] ?? '',
      agent:     parts[1] ?? '',
      type:      parts[2] ?? '',
      summary:   parts.slice(3).join('\t') ?? '',
    };
  });

  const compressed = {
    compressedAt: ts,
    entryCount:   entries.length,
    entries,
  };

  writeJSON(outFile, compressed);

  // Archive the raw TSV
  const archivePath = path.join(obsDir, `${ts.slice(0, 10)}_index-archive.tsv`);
  fs.renameSync(indexTsv, archivePath);

  // Start fresh index
  fs.writeFileSync(indexTsv, '', 'utf8');

  console.log(c('green', '\n  ✓ Observations compressed'));
  console.log(`  ${c('bold', 'Entries')}:    ${entries.length}`);
  console.log(`  ${c('bold', 'Output')}:     ${path.relative(ROOT, outFile)}`);
  console.log(`  ${c('bold', 'Archived')}:   ${path.relative(ROOT, archivePath)}`);
  console.log(`  ${c('bold', 'New index')}: fresh index.tsv started\n`);
}

// ─── Command: /rna.search <query> ────────────────────────────────────────────

function cmdSearch(args) {
  const query = args.join(' ').trim().toLowerCase();

  if (!query) {
    console.log(c('yellow', '\n  Usage: /rna.search <keywords>\n'));
    return;
  }

  const searchDirs = [
    path.join(ROOT, '_memory', 'context'),
    path.join(ROOT, '_memory', 'agents'),
    path.join(ROOT, '_memory', 'rna-method'),
    path.join(ROOT, '_memory', 'observations'),
  ];

  const hits = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(json|md|tsv|txt)$/i.test(entry.name)) {
          try {
            const content = fs.readFileSync(full, 'utf8');
            const lower   = content.toLowerCase();
            const idx     = lower.indexOf(query);
            if (idx !== -1) {
              // Extract a snippet around the match
              const start   = Math.max(0, idx - 40);
              const end     = Math.min(content.length, idx + query.length + 60);
              const snippet = content.slice(start, end).replace(/\n/g, ' ').trim();
              hits.push({
                file:    path.relative(ROOT, full),
                snippet: snippet.length > 100 ? snippet.slice(0, 100) + '…' : snippet,
              });
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    };
    walk(dir);
  }

  console.log('');
  if (hits.length === 0) {
    console.log(c('yellow', `  No matches for "${query}" in _memory/`));
  } else {
    console.log(c('bold', `  ${hits.length} match(es) for "${query}":\n`));
    for (const h of hits.slice(0, 20)) {
      console.log(`  ${c('cyan', h.file)}`);
      console.log(`    ${c('gray', h.snippet)}`);
    }
    if (hits.length > 20) {
      console.log(c('gray', `\n  … and ${hits.length - 20} more`));
    }
  }
  console.log('');
}

// ─── Command: /rna.obsidian ─────────────────────────────────────────────────

function cmdObsidian() {
  console.log('\n' + c('bold', '  RNA Method — Obsidian Vault Generator') + '\n');

  // Find obsidian-vault.js alongside rna-commands.js
  const vaultScript = path.join(__dirname, 'obsidian-vault.js');
  if (!fs.existsSync(vaultScript)) {
    console.log(c('red', '  ✗ obsidian-vault.js not found.'));
    console.log(c('gray', '    Ensure tools/obsidian-vault.js exists in the rna-method directory.'));
    return;
  }

  try {
    execSync(`node "${vaultScript}" "${ROOT}"`, { stdio: 'inherit' });

    // Update .rna/config.json
    const configPath = path.join(ROOT, '.rna', 'config.json');
    const config = readJSON(configPath);
    if (config) {
      config.obsidian = true;
      writeJSON(configPath, config);
      console.log('  ' + c('green', '✓') + ' .rna/config.json updated (obsidian: true)');
    }
  } catch (e) {
    console.log(c('red', `  ✗ Vault generation failed: ${e.message}`));
  }
}

// ─── Command: /rna.upgrade ───────────────────────────────────────────────────

function cmdUpgrade() {
  console.log('\n' + c('bold', '  RNA Method — Upgrade Protocol') + '\n');

  const configPath = path.join(ROOT, '.rna', 'config.json');
  const config     = readJSON(configPath);

  if (!config) {
    console.log(c('red', '  .rna/config.json not found — run /rna.setup first.\n'));
    return;
  }

  const currentVersion = config.rnaVersion ?? config.version ?? '(unknown)';
  const schemaPath     = path.join(ROOT, 'schema', 'rna-schema.json');
  const schema         = readJSON(schemaPath);
  const latestVersion  = schema?.rnaVersion ?? schema?.version ?? '(unknown)';

  // Step 1: Snapshot current customizations
  const snapshotDir = path.join(ROOT, '_memory', 'upgrade-snapshots');
  const ts          = new Date().toISOString();
  const snapshotId  = ts.slice(0, 10) + '_' + ts.slice(11, 19).replace(/:/g, '');
  const snapshotOut = path.join(snapshotDir, snapshotId);

  fs.mkdirSync(snapshotOut, { recursive: true });

  // Capture config
  writeJSON(path.join(snapshotOut, 'config.json'), config);

  // Capture receptors (agent definitions)
  const receptorsPath = path.join(ROOT, '_memory', 'rna-method', 'receptors.json');
  const receptors     = readJSON(receptorsPath);
  if (receptors) {
    writeJSON(path.join(snapshotOut, 'receptors.json'), receptors);
  }

  // Capture timeline
  const timelinePath = path.join(ROOT, '_memory', 'rna-method', 'timeline.json');
  const timeline     = readJSON(timelinePath);
  if (timeline) {
    writeJSON(path.join(snapshotOut, 'timeline.json'), timeline);
  }

  // Capture agent-context
  const agentCtxPath = path.join(ROOT, '_memory', 'rna-method', 'agent-context.json');
  const agentCtx     = readJSON(agentCtxPath);
  if (agentCtx) {
    writeJSON(path.join(snapshotOut, 'agent-context.json'), agentCtx);
  }

  console.log(c('green', '  ✓ Step 1: Snapshot captured'));
  console.log(`    ${c('bold', 'Location')}: ${path.relative(ROOT, snapshotOut)}`);
  console.log(`    ${c('bold', 'Files')}:    config, receptors, timeline, agent-context\n`);

  // Step 2: Show version delta
  console.log(`  ${c('bold', 'Step 2: Version delta')}`);
  console.log(`    ${c('bold', 'Current')}: ${c('yellow', currentVersion)}`);
  console.log(`    ${c('bold', 'Latest')}:  ${c('cyan', latestVersion)}\n`);

  // Step 3: Update config version
  config.rnaVersion        = latestVersion;
  config.lastUpgrade       = ts;
  config.upgradeSnapshotId = snapshotId;
  writeJSON(configPath, config);

  console.log(c('green', '  ✓ Step 3: Config updated'));
  console.log(`    rnaVersion → ${latestVersion}\n`);

  // Step 4: Instruction for adapter re-run
  const adapter = config.adapter ?? config.adapters?.[0] ?? '(unknown)';
  console.log(`  ${c('bold', 'Step 4: Re-run your platform adapter to pick up new features')}`);
  console.log(`    Platform: ${c('cyan', adapter)}`);
  console.log(`    Run: ${c('cyan', 'node tools/init.js')} (select "update" when prompted)\n`);

  // Step 5: Summary
  console.log(c('green', '  ✓ Upgrade preparation complete'));
  console.log('    Your project customizations (agent names, personas, rules, memory)');
  console.log(`    are preserved in the snapshot at ${c('cyan', path.relative(ROOT, snapshotOut))}.`);
  console.log('    The adapter re-run will merge latest RNA features while keeping your config.\n');

  // Step 6: Write upgrade log
  const upgradeLogPath = path.join(ROOT, '_memory', 'rna-method', 'upgrade-log.json');
  const upgradeLog     = readJSON(upgradeLogPath) ?? { upgrades: [] };
  upgradeLog.upgrades.push({
    from:       currentVersion,
    to:         latestVersion,
    timestamp:  ts,
    snapshotId,
    adapter,
  });
  writeJSON(upgradeLogPath, upgradeLog);

  console.log(c('gray', `  Upgrade logged to _memory/rna-method/upgrade-log.json\n`));
}

// ─── Command: /rna.setup | /rna.update ───────────────────────────────────────

function cmdDelegateToInit(name) {
  console.log(c('yellow', `\n  /rna.${name} is handled interactively by init.js.\n`));
  console.log(`  Run: ${c('cyan', 'node tools/init.js')}\n`);
}

// ─── Command: /rna.tools ─────────────────────────────────────────────────────

function cmdTools() {
  console.log('\n' + c('bold', '  RNA Method — Tool & MCP Discovery') + '\n');

  const configPath = path.join(ROOT, '.rna', 'config.json');
  const config     = readJSON(configPath);

  if (!config) {
    console.log(c('red', '  .rna/config.json not found — run /rna.setup first.\n'));
    return;
  }

  const platform = config.platform || 'copilot';
  const agents   = (config.agents ?? []).map(a => typeof a === 'string' ? a : a.id);

  if (agents.length === 0) {
    console.log(c('yellow', '  No agents found in .rna/config.json — nothing to update.\n'));
    return;
  }

  // Load discover-tools module
  let discoverMod;
  try {
    discoverMod = require(path.join(__dirname, 'discover-tools'));
  } catch (e) {
    console.log(c('red', `  Could not load discover-tools.js: ${e.message}\n`));
    return;
  }

  // Run discovery
  const result = discoverMod.discover(platform, ROOT);

  if (result.serverCount === 0) {
    console.log(c('gray', '  No MCP servers detected in project config.'));
    console.log(c('gray', '  Add MCP servers to your editor config, then re-run /rna.tools.\n'));
    return;
  }

  console.log(`  Found ${c('green', String(result.serverCount))} MCP server(s):\n`);
  for (const [key, srv] of Object.entries(result.servers)) {
    const tag = srv.known ? c('green', '✓ known') : c('yellow', '? unknown');
    console.log(`    ${tag}  ${srv.name || key}`);
  }
  console.log('');

  // Compute per-agent MCP tool assignments
  const agentMcpTools = discoverMod.computeAgentMcpTools(result, agents);

  if (Object.keys(agentMcpTools).length === 0) {
    console.log(c('gray', '  No MCP tools matched any agent roles.\n'));
    return;
  }

  // Determine agent file directory based on platform
  let agentDir;
  switch (platform) {
    case 'copilot':    agentDir = path.join(ROOT, '.github', 'agents'); break;
    case 'cursor':     agentDir = path.join(ROOT, '.cursor', 'agents'); break;
    case 'claude-code': agentDir = path.join(ROOT, '.claude', 'agents'); break;
    default:           agentDir = path.join(ROOT, '.github', 'agents'); break;
  }

  let updated = 0;

  for (const [agentId, newTools] of Object.entries(agentMcpTools)) {
    // Find the agent file
    const possibleFiles = [
      path.join(agentDir, `${agentId}.agent.md`),
      path.join(agentDir, `${agentId}.md`),
    ];
    // Also check director name from config
    if (agentId === 'director' && config.directorName) {
      const dirName = config.directorName.toLowerCase();
      possibleFiles.unshift(
        path.join(agentDir, `${dirName}.agent.md`),
        path.join(agentDir, `${dirName}.md`),
      );
    }

    const agentFile = possibleFiles.find(f => fs.existsSync(f));
    if (!agentFile) {
      console.log(`  ${c('yellow', '⚠')} ${agentId}: agent file not found — skipping`);
      continue;
    }

    let content = fs.readFileSync(agentFile, 'utf-8');

    // Check if file has YAML frontmatter with tools:
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.log(`  ${c('yellow', '⚠')} ${agentId}: no frontmatter found — skipping`);
      continue;
    }

    const frontmatter = fmMatch[1];

    // Extract existing tools
    const toolsMatch = frontmatter.match(/tools:\n((?:\s+-\s+.+\n?)*)/);
    let existingTools = [];
    if (toolsMatch) {
      existingTools = toolsMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }

    // Merge: add new MCP tools that aren't already present
    const allTools = [...existingTools];
    let addedCount = 0;
    for (const tool of newTools) {
      if (!allTools.includes(tool)) {
        allTools.push(tool);
        addedCount++;
      }
    }

    if (addedCount === 0) {
      console.log(`  ${c('green', '✓')} ${agentId}: already up to date`);
      continue;
    }

    // Rebuild the tools YAML block
    const newToolsYaml = 'tools:\n' + allTools.map(t => `  - ${t}`).join('\n');

    let newFrontmatter;
    if (toolsMatch) {
      newFrontmatter = frontmatter.replace(/tools:\n(?:\s+-\s+.+\n?)*/, newToolsYaml + '\n');
    } else {
      // Append tools block to frontmatter
      newFrontmatter = frontmatter.trimEnd() + '\n' + newToolsYaml + '\n';
    }

    content = content.replace(fmMatch[1], newFrontmatter);
    fs.writeFileSync(agentFile, content, 'utf-8');
    updated++;
    console.log(`  ${c('green', '✓')} ${agentId}: +${addedCount} MCP tool(s) injected`);
  }

  console.log('');
  if (updated > 0) {
    console.log(`  Updated ${c('green', String(updated))} agent file(s).`);
  }

  // Write/update tools manifest
  const manifest     = discoverMod.buildManifest(result, agentMcpTools);
  const manifestPath = path.join(ROOT, '.rna', 'tools-manifest.json');
  writeJSON(manifestPath, manifest);
  console.log(`  ${c('green', '✓')} .rna/tools-manifest.json written`);
  console.log('');
}

// ─── Router ───────────────────────────────────────────────────────────────────

function main() {
  const raw   = process.argv[2] ?? '';
  const match = raw.match(/^\/rna\.([a-zA-Z]+)(.*)?$/);

  if (!match) {
    if (raw) {
      console.log(c('red', `\n  Unknown command: ${raw}\n`));
    }
    cmdHelp();
    return;
  }

  const cmd          = match[1].toLowerCase();
  const trailingRaw  = (match[2] ?? '').trim();
  // Merge trailing text from argv[2] with any extra argv elements
  const trailingArgs = trailingRaw
    ? [trailingRaw, ...process.argv.slice(3)]
    : process.argv.slice(3);

  switch (cmd) {
    case 'help':     cmdHelp();                    break;
    case 'version':  cmdVersion();                 break;
    case 'status':   cmdStatus();                  break;
    case 'signal':   cmdSignal(trailingArgs);      break;
    case 'compact':  cmdCompact();                 break;
    case 'resync':   cmdResync();                  break;
    case 'gui':      cmdGui();                     break;
    case 'loop':     cmdLoop(trailingArgs);        break;
    case 'recall':   cmdRecall(trailingArgs);      break;
    case 'toon':     cmdToon();                    break;
    case 'compress': cmdCompress();                break;
    case 'search':   cmdSearch(trailingArgs);      break;
    case 'upgrade':  cmdUpgrade();                 break;
    case 'tools':    cmdTools();                   break;
    case 'obsidian':  cmdObsidian();                break;
    case 'resynk':   cmdUpgrade();                 break;  // alias
    case 'setup':    cmdDelegateToInit('setup');   break;
    case 'update':   cmdDelegateToInit('update');  break;
    default:
      console.log(c('red', `\n  Unknown command: /rna.${cmd}\n`));
      cmdHelp();
  }
}

try {
  main();
} catch (err) {
  console.error(c('red', `\n  Error: ${err.message}\n`));
  process.exit(1);
}
