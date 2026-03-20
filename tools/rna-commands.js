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
  const COL = 26;
  const rows = [
    ['/rna.setup',        'Full interactive setup: reads project, asks questions, writes all RNA files'],
    ['/rna.update',       'Re-run setup preserving existing customizations'],
    ['/rna.resync',       'Re-read project source (package.json, git log) and update timeline.json'],
    ['/rna.signal <msg>', 'Append a signal entry to agent-context.json signalQueue[]'],
    ['/rna.status',       'Print team status table from agent-context.json + activity.json files'],
    ['/rna.compact',      'Compact current session context to _memory/context/<date>_session-summary.md'],
    ['/rna.gui',          'Print instructions to start RNA Studio and the studio URL'],
    ['/rna.version',      'Print installed RNA Method version and schema version'],
    ['/rna.help',         'Print this table'],
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

// ─── Command: /rna.setup | /rna.update ───────────────────────────────────────

function cmdDelegateToInit(name) {
  console.log(c('yellow', `\n  /rna.${name} is handled interactively by init.js.\n`));
  console.log(`  Run: ${c('cyan', 'node tools/init.js')}\n`);
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
    case 'help':    cmdHelp();                    break;
    case 'version': cmdVersion();                 break;
    case 'status':  cmdStatus();                  break;
    case 'signal':  cmdSignal(trailingArgs);       break;
    case 'compact': cmdCompact();                 break;
    case 'resync':  cmdResync();                  break;
    case 'gui':     cmdGui();                     break;
    case 'setup':   cmdDelegateToInit('setup');   break;
    case 'update':  cmdDelegateToInit('update');  break;
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
