#!/usr/bin/env node

/**
 * Kimi Code Adapter — RNA Method v1 (EXPERIMENTAL)
 *
 * ⚠️  Status: Experimental. Kimi Code has limited native multi-agent
 *    support. This adapter approximates RNA orchestration by generating
 *    a structured KIMI.md manifest and per-role context files.
 *
 * Generates from rna-schema.json:
 *   KIMI.md                            — master orchestration manifest
 *   .kimi/agents/<id>.md               — per-agent context files
 *   .kimi/rules/<id>.md                — rule files
 *
 * Usage:
 *   node adapters/kimi/kimi-adapter.js [schema-path] [output-dir]
 *
 *   schema-path  defaults to ../../schema/rna-schema.json
 *   output-dir   defaults to <project-root>
 *
 * Known limitations:
 *   - Kimi Code does not support native agent switching via commands;
 *     agents are invoked by pasting the agent file content manually
 *     or referencing it with @file syntax where supported.
 *   - Hook-based automation is not supported natively; use external
 *     shell scripts calling this adapter to approximate.
 *   - Signal routing is advisory only — no runtime receptor matching.
 *
 * Improvement contributions welcome. See CONTRIBUTING.md Path A.
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

function generateKimiMd(schema, outDir) {
  const lines = [];

  lines.push(`# ${schema.meta.projectName} — RNA Collective (Kimi Code)`);
  lines.push('');
  lines.push(`> ⚠️  Experimental Kimi Code adapter. Auto-generated from RNA schema v${schema.version}.`);
  lines.push('');

  lines.push('## How to Use RNA with Kimi Code');
  lines.push('');
  lines.push('Kimi Code does not yet support native agent switching. Use this workflow:');
  lines.push('');
  lines.push('1. At session start: paste the contents of `.kimi/agents/<role>.md` into the system prompt');
  lines.push('2. Reference the agent for the task you need (see routing table below)');
  lines.push('3. Kimi will adopt that role for the session');
  lines.push('4. At session end: update `_memory/rna-method/timeline.json` manually');
  lines.push('');
  lines.push('> Tip: Some Kimi Code versions support `@file` syntax. Try');
  lines.push('> `@.kimi/agents/developer.md` to load an agent inline.');
  lines.push('');

  lines.push('## Session Start Protocol');
  lines.push('');
  lines.push('1. Read `_memory/rna-method/timeline.json`');
  lines.push('2. Report current project phase, last 3 known decisions, top open question');
  lines.push('3. Ask what to work on');
  lines.push('');
  lines.push('Update `knownDecisions[]` and `openQuestions[]` at session end.');
  lines.push('');

  // Always-apply rules
  lines.push('## Core Standards (Always Active)');
  lines.push('');
  for (const rule of schema.rules.filter(r => r.alwaysApply)) {
    lines.push(`### ${rule.name}`);
    lines.push('');
    lines.push(rule.content || rule.description);
    lines.push('');
  }

  // Agent quick-reference
  lines.push('## Agent Quick Reference');
  lines.push('');
  lines.push('Load the agent file for the task you are working on:');
  lines.push('');
  lines.push('| Task type | Load agent | File |');
  lines.push('|-----------|-----------|------|');
  for (const agent of schema.agents) {
    const cap = agent.capabilities.slice(0, 2).join(', ');
    lines.push(`| ${cap} | **${agent.name}** | \`.kimi/agents/${agent.id}.md\` |`);
  }
  lines.push('');

  // Domain rules
  lines.push('## Domain Rules');
  lines.push('');
  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    lines.push(`### ${rule.name}`);
    lines.push(`_Trigger_: ${(rule.triggerKeywords || []).join(', ') || 'Manual'}  `);
    lines.push(`_Owner_: ${rule.ownedBy || 'Any'}`);
    lines.push('');
    lines.push(rule.description);
    if (rule.content) { lines.push(''); lines.push(rule.content); }
    lines.push('');
  }

  // Joining patterns (advisory)
  lines.push('## Multi-Agent Joins (Advisory)');
  lines.push('');
  lines.push('Kimi Code does not support automated joins. Use these as manual workflows:');
  lines.push('');
  for (const jp of schema.joiningPatterns) {
    const names = jp.agents.map(id => {
      const a = schema.agents.find(ag => ag.id === id);
      return a ? a.name : id;
    });
    lines.push(`- **${jp.id}**: manually invoke ${names.join(', then ')} in sequence`);
  }
  lines.push('');

  const content = lines.join('\n');
  fs.writeFileSync(path.join(outDir, 'KIMI.md'), content, 'utf-8');
  console.log(`  ✓ KIMI.md (${content.split('\n').length} lines)`);
}

function generateAgentFiles(schema, outDir) {
  const dir = path.join(outDir, '.kimi', 'agents');
  ensureDir(dir);

  for (const agent of schema.agents) {
    const content = [
      `# ${agent.name} — ${agent.role}`,
      '',
      '> Paste or @reference this file to activate this agent for a Kimi Code session.',
      '',
      agent.systemPrompt,
      '',
      '## Identity',
      '',
      `- **Name**: ${agent.name}`,
      `- **Persona**: ${agent.persona}`,
      `- **Model tier**: ${agent.model}`,
      '',
      '## Capabilities',
      '',
      agent.capabilities.map(c => `- ${c}`).join('\n'),
      '',
      '## Session Start Protocol',
      '',
      '1. Read `_memory/rna-method/timeline.json`',
      '2. State the current project phase and last 3 known decisions',
      '3. State the top open question',
      '4. Ask what to work on',
      '',
      '## Session End Protocol',
      '',
      '1. Update `knownDecisions[]` with any decisions made this session',
      '2. Remove resolved items from `openQuestions[]`',
      '3. Set your `lastActive` and `lastTask` in `teamProfiles[]`'
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${agent.id}.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.agents.length} agent context files (.kimi/agents/)`);
}

function generateRuleFiles(schema, outDir) {
  const dir = path.join(outDir, '.kimi', 'rules');
  ensureDir(dir);

  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    const content = [
      `# ${rule.name}`,
      '',
      `_Trigger keywords_: ${(rule.triggerKeywords || []).join(', ') || 'Manual'}  `,
      `_Owner_: ${rule.ownedBy || 'Any'}`,
      '',
      rule.description,
      '',
      rule.content || `<!-- Add detailed rule content here. -->`
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${rule.id}.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.rules.filter(r => !r.alwaysApply).length} rule files (.kimi/rules/)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nKimi Code Adapter — RNA Method v1 (EXPERIMENTAL)');
  console.log('  ⚠️  Limited native support. See adapter header for known limitations.');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_DIR}\n`);

  const schema = loadSchema();

  generateKimiMd(schema, OUTPUT_DIR);
  generateAgentFiles(schema, OUTPUT_DIR);
  generateRuleFiles(schema, OUTPUT_DIR);

  console.log('\n⚠️  Kimi adapter is experimental. Manual agent loading required.');
  console.log('   See KIMI.md in your project root for usage instructions.');
}

main();
