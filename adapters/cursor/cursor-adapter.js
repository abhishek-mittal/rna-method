#!/usr/bin/env node

/**
 * Cursor IDE Adapter — RNA Method v1
 *
 * Generates .cursor/ directory structure from rna-schema.json:
 *   .cursor/agents/<id>.md          — one per agent
 *   .cursor/rules/<id>.mdc          — one per rule
 *   .cursor/skills/<id>/SKILL.md    — one per skill
 *   .cursor/commands/<id>.md        — one per command
 *   .cursor/agents/_registry.md     — agent index
 *
 * Usage:
 *   node adapters/cursor/cursor-adapter.js [schema-path] [output-dir]
 *
 *   schema-path  defaults to ../../schema/rna-schema.json
 *   output-dir   defaults to <project-root>/.cursor
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = process.argv[2] || path.join(__dirname, '..', '..', 'schema', 'rna-schema.json');
const OUTPUT_DIR  = process.argv[3] || path.join(process.cwd(), '.cursor');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure agent command uses the @ prefix for Cursor.
 * The schema may contain / prefix (Copilot default) if not rewritten by init.
 */
function cursorCommand(agent) {
  const cmd = agent.command || agent.id;
  const base = cmd.replace(/^[@/]/, '');
  return `@${base}`;
}

function loadSchema(customPath) {
  const p = customPath || SCHEMA_PATH;
  if (!fs.existsSync(p)) {
    console.error(`✗ Schema not found: ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generateAgents(schema, outDir) {
  const dir = path.join(outDir, 'agents');
  ensureDir(dir);

  const registryLines = [
    '# Pluribus Agent Collective — Registry',
    '',
    '| # | Name | File | Role | Command | Model |',
    '|---|------|------|------|---------|-------|'
  ];

  schema.agents.forEach((agent, i) => {
    const filename = `${(agent.name || agent.id).toLowerCase()}.md`;
    const content = [
      '---',
      `description: "${agent.role} — ${agent.persona}"`,
      `alwaysApply: false`,
      '---',
      '',
      `# ${agent.name} — ${agent.role}`,
      '',
      agent.systemPrompt,
      '',
      '## Identity',
      '',
      `- **Name**: ${agent.name}`,
      `- **Role**: ${agent.role}`,
      `- **Persona**: ${agent.persona}`,
      `- **Command**: \`${cursorCommand(agent)}\``,
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
      `- **Priorities**: ${agent.matchPriorities.length ? agent.matchPriorities.join(', ') : 'All'}`
    ].join('\n');

    fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
    registryLines.push(
      `| ${i + 1} | **${agent.name}** | \`${filename}\` | ${agent.role} | \`${cursorCommand(agent)}\` | ${agent.model} |`
    );
  });

  fs.writeFileSync(path.join(dir, '_registry.md'), registryLines.join('\n') + '\n', 'utf-8');
  console.log(`  ✓ ${schema.agents.length} agent files + _registry.md`);
}

function generateRules(schema, outDir) {
  const dir = path.join(outDir, 'rules');
  ensureDir(dir);

  for (const rule of schema.rules) {
    const content = [
      '---',
      `description: "${rule.description}"`,
      `alwaysApply: ${rule.alwaysApply}`,
      '---',
      '',
      `# ${rule.name}`,
      '',
      rule.content || `<!-- Rule content for ${rule.name}. Add your guidelines here. -->`
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${rule.id}.mdc`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.rules.length} rule files (.mdc)`);
}

function generateSkills(schema, outDir) {
  const dir = path.join(outDir, 'skills');
  ensureDir(dir);

  for (const skill of schema.skills) {
    const skillDir = path.join(dir, skill.id);
    ensureDir(skillDir);

    const content = [
      '---',
      `name: "${skill.id}"`,
      `description: "${skill.description}"`,
      '---',
      '',
      `# ${skill.name}`,
      '',
      skill.description,
      '',
      '## Trigger Keywords',
      '',
      (skill.triggerKeywords || []).map(k => `- \`${k}\``).join('\n') || '- (auto-activated)',
      '',
      `## Owner Agent: ${skill.ownedBy || 'Any'}`,
      '',
      '## Workflow',
      '',
      '<!-- Define the multi-step workflow for this skill here. -->'
    ].join('\n');

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.skills.length} skill directories`);
}

function generateCommands(schema, outDir) {
  const dir = path.join(outDir, 'commands');
  ensureDir(dir);

  for (const cmd of schema.commands) {
    const agent = schema.agents.find(a => a.id === cmd.agentId);

    const content = [
      '---',
      `description: "${cmd.description}"`,
      '---',
      '',
      `# /${cmd.id} — ${agent ? agent.name : 'Unknown'} (${agent ? agent.role : 'Unknown'})`,
      '',
      `Read \`.cursor/agents/${agent ? (agent.name || agent.id).toLowerCase() : 'unknown'}.md\` and follow its instructions completely.`,
      '',
      `Then execute the user's task. If no specific task is given, ask what to do.`
    ].join('\n');

    fs.writeFileSync(path.join(dir, `${cmd.id}.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.commands.length} command files`);
}

// ─── Run (programmatic entry point) ─────────────────────────────────────────

function run(schemaPath, outDir) {
  const schema = loadSchema(schemaPath);
  const dir    = outDir || OUTPUT_DIR;
  generateAgents(schema, dir);
  generateRules(schema, dir);
  generateSkills(schema, dir);
  generateCommands(schema, dir);
}

// ─── Main (CLI entry point) ───────────────────────────────────────────────────

function main() {
  console.log('\nCursor IDE Adapter — RNA Method v1');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_DIR}\n`);

  run(SCHEMA_PATH, OUTPUT_DIR);

  console.log('\n✓ Done. Cursor-native .cursor/ files generated from RNA schema.');
  console.log('  Next: open Cursor, invoke any /command, verify the agent loads context from timeline.json');
}

if (require.main === module) main();

module.exports = { run };
