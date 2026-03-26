#!/usr/bin/env node

/**
 * RNA Method — Tool & MCP Server Discovery
 *
 * Scans the user's project and system for installed MCP servers and available
 * tools. Outputs a structured manifest that adapters use to inject tool
 * references into agent configuration files.
 *
 * Usage (module):
 *   const { discover } = require('./discover-tools');
 *   const result = discover('copilot', '/path/to/project');
 *
 * Usage (CLI):
 *   node tools/discover-tools.js --platform=copilot [--project-root=.]
 *
 * Outputs JSON to stdout when run as CLI.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─── Platform MCP Config Locations ───────────────────────────────────────────
//
// Each platform stores MCP server configs in different locations.
// Entries are tried in order; first found wins per location.

const PLATFORM_MCP_CONFIGS = {
  copilot: [
    // Workspace-level (project root)
    { relative: '.vscode/mcp.json',  scope: 'workspace', parser: parseVSCodeMcp },
  ],
  cursor: [
    { relative: '.cursor/mcp.json',  scope: 'workspace', parser: parseCursorMcp },
  ],
  'claude-code': [
    { relative: '.mcp.json',         scope: 'workspace', parser: parseGenericMcp },
  ],
  codex: [],
  kimi:  [],
};

// ─── Known MCP Server Registry ───────────────────────────────────────────────
//
// Maps server identifiers (config keys or Gallery IDs) to:
//   - name:        Human-readable display name
//   - description: What the server does
//   - source:      'gallery' (VS Code extension) | 'workspace' (mcp.json)
//   - tools:       Known tool IDs in Copilot frontmatter format
//   - roles:       Agent roles that benefit from this server
//   - aliases:     Alternative config keys that map to the same server
//
// Tool format for Copilot: <server-prefix>/<tool-name>

const KNOWN_SERVERS = {
  // ── Gallery / Extension MCPs ────────────────────────────────────────────
  'com.figma.mcp': {
    name: 'Figma',
    description: 'Read designs, variables, screenshots, and Code Connect mappings from Figma',
    source: 'gallery',
    tools: [
      'com.figma.mcp/get_design_context',
      'com.figma.mcp/get_screenshot',
      'com.figma.mcp/get_metadata',
      'com.figma.mcp/get_variable_defs',
      'com.figma.mcp/get_code_connect_map',
      'com.figma.mcp/generate_diagram',
    ],
    roles: ['designer'],
    aliases: ['figma-mcp', '@anthropic-ai/figma-mcp'],
  },

  'io.github.upstash/context7': {
    name: 'Context7',
    description: 'Up-to-date library documentation and code examples',
    source: 'gallery',
    tools: [
      'io.github.upstash/context7/get-library-docs',
      'io.github.upstash/context7/resolve-library-id',
    ],
    roles: ['architect', 'researcher', 'developer'],
    aliases: ['@upstash/context7-mcp', 'context7'],
  },

  'io.github.git': {
    name: 'GitHub',
    description: 'GitHub API — issues, PRs, repos, branches, code search',
    source: 'gallery',
    tools: [
      'io.github.git/get_file_contents',
      'io.github.git/search_code',
      'io.github.git/search_issues',
      'io.github.git/list_issues',
      'io.github.git/issue_read',
      'io.github.git/issue_write',
      'io.github.git/create_pull_request',
      'io.github.git/list_pull_requests',
      'io.github.git/pull_request_read',
      'io.github.git/create_branch',
      'io.github.git/list_branches',
      'io.github.git/list_commits',
    ],
    roles: ['developer', 'reviewer', 'director', 'ops'],
    aliases: ['github-mcp'],
  },

  // ── Workspace MCPs (common in .vscode/mcp.json) ────────────────────────

  'microsoft/markitdown': {
    name: 'MarkItDown',
    description: 'Convert documents (PDF, DOCX, PPTX, HTML) to Markdown',
    source: 'workspace',
    tools: ['microsoft/markitdown/convert_to_markdown'],
    roles: ['researcher', 'developer'],
    aliases: ['markitdown', 'markitdown-mcp'],
  },

  'tavily/tavily-mcp': {
    name: 'Tavily',
    description: 'Web search and content extraction with AI-optimized results',
    source: 'workspace',
    tools: [
      'tavily/tavily-mcp/tavily-search',
      'tavily/tavily-mcp/tavily-extract',
    ],
    roles: ['researcher'],
    aliases: ['tavily', 'tavily-mcp'],
  },

  'browsermcp': {
    name: 'Browser MCP',
    description: 'Browser automation — navigate, screenshot, click, type',
    source: 'workspace',
    tools: [
      'browsermcp/browser_navigate',
      'browsermcp/browser_screenshot',
      'browsermcp/browser_click',
      'browsermcp/browser_type',
      'browsermcp/browser_snapshot',
    ],
    roles: ['designer', 'developer'],
    aliases: ['@anthropic-ai/browsermcp', '@browsermcp/mcp'],
  },

  'penpot/penpot-mcp': {
    name: 'Penpot',
    description: 'Open-source design tool — read and manipulate designs',
    source: 'workspace',
    tools: [
      'penpot/penpot-mcp/execute_code',
      'penpot/penpot-mcp/export_shape',
      'penpot/penpot-mcp/import_image',
      'penpot/penpot-mcp/high_level_overview',
    ],
    roles: ['designer'],
    aliases: ['penpot'],
  },

  'dev.svelte/mcp': {
    name: 'Svelte',
    description: 'Svelte documentation, code examples, and autofixer',
    source: 'workspace',
    tools: [
      'dev.svelte/mcp/get-documentation',
      'dev.svelte/mcp/list-sections',
      'dev.svelte/mcp/svelte-autofixer',
    ],
    roles: ['developer'],
    aliases: ['svelte-mcp', '@sveltejs/mcp'],
  },

  'microsoft/playwright': {
    name: 'Playwright',
    description: 'Browser testing and automation via Playwright',
    source: 'workspace',
    tools: [
      'microsoft/playwright/browser_navigate',
      'microsoft/playwright/browser_snapshot',
      'microsoft/playwright/browser_click',
      'microsoft/playwright/browser_type',
      'microsoft/playwright/browser_take_screenshot',
    ],
    roles: ['developer', 'reviewer'],
    aliases: ['playwright', '@anthropic-ai/playwright-mcp'],
  },

  'snyk': {
    name: 'Snyk',
    description: 'Security scanning — code, dependencies, containers, IaC',
    source: 'workspace',
    tools: [
      'snyk/snyk_code_scan',
      'snyk/snyk_sca_scan',
      'snyk/snyk_iac_scan',
      'snyk/snyk_container_scan',
    ],
    roles: ['reviewer', 'ops'],
    aliases: ['snyk-mcp'],
  },

  'makenotion/notion': {
    name: 'Notion',
    description: 'Read and write Notion pages, databases, and comments',
    source: 'workspace',
    tools: [
      'makenotion/notion/notion-search',
      'makenotion/notion/notion-fetch',
      'makenotion/notion/notion-create-pages',
      'makenotion/notion/notion-update-page',
    ],
    roles: ['director', 'ops', 'researcher'],
    aliases: ['notion', 'notion-mcp'],
  },

  'gitkraken': {
    name: 'GitKraken / GitLens',
    description: 'Git operations — blame, log, diff, branch, stash, issues, PRs',
    source: 'workspace',
    tools: [
      'gitkraken/git_log_or_diff',
      'gitkraken/git_blame',
      'gitkraken/git_branch',
      'gitkraken/git_status',
    ],
    roles: ['developer', 'reviewer'],
    aliases: ['gitlens'],
  },
};

// ─── Role → MCP Relevance Mapping ───────────────────────────────────────────
//
// Which agent roles benefit from which MCP categories.
// Used when recommending tool assignments for discovered servers.

const ROLE_RELEVANCE_TAGS = {
  director:   ['project-management', 'issues', 'communication', 'search'],
  developer:  ['code', 'browser', 'docs', 'testing', 'git', 'framework'],
  reviewer:   ['security', 'code-analysis', 'git', 'testing'],
  architect:  ['docs', 'search', 'code-analysis'],
  researcher: ['search', 'docs', 'browser', 'content-extraction'],
  ops:        ['automation', 'issues', 'security', 'monitoring'],
  designer:   ['design', 'browser', 'visual'],
};

// ─── Parsers ─────────────────────────────────────────────────────────────────

/** Parse VS Code `.vscode/mcp.json` format */
function parseVSCodeMcp(content) {
  const data = JSON.parse(content);
  const servers = {};
  if (data.servers && typeof data.servers === 'object') {
    for (const [key, cfg] of Object.entries(data.servers)) {
      servers[key] = {
        id: key,
        type: cfg.type || 'stdio',
        command: cfg.command || null,
        args: cfg.args || [],
        url: cfg.url || null,
        hasEnvVars: !!(cfg.env && Object.keys(cfg.env).length > 0),
      };
    }
  }
  return servers;
}

