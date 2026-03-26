#!/usr/bin/env node

/**
 * RNA Method — Interactive Project Init
 *
 * Scaffolds a project with the RNA Method: writes _memory/ config files,
 * runs the platform adapter, and validates the registry.
 *
 * Usage (embedded — from inside the cloned repo):
 *   node tools/init.js
 *
 * Usage (remote — no clone needed):
 *   node -e "$(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/init.js)"
 *
 * Non-interactive / CI:
 *   node tools/init.js --non-interactive \
 *     --platform=copilot --collective=minimal --project-name=my-project
 *
 * All flags:
 *   --platform=<cursor|copilot|claude-code|codex|kimi>
 *   --collective=<minimal|full>         (shortcut; overridden by --agents)
 *   --agents=<id,id,...>                (e.g. developer,reviewer,architect)
 *   --rules=<id,id,...>                 (coding-standards,security-gate,review-gate,docs-standards)
 *   --project-name=<name>
 *   --description=<text>                (1-line project description)
 *   --domain=<domain>                   (e.g. ecommerce, SaaS, AI research)
 *   --stack=<language>                  (e.g. TypeScript)
 *   --framework=<framework>             (e.g. Next.js)
 *   --deploy=<target>                   (local, cloud, edge, hybrid)
 *   --director-name=<name>              (persona name for the director agent, e.g. Abhishek)
 *   --studio=<true|false>               (enable RNA Studio dashboard)
 *   --studio-port=<port>                (default: 7337)
 *   --output=<dir>                      (default: cwd)
 *   --non-interactive                   (accept defaults; combine with other flags)
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const https = require('https');

// ─── Mode Detection ──────────────────────────────────────────────────────────
// Embedded: running from within the rna-method repo tree (local files available)
// Remote  : downloaded/piped — fetches templates from GitHub raw CDN

const SCRIPT_DIR  = path.resolve(__dirname);
const REPO_ROOT   = path.resolve(SCRIPT_DIR, '..');
const IS_EMBEDDED = fs.existsSync(path.join(REPO_ROOT, 'schema', 'rna-schema.json'));
const GH_RAW_BASE = 'https://raw.githubusercontent.com/abhishek-mittal/rna-method/main';

// ─── CLI Flags ───────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function flag(name) {
  const match = argv.find(a => a.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : null;
}

const NON_INTERACTIVE = argv.includes('--non-interactive');
const DRY_RUN         = argv.includes('--dry-run');
const UPDATE_FLAG     = argv.includes('--update');
const PLATFORM_FLAG   = flag('platform');
const COLLECTIVE_FLAG = flag('collective');
const AGENTS_FLAG     = flag('agents');
const RULES_FLAG      = flag('rules');
const PROJECT_FLAG    = flag('project-name');
const DESCRIPTION_FLAG  = flag('description');
const DOMAIN_FLAG       = flag('domain');
const STACK_FLAG        = flag('stack');
const FRAMEWORK_FLAG    = flag('framework');
const DEPLOY_FLAG       = flag('deploy');
const DIRECTOR_NAME_FLAG = flag('director-name');
const OUTPUT_FLAG       = flag('output');
const STUDIO_FLAG       = flag('studio');
const STUDIO_PORT_FLAG  = flag('studio-port');

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS  = ['cursor', 'copilot', 'claude-code', 'codex', 'kimi'];
const AGENT_IDS  = ['director', 'developer', 'reviewer', 'architect', 'researcher', 'ops', 'designer'];
const RULE_IDS   = ['testing-standards', 'security-gate', 'optimization-workflow', 'pr-description', 'docs-standards'];

// Human-readable labels for rule selection prompt
const RULE_LABELS = {
  'testing-standards':     'testing-standards     — test creation standards',
  'security-gate':         'security-gate         — security checklist',
  'optimization-workflow': 'optimization-workflow — optimization process',
  'pr-description':        'pr-description        — PR description template',
  'docs-standards':        'docs-standards        — documentation standards',
};

// Map from schema rule IDs to template rule files (for content injection)
const RULE_TEMPLATE_MAP = {
  'security-gate':         'security-gate.md',
  'docs-standards':        'docs-standards.md',
  'pr-description':        'review-gate.md',
  'testing-standards':     'coding-standards.md',
  'optimization-workflow': 'optimization-workflow.md',
};

// Maps platform → function(projectRoot) → adapter output directory
const PLATFORM_OUT = {
  copilot:       (root) => path.join(root, '.github'),
  cursor:        (root) => path.join(root, '.cursor'),
  'claude-code': (root) => root,
  codex:         (root) => root,
  kimi:          (root) => root,
};

// Platform entry file shown in the "next steps" summary
const PLATFORM_ENTRY = {
  copilot:       '.github/copilot-instructions.md',
  cursor:        '.cursor/agents/_registry.md',
  'claude-code': 'CLAUDE.md',
  codex:         'AGENTS.md',
  kimi:          'KIMI.md',
};

// ─── Colours ─────────────────────────────────────────────────────────────────

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

// ─── TTY Guard ───────────────────────────────────────────────────────────────

if (!process.stdout.isTTY && !NON_INTERACTIVE) {
  console.log('RNA Method Init\n');
  console.log('Interactive mode requires a TTY. For scripted use:\n');
  console.log('  node tools/init.js --non-interactive \\');
  console.log('    --platform=copilot --collective=minimal --project-name=my-project\n');
  console.log('Supported flags:');
  console.log('  --platform, --collective, --agents, --rules,');
  console.log('  --project-name, --stack, --framework, --output');
  process.exit(0);
}

// ─── Raw Key Reader ──────────────────────────────────────────────────────────

/**
 * Reads a single raw keystroke from stdin.
 * Arrow keys arrive as multi-byte escape sequences (\x1b[A etc).
 */
