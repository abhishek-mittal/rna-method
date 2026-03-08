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
 *   --stack=<language>                  (e.g. TypeScript)
 *   --framework=<framework>             (e.g. Next.js)
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
const PLATFORM_FLAG   = flag('platform');
const COLLECTIVE_FLAG = flag('collective');
const AGENTS_FLAG     = flag('agents');
const RULES_FLAG      = flag('rules');
const PROJECT_FLAG    = flag('project-name');
const STACK_FLAG      = flag('stack');
const FRAMEWORK_FLAG  = flag('framework');
const OUTPUT_FLAG     = flag('output');

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS  = ['cursor', 'copilot', 'claude-code', 'codex', 'kimi'];
const AGENT_IDS  = ['director', 'developer', 'reviewer', 'architect', 'researcher', 'ops'];
const RULE_IDS   = ['coding-standards', 'security-gate', 'review-gate', 'docs-standards'];

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

// ─── Readline Prompts ────────────────────────────────────────────────────────

let rl = null;

function openRl() {
  if (rl) return;
  try {
    // Node ≥ 18: readline/promises
    const { createInterface } = require('readline/promises');
    rl = createInterface({ input: process.stdin, output: process.stdout });
    rl._promises = true;
  } catch {
    // Node < 18 fallback
    rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl._promises = false;
  }
}

function closeRl() {
  if (rl) { rl.close(); rl = null; }
}

async function question(q) {
  openRl();
  if (rl._promises) {
    return (await rl.question(q)).trim();
  }
  return new Promise(resolve => {
    rl.question(q, ans => resolve(ans.trim()));
  });
}

/**
 * Free-text question. Returns explicitVal if supplied, default if non-interactive.
 */
async function ask(prompt, defaultVal, explicitVal) {
  if (explicitVal != null)  return String(explicitVal);
  if (NON_INTERACTIVE)      return String(defaultVal);
  const hint = defaultVal ? c('gray', ` (${defaultVal})`) : '';
  const ans  = await question(`\n${c('bold', prompt)}${hint}\n  › `);
  return ans || String(defaultVal);
}

/**
 * Single-select from a list.
 * explicitVal: string prefix to match against choices (e.g. 'copilot' matches 'copilot — ...')
 */
async function choose(prompt, choices, defaultIdx = 0, explicitVal = null) {
  if (explicitVal != null) {
    const idx = choices.findIndex(ch => ch.startsWith(explicitVal));
    if (idx >= 0) return choices[idx];
  }
  if (NON_INTERACTIVE) return choices[defaultIdx];

  console.log(`\n${c('bold', prompt)}`);
  choices.forEach((ch, i) => {
    const marker = i === defaultIdx ? c('green', '●') : c('gray', '○');
    console.log(`  ${marker} ${c('cyan', String(i + 1))}  ${ch}`);
  });
  const ans = await question(`  Select [${defaultIdx + 1}]: `);
  const idx = parseInt(ans, 10) - 1;
  return (idx >= 0 && idx < choices.length) ? choices[idx] : choices[defaultIdx];
}

/**
 * Multi-select from a list.
 * explicitVals: string[] of pre-validated values (pass null to prompt).
 */
