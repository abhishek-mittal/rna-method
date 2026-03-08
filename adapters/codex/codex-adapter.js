#!/usr/bin/env node

/**
 * OpenAI Codex Adapter — RNA Method v1
 *
 * Generates from rna-schema.json:
 *   AGENTS.md                  — root-level roles, rules, routing
 *   api/AGENTS.override.md     — path-specific rules for API directories
 *
 * Usage:
 *   node adapters/codex/codex-adapter.js [schema-path] [output-dir]
 *
 *   schema-path  defaults to ../../schema/rna-schema.json
 *   output-dir   defaults to <project-root>
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = process.argv[2] || path.join(__dirname, '..', '..', 'schema', 'rna-schema.json');
const OUTPUT_DIR  = process.argv[3] || process.cwd();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSchema() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`✗ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generateAgentsMd(schema, outDir) {
  const lines = [];

  lines.push(`# ${schema.meta.projectName} — Pluribus Agent Collective`);
  lines.push('');
  lines.push(`> Auto-generated from RNA schema v${schema.version}`);
  lines.push('');

  lines.push('## Session Start Protocol');
  lines.push('');
  lines.push('1. Read `_memory/rna-method/timeline.json`');
  lines.push('2. Report current phase, last 3 known decisions, top open question');
  lines.push('3. Ask what to work on');
  lines.push('');
  lines.push('Update `knownDecisions[]` and `openQuestions[]` at session end.');
  lines.push('');

  // Roles
  lines.push('## Roles');
  lines.push('');
  for (const agent of schema.agents) {
    lines.push(`### ${agent.name} (${agent.role})`);
    lines.push('');
    lines.push(agent.systemPrompt);
    lines.push('');
    lines.push(`- **Persona**: ${agent.persona}`);
    lines.push(`- **Model tier**: ${agent.model}`);
    lines.push(`- **Capabilities**: ${agent.capabilities.join(', ')}`);
    lines.push(`- **Command**: \`/${agent.command.replace('/', '')}\``);
    lines.push('');
  }

  // Always-apply rules
  lines.push('## Standards (Always Active)');
  lines.push('');
  for (const rule of schema.rules.filter(r => r.alwaysApply)) {
    lines.push(`### ${rule.name}`);
    lines.push('');
    lines.push(rule.content || rule.description);
    lines.push('');
  }

  // Domain rules
  lines.push('## Domain Rules');
  lines.push('');
  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    lines.push(`### ${rule.name}`);
    lines.push(`- **Trigger**: ${(rule.triggerKeywords || []).join(', ') || 'Manual'}`);
    lines.push(`- **Owner**: ${rule.ownedBy || 'Any'}`);
    lines.push('');
    lines.push(rule.description);
    if (rule.content) { lines.push(''); lines.push(rule.content); }
    lines.push('');
  }

  // Routing
  lines.push('## Routing');
  lines.push('');
  for (const agent of schema.agents) {
    if (agent.id === 'director') continue;
    lines.push(`- **${agent.capabilities.slice(0, 3).join(', ')}** → ${agent.name} (${agent.role})`);
  }
  lines.push('');

  // Joining patterns
  lines.push('## Multi-Agent Workflows');
  lines.push('');
  for (const jp of schema.joiningPatterns) {
    const names = jp.agents.map(id => {
      const a = schema.agents.find(ag => ag.id === id);
      return a ? a.name : id;
    });
    lines.push(`- **${jp.id}**: ${names.join(' → ')} (${jp.flow})`);
  }
  lines.push('');

  // Signal routes
  lines.push('## Signal Routes');
  lines.push('');
  for (const route of schema.routes) {
    const names = route.activate.map(id => {
      const a = schema.agents.find(ag => ag.id === id);
      return a ? a.name : id;
    });
    lines.push(`- When \`${route.when.category}\` / \`${route.when.event}\` → ${names.join(' + ')}`);
  }
  lines.push('');

  // Hooks
  lines.push('## Lifecycle Hooks');
  lines.push('');
  for (const hook of schema.hooks) {
    const names = hook.activates.map(id => {
      const a = schema.agents.find(ag => ag.id === id);
      return a ? a.name : id;
    });
    const enabledNote = hook.enabled ? '' : ' _(disabled by default — set `enabled: true` in schema to activate)_';
    lines.push(`- **${hook.event}**: ${hook.description} → ${names.join(', ')}${enabledNote}`);
  }
  lines.push('');

  const content = lines.join('\n');
  fs.writeFileSync(path.join(outDir, 'AGENTS.md'), content, 'utf-8');
  console.log(`  ✓ AGENTS.md (${content.split('\n').length} lines)`);
}

function generateOverrides(schema, outDir) {
  const securityRules = schema.rules.filter(r =>
    (r.triggerKeywords || []).some(k =>
      ['security', 'auth', 'credential', 'test', 'spec'].includes(k.toLowerCase())
    )
  );

  if (securityRules.length === 0) return;

  const lines = [
    '# API-Specific Overrides',
    '',
    'When working on files in this directory:',
    ''
  ];

  for (const rule of securityRules) {
    lines.push(`## ${rule.name}`);
    lines.push(`${rule.description}`);
    if (rule.content) { lines.push(''); lines.push(rule.content); }
    lines.push('');
  }

  const apiDir = path.join(outDir, 'api');
  ensureDir(apiDir);
  fs.writeFileSync(path.join(apiDir, 'AGENTS.override.md'), lines.join('\n'), 'utf-8');
  console.log(`  ✓ api/AGENTS.override.md`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nOpenAI Codex Adapter — RNA Method v1');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_DIR}\n`);

  const schema = loadSchema();

  generateAgentsMd(schema, OUTPUT_DIR);
  generateOverrides(schema, OUTPUT_DIR);

  console.log('\n✓ Done. Codex-native AGENTS.md generated from RNA schema.');
  console.log('  Next: run the Codex CLI in the project root, verify context loads from timeline.json at session start');
}

main();
