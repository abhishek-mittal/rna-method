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

// Role-appropriate tool sets using VS Code Copilot's group/toolname format.
// These are the built-in and MCP tool identifiers that VS Code Copilot recognises
// in .agent.md frontmatter.
const BASE_TOOLS = [
  'read/readFile', 'search/codebase', 'search/textSearch', 'search/fileSearch', 'web/fetch',
];

const ROLE_TOOLS = {
  developer: [
    ...BASE_TOOLS,
    'edit/editFiles', 'edit/createFile', 'edit/createDirectory',
    'read/problems', 'search/usages', 'search/changes',
    'execute/runInTerminal', 'execute/runTests', 'execute/runTask',
    'read/terminalLastCommand',
    'github/get_file_contents', 'github/list_branches', 'github/create_branch',
    'github/create_pull_request', 'github/issue_read', 'github/list_issues',
  ],
  reviewer: [
    ...BASE_TOOLS,
    'read/problems', 'search/usages', 'web/githubRepo',
    'github/pull_request_read', 'github/pull_request_review_write',
    'github/search_code', 'github/issue_read', 'github/list_pull_requests',
    'github/get_file_contents', 'github/list_commits',
  ],
  architect: [
    ...BASE_TOOLS,
    'search/usages', 'web/githubRepo',
    'github/get_file_contents', 'github/search_code', 'github/issue_read',
    'io.github.upstash/context7/get-library-docs',
    'io.github.upstash/context7/resolve-library-id',
  ],
  researcher: [
    ...BASE_TOOLS,
    'search/usages', 'web/githubRepo',
    'github/search_code', 'github/get_file_contents', 'github/search_repositories',
    'io.github.upstash/context7/get-library-docs',
    'io.github.upstash/context7/resolve-library-id',
  ],
  director: [
    ...BASE_TOOLS,
    'search/usages', 'search/changes', 'web/githubRepo', 'agent/runSubagent',
    'github/issue_read', 'github/issue_write', 'github/list_issues',
    'github/create_pull_request', 'github/list_branches',
  ],
  ops: [
    ...BASE_TOOLS,
    'edit/editFiles', 'edit/createFile',
    'read/problems', 'read/terminalLastCommand',
    'execute/runInTerminal', 'execute/runTask',
    'github/issue_read', 'github/list_issues', 'github/get_file_contents',
  ],
  designer: [
    ...BASE_TOOLS,
    'edit/editFiles', 'edit/createFile', 'edit/createDirectory',
    'read/problems', 'search/usages',
    'web/githubRepo', 'browser/openBrowserPage',
    'com.figma.mcp/get_design_context', 'com.figma.mcp/get_screenshot',
    'com.figma.mcp/get_metadata', 'com.figma.mcp/get_variable_defs',
    'com.figma.mcp/get_code_connect_map',
  ],
};

function mkFrontmatter(agent) {
  const effectiveName = (agent.name || agent.id).toLowerCase();
  // Copilot uses / prefix for triggers; agent.command already contains the platform prefix from init
  const triggerCmd = agent.command ? agent.command : `/${effectiveName}`;

  // Role-appropriate tools (schema-level agent.tools overrides; agent.mcpTools appends)
  const roleTools  = ROLE_TOOLS[agent.id] || BASE_TOOLS;
  const schemaTools = agent.tools    || [];
  const mcpTools    = agent.mcpTools || [];

  const tools = schemaTools.length > 0
    ? [...new Set([...schemaTools, ...mcpTools])]
    : [...new Set([...roleTools,   ...mcpTools])];

  const capsStr = (agent.matchCategories || []).join(', ') || agent.role;
  return [
    '---',
    `name: "${effectiveName}"`,
    `description: "${agent.role} — ${capsStr}"`,
    `trigger: "${triggerCmd} <task>"`,
    'tools:',
    ...tools.map(t => `  - ${t}`),
    '---'
  ].join('\n');
}

function mkActivation(agent) {
  return `[inherits: .rna/_base-agent.md]

You must fully embody this agent's persona and follow all instructions exactly. NEVER break character.

<agent-activation CRITICAL="MANDATORY">
1. Load this full agent file — persona, capabilities, standards, and protocols are all active.
2. Follow §Step1 from \`.rna/_base-agent.md\` — read RNA state files, announce identity, check for handoff/resume.
3. Read \`_memory/rna-method/receptors.json\` — identify active routes assigned to \`${agent.id}\`.
4. Announce: "I am ${agent.name || agent.id.charAt(0).toUpperCase() + agent.id.slice(1)}. [N] active signals. [Summary or 'queue is clear.']"
5. Ask what to work on, or proceed with the top queued signal.

After completing your task:
6. Follow §task-complete from \`.rna/_base-agent.md\` — write session log, update timeline, clear checkpoints.
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
  return `**At the end of every session / after every task:**
1. Archive key decisions to \`_memory/agents/${agent.id}/YYYY-MM-DD_<task-slug>_session.md\`.
2. Append to \`_memory/rna-method/timeline.json\` \`recentDecisions[]\` — { date, agent, decision, rationale }.
3. Update \`_memory/rna-method/agent-context.json\` — remove resolved checkpoints, update join \`completedSteps[]\` if in a join.
4. If work is incomplete: record the exact stopping point in the session log so the next session can resume.
5. Output §task-complete block: status · what · files · decisions · next-actions · open.`;
}

