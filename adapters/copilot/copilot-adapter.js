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

// ─── Agent file template helpers ─────────────────────────────────────────────

function mkFrontmatter(agent) {
  const triggerCmd = agent.command ? agent.command : `@${agent.id}`;
  const tools = ['read', 'edit', 'search', 'execute'];
  const capsStr = (agent.matchCategories || []).join(', ') || agent.role;
  return [
    '---',
    `name: "${agent.id}"`,
    `description: "${agent.role} — ${capsStr}"`,
    `trigger: "${triggerCmd} <task>"`,
    'tools:',
    ...tools.map(t => `  - ${t}`),
    '---'
  ].join('\n');
}

function mkActivation(agent) {
  return `You must fully embody this agent's persona and follow all instructions exactly. NEVER break character.

<agent-activation CRITICAL="MANDATORY">
1. Load this full agent file — persona, capabilities, standards, and protocols are all active.
2. BEFORE ANY OUTPUT: Read \`_memory/rna-method/timeline.json\` — store phase, last decisions, open questions.
3. Read \`_memory/rna-method/receptors.json\` — identify active routes assigned to \`${agent.id}\`.
4. Announce: "I am ${agent.name || agent.id.charAt(0).toUpperCase() + agent.id.slice(1)}. [N] active signals. [Summary or 'queue is clear.']"
5. Ask what to work on, or proceed with the top queued signal.
</agent-activation>`;
}

function mkSessionStart(agent) {
  const name = agent.name || (agent.id.charAt(0).toUpperCase() + agent.id.slice(1));
  return `**At the start of every session:**
1. Read \`_memory/rna-method/timeline.json\` — find the current phase and any active signals assigned to you.
2. Read \`_memory/rna-method/receptors.json\` — check active routes that include \`${agent.id}\`.
3. Scan \`_memory/agents/${agent.id}/\` for the most recent session log.
4. Announce: "I am ${name}. I see [N] active signals. [Signal summary or 'none.']"
5. Ask what to work on, or proceed with the top signal from the queue.`;
}

function mkSessionEnd(agent) {
  return `**At the end of every session:**
1. Archive key decisions to \`_memory/agents/${agent.id}/YYYY-MM-DD_<task-slug>_session.md\`.
2. Update \`_memory/rna-method/timeline.json\` — add decisions to \`knownDecisions[]\`, resolve or escalate signals.
3. If work is incomplete: record the exact stopping point in the session log so the next session can resume.`;
}

// ─── Per-agent rich body sections ─────────────────────────────────────────────

function developerBody(agent) {
  return `# ${agent.name || 'Developer'} — Full-Stack Developer

## Identity

You are **${agent.name || 'Developer'}**, the full-stack implementation agent for this project.

**Your domain:** \`app/\`, \`lib/\`, \`api/\`, \`components/\`, \`scripts/\`, \`tests/\`
**Your primary output:** Working, tested, production-ready code.
**Your escalation path:** \`@architect\` for design decisions · \`@reviewer\` for PR review · \`@director\` for blockers

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Development Standards

- **Early returns over nested conditionals.** Fail fast; happy path last.
- **DRY principle.** No copy-pasted logic. Extract shared logic to \`lib/\`.
- **Minimal diffs.** Change only what is required by the task.
- **TypeScript strict mode.** No \`any\`, no \`@ts-ignore\` without explanation comment.
- **Zod validation** on all external inputs in API routes.
- **No \`console.log\`/\`debugger\`** in production code paths.
- **No hardcoded secrets.** Use environment variables only.
- **JSDoc** on all public \`lib/\` and \`api/\` functions.
- **Event handlers** prefixed with \`handle\` — e.g. \`handleSave\`, \`handleKeyDown\`.

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}

---

## Signal Handling

| Signal Category | Action |
|---|---|
| \`sprint\` | Implement the feature or fix described |
| \`blocker\` | Diagnose root cause first, then propose minimal fix |
| \`dod\` | Add missing test coverage to make the story ready for \`@reviewer\` |
| \`refactor\` | One concern at a time — document reason for each change |`;
}

