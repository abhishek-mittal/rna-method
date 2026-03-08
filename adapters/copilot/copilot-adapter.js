#!/usr/bin/env node

/**
 * GitHub Copilot Adapter — RNA Method v1
 *
 * Generates from rna-schema.json:
 *   .github/agents/<id>.agent.md           — one per agent
 *   .github/copilot-instructions.md        — always-apply rules
 *   .github/instructions/<id>.instructions.md — domain rules
 *
 * Usage:
 *   node adapters/copilot/copilot-adapter.js [schema-path] [output-dir]
 *
 *   schema-path  defaults to ../../schema/rna-schema.json
 *   output-dir   defaults to <project-root>/.github
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = process.argv[2] || path.join(__dirname, '..', '..', 'schema', 'rna-schema.json');
const OUTPUT_DIR  = process.argv[3] || path.join(process.cwd(), '.github');

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

function generateAgents(schema, outDir) {
  const dir = path.join(outDir, 'agents');
  ensureDir(dir);

  for (const agent of schema.agents) {
    const content = [
      '---',
      `name: "${agent.id}"`,
      `description: "${agent.role} agent for the Pluribus Collective"`,
      `tools:`,
      `  - shell`,
      `  - file_editor`,
      '---',
      '',
      `# ${agent.name} — ${agent.role}`,
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
      '## Signal Triggers',
      '',
      `- **Events**: ${agent.triggerEvents.length ? agent.triggerEvents.join(', ') : 'Manual only'}`,
      `- **Categories**: ${agent.matchCategories.length ? agent.matchCategories.join(', ') : 'None'}`,
      '',
      '## Session Start Protocol',
      '',
      '1. Read `_memory/rna-method/timeline.json`',
      '2. State the current project phase and last 3 known decisions',
      '3. State the top open question from `openQuestions[]`',
      '4. Ask what to work on'
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${agent.id}.agent.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.agents.length} agent files (.agent.md)`);
}

function generateCopilotInstructions(schema, outDir) {
  ensureDir(outDir);

  const lines = [
    `# Copilot Instructions — ${schema.meta.projectName}`,
    '',
    `> Auto-generated from RNA schema v${schema.version}. Edit \`schema/rna-schema.json\` and re-run the adapter to update.`,
    ''
  ];

  // Always-apply rules
  for (const rule of schema.rules.filter(r => r.alwaysApply)) {
    lines.push(`## ${rule.name}`);
    lines.push('');
    lines.push(rule.content || rule.description);
    lines.push('');
  }

  // Agent roster
  lines.push('## Agent Collective');
  lines.push('');
  lines.push('| Agent | Role | Command |');
  lines.push('|-------|------|---------|');
  for (const agent of schema.agents) {
    lines.push(`| ${agent.name} | ${agent.role} | \`@${agent.id}\` |`);
  }
  lines.push('');

  lines.push('## Session Start Protocol');
  lines.push('');
  lines.push('On every session start, the active agent reads `_memory/rna-method/timeline.json` and reports:');
  lines.push('- Current project phase and tech stack');
  lines.push('- Last 3 known decisions');
  lines.push('- Top open question');
  lines.push('');
  lines.push('Update `knownDecisions[]` and `openQuestions[]` at session end before closing.');
  lines.push('');

  fs.writeFileSync(path.join(outDir, 'copilot-instructions.md'), lines.join('\n'), 'utf-8');
  console.log(`  ✓ copilot-instructions.md`);
}

function generateInstructionFiles(schema, outDir) {
  const dir = path.join(outDir, 'instructions');
  ensureDir(dir);

  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    const content = [
      '---',
      `description: "${rule.description}"`,
      `applyTo: "**/*"`,
      '---',
      '',
      `# ${rule.name}`,
      '',
      rule.description,
      '',
      rule.content ? rule.content + '\n' : '',
      `**Trigger keywords:** ${(rule.triggerKeywords || []).join(', ') || 'Manual'}  `,
      `**Owner agent:** ${rule.ownedBy || 'Any'}`
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${rule.id}.instructions.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.rules.filter(r => !r.alwaysApply).length} instruction files (.instructions.md)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('\nGitHub Copilot Adapter — RNA Method v1');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_DIR}\n`);

  const schema = loadSchema();

  generateAgents(schema, OUTPUT_DIR);
  generateCopilotInstructions(schema, OUTPUT_DIR);
  generateInstructionFiles(schema, OUTPUT_DIR);

  console.log('\n✓ Done. Copilot-native .github/ files generated from RNA schema.');
  console.log('  Next: open GitHub Copilot chat, type @developer and verify context loads from timeline.json');
}

main();