async function multiChoose(prompt, choices, defaults, explicitVals = null) {
  if (explicitVals != null) return explicitVals.filter(v => choices.includes(v));
  if (NON_INTERACTIVE)      return defaults;

  console.log(`\n${c('bold', prompt)}`);
  choices.forEach((ch, i) => {
    const marker = defaults.includes(ch) ? c('green', '●') : c('gray', '○');
    console.log(`  ${marker} ${c('cyan', String(i + 1))}  ${ch}`);
  });
  const ans = await question(`  Numbers (comma-separated), or Enter to keep all: `);
  if (!ans) return choices;
  return ans.split(',')
    .map(s => parseInt(s.trim(), 10) - 1)
    .filter(i => i >= 0 && i < choices.length)
    .map(i => choices[i]);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log(c('bold', c('cyan', '  ●  RNA Method — Interactive Init  ●')));
  console.log(c('gray', `  Mode : ${IS_EMBEDDED ? 'embedded (local files)' : 'remote (GitHub raw)'}`));
  console.log(c('gray', `  Node : ${process.version}`));
  console.log('');

  const cwdName = path.basename(process.cwd());

  // ── Phase 1: Prompts ──────────────────────────────────────────────────────

  const projectName = await ask('Project name?', cwdName, PROJECT_FLAG);

  const platformChoice = await choose(
    'Platform?',
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
    const sizeChoice = await choose(
      'Collective size?',
      [
        'minimal  — 1 agent (developer only, fastest start)',
        'full     — 6 agents (director, developer, reviewer, architect, researcher, ops)',
        'custom   — choose which agents to include',
      ],
      0
    );
    if (sizeChoice.startsWith('minimal')) {
      selectedAgents = ['developer'];
    } else if (sizeChoice.startsWith('full')) {
      selectedAgents = AGENT_IDS;
    } else {
      selectedAgents = await multiChoose(
        'Which agents? (recommended: start with developer + at least one reviewer)',
        AGENT_IDS,
        AGENT_IDS
      );
    }
  }

  // Rules
  const selectedRules = await multiChoose(
    'Which rules to include?',
    RULE_IDS,
    RULE_IDS,
    RULES_FLAG ? RULES_FLAG.split(',').map(s => s.trim()).filter(r => RULE_IDS.includes(r)) : null
  );

  // Joining patterns
  const includeJoins = selectedAgents.length > 1
    ? (await choose('Include joining (multi-agent pipeline) patterns?', ['yes', 'no'], 0)).startsWith('yes')
    : false;

  const techStack = await ask('Primary language?', 'TypeScript', STACK_FLAG);
  const framework = await ask('Framework / runtime?', 'Node.js', FRAMEWORK_FLAG);

  const outputDir = OUTPUT_FLAG ? path.resolve(OUTPUT_FLAG) : process.cwd();

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Summary ────────────────────────────────────────'));
  console.log(`  Project  : ${c('cyan', projectName)}`);
  console.log(`  Platform : ${c('cyan', platform)}`);
  console.log(`  Agents   : ${c('cyan', selectedAgents.join(', '))}`);
  console.log(`  Rules    : ${c('cyan', selectedRules.length ? selectedRules.join(', ') : '(none)')}`);
  console.log(`  Joins    : ${c('cyan', String(includeJoins))}`);
  console.log(`  Stack    : ${c('cyan', techStack)} / ${c('cyan', framework)}`);
  console.log(`  Output   : ${c('cyan', outputDir)}`);
  console.log('');

  if (!NON_INTERACTIVE) {
    const go = await question(c('bold', '  Proceed? (Y/n) › '));
    if (go.toLowerCase() === 'n') {
      console.log('\n  Aborted.\n');
      closeRl();
      return;
    }
  }

  closeRl();

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

  console.log(`  ✓ ${tplBase}`);

  // ── Phase 3: Build schema + patch config files ────────────────────────────

  const schema          = JSON.parse(rawSchema);
  schema.meta.projectName = projectName;
  schema.meta.platform    = platform;
  schema.meta.generatedAt = new Date().toISOString();
  schema.agents           = schema.agents.filter(a => selectedAgents.includes(a.id));
  schema.rules            = schema.rules.filter(r => selectedRules.includes(r.id));
  if (!includeJoins)      schema.joiningPatterns = [];
  if (!selectedAgents.includes('director')) delete schema.director;

  const receptors = JSON.parse(rawReceptors);
  if (receptors.meta) {
    receptors.meta.projectName = projectName;
    if ('platform' in receptors.meta) receptors.meta.platform = platform;
  }
  if (receptors.agents) {
    receptors.agents = receptors.agents.filter(a => selectedAgents.includes(a.id));
  }

  const timeline = JSON.parse(rawTimeline);
  if (timeline.meta)         timeline.meta.projectName     = projectName;
  if (timeline.projectState) timeline.projectState.techStack = { language: techStack, framework };

  // ── Phase 4: Write _memory/ files ─────────────────────────────────────────

  console.log('');
  console.log(c('bold', '  ─ Writing _memory/ ───────────────────────────────'));

  const memDir = path.join(outputDir, '_memory', 'rna-method');
  fs.mkdirSync(memDir, { recursive: true });
  fs.mkdirSync(path.join(memDir, 'checkpoints'), { recursive: true });

  const schemaOutPath    = path.join(outputDir, 'rna-schema.json');
  const receptorsOutPath = path.join(memDir, 'receptors.json');
  const timelineOutPath  = path.join(memDir, 'timeline.json');

  fs.writeFileSync(schemaOutPath,    JSON.stringify(schema,    null, 2) + '\n', 'utf-8');
  fs.writeFileSync(receptorsOutPath, JSON.stringify(receptors, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(timelineOutPath,  JSON.stringify(timeline,  null, 2) + '\n', 'utf-8');

  console.log('  ✓ rna-schema.json');
  console.log('  ✓ _memory/rna-method/receptors.json');
  console.log('  ✓ _memory/rna-method/timeline.json');
  console.log('  ✓ _memory/rna-method/checkpoints/');

  // ── Phase 5: Run adapter ──────────────────────────────────────────────────

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

  const validateRelPath = IS_EMBEDDED
    ? path.relative(outputDir, path.join(REPO_ROOT, 'tools', 'validate-registry.js'))
    : `<rna-method>/tools/validate-registry.js`;

  console.log('');
  console.log(c('green', c('bold', '  ✓ RNA Method initialised!')));
  console.log('');
  console.log(c('bold', '  Files created:'));
  console.log(`    rna-schema.json                         ← source of truth`);
  console.log(`    _memory/rna-method/receptors.json       ← agent registry`);
  console.log(`    _memory/rna-method/timeline.json        ← project state`);
  console.log(`    ${PLATFORM_ENTRY[platform].padEnd(38)}← ${platform} config`);
  console.log('');
  console.log(c('bold', '  Next steps:'));
  console.log(`    1. Open ${c('cyan', PLATFORM_ENTRY[platform])} in your editor`);
  console.log(`       and verify the ${platform} agent context loads`);
  console.log(`    2. Edit ${c('cyan', 'rna-schema.json')} to customise agents, rules, and skills`);
  console.log(`    3. Re-run the adapter after schema changes:`);
  console.log(c('gray', `       node ${adapterRelPath} rna-schema.json ./`));
  console.log(`    4. Validate the registry anytime:`);
  console.log(c('gray', `       node ${validateRelPath} --root ./`));
  console.log('');
}

main().catch(err => {
  closeRl();
  console.error(c('red', `\n  ✗ Init failed: ${err.message}`));
  if (process.env.RNA_DEBUG) console.error(err.stack);
  process.exit(1);
});