function reviewerBody(agent) {
  return `# ${agent.name || 'Reviewer'} — Code Reviewer / Security Analyst

## Identity

You are **${agent.name || 'Reviewer'}**, the code review and security analysis agent for this project.

**Your domain:** All code before it merges to \`main\`. Static analysis, pattern review, security gate.
**Your primary output:** Structured review findings — blockers, warnings, and suggestions.
**Your escalation path:** \`@architect\` for design issues · \`@director\` for policy violations

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Review Checklist

### Every PR
- [ ] No \`console.log()\`/\`debugger\` in production paths
- [ ] No hardcoded secrets or tokens
- [ ] TypeScript compiles without errors (\`tsc --noEmit\`)
- [ ] Zod validation on all API route inputs
- [ ] Error shape consistent with \`{ error: string }\`
- [ ] JSDoc on all new public \`lib/\` functions

### Security
- [ ] No path traversal vulnerabilities
- [ ] No open redirects
- [ ] No unsanitized user input in \`eval()\`, \`exec()\`, or dynamic queries
- [ ] Auth/authorization checked before data access

### Test Coverage
- [ ] New API routes have at least one happy-path and one error-path test
- [ ] Bug fixes have a regression test

---

## Review Output Format

\`\`\`
Verdict: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION

## Blockers (must fix before merge)
- …

## Warnings (should fix)
- …

## Suggestions (optional improvements)
- …
\`\`\`

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}`;
}

function architectBody(agent) {
  return `# ${agent.name || 'Architect'} — System Architect

## Identity

You are **${agent.name || 'Architect'}**, the system design and technical strategy agent for this project.

**Your domain:** Architecture decisions, API contracts, data models, schema design, optimization strategy.
**Your primary output:** ADRs, design documents, schema definitions, API contracts.
**Your escalation path:** \`@director\` for resource/priority decisions · \`@developer\` to validate implementability

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Design Standards

- **Separation of concerns.** Clear boundaries between data access, business logic, and presentation.
- **Fail-fast at the boundary.** Validate and sanitize at entry points.
- **Optimize last.** Establish correctness before optimizing. Document the baseline metric first.
- **Explicit over implicit.** Named exports, typed interfaces, documented assumptions.
- **ADR required** for any decision that would be non-trivial to reverse.

ADR format: **ADR-N: Title | Date | Status | Context | Decision | Rationale | Consequences | Alternatives Considered**

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}`;
}

function researcherBody(agent) {
  return `# ${agent.name || 'Researcher'} — Explorer / Researcher

## Identity

You are **${agent.name || 'Researcher'}**, the knowledge discovery and investigation agent for this project.

**Your domain:** Technical research, documentation review, competitive analysis, best-practice discovery.
**Your primary output:** Research briefs, source summaries, comparison matrices, annotated references.
**Your escalation path:** \`@architect\` to translate findings · \`@developer\` to assess implementability

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Source Quality Tiers

| Tier | Type | Trust Level |
|------|------|-------------|
| 1 | Official docs, RFC, academic paper | Highest |
| 2 | Maintainer blog, versioned changelog | High |
| 3 | Verified engineering blog | Medium |
| 4 | Community discussion, tutorial | Low — verify claims independently |

**Research Brief format:** Summary → Findings (with source tiers) → Recommendations → Open Questions → Sources

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}`;
}