function readRawKey() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (chunk) => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(chunk);
    };
    process.stdin.once('data', onData);
  });
}

function classifyKey(chunk) {
  if (chunk === '\x1b[A' || chunk === '\x1bOA') return 'UP';
  if (chunk === '\x1b[B' || chunk === '\x1bOB') return 'DOWN';
  if (chunk === '\r'     || chunk === '\n')      return 'ENTER';
  if (chunk === ' ')                             return 'SPACE';
  if (chunk === '\x03'   || chunk === '\x04') {  // Ctrl-C / Ctrl-D
    process.stdout.write('\n');
    process.exit(0);
  }
  return null;
}

// ─── ANSI Helpers ─────────────────────────────────────────────────────────────

function cursorUp(n) { if (n > 0) process.stdout.write(`\x1b[${n}A`); }
function clearDown() { process.stdout.write('\x1b[0J'); }

// ─── Remote Fetch ────────────────────────────────────────────────────────────

const tmpDir = path.join(os.tmpdir(), `rna-init-${Date.now()}`);

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    }).on('error', reject);
  });
}

async function getFile(relPath) {
  if (IS_EMBEDDED) {
    return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
  }
  return fetchText(`${GH_RAW_BASE}/${relPath}`);
}

// ─── Interactive Prompts ──────────────────────────────────────────────────────

/**
 * Free-text input. Uses readline; closes stdin cleanly before returning so
 * subsequent raw-mode calls don't conflict.
 */
async function ask(prompt, defaultVal, explicitVal) {
  if (explicitVal != null) return String(explicitVal);
  if (NON_INTERACTIVE)     return String(defaultVal);

  const hint = defaultVal ? c('gray', ` (${defaultVal})`) : '';

  return new Promise((resolve) => {
    const rl = require('readline').createInterface({
      input:  process.stdin,
      output: process.stdout,
    });
    let answered = false;
    rl.question(`\n${c('bold', prompt)}${hint}\n  › `, (ans) => {
      answered = true;
      rl.close();
      resolve(ans.trim() || String(defaultVal));
    });
    rl.once('close', () => {
      if (!answered) resolve(String(defaultVal));
    });
  });
}

/**
 * Single-select with ↑/↓ to move, Enter to confirm.
 * explicitVal: string prefix to match (used when flag is supplied).
 */
async function arrowSelect(prompt, choices, defaultIdx = 0, explicitVal = null) {
  if (explicitVal != null) {
    const idx = choices.findIndex(ch => ch.startsWith(explicitVal));
    if (idx >= 0) return choices[idx];
  }
  if (NON_INTERACTIVE) return choices[defaultIdx];

  let current = defaultIdx;
  let linesDrawn = 0;

  function draw(isFirst) {
    if (!isFirst) {
      cursorUp(linesDrawn);
      clearDown();
    }
    const header = `\n${c('bold', prompt)} ${c('gray', '(↑↓ move · enter confirm)')}`;
    process.stdout.write(header + '\n');
    choices.forEach((ch, i) => {
      if (i === current) {
        process.stdout.write(`  ${c('cyan', '❯')} ${c('bold', ch)}\n`);
      } else {
        process.stdout.write(`    ${c('gray', ch)}\n`);
      }
    });
    // blank line + prompt line + choices
    linesDrawn = 1 + 1 + choices.length;
  }

  draw(true);

  while (true) {
    const action = classifyKey(await readRawKey());
    if (action === 'UP')    current = (current - 1 + choices.length) % choices.length;
    if (action === 'DOWN')  current = (current + 1) % choices.length;
    if (action === 'ENTER') break;
    draw(false);
  }

  // Collapse to single confirmation line
  cursorUp(linesDrawn);
  clearDown();
  process.stdout.write(`\n${c('bold', prompt)}\n  ${c('green', '✔')} ${c('cyan', choices[current])}\n`);

  return choices[current];
}

/**
 * Multi-select with ↑/↓ to move, Space to toggle, Enter to confirm.
 * explicitVals: pre-validated string[] (bypass prompt when flags supplied).
 */
async function arrowMultiSelect(prompt, choices, defaults = [], explicitVals = null) {
  if (explicitVals != null) return explicitVals.filter(v => choices.includes(v));
  if (NON_INTERACTIVE)      return defaults;

  const selected = new Set(defaults);
  let current    = 0;
  let linesDrawn = 0;

  function draw(isFirst) {
    if (!isFirst) {
      cursorUp(linesDrawn);
      clearDown();
    }
    const header = `\n${c('bold', prompt)} ${c('gray', '(↑↓ move · space toggle · enter confirm)')}`;
    process.stdout.write(header + '\n');
    choices.forEach((ch, i) => {
      const tick   = selected.has(ch) ? c('green', '◉') : c('gray',  '◯');
      const cursor = i === current     ? c('cyan', '❯')  : ' ';
      const label  = i === current     ? c('bold', ch)   : ch;
      process.stdout.write(`  ${cursor} ${tick} ${label}\n`);
    });
    linesDrawn = 1 + 1 + choices.length;
  }

  draw(true);

  while (true) {
    const action = classifyKey(await readRawKey());
    if (action === 'UP')    current = (current - 1 + choices.length) % choices.length;
    if (action === 'DOWN')  current = (current + 1) % choices.length;
    if (action === 'SPACE') {
      if (selected.has(choices[current])) selected.delete(choices[current]);
      else                                selected.add(choices[current]);
    }
    if (action === 'ENTER') break;
    draw(false);
  }

  const result = choices.filter(ch => selected.has(ch));

  // Collapse to single confirmation line
  cursorUp(linesDrawn);
  clearDown();
  const summary = result.length ? c('cyan', result.join(', ')) : c('gray', '(none)');
  process.stdout.write(`\n${c('bold', prompt)}\n  ${c('green', '✔')} ${summary}\n`);

  return result;
}