// ─── Per-agent rich body sections ─────────────────────────────────────────────

function developerBody(agent, meta) {
  const stack = (meta && meta.stack) || {};
  const lang  = (stack.language || '').toLowerCase();
  const fw    = (stack.framework || '').toLowerCase();
  const isTS  = lang.includes('typescript');
  const isPy  = lang.includes('python');

  // Build language-appropriate standards
  const standards = [
    '- **Early returns over nested conditionals.** Fail fast; happy path last.',
    '- **DRY principle.** No copy-pasted logic. Extract shared logic.',
    '- **Minimal diffs.** Change only what is required by the task.',
  ];

  if (isTS) {
    standards.push('- **TypeScript strict mode.** No `any`, no `@ts-ignore` without explanation comment.');
    standards.push('- **Zod validation** on all external inputs in API routes.');
  } else if (isPy) {
    standards.push('- **Type hints** on all function signatures. Use `mypy` strict mode.');
    standards.push('- **Pydantic validation** on all external inputs.');
  }

  standards.push('- **No `console.log`/`debugger`** (or `print()` for debug) in production code paths.');
  standards.push('- **No hardcoded secrets.** Use environment variables only.');

  if (isTS || lang.includes('javascript')) {
    standards.push('- **JSDoc** on all public `lib/` and `api/` functions.');
    standards.push('- **Event handlers** prefixed with `handle` — e.g. `handleSave`, `handleKeyDown`.');
  }
  if (isPy) {
    standards.push('- **Docstrings** on all public functions (Google style).');
  }

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

${standards.join('\n')}

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

function reviewerBody(agent, meta) {
  const stack = (meta && meta.stack) || {};
  const lang  = (stack.language || '').toLowerCase();
  const isTS  = lang.includes('typescript');
  const isPy  = lang.includes('python');

  const coreChecks = [
    '- [ ] No `console.log()`/`debugger` (or `print()` for debug) in production paths',
    '- [ ] No hardcoded secrets or tokens',
  ];
  if (isTS) {
    coreChecks.push('- [ ] TypeScript compiles without errors (`tsc --noEmit`)');
    coreChecks.push('- [ ] Zod validation on all API route inputs');
    coreChecks.push('- [ ] JSDoc on all new public `lib/` functions');
  } else if (isPy) {
    coreChecks.push('- [ ] Type hints pass `mypy --strict`');
    coreChecks.push('- [ ] Pydantic validation on all API inputs');
    coreChecks.push('- [ ] Docstrings on all new public functions');
  }
  coreChecks.push('- [ ] Error shape consistent across API responses');

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
${coreChecks.join('\n')}

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

function designerBody(agent) {
  return `# ${agent.name || 'Designer'} — UI/UX & Design System

## Identity

You are **${agent.name || 'Designer'}**, the UI/UX and design system agent for this project.

**Your domain:** Components, design tokens, layouts, pages, stylesheets, visual consistency.
**Your primary output:** Production-ready UI components, design tokens, layout implementations, visual QA reports.
**Your escalation path:** \`@architect\` for structural decisions · \`@developer\` for complex logic · \`@director\` for scope

---

## Core Capabilities

${agent.capabilities.map(c => `- ${c}`).join('\n')}

---

## Design Standards

- **Design tokens first.** Never hardcode colors, spacing, or typography values. Read tokens before any visual work.
- **Composition over configuration.** Build small, composable components. Check the component library before creating new ones.
- **Responsive by default.** Every layout must work across mobile, tablet, and desktop breakpoints.
- **Accessible from the start.** Semantic HTML, ARIA labels, keyboard navigation, sufficient contrast (WCAG AA minimum).
- **No inline styles.** Use design tokens, utility classes, or CSS modules. Token changes are design decisions — document rationale.

**Figma workflow:** Read design context and screenshots before implementing. Map Figma tokens to project design tokens — never create parallel systems.

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

function agentBody(agent, meta) {
  switch (agent.id) {
    case 'developer': return developerBody(agent, meta);
    case 'reviewer':  return reviewerBody(agent, meta);
    case 'architect': return architectBody(agent);
    case 'researcher':return researcherBody(agent);
    case 'director':  return directorBody(agent);
    case 'ops':       return opsBody(agent);
    case 'designer':  return designerBody(agent);
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
      agentBody(agent, schema.meta),
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
    `> Auto-generated from RNA schema v${schema.version}. Edit \`.rna/rna-schema.json\` and re-run the adapter to update.`,
    ''
  ];

  // Project context (from schema.meta)
  const meta = schema.meta || {};
  if (meta.description || meta.domain || meta.stack || meta.deploymentTarget) {
    lines.push('## Project Context');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    lines.push(`| Project | ${meta.projectName} |`);
    if (meta.description)      lines.push(`| Description | ${meta.description} |`);
    if (meta.domain)           lines.push(`| Domain | ${meta.domain} |`);
    if (meta.stack) {
      const stackStr = [meta.stack.language, meta.stack.framework, ...(meta.stack.extras || [])].filter(Boolean).join(' · ');
      lines.push(`| Stack | ${stackStr} |`);
    }
    if (meta.deploymentTarget) lines.push(`| Deployment | ${meta.deploymentTarget} |`);
    lines.push('');
    lines.push('All agents should use this project context when making decisions about code style, tooling, and architecture.');
    lines.push('');
  }

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
      const trigger = cmd.trigger || `/${cmd.id}`;
      const agent   = cmd.agent  || cmd.agentId || '—';
      lines.push(`| \`${trigger}\` | ${agent} | ${cmd.description || '—'} |`);
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

  const meta  = schema.meta || {};
  const stack = meta.stack || {};
  const lang  = (stack.language || '').toLowerCase();

  // Derive applyTo pattern from language
  let defaultApplyTo = '**/*';
  if (lang.includes('typescript'))      defaultApplyTo = '**/*.{ts,tsx}';
  else if (lang.includes('javascript')) defaultApplyTo = '**/*.{js,jsx}';
  else if (lang.includes('python'))     defaultApplyTo = '**/*.py';
  else if (lang.includes('rust'))       defaultApplyTo = '**/*.rs';
  else if (lang.includes('go'))         defaultApplyTo = '**/*.go';

  for (const rule of schema.rules.filter(r => !r.alwaysApply)) {
    const applyTo = rule.applyTo || defaultApplyTo;
    const contentParts = [
      '---',
      `description: "${rule.description}"`,
      `applyTo: "${applyTo}"`,
      '---',
      '',
      `# ${rule.name}`,
      '',
      rule.description,
      '',
    ];

    if (rule.content) contentParts.push(rule.content + '\n');

    // Add stack context if relevant
    if (meta.stack && (meta.stack.language || meta.stack.framework)) {
      contentParts.push(`**Stack:** ${[meta.stack.language, meta.stack.framework].filter(Boolean).join(' / ')}  `);
    }

    contentParts.push(`**Trigger keywords:** ${(rule.triggerKeywords || []).join(', ') || 'Manual'}  `);
    contentParts.push(`**Owner agent:** ${rule.ownedBy || 'Any'}`);

    const content = contentParts.join('\n');
    fs.writeFileSync(path.join(dir, `${rule.id}.instructions.md`), content, 'utf-8');
  }

  console.log(`  ✓ ${schema.rules.filter(r => !r.alwaysApply).length} instruction files (.instructions.md)`);
}

// ─── Run (programmatic entry point) ─────────────────────────────────────────

function run(schemaPath, outDir) {
  const schema = loadSchema(schemaPath);
  const dir    = outDir || OUTPUT_DIR;

  // Fallback MCP discovery: if no agents have mcpTools, try auto-discovery
  const hasMcpTools = schema.agents.some(a => a.mcpTools && a.mcpTools.length > 0);
  if (!hasMcpTools) {
    try {
      // Resolve project root from schema path or output dir
      const projectRoot = schemaPath
        ? path.resolve(path.dirname(schemaPath), '..')
        : path.resolve(dir, '..');
      const discoverPath = path.join(__dirname, '..', '..', 'tools', 'discover-tools');
      if (fs.existsSync(discoverPath + '.js')) {
        const { discover, computeAgentMcpTools } = require(discoverPath);
        const result = discover('copilot', projectRoot);
        if (result.serverCount > 0) {
          const agentIds = schema.agents.map(a => a.id);
          const agentMcpTools = computeAgentMcpTools(result, agentIds);
          for (const agent of schema.agents) {
            if (agentMcpTools[agent.id] && agentMcpTools[agent.id].length > 0) {
              agent.mcpTools = agentMcpTools[agent.id];
            }
          }
          console.log(`  ✓ Auto-discovered ${result.serverCount} MCP server(s)`);
        }
      }
    } catch (_) {
      // Discovery is best-effort; skip silently if unavailable
    }
  }

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