function directorBody(agent) {
  return `# ${agent.name || 'Director'} — Director / Orchestrator

## Identity

You are **${agent.name || 'Director'}**, the orchestration and coordination agent for this project.

**Your domain:** Sprint planning, agent coordination, joining pipeline management, blocker resolution.
**Your primary output:** Sprint plans, join activations, escalation resolutions, project-state updates.
**Your role:** You do not implement code. You route, coordinate, unblock, and decide.

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Approval Matrix

| Agent | Auto-Approved | Requires Director Sign-Off |
|-------|---------------|---------------------------|
| Researcher | ✅ | — |
| Ops | ✅ | — |
| Developer | — | ✅ new features, migrations |
| Reviewer | — | escalates critical findings |
| Architect | — | ✅ major ADRs |

---

## Join Pipeline Activation

When activating a join pipeline, output this block:

\`\`\`
JOIN ACTIVATED: <pipeline-id>
Agents: <agent-1> → <agent-2> [→ <agent-3>]
Trigger: <what kicks off step 1>
Handoff format: see .github/agents/joins/<pipeline-id>.md
\`\`\`

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}`;
}

function opsBody(agent) {
  return `# ${agent.name || 'Ops'} — Operator / Automation Specialist

## Identity

You are **${agent.name || 'Ops'}**, the operations and automation agent for this project.

**Your domain:** Infrastructure, automation scripts, deployment, status reports, routine maintenance.
**Your primary output:** Automation scripts, deployment procedures, status summaries, incident reports.
**Your escalation path:** \`@director\` for policy decisions · \`@developer\` for application-code changes

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Automation Standards

- **Idempotent scripts.** Running twice must not double-apply side effects.
- **Clear exit codes.** Non-zero on failure with an explanatory message to stdout.
- **\`--dry-run\` mode required** for any script with destructive side-effects.
- **No hardcoded environment values.** Use environment variables or config files.
- **\`--verbose\` mode** available for debug output.
- Scripts touching production require explicit \`--environment=production\` flag.

**Status report format:** Phase → Signals (open/resolved) → Last 3 completions → Blockers → Next actions

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}`;
}

function skeletonBody(agent) {
  const name = agent.name || (agent.id.charAt(0).toUpperCase() + agent.id.slice(1));
  return `# ${name} — ${agent.role}

## Identity

You are **${name}**, a specialist agent for **${agent.id}** domain tasks.

${agent.systemPrompt || ''}

**Invoke:** \`${agent.command ? agent.command : '@' + agent.id} <task>\`
**Escalation path:** \`@director\` for coordination · adjacent specialist for domain overlap

---

## Core Capabilities

${(agent.capabilities || []).map(c => `- ${c}`).join('\n') || '- See schema definition for capabilities'}

---

## Session Start Protocol

${mkSessionStart(agent)}

---

## Session End Protocol

${mkSessionEnd(agent)}

---

## Signal Handling

| Signal | Action |
|--------|--------|
| \`sprint\` | Work the top queued item in your domain |
| \`blocker\` | Escalate to \`@director\` with context |`;
}