/**
 * Required-field guard.
 * Wraps any async prompt function. If the result is empty and the field is
 * required, shows a "reselect / skip / quit" menu so the user can recover.
 *
 * @param {string}   label    Human name for the field shown in the warning
 * @param {Function} fn       Async function that runs the prompt, returns value
 * @returns {Promise<*>}
 */
async function withRequired(label, fn) {
  while (true) {
    const result = await fn();
    const isEmpty = Array.isArray(result) ? result.length === 0 : !result;
    if (!isEmpty) return result;

    process.stdout.write(`\n  ${c('yellow', '⚠')}  ${c('bold', `"${label}"`)}`
      + c('yellow', ' requires at least one selection.\n'));

    const action = await arrowSelect(
      'What would you like to do?',
      [
        'reselect  — go back and choose again',
        'skip      — continue without this field',
        'quit      — exit the wizard',
      ],
      0
    );

    if (action.startsWith('reselect')) continue;
    if (action.startsWith('skip'))     return result;
    /* quit */
    process.stdout.write('\n  Aborted.\n\n');
    process.exit(0);
  }
}

// ─── Dry-run file helpers ─────────────────────────────────────────────────────

const FOOTPRINT_PATHS = [];

function mkdirp(dir) {
  if (DRY_RUN) {
    process.stdout.write(c('gray', `  [dry-run] mkdir -p ${dir}\n`));
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function writef(filePath, content) {
  FOOTPRINT_PATHS.push(filePath);
  if (DRY_RUN) {
    const lines = content.split('\n').length;
    process.stdout.write(c('gray', `  [dry-run] write ${filePath} (${lines} lines)\n`));
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function reportFootprint() {
  console.log('');
  console.log(c('bold', '  ─ Token Footprint ────────────────────────────────'));
  console.log(`  ${'File'.padEnd(46)}  ${'Bytes'.padStart(6)}  ${'~Tokens'.padStart(8)}`);
  console.log(`  ${'-'.repeat(46)}  ${'-'.repeat(6)}  ${'-'.repeat(8)}`);
  let totalBytes = 0;
  for (const f of FOOTPRINT_PATHS) {
    if (!fs.existsSync(f)) continue;
    const bytes  = fs.statSync(f).size;
    const tokens = Math.round(bytes / 4);
    totalBytes  += bytes;
    console.log(`  ${path.basename(f).padEnd(46)}  ${String(bytes).padStart(6)}  ~${String(tokens).padStart(7)}`);
  }
  const totalTokens = Math.round(totalBytes / 4);
  console.log(`  ${'-'.repeat(46)}  ${'-'.repeat(6)}  ${'-'.repeat(8)}`);
  console.log(`  ${'TOTAL'.padEnd(46)}  ${String(totalBytes).padStart(6)}  ~${String(totalTokens).padStart(7)}`);
  console.log('');
  console.log(c('gray', '  BMAD comparison: bmad-method typically loads ~8 000 tokens on first message.'));
  console.log(c('gray', '  RNA Method loads only what the active agent needs (~500–1 200 tokens).'));
}

// ─── Session-zero Builder ─────────────────────────────────────────────────────

function buildSessionZero({ projectName, description, domain, platform, selectedAgents, techStack, framework, deployTarget }) {
  const ts = new Date().toISOString();
  const agentList = selectedAgents.join(', ');
  return `---
generated_by: rna-method/init.js
generated_at: ${ts}
project: ${projectName}
platform: ${platform}
---

# RNA Method — Session Zero

## What this project uses

| Field       | Value                      |
|-------------|-----------------------------|
| Project     | ${projectName}             |
| Description | ${description || '—'}      |
| Domain      | ${domain || '—'}           |
| Platform    | ${platform}                |
| Stack       | ${techStack} / ${framework}|
| Deploy      | ${deployTarget || 'local'} |
| Agents      | ${agentList}               |
| Init date   | ${ts}                      |

## Activate your first agent

\`\`\`
@developer Implement a user authentication endpoint
\`\`\`

## Personalise your agents

Run \`/rna.setup\` in your AI agent chat to tailor agents for your project domain,
stack, and conventions. This step contextualises each agent with your specific needs.

## Key files

| File | Purpose |
|------|---------|
| \`rna-schema.json\` | Source of truth — agents, rules, skills, hooks |
| \`_memory/rna-method/receptors.json\` | Agent registry |
| \`_memory/rna-method/timeline.json\` | Project state |
| \`${PLATFORM_ENTRY[platform]}\` | ${platform} loader |

> All RNA config is in \`.rna/\`, runtime state in \`_memory/\`.
> Add \`_memory/\` to \`.gitignore\` — it is managed by agents during sessions.

## How to re-run

\`\`\`bash
# Update an existing install:
bash tools/install.sh --update

# Or with the Node installer:
node tools/init.js --update
\`\`\`

## How to validate

\`\`\`bash
node .rna/validate-registry.js --root ./
\`\`\`
`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log(c('bold', c('cyan', '  ●  RNA Method — Interactive Init  ●')));
  console.log(c('gray', `  Mode : ${IS_EMBEDDED ? 'embedded (local files)' : 'remote (GitHub raw)'}`));
  console.log(c('gray', `  Node : ${process.version}`));
  if (DRY_RUN)    console.log(c('yellow', '  ⚠  DRY-RUN — nothing will be written'));
  if (UPDATE_FLAG) console.log(c('yellow', '  ⚡  UPDATE MODE — replacing existing install'));
  console.log('');

  const cwdName    = path.basename(process.cwd());
  const outputDir  = OUTPUT_FLAG ? path.resolve(OUTPUT_FLAG) : process.cwd();

  // ── Update detection ──────────────────────────────────────────────────────

  const rnaDir         = path.join(outputDir, '.rna');
  const existingSchema = path.join(rnaDir, 'rna-schema.json');
  // Also check legacy root-level location for backward compat
  const legacySchema   = path.join(outputDir, 'rna-schema.json');
  if ((fs.existsSync(existingSchema) || fs.existsSync(legacySchema)) && !UPDATE_FLAG) {
    console.log(c('yellow', `  ⚠  Existing install detected at: ${outputDir}`));
    const how = await arrowSelect(
      'How would you like to proceed?',
      [
        'update  — refresh files, clean stale platform dir',
        'fresh   — overwrite everything (clean slate)',
        'abort   — exit without changes',
      ],
      0
    );
    if (how.startsWith('abort')) {
      process.stdout.write('\n  Aborted.\n\n');
      return;
    }
    // fresh = continue as normal; update = enable stale cleanup below
  }

  // ── Phase 1: Prompts ──────────────────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ── ① Project Identity ──────────────────────────────'));

  const projectName = await ask('Project name?', cwdName, PROJECT_FLAG);

  const projectDescription = await ask(
    'One-line project description?',
    `${cwdName} — built with RNA Method`,
    DESCRIPTION_FLAG
  );

  const domainChoice = await arrowSelect(
    'Project domain?',
    [
      'web-app     — web application (SaaS, dashboard, portal)',
      'api         — backend API / microservice',
      'ecommerce   — online store / marketplace',
      'ai-ml       — AI/ML project (training, inference, agents)',
      'mobile      — mobile app (React Native, Flutter, etc.)',
      'cli-tool    — command-line tool / automation',
      'library     — reusable library / SDK / package',
      'other       — custom domain',
    ],
    0,
    DOMAIN_FLAG
  );
  const domain = domainChoice.split(/\s+/)[0].replace('—', '').trim();

  const platformChoice = await arrowSelect(
    'Primary platform? (adapter that will be run)',
    [
      'cursor        — .cursor/ agents, rules, skills, commands',
      'copilot       — .github/ agents + copilot-instructions.md',
      'claude-code   — single CLAUDE.md (Claude Code)',
      'codex         — AGENTS.md + path overrides (OpenAI Codex CLI)',
      'kimi ⚠        — KIMI.md + .kimi/ (experimental)',
    ],
    0,
    PLATFORM_FLAG
  );
  const platform = platformChoice.split(/\s+/)[0].replace('⚠', '').trim();

  if (!PLATFORMS.includes(platform)) {
    console.error(c('red', `  ✗ Unknown platform "${platform}". Choose from: ${PLATFORMS.join(', ')}`));
    process.exit(1);
  }

  // Additional adapters (multi-select) — generates config files for each
  let extraAdapters = [];
  if (!NON_INTERACTIVE) {
    console.log('');
    console.log(c('bold', '  ── ①b Additional Adapters ───────────────────────────'));
    console.log(c('gray', '  Generate adapter config for other platforms too? (optional)'));
    const otherPlatforms = PLATFORMS.filter((p) => p !== platform);
    extraAdapters = await arrowMultiSelect(
      'Also generate for?',
      otherPlatforms,
      [],
    );
  }

  // Collective / agents
  let selectedAgents;
  if (AGENTS_FLAG) {
    selectedAgents = AGENTS_FLAG.split(',').map(s => s.trim()).filter(a => AGENT_IDS.includes(a));
    if (selectedAgents.length === 0) {
      console.error(c('red', `  ✗ --agents flag contained no valid agent IDs. Valid: ${AGENT_IDS.join(', ')}`));
      process.exit(1);
    }
  } else if (COLLECTIVE_FLAG === 'minimal') {
    selectedAgents = ['developer'];
  } else if (COLLECTIVE_FLAG === 'full') {
    selectedAgents = AGENT_IDS;
  } else {
    console.log('');
    console.log(c('bold', '  ── ② Collective Setup ──────────────────────────────'));
    const sizeChoice = await arrowSelect(
      'Collective size?',
      [
        'minimal  — 1 agent (developer only, fastest start)',
        'full     — 7 agents (director, developer, reviewer, architect, researcher, ops, designer)',
        'custom   — choose which agents to include',
      ],
      0
    );
    if (sizeChoice.startsWith('minimal')) {
      selectedAgents = ['developer'];
    } else if (sizeChoice.startsWith('full')) {
      selectedAgents = AGENT_IDS;
    } else {
      selectedAgents = await withRequired(
        'Agents',
        () => arrowMultiSelect(
          'Which agents? (recommended: start with developer + at least one reviewer)',
          AGENT_IDS,
          AGENT_IDS
        )
      );
    }
  }

  // Rules
  const ruleChoices = RULE_IDS.map(id => RULE_LABELS[id] || id);
  const ruleExplicit = RULES_FLAG
    ? RULES_FLAG.split(',').map(s => s.trim()).filter(r => RULE_IDS.includes(r)).map(id => RULE_LABELS[id] || id)
    : null;

  const selectedRuleChoices = await arrowMultiSelect(
    'Which rules to include?',
    ruleChoices,
    ruleChoices,
    ruleExplicit
  );
  const selectedRules = selectedRuleChoices.map(ch => ch.split(/\s+/)[0].trim());

  // Joining patterns
  const includeJoins = selectedAgents.length > 1
    ? (await arrowSelect('Include joining (multi-agent pipeline) patterns?', ['yes', 'no'], 0)).startsWith('yes')
    : false;

  // Director agent name (personalise the director persona and @handle)
  let directorName = 'Director';
  if (selectedAgents.includes('director')) {
    directorName = await ask('Director agent name?', 'Director', DIRECTOR_NAME_FLAG);
  }

  console.log('');
  console.log(c('bold', '  ── ③ Stack & Output ────────────────────────────────'));

  const techStack = await ask('Primary language?', 'TypeScript', STACK_FLAG);
  const framework = await ask('Framework / runtime?', 'Node.js', FRAMEWORK_FLAG);

  const deployChoice = await arrowSelect(
    'Deployment target?',
    [
      'local       — local development / self-hosted',
      'cloud       — cloud platforms (Vercel, AWS, GCP, Azure)',
      'edge        — edge / serverless / CDN',
      'hybrid      — mixed deployment',
    ],
    0,
    DEPLOY_FLAG
  );
  const deployTarget = deployChoice.split(/\s+/)[0].replace('—', '').trim();

  // RNA Studio
  console.log('');
  console.log(c('bold', '  ── ④ RNA Studio ────────────────────────────────────'));
  console.log(c('gray', '  RNA Studio is a local web dashboard for monitoring your agent collective.'));

  let enableStudio = STUDIO_FLAG === 'true' || STUDIO_FLAG === 'yes';
  let studioPort   = parseInt(STUDIO_PORT_FLAG, 10) || 7337;
  if (!NON_INTERACTIVE) {
    const studioChoice = await arrowSelect(
      'Enable RNA Studio? (local dashboard for agent monitoring)',
      ['yes — install RNA Studio', 'no  — skip for now (can add later)'],
      0
    );
    enableStudio = studioChoice.startsWith('yes');
    if (enableStudio) {
      studioPort = parseInt(await ask('Studio port?', '7337'), 10) || 7337;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Summary ────────────────────────────────────────'));
  console.log(`  Project  : ${c('cyan', projectName)}`);
  console.log(`  Platform : ${c('cyan', platform)}`);
  console.log(`  Agents   : ${c('cyan', selectedAgents.join(', '))}`);
  console.log(`  Rules    : ${c('cyan', selectedRules.length ? selectedRules.join(', ') : '(none)')}`);
  console.log(`  Joins    : ${c('cyan', String(includeJoins))}`);
  if (selectedAgents.includes('director')) {
    console.log(`  Director : ${c('cyan', directorName)}`);
  }
  console.log(`  Stack    : ${c('cyan', techStack)} / ${c('cyan', framework)}`);
  console.log(`  Studio   : ${c('cyan', enableStudio ? `yes (port ${studioPort})` : 'no')}`);
  console.log(`  Output   : ${c('cyan', outputDir)}`);
  console.log('');

  if (!NON_INTERACTIVE) {
    const go = await arrowSelect(
      'Proceed?',
      ['yes — scaffold the project', 'no  — abort'],
      0
    );
    if (go.startsWith('no')) {
      process.stdout.write('\n  Aborted.\n\n');
      return;
    }
  }

  // ── Phase 2: Load template files ─────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Loading templates ──────────────────────────────'));

  const useMinimalBase = selectedAgents.length === 1 && selectedAgents[0] === 'developer';
  const tplBase        = useMinimalBase ? 'templates/minimal-collective' : 'templates/full-collective';

  const [rawReceptors, rawTimeline, rawSchema] = await Promise.all([
    getFile(`${tplBase}/receptors.json`),
    getFile(`${tplBase}/timeline.json`),
    getFile('schema/rna-schema.json'),
  ]);

  // Load template rule content for rules that have template files
  const ruleContentMap = {};
  for (const [ruleId, tplFile] of Object.entries(RULE_TEMPLATE_MAP)) {
    try {
      const raw = await getFile(`templates/rules/${tplFile}`);
      // Strip frontmatter (between --- delimiters) and use the markdown body
      const body = raw.replace(/^---[\s\S]*?---\s*/, '').trim();
      ruleContentMap[ruleId] = body;
    } catch (_) {
      // Template file not found — skip
    }
  }

  console.log(`  ✓ ${tplBase}`);

  // ── Phase 3: Build schema + patch config files ────────────────────────────

  const schema          = JSON.parse(rawSchema);
  schema.meta.projectName      = projectName;
  schema.meta.description      = projectDescription;
  schema.meta.domain           = domain;
  schema.meta.stack            = { language: techStack, framework, extras: [] };
  schema.meta.deploymentTarget = deployTarget;
  schema.meta.platform         = platform;
  schema.meta.generatedAt      = new Date().toISOString();
  schema.agents           = schema.agents.filter(a => selectedAgents.includes(a.id));
  schema.rules            = schema.rules.filter(r => r.alwaysApply || selectedRules.includes(r.id));

  // Inject template rule content for rules that lack content
  for (const rule of schema.rules) {
    if (!rule.content && ruleContentMap[rule.id]) {
      rule.content = ruleContentMap[rule.id];
    }
  }

  if (!includeJoins)      schema.joiningPatterns = [];
  if (!selectedAgents.includes('director')) delete schema.director;

  // Filter commands and skills to only reference selected agents
  if (schema.commands) {
    schema.commands = schema.commands.filter(cmd => selectedAgents.includes(cmd.agentId));
  }
  if (schema.skills) {
    schema.skills = schema.skills.filter(sk => !sk.ownedBy || selectedAgents.includes(sk.ownedBy));
  }

  // Patch director display name in schema (flows through to agent body via adapter)
  const schemaDirector = schema.agents?.find(a => a.id === 'director');
  if (schemaDirector) schemaDirector.name = directorName;

  const receptors = JSON.parse(rawReceptors);
  if (receptors.meta) {
    receptors.meta.projectName = projectName;
    receptors.meta.project     = projectName;
    receptors.meta.generatedAt = new Date().toISOString().slice(0, 10);
    if ('platform' in receptors.meta) receptors.meta.platform = platform;
  }
  if (receptors.agents) {
    receptors.agents = receptors.agents.filter(a => selectedAgents.includes(a.id));
    const receptorDirector = receptors.agents.find(a => a.id === 'director');
    if (receptorDirector) receptorDirector.name = directorName;
  }

  const timeline = JSON.parse(rawTimeline);
  if (timeline.meta) {
    timeline.meta.projectName  = projectName;
    timeline.meta.project      = projectName;
    timeline.meta.lastUpdated  = new Date().toISOString().slice(0, 10);
  }
  if (timeline.projectState) timeline.projectState.techStack = { language: techStack, framework };
  if (timeline.projectState && selectedAgents.includes('director')) timeline.projectState.directorName = directorName;

  // ── Phase 4: Write _memory/ files ─────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Writing _memory/ ───────────────────────────────'));

  const memDir = path.join(outputDir, '_memory', 'rna-method');
  mkdirp(memDir);
  mkdirp(path.join(memDir, 'checkpoints'));

  const rnaConfigDir     = path.join(outputDir, '.rna');
  mkdirp(rnaConfigDir);

  const schemaOutPath    = path.join(rnaConfigDir, 'rna-schema.json');
  const receptorsOutPath = path.join(memDir, 'receptors.json');
  const timelineOutPath  = path.join(memDir, 'timeline.json');
  const sessionZeroPath  = path.join(memDir, 'session-zero.md');
  const agentContextPath = path.join(memDir, 'agent-context.json');

  // Stale platform dir cleanup (--update mode)
  if (UPDATE_FLAG) {
    console.log('');
    console.log(c('bold', '  ─ Cleaning stale platform files ───────────────────'));
    const staleDirs = {
      copilot: path.join(outputDir, '.github', 'agents'),
      cursor:  path.join(outputDir, '.cursor', 'agents'),
    };
    const staleDir = staleDirs[platform];
    if (staleDir && fs.existsSync(staleDir)) {
      if (DRY_RUN) {
        console.log(c('gray', `  [dry-run] rm -rf ${staleDir}`));
      } else {
        fs.rmSync(staleDir, { recursive: true, force: true });
        console.log(c('green', `  ✓ removed ${path.relative(outputDir, staleDir)}`));
      }
    }
  }

  writef(schemaOutPath,    JSON.stringify(schema,    null, 2) + '\n');
  writef(receptorsOutPath, JSON.stringify(receptors, null, 2) + '\n');
  writef(timelineOutPath,  JSON.stringify(timeline,  null, 2) + '\n');
  writef(sessionZeroPath,  buildSessionZero({ projectName, description: projectDescription, domain, platform, selectedAgents, techStack, framework, deployTarget }));

  const agentContext = {
    activeJoins: [],
    openCheckpoints: [],
    blockers: [],
    _note: 'Managed by agents during sessions. See .rna/rna-schema.json joiningPatterns[] for available pipelines.',
  };
  writef(agentContextPath, JSON.stringify(agentContext, null, 2) + '\n');

  console.log('  ✓ .rna/rna-schema.json');
  console.log('  ✓ _memory/rna-method/receptors.json');
  console.log('  ✓ _memory/rna-method/timeline.json');
  console.log('  ✓ _memory/rna-method/agent-context.json');
  console.log('  ✓ _memory/rna-method/session-zero.md');
  console.log('  ✓ _memory/rna-method/checkpoints/');

  // ── Phase 4.5: Write .rna/config.json ───────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Writing .rna/ config ──────────────────────────'));

  const rnaConfigPath = path.join(rnaConfigDir, 'config.json');
  const rnaConfig = {
    projectName,
    adapter: platform,
    adapters: [platform, ...extraAdapters],
    studio: enableStudio,
    studioPort: studioPort,
    rnaVersion: (schema.meta && schema.meta.version) ? schema.meta.version : '1.0.0',
    installedAt: new Date().toISOString(),
    _note: 'Generated by tools/init.js. Re-run with --update to refresh.',
  };
  writef(rnaConfigPath, JSON.stringify(rnaConfig, null, 2) + '\n');
  console.log('  ✓ .rna/config.json');

  // ── Phase 4.55: Write _base-agent.md + toon-registry.md ─────────────────

  try {
    const baseAgentTpl = await getFile('templates/_base-agent.md');
    writef(path.join(rnaConfigDir, '_base-agent.md'), baseAgentTpl);
    console.log('  ✓ .rna/_base-agent.md');
  } catch (e) {
    console.log(c('yellow', `  ⚠ Could not write _base-agent.md: ${e.message}`));
  }

  try {
    let toonTpl = await getFile('templates/toon-registry.md');

    // Build TOON interpolation values from project context
    const stackLine = [techStack, framework].filter(Boolean).join(' | ');
    const stackAcronyms = [];
    if (/typescript/i.test(techStack)) stackAcronyms.push('| TS  | TypeScript |');
    if (/javascript/i.test(techStack)) stackAcronyms.push('| JS  | JavaScript |');
    if (/python/i.test(techStack))     stackAcronyms.push('| PY  | Python |');
    if (/next/i.test(framework))       stackAcronyms.push('| NXT | Next.js |');
    if (/react/i.test(framework))      stackAcronyms.push('| RCT | React |');
    if (/node/i.test(framework))       stackAcronyms.push('| NOD | Node.js |');
    if (/express/i.test(framework))    stackAcronyms.push('| EXP | Express |');
    if (/django/i.test(framework))     stackAcronyms.push('| DJG | Django |');
    if (/flask/i.test(framework))      stackAcronyms.push('| FLK | Flask |');
    if (/vue/i.test(framework))        stackAcronyms.push('| VUE | Vue.js |');
    if (/angular/i.test(framework))    stackAcronyms.push('| ANG | Angular |');

    const joinAcronyms = [];
    const joinPatterns = [];
    for (const jp of (schema.joiningPatterns || [])) {
      const abbr = jp.shortId || jp.id.replace(/-/g, '').toUpperCase().slice(0, 3);
      const name = jp.name || jp.id;
      const agents = jp.agents || jp.steps || [];
      joinAcronyms.push(`| ${abbr} | ${name} |`);
      const agentFlow = agents.map(a => `@${a}`).join(' → ');
      joinPatterns.push(`| ${abbr} | ${name} | ${agentFlow} | ${agents.length} |`);
    }

    toonTpl = toonTpl
      .replace('{{STACK_LINE}}',      stackLine || 'TypeScript | Node.js')
      .replace('{{STACK_ACRONYMS}}',  stackAcronyms.join('\n') || '| — | — |')
      .replace('{{JOIN_ACRONYMS}}',   joinAcronyms.join('\n')  || '| — | — |')
      .replace('{{JOIN_PATTERNS}}',   joinPatterns.join('\n')   || '| — | — | — | — |');

    writef(path.join(rnaConfigDir, 'toon-registry.md'), toonTpl);
    console.log('  ✓ .rna/toon-registry.md');
  } catch (e) {
    console.log(c('yellow', `  ⚠ Could not write toon-registry.md: ${e.message}`));
  }

  // ── Phase 4.6: Copy validate-registry.js into .rna/ ────────────────────────

  const valDest = path.join(rnaConfigDir, 'validate-registry.js');
  try {
    const valSrc = await getFile('tools/validate-registry.js');
    writef(valDest, valSrc);
    console.log('  ✓ .rna/validate-registry.js');
  } catch (e) {
    console.log(c('yellow', `  ⚠ Could not copy validate-registry.js: ${e.message}`));
  }

  // ── Phase 4.7: Ensure .gitignore covers _memory/ ──────────────────────────

  const gitignorePath = path.join(outputDir, '.gitignore');
  const gitignoreBlock = [
    '',
    '# RNA Method — runtime state (managed by agents during sessions)',
    '_memory/',
    '',
  ].join('\n');

  try {
    const existing = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, 'utf-8')
      : '';
    if (!existing.includes('_memory/')) {
      if (DRY_RUN) {
        console.log(c('gray', '  [dry-run] would append _memory/ to .gitignore'));
      } else {
        fs.appendFileSync(gitignorePath, gitignoreBlock, 'utf-8');
        console.log('  ✓ .gitignore — added _memory/');
      }
    }
  } catch (e) {
    console.log(c('yellow', `  ⚠ Could not update .gitignore: ${e.message}`));
  }

  // Token footprint
  if (!DRY_RUN) reportFootprint();

  // ── Phase 5: Run adapter ──────────────────────────────────────────────────

  if (DRY_RUN) {
    console.log('');
    console.log(c('gray', '  [dry-run] skipping adapter + validation'));
    return;
  }

  console.log('');
  console.log(c('bold', `  ─ Running ${platform} adapter ───────────────────────`));

  let adapter;
  if (IS_EMBEDDED) {
    adapter = require(path.join(REPO_ROOT, 'adapters', platform, `${platform}-adapter`));
  } else {
    fs.mkdirSync(tmpDir, { recursive: true });
    const adapterCode = await getFile(`adapters/${platform}/${platform}-adapter.js`);
    const tmpPath     = path.join(tmpDir, `${platform}-adapter.js`);
    fs.writeFileSync(tmpPath, adapterCode, 'utf-8');
    adapter = require(tmpPath);
  }

  if (typeof adapter.run !== 'function') {
    console.error(c('red', `  ✗ Adapter "${platform}" does not export run(). Update the adapter file.`));
    process.exit(1);
  }

  const adapterOutDir = PLATFORM_OUT[platform](outputDir);
  adapter.run(schemaOutPath, adapterOutDir);

  // Run extra adapters (if any were selected in the multi-select step)
  if (Array.isArray(extraAdapters) && extraAdapters.length > 0) {
    console.log('');
    console.log(c('bold', '  ─ Running extra adapters ─────────────────────────'));
    for (const extraPlatform of extraAdapters) {
      try {
        let extraAdapter;
        if (IS_EMBEDDED) {
          extraAdapter = require(path.join(REPO_ROOT, 'adapters', extraPlatform, `${extraPlatform}-adapter`));
        } else {
          const code    = await getFile(`adapters/${extraPlatform}/${extraPlatform}-adapter.js`);
          const tmpPath = path.join(tmpDir, `${extraPlatform}-adapter.js`);
          fs.writeFileSync(tmpPath, code, 'utf-8');
          extraAdapter  = require(tmpPath);
        }
        if (typeof extraAdapter.run === 'function') {
          extraAdapter.run(schemaOutPath, PLATFORM_OUT[extraPlatform](outputDir));
          console.log(c('green', `  ✓ ${extraPlatform} adapter`));
        }
      } catch (e) {
        console.log(c('yellow', `  ⚠ ${extraPlatform} adapter skipped: ${e.message}`));
      }
    }
  }

  // ── Phase 6: Validate ─────────────────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Validating registry ───────────────────────────'));

  try {
    let validator;
    if (IS_EMBEDDED) {
      validator = require(path.join(REPO_ROOT, 'tools', 'validate-registry'));
    } else {
      const valCode    = await getFile('tools/validate-registry.js');
      const tmpValPath = path.join(tmpDir, 'validate-registry.js');
      fs.writeFileSync(tmpValPath, valCode, 'utf-8');
      validator = require(tmpValPath);
    }

    const r = validator.run({
      root:      outputDir,
      receptors: receptorsOutPath,
      context:   path.join(memDir, 'agent-context.json'),
      silent:    true,
    });

    if (r.fatal) {
      console.log(c('yellow', `  ⚠ Validation skipped: ${r.fatal}`));
    } else if (r.failed.length === 0 && r.warnings.length === 0) {
      console.log(c('green', `  ✓ All ${r.passed.length} checks passed`));
    } else if (r.failed.length === 0) {
      console.log(c('yellow', `  ⚠ ${r.warnings.length} warning(s) — run validate-registry.js for details`));
    } else {
      console.log(c('red', `  ✗ ${r.failed.length} check(s) failed:`));
      r.failed.forEach(f => console.log(c('red', `      • ${f.detail}`)));
    }
  } catch (e) {
    console.log(c('gray', `  (validation unavailable: ${e.message})`));
  }

  // Cleanup tmpdir (remote mode only)
  if (!IS_EMBEDDED && fs.existsSync(tmpDir)) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  // ── Phase 7: Done ─────────────────────────────────────────────────────────

  const adapterRelPath = IS_EMBEDDED
    ? path.relative(outputDir, path.join(REPO_ROOT, 'adapters', platform, `${platform}-adapter.js`))
    : `<rna-method>/adapters/${platform}/${platform}-adapter.js`;

  const validateRelPath = '.rna/validate-registry.js';

  console.log('');
  console.log(c('green', c('bold', '  ✓ RNA Method initialised!')));
  console.log('');
  console.log(c('bold', '  Files created:'));
  console.log(`    .rna/rna-schema.json                    ← source of truth`);
  console.log(`    .rna/config.json                        ← RNA config`);
  console.log(`    _memory/rna-method/receptors.json       ← agent registry`);
  console.log(`    _memory/rna-method/timeline.json        ← project state`);
  console.log(`    _memory/rna-method/session-zero.md      ← start here`);
  console.log(`    ${PLATFORM_ENTRY[platform].padEnd(38)}← ${platform} config`);
  console.log('');
  console.log(c('bold', '  Next steps:'));
  console.log(`    1. Read ${c('cyan', '_memory/rna-method/session-zero.md')} — your quick-start briefing`);
  console.log(`    2. Run ${c('cyan', '/rna.setup')} in your AI agent chat to personalise`);
  console.log(`       agents for your project domain, stack, and conventions`);
  console.log(`    3. Open ${c('cyan', PLATFORM_ENTRY[platform])} in your editor`);
  console.log(`       and verify the ${platform} agent context loads`);
  console.log(`    4. Edit ${c('cyan', '.rna/rna-schema.json')} to customise agents, rules, and skills`);
  console.log(`    5. Re-run the adapter after schema changes:`);
  console.log(c('gray', `       node ${adapterRelPath} .rna/rna-schema.json ./`));
  console.log(`    6. Validate the registry anytime:`);
  console.log(c('gray', `       node ${validateRelPath} --root ./`));
  if (enableStudio) {
    console.log(`    7. Start RNA Studio:`);
    console.log(c('gray', `       node <rna-method>/studio/server.js  →  http://localhost:${studioPort}`));
  }
  console.log('');
}

main().catch(err => {
  console.error(c('red', `\n  ✗ Init failed: ${err.message}`));
  if (process.env.RNA_DEBUG) console.error(err.stack);
  process.exit(1);
});
