#!/usr/bin/env node
/**
 * RNA Studio — standalone server (pure Node.js, zero npm dependencies)
 *
 * Serves the pre-built Vite SPA from ./dist/ and exposes /api/* endpoints
 * that read RNA Method files from the target project directory.
 *
 * Usage:
 *   node server.js                          ← reads RNA files from cwd
 *   node server.js /path/to/project         ← explicit project root
 *   RNA_STUDIO_PORT=8080 node server.js     ← custom port
 *
 * Installed location:  <project>/.rna/studio/server.js
 * Source location:     open-source/rna-method/studio/server.js
 */

import http   from 'node:http';
import fs     from 'node:fs';
import path   from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.RNA_STUDIO_PORT ?? '7337', 10);
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const DIST = path.join(__dirname, 'dist');

// ── MIME map ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2': 'font/woff2',
};

// ── Security helpers ─────────────────────────────────────────────────────────

/** Resolve `rel` under `base`, returning null if it escapes `base`. */
function safe(base, rel) {
  const resolved = path.resolve(base, rel);
  if (!resolved.startsWith(path.resolve(base) + path.sep) && resolved !== path.resolve(base)) {
    return null;
  }
  return resolved;
}

// ── Response helpers ─────────────────────────────────────────────────────────

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(data));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ── SSE: real-time change notifications ──────────────────────────────────────

const sseClients = new Set();

function sseWrite(client, data) {
  try { client.write(`data: ${JSON.stringify(data)}\n\n`); } catch { sseClients.delete(client); }
}

function broadcastChange(rel) {
  if (sseClients.size === 0) return;
  const payload = { type: 'changed', file: rel, ts: Date.now() };
  sseClients.forEach((c) => sseWrite(c, payload));
}

// Debounce map prevents double-fires from atomic writes
const debounceMap = new Map();

function watchRnaFile(rel) {
  const fp = path.resolve(ROOT, rel);
  if (!fs.existsSync(fp)) return;
  try {
    fs.watch(fp, () => {
      clearTimeout(debounceMap.get(rel));
      debounceMap.set(rel, setTimeout(() => broadcastChange(rel), 300));
    });
  } catch { /* file may not be watchable on all systems */ }
}

[
  '_memory/rna-method/receptors.json',
  '_memory/rna-method/timeline.json',
  '_memory/rna-method/agent-context.json',
].forEach(watchRnaFile);

/**
 * Watch _memory/agents/ for per-agent activity.json writes.
 * Each agent dir may contain activity.json that the agent updates continuously.
 */
function watchAgentActivityDir() {
  const agentsDir = path.resolve(ROOT, '_memory/agents');
  if (!fs.existsSync(agentsDir)) return;
  try {
    fs.watch(agentsDir, { recursive: true }, (event, filename) => {
      if (!filename || !filename.endsWith('activity.json')) return;
      const rel = `_memory/agents/${filename.replace(/\\/g, '/')}`;
      clearTimeout(debounceMap.get(rel));
      debounceMap.set(rel, setTimeout(() => broadcastChange(rel), 300));
    });
  } catch { /* recursive fs.watch not available on all platforms */ }
}
watchAgentActivityDir();

// Heartbeat keeps SSE connections alive through idle proxies
setInterval(() => {
  sseClients.forEach((c) => {
    try { c.write(': ping\n\n'); } catch { sseClients.delete(c); }
  });
}, 30_000);