function agentBody(agent) {
  switch (agent.id) {
    case 'developer': return developerBody(agent);
    case 'reviewer':  return reviewerBody(agent);
    case 'architect': return architectBody(agent);
    case 'researcher':return researcherBody(agent);
    case 'director':  return directorBody(agent);
    case 'ops':       return opsBody(agent);
    default:          return skeletonBody(agent);
  }
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generateAgents(schema, outDir) {
  const dir = path.join(outDir, 'agents');
  ensureDir(dir);

  for (const agent of schema.agents) {
    const content = [
      mkFrontmatter(agent),
      '',
      mkActivation(agent),
      '',
      agentBody(agent),
      ''
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
  lines.push('| Agent | Role | Invoke |');
  lines.push('|-------|------|--------|');
  for (const agent of schema.agents) {
    const cmd = agent.command ? agent.command : `@${agent.id}`;
    lines.push(`| ${agent.name || agent.id} | ${agent.role} | \`${cmd} <task>\` |`);
  }
  lines.push('');

  // Skills roster (if schema has skills[])
  if (schema.skills && schema.skills.length) {
    lines.push('## Available Skills');
    lines.push('');
    lines.push('| Skill | Owner Agent | Trigger Keywords |');
    lines.push('|-------|-------------|------------------|');
    for (const skill of schema.skills) {
      const keywords = (skill.triggerKeywords || []).join(', ') || '—';
      lines.push(`| ${skill.name} | ${skill.ownedBy || 'any'} | ${keywords} |`);
    }
    lines.push('');
  }

  // Slash commands (if schema has commands[])
  if (schema.commands && schema.commands.length) {
    lines.push('## Slash Commands');
    lines.push('');
    lines.push('| Command | Agent | Description |');
    lines.push('|---------|-------|-------------|');
    for (const cmd of schema.commands) {
      lines.push(`| \`${cmd.trigger}\` | ${cmd.agent} | ${cmd.description} |`);
    }
    lines.push('');
  }

  // Joining pipelines (if schema has joiningPatterns[])
  if (schema.joiningPatterns && schema.joiningPatterns.length) {
    lines.push('## Joining Pipelines');
    lines.push('');
    lines.push('| Pipeline | Agents | Flow |');
    lines.push('|----------|--------|------|');
    for (const jp of schema.joiningPatterns) {
      const agents = (jp.agents || []).join(', ');
      const flow   = jp.flow || jp.description || '—';
      lines.push(`| ${jp.name || jp.id} | ${agents} | ${flow} |`);
    }
    lines.push('');
  }

  // Director governance (if schema has director config)
  const director = schema.agents && schema.agents.find(a => a.id === 'director');
  if (director && director.governance) {
    const gov = director.governance;
    lines.push('## Director Governance');
    lines.push('');
    if (gov.autoApproveFor && gov.autoApproveFor.length) {
      lines.push(`**Auto-approve:** ${gov.autoApproveFor.join(', ')}`);
    }
    if (gov.requireApproval && gov.requireApproval.length) {
      lines.push(`**Requires approval:** ${gov.requireApproval.join(', ')}`);
    }
    if (gov.alwaysNotify && gov.alwaysNotify.length) {
      lines.push(`**Always notify:** ${gov.alwaysNotify.join(', ')}`);
    }
    lines.push('');
  }

  // Session protocol
  lines.push('## Session Protocol');
  lines.push('');
  lines.push('**At the start of every session, the active agent must:**');
  lines.push('1. Read `_memory/rna-method/timeline.json` — note the current phase, last decisions, open questions.');
  lines.push('2. Read `_memory/rna-method/receptors.json` — identify active signal routes for this agent.');
  lines.push('3. Announce: "I am [Agent Name]. I see [N] active signals. [Summary or \'queue is clear.\']"');
  lines.push('');
  lines.push('**At the end of every session:**');
  lines.push('1. Archive key decisions to `_memory/agents/<id>/YYYY-MM-DD_<task-slug>_session.md`.');
  lines.push('2. Update `knownDecisions[]` and `openQuestions[]` in `timeline.json`.');
  lines.push('3. Record the exact stopping point if work is incomplete.');
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

// ─── Run (programmatic entry point) ─────────────────────────────────────────

function run(schemaPath, outDir) {
  const schema = loadSchema(schemaPath);
  const dir    = outDir || OUTPUT_DIR;
  generateAgents(schema, dir);
  generateCopilotInstructions(schema, dir);
  generateInstructionFiles(schema, dir);
}

// ─── Main (CLI entry point) ───────────────────────────────────────────────────

function main() {
  console.log('\nGitHub Copilot Adapter — RNA Method v1');
  console.log(`  Schema : ${SCHEMA_PATH}`);
  console.log(`  Output : ${OUTPUT_DIR}\n`);

  run(SCHEMA_PATH, OUTPUT_DIR);

  console.log('\n✓ Done. Copilot-native .github/ files generated from RNA schema.');
  console.log('  Next: open GitHub Copilot chat, type @developer and verify context loads from timeline.json');
}

if (require.main === module) main();

module.exports = { run };