/** Parse Cursor `.cursor/mcp.json` format */
function parseCursorMcp(content) {
  const data = JSON.parse(content);
  const servers = {};
  const source = data.mcpServers || data.servers || {};
  for (const [key, cfg] of Object.entries(source)) {
    servers[key] = {
      id: key,
      type: cfg.type || 'stdio',
      command: cfg.command || null,
      args: cfg.args || [],
      url: cfg.url || null,
      hasEnvVars: !!(cfg.env && Object.keys(cfg.env).length > 0),
    };
  }
  return servers;
}

/** Parse generic `.mcp.json` format (Claude Code, etc.) */
function parseGenericMcp(content) {
  const data = JSON.parse(content);
  const servers = {};
  const source = data.mcpServers || data.servers || {};
  for (const [key, cfg] of Object.entries(source)) {
    servers[key] = {
      id: key,
      type: cfg.type || 'stdio',
      command: cfg.command || null,
      args: cfg.args || [],
      url: cfg.url || null,
      hasEnvVars: !!(cfg.env && Object.keys(cfg.env).length > 0),
    };
  }
  return servers;
}

// ─── Discovery Engine ────────────────────────────────────────────────────────

/**
 * Match a discovered server key against the known registry.
 * Checks exact match first, then aliases.
 * @returns {object|null} Matching registry entry or null.
 */