function apiEvents(req, res) {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(': connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
}

// ── API handlers ─────────────────────────────────────────────────────────────

function apiAgents(res) {
  try {
    const rp = safe(ROOT, '_memory/rna-method/receptors.json');
    if (!rp) return json(res, { error: 'path forbidden' }, 403);
    const receptors = readJson(rp);

    let timeline = {};
    try {
      const tp = safe(ROOT, '_memory/rna-method/timeline.json');
      if (tp) timeline = readJson(tp);
    } catch { /* no timeline file — skip */ }

    const profiles = timeline.teamProfiles ?? {};
    const agents = (receptors.agents ?? []).map((a) => ({
      ...a,
      lastActive: profiles[a.id]?.lastActive ?? null,
      lastTask:   profiles[a.id]?.lastTask   ?? null,
    }));
    json(res, { agents });
  } catch (e) {
    json(res, { error: e.message }, 500);
  }
}

function apiAgentActivity(res) {
  try {
    const agentsDir = safe(ROOT, '_memory/agents');
    if (!agentsDir || !fs.existsSync(agentsDir)) return json(res, { activities: [] });

    const agentDirs = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const activities = [];
    for (const agentId of agentDirs) {
      const activityPath = safe(agentsDir, `${agentId}/activity.json`);
      if (!activityPath || !fs.existsSync(activityPath)) continue;
      try {
        const data = readJson(activityPath);
        activities.push({ agentId, ...data });
      } catch { /* malformed activity.json — skip */ }
    }
    json(res, { activities });
  } catch (e) { json(res, { error: e.message }, 500); }
}

function apiRnaConfig(res) {
  try {
    // Prefer .rna/config.json (installed location), fall back to open-source/rna-method/studio
    const configPath = safe(ROOT, '.rna/config.json');
    if (configPath && fs.existsSync(configPath)) {
      return json(res, readJson(configPath));
    }
    json(res, { _note: 'No .rna/config.json found. Run tools/init.js to initialise.' });
  } catch (e) { json(res, { error: e.message }, 500); }
}

function apiContext(res) {
  try {
    const p = safe(ROOT, '_memory/rna-method/agent-context.json');
    if (!p) return json(res, { error: 'path forbidden' }, 403);
    json(res, readJson(p));
  } catch (e) { json(res, { error: e.message }, 500); }
}

function apiTimeline(res) {
  try {
    const tp = safe(ROOT, '_memory/rna-method/timeline.json');
    const rp = safe(ROOT, '_memory/rna-method/receptors.json');
    if (!tp || !rp) return json(res, { error: 'path forbidden' }, 403);
    const timeline  = readJson(tp);
    const receptors = readJson(rp);
    json(res, { ...timeline, agents: receptors.agents ?? [] });
  } catch (e) { json(res, { error: e.message }, 500); }
}

function buildTree(dir, rel) {
  const full = path.join(dir, rel);
  try {
    const entries = fs.readdirSync(full, { withFileTypes: true });
    return entries
      .filter((e) => !e.name.startsWith('.'))
      .map((e) => {
        const childRel = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
          return { name: e.name, type: 'dir', path: childRel, children: buildTree(dir, childRel) };
        }
        const ext = path.extname(e.name);
        if (['.md', '.json', '.txt'].includes(ext)) {
          return { name: e.name, type: 'file', path: childRel, ext };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function apiMemory(res) {
  try {
    const memDir = safe(ROOT, '_memory');
    if (!memDir) return json(res, { error: 'path forbidden' }, 403);
    json(res, { tree: buildTree(memDir, '') });
  } catch (e) { json(res, { error: e.message }, 500); }
}

function apiMemoryFile(res, slug) {
  try {
    const memDir = safe(ROOT, '_memory');
    if (!memDir) return json(res, { error: 'path forbidden' }, 403);
    // slug may contain path segments; validate each segment
    const filePath = safe(memDir, slug);
    if (!filePath) return json(res, { error: 'forbidden' }, 403);
    if (!fs.existsSync(filePath)) return json(res, { error: 'not found' }, 404);
    const content = fs.readFileSync(filePath, 'utf-8');
    json(res, { content, ext: path.extname(filePath) });
  } catch (e) { json(res, { error: e.message }, 404); }
}

function apiJoins(res) {
  try {
    const joinsDir = safe(ROOT, '.github/agents/joins');
    if (!joinsDir || !fs.existsSync(joinsDir)) {
      return json(res, { joins: [] });
    }
    const files = fs.readdirSync(joinsDir).filter((f) => f.endsWith('.md'));
    const joins = files.map((f) => {
      const content    = fs.readFileSync(path.join(joinsDir, f), 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const agentMatch = content.match(/agents?[:\s]+(.+)/im);
      return {
        id:        f.replace('.md', ''),
        title:     titleMatch ? titleMatch[1].trim() : f,
        file:      f,
        agentLine: agentMatch ? agentMatch[1].trim() : '',
        content,
      };
    });
    json(res, { joins });
  } catch (e) { json(res, { error: e.message }, 500); }
}

function apiPlatforms(res) {
  try {
    const adaptersDir = safe(ROOT, 'open-source/rna-method/adapters');
    if (!adaptersDir || !fs.existsSync(adaptersDir)) {
      return json(res, { platforms: [] });
    }
    const entries  = fs.readdirSync(adaptersDir, { withFileTypes: true });
    const platforms = entries
      .filter((e) => e.isDirectory())
      .map((dir) => {
        const d     = path.join(adaptersDir, dir.name);
        const files = fs.readdirSync(d);
        let description = '';
        try {
          const readme = fs.readFileSync(path.join(d, 'README.md'), 'utf-8');
          description  = readme.split('\n').filter((l) => !l.startsWith('#') && l.trim())[0] ?? '';
        } catch { /* no README */ }
        const adapterFile = files.find((f) => f.endsWith('-adapter.js') || f.endsWith('-adapter.md')) ?? null;
        return { id: dir.name, name: dir.name.replace(/-/g, ' '), files, adapterFile, description };
      });
    json(res, { platforms });
  } catch (e) { json(res, { error: e.message }, 500); }
}

// ── Static file server ───────────────────────────────────────────────────────

function serveStatic(req, res) {
  const url  = new URL(req.url, `http://localhost:${PORT}`);
  let urlPath = url.pathname;
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST, urlPath);
  // Security: stay inside DIST
  if (!filePath.startsWith(DIST + path.sep) && filePath !== DIST) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext  = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    // SPA fallback: serve index.html for client-side routing
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(DIST, 'index.html')));
    } catch {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('RNA Studio has not been built yet. Run: npm run build inside open-source/rna-method/studio/');
    }
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' });
    res.end();
    return;
  }

  // API routes
  if (pathname === '/api/events')              return apiEvents(req, res);
  if (pathname === '/api/agents')              return apiAgents(res);
  if (pathname === '/api/agent-activity')      return apiAgentActivity(res);
  if (pathname === '/api/context')             return apiContext(res);
  if (pathname === '/api/timeline')            return apiTimeline(res);
  if (pathname === '/api/memory')              return apiMemory(res);
  if (pathname.startsWith('/api/memory/'))     return apiMemoryFile(res, pathname.slice(12));
  if (pathname === '/api/joins')               return apiJoins(res);
  if (pathname === '/api/platforms')           return apiPlatforms(res);
  if (pathname === '/api/rna-config')          return apiRnaConfig(res);

  // Static
  serveStatic(req, res);
});

server.listen(PORT, () => {
  const projectName = ROOT.split(path.sep).pop() ?? ROOT;
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   RNA Studio                            │
  │   http://localhost:${PORT}                │
  │                                         │
  │   Project: ${projectName.padEnd(29)} │
  │   Root:    ${ROOT.length > 29 ? '…' + ROOT.slice(-28) : ROOT.padEnd(29)} │
  │                                         │
  └─────────────────────────────────────────┘
`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  ✗ Port ${PORT} is already in use. Set RNA_STUDIO_PORT to a different port.\n`);
  } else {
    console.error('\n  ✗ Server error:', e.message, '\n');
  }
  process.exit(1);
});
