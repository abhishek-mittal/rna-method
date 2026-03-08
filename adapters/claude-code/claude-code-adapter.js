#!/usr/bin/env node

/**
 * Claude Code Adapter — RNA Method v1
 *
 * Generates a single CLAUDE.md from rna-schema.json.
 * Claude Code uses one project-level file as the orchestration manifest.
 * Agents are encoded as Task tool invocation instructions.
 *
 * Usage:
 *   node adapters/claude-code/claude-code-adapter.js [schema-path] [output-file]
 *
 *   schema-path  defaults to ../../schema/rna-schema.json
 *   output-file  defaults to <project-root>/CLAUDE.md
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = process.argv[2] || path.join(__dirname, '..', '..', 'schema', 'rna-schema.json');
const OUTPUT_FILE = process.argv[3] || path.join(process.cwd(), 'CLAUDE.md');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSchema() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`✗ Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
}

// ─── Generator ────────────────────────────────────────────────────────────────

function generate(schema) {
  const lines = [];

  lines.push(`# ${schema.meta.projectName} — Pluribus Agent Collective`);
  lines.push('');
  lines.push(`> Auto-generated from RNA schema v${schema.version}. Edit \`schema/rna-schema.json\` and re-run the adapter to update.`);
  lines.push('');
  lines.push('## Session Start Protocol');
  lines.push('');
  lines.push('At the start of every session:');
  lines.push('1. Read `_memory/rna-method/timeline.json`');
  lines.push('2. Report: current project phase, last 3 known decisions, top open question');
  lines.push('3. Ask what to work on');
  lines.push('');
  lines.push('At session end: update `knownDecisions[]` and resolve any completed `openQuestions[]`.');
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

  // Agent collective as orchestration table
  lines.push('## Agent Collective');
  lines.push('');
  lines.push('You are the Director. Route tasks to specialists by spawning sub-agents with the `Task` tool.');
  lines.push('');
  lines.push('| Agent | Role | When to Invoke | Model Tier |');
  lines.push('|-------|------|----------------|-----------|');
  for (const agent of schema.agents) {
    if (agent.id === 'director') continue;
    lines.push(
      `| **${agent.name}** | ${agent.role} | ${agent.capabilities.slice(0, 3).join(', ')} | ${agent.model} |`
    );
  }
  lines.push('');

  // Routing guide
  lines.push('## Task Routing');
  lines.push('');
  for (const agent of schema.agents) {
    if (agent.id === 'director') continue;
    lines.push(
      `- **${agent.capabilities.join(', ')}** → spawn Task with ${agent.name}: "${agent.systemPrompt.substring(0, 90)}..."`
    );
  }
  lines.push('');

  // Domain rules
  lines.push('## Domain Rules');
  lines.push('');
  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    lines.push(`### ${rule.name}`);
    lines.push(`- **Triggers**: ${(rule.triggerKeywords || []).join(', ') || 'Manual'}`);
    lines.push(`- **Owner**: ${rule.ownedBy || 'Any'}`);
    lines.push('');
    lines.push(rule.description);
    if (rule.content) { lines.push(''); lines.push(rule.content); }
    lines.push('');
  }

  // Skills
  lines.push('## Skills');
  lines.push('');
  for (const skill of schema.skills) {
    lines.push(`### ${skill.name}`);
    lines.push(`- **Owner**: ${skill.ownedBy || 'Any'}`);
    lines.push(`- **Triggers**: ${(skill.triggerKeywords || []).join(', ') || 'auto'}`);
    lines.push('');
    lines.push(skill.description);
    lines.push('');
  }

  // Joining patterns
  lines.push('## Multi-Agent Joins');
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
    lines.push(
      `- **${route.id}**: \`${route.when.category}\` + \`${route.when.event}\` → ${names.join(' + ')} (director approval: ${route.directorApproval})`
    );
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nClaude Code Adapter — RNA Method v1');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_FILE}\n`);

  const schema = loadSchema();
  const content = generate(schema);
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');

  console.log(`  ✓ CLAUDE.md (${content.split('\n').length} lines)`);
  console.log('\n✓ Done. CLAUDE.md generated from RNA schema.');
  console.log('  Next: open Claude Code in the project root, verify context loads from timeline.json at session start');
}

main();