function matchKnownServer(serverKey) {
  // Exact match
  if (KNOWN_SERVERS[serverKey]) return { registryId: serverKey, ...KNOWN_SERVERS[serverKey] };

  // Alias match
  for (const [regId, entry] of Object.entries(KNOWN_SERVERS)) {
    if (entry.aliases && entry.aliases.some(a => serverKey.includes(a) || a.includes(serverKey))) {
      return { registryId: regId, ...entry };
    }
  }

  // Partial match (server key contains registry key or vice versa)
  for (const [regId, entry] of Object.entries(KNOWN_SERVERS)) {
    const normKey = serverKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normReg = regId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normKey.includes(normReg) || normReg.includes(normKey)) {
      return { registryId: regId, ...entry };
    }
  }

  return null;
}

/**
 * Discover MCP servers configured for the given platform.
 *
 * @param {string} platform   - 'copilot' | 'cursor' | 'claude-code' | 'codex' | 'kimi'
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {{ servers: object[], manifest: object }}
 */
function discover(platform, projectRoot) {
  const configs = PLATFORM_MCP_CONFIGS[platform] || [];
  const discovered = {};

  for (const { relative, scope, parser } of configs) {
    const fullPath = path.resolve(projectRoot, relative);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const servers = parser(content);

      for (const [key, cfg] of Object.entries(servers)) {
        const known = matchKnownServer(key);
        discovered[key] = {
          configKey: key,
          source: relative,
          scope,
          type: cfg.type,
          command: cfg.command,
          hasEnvVars: cfg.hasEnvVars,
          known: !!known,
          registryId: known ? known.registryId : null,
          name: known ? known.name : key,
          description: known ? known.description : null,
          tools: known ? known.tools : [],
          suggestedRoles: known ? known.roles : [],
        };
      }
    } catch (e) {
      // Skip unparseable config files
    }
  }

  return {
    platform,
    projectRoot,
    discoveredAt: new Date().toISOString(),
    serverCount: Object.keys(discovered).length,
    knownCount: Object.values(discovered).filter(s => s.known).length,
    servers: discovered,
  };
}

/**
 * Given discovery results and a list of selected agent IDs,
 * compute per-agent MCP tool assignments.
 *
 * @param {object} discoveryResult - Output of discover()
 * @param {string[]} agentIds       - Selected agent IDs
 * @returns {Object<string, string[]>} Map of agentId → tool ID array
 */
function computeAgentMcpTools(discoveryResult, agentIds) {
  const assignments = {};

  for (const agentId of agentIds) {
    const tools = new Set();

    for (const server of Object.values(discoveryResult.servers)) {
      if (!server.known || server.tools.length === 0) continue;

      // Check if this agent's role is in the server's suggested roles
      if (server.suggestedRoles.includes(agentId)) {
        for (const tool of server.tools) {
          tools.add(tool);
        }
      }
    }

    if (tools.size > 0) {
      assignments[agentId] = [...tools];
    }
  }

  return assignments;
}

/**
 * Build a tools manifest for writing to .rna/tools-manifest.json
 *
 * @param {object} discoveryResult    - Output of discover()
 * @param {Object<string, string[]>} agentTools - Output of computeAgentMcpTools()
 * @returns {object} Manifest object
 */
function buildManifest(discoveryResult, agentTools) {
  return {
    _note: 'Auto-generated by RNA Method tool discovery. Re-run init or /rna.setup to refresh.',
    discoveredAt: discoveryResult.discoveredAt,
    platform: discoveryResult.platform,
    summary: {
      totalServers: discoveryResult.serverCount,
      knownServers: discoveryResult.knownCount,
      unknownServers: discoveryResult.serverCount - discoveryResult.knownCount,
    },
    servers: Object.fromEntries(
      Object.entries(discoveryResult.servers).map(([key, s]) => [key, {
        name: s.name,
        description: s.description,
        source: s.source,
        type: s.type,
        known: s.known,
        tools: s.tools,
        suggestedRoles: s.suggestedRoles,
      }])
    ),
    agentTools,
  };
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const getFlag = (name) => {
    const m = args.find(a => a.startsWith(`--${name}=`));
    return m ? m.split('=').slice(1).join('=') : null;
  };

  const platform    = getFlag('platform') || 'copilot';
  const projectRoot = getFlag('project-root') || process.cwd();
  const agentsFlag  = getFlag('agents');
  const agentIds    = agentsFlag ? agentsFlag.split(',') : ['director', 'developer', 'reviewer', 'architect', 'researcher', 'ops', 'designer'];

  const result     = discover(platform, projectRoot);
  const agentTools = computeAgentMcpTools(result, agentIds);
  const manifest   = buildManifest(result, agentTools);

  if (args.includes('--quiet')) {
    // Machine-readable: just the agent tools JSON
    process.stdout.write(JSON.stringify(agentTools));
  } else {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  discover,
  computeAgentMcpTools,
  buildManifest,
  matchKnownServer,
  KNOWN_SERVERS,
  PLATFORM_MCP_CONFIGS,
};
