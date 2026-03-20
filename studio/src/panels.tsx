import { useEffect, useState } from 'react';
import { useRnaEvents } from './use-rna-events';
import { api, type Agent, type MemoryNode, type JoinPattern, type Platform } from './api';

// ── Shared style primitives ───────────────────────────────────────────────
const page: React.CSSProperties  = { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' };
const hdr: React.CSSProperties   = { padding: '13px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0 };
const body: React.CSSProperties  = { flex: 1, overflowY: 'auto', padding: 20 };
const card: React.CSSProperties  = { background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 10, padding: 14, marginBottom: 10 };
const label: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };

function H1({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={hdr}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Chip({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 4, display: 'inline-block',
      background: accent ? 'var(--accent-soft)' : 'var(--panel)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--line)'}`,
      color: accent ? 'var(--accent)' : 'var(--fg-muted)',
    }}>{text}</span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const c = tier === 'high-reasoning' ? '#9333ea' : tier === 'balanced' ? '#2563eb' : '#059669';
  return (
    <span style={{ fontSize: 9, fontWeight: 700, background: `${c}22`, color: c, padding: '2px 7px', borderRadius: 4, display: 'inline-block' }}>
      {tier}
    </span>
  );
}

function Loading() {
  return <div style={{ padding: 24, color: 'var(--fg-muted)', fontSize: 12 }}>Loading…</div>;
}

// ── Joins Panel ───────────────────────────────────────────────────────────
export function JoinsPanel() {
  const [joins, setJoins]     = useState<JoinPattern[]>([]);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { tick } = useRnaEvents();

  useEffect(() => {
    Promise.all([api.joins(), api.context()]).then(([j, c]) => {
      setJoins(j.joins ?? []);
      setContext(c);
    }).finally(() => setLoading(false));
  }, [tick]);

  const toggle = (id: string) => setExpanded(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const active    = (context.activeJoins    as unknown[]) ?? [];
  const pending   = (context.pendingJoins   as unknown[]) ?? [];
  const completed = (context.completedJoins as unknown[]) ?? [];

  if (loading) return <Loading />;

  return (
    <div style={page}>
      <H1 title="Join Flows" sub="Active orchestration patterns and pattern library" />
      <div style={body}>
        {active.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={label}>Active ({active.length})</div>
            {active.map((j: unknown) => {
              const join = j as Record<string, string>;
              return (
                <div key={join.id} style={{ ...card, borderColor: 'var(--accent)' }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{join.id}</div>
                  {join.pattern && <Chip text={join.pattern} accent />}
                </div>
              );
            })}
          </section>
        )}
        {pending.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={label}>Pending ({pending.length})</div>
            {pending.map((j: unknown) => {
              const join = j as Record<string, string>;
              return (
                <div key={join.id} style={card}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{join.id}</div>
                </div>
              );
            })}
          </section>
        )}
        <section style={{ marginBottom: 24 }}>
          <div style={label}>Pattern Library ({joins.length})</div>
          {joins.map((j) => (
            <div key={j.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{j.title}</div>
                  {j.agentLine && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{j.agentLine}</div>}
                </div>
                <button
                  onClick={() => toggle(j.id)}
                  style={{ background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--fg-muted)', borderRadius: 5, padding: '3px 8px', fontSize: 11 }}
                >{expanded.has(j.id) ? '▲ Hide' : '▼ Show'}</button>
              </div>
              {expanded.has(j.id) && (
                <pre style={{ marginTop: 12, fontSize: 10, color: 'var(--fg-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 6, padding: 10 }}>
                  {j.content}
                </pre>
              )}
            </div>
          ))}
        </section>
        {completed.length > 0 && (
          <section>
            <div style={label}>Completed ({completed.length})</div>
            {completed.map((j: unknown) => {
              const join = j as Record<string, string>;
              return (
                <div key={join.id} style={{ ...card, opacity: 0.6 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{join.id}</div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

// ── Memory Panel ──────────────────────────────────────────────────────────
function TreeItem({ node, depth, onSelect }: { node: MemoryNode; depth: number; onSelect: (n: MemoryNode) => void }) {
  const [open, setOpen] = useState(depth < 1 || ['agents', 'rna-method'].includes(node.name));

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', color: open ? 'var(--accent)' : 'var(--fg)', padding: '3px 0', paddingLeft: depth * 14, display: 'block', width: '100%', textAlign: 'left', fontSize: 11 }}
        >
          {open ? '▾' : '▸'} {node.name}/
        </button>
        {open && node.children?.map((c) => <TreeItem key={c.path} node={c} depth={depth + 1} onSelect={onSelect} />)}
      </div>
    );
  }
  return (
    <button
      onClick={() => onSelect(node)}
      style={{ background: 'none', color: 'var(--fg-muted)', padding: '2px 0', paddingLeft: depth * 14 + 14, display: 'block', width: '100%', textAlign: 'left', fontSize: 11 }}
    >
      {node.name}
    </button>
  );
}

export function MemoryPanel() {
  const [tree, setTree]         = useState<MemoryNode[]>([]);
  const [selected, setSelected] = useState<MemoryNode | null>(null);
  const [content, setContent]   = useState<string>('');
  const [loading, setLoading]   = useState(true);
  const { tick } = useRnaEvents();

  useEffect(() => {
    api.memory().then((d) => setTree(d.tree ?? [])).finally(() => setLoading(false));
    // Re-fetch currently open file so edits made by agents appear immediately
    if (selected) api.memoryFile(selected.path).then((d) => setContent(d.content ?? ''));
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (node: MemoryNode) => {
    setSelected(node);
    const d = await api.memoryFile(node.path);
    setContent(d.content ?? '');
  };

  if (loading) return <Loading />;

  return (
    <div style={page}>
      <H1 title="Memory Browser" sub="Agent session logs, checkpoints, and RNA context files" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--line)', padding: '12px 10px', overflowY: 'auto', background: 'var(--panel)' }}>
          {tree.map((n) => <TreeItem key={n.path} node={n} depth={0} onSelect={pick} />)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {selected ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 10 }}>{selected.path}</div>
              <pre style={{ fontSize: 10.5, fontFamily: selected.ext === '.json' ? 'monospace' : 'inherit', color: 'var(--fg)', background: 'var(--panel)', borderRadius: 8, padding: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                {content}
              </pre>
            </>
          ) : (
            <div style={{ color: 'var(--fg-muted)', fontSize: 12, paddingTop: 20 }}>Select a file to view its contents</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Team Panel ────────────────────────────────────────────────────────────
export function TeamPanel() {
  const [agents, setAgents]   = useState<Agent[]>([]);
  const [project, setProject] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { tick } = useRnaEvents();

  useEffect(() => {
    api.timeline().then((d) => {
      setAgents(d.agents ?? []);
      setProject(d.projectState ?? {});
    }).finally(() => setLoading(false));
  }, [tick]);

  if (loading) return <Loading />;

  const areas     = (project.activeAreas    as string[]) ?? [];
  const decisions = (project.knownDecisions as string[]) ?? [];
  const questions = (project.openQuestions  as string[]) ?? [];

  return (
    <div style={page}>
      <H1 title="Team Dashboard" sub="Agent roster and current project state" />
      <div style={body}>
        <div style={label}>Agent Roster ({agents.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 28 }}>
          {agents.map((a) => (
            <div key={a.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{a.id}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{a.role}</div>
                </div>
                <TierBadge tier={a.modelTier} />
              </div>
              {a.lastTask && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 6, borderTop: '1px solid var(--line)', paddingTop: 6 }}>{a.lastTask}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {[
            { title: 'Active Areas',     items: areas,     color: 'var(--accent)' },
            { title: 'Known Decisions',  items: decisions, color: 'var(--success)' },
            { title: 'Open Questions',   items: questions, color: 'var(--warn)' },
          ].map(({ title, items, color }) => (
            <div key={title} style={card}>
              <div style={{ ...label, color }}>{title} ({items.length})</div>
              <ul style={{ paddingLeft: 14, fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.8 }}>
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Signals Panel ─────────────────────────────────────────────────────────
export function SignalsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [text, setText]     = useState('');
  const [matched, setMatched] = useState<Agent[] | null>(null);
  const { tick } = useRnaEvents();

  useEffect(() => { api.agents().then((d) => setAgents(d.agents ?? [])); }, [tick]);

  const simulate = () => {
    const q = text.toLowerCase();
    if (!q.trim()) { setMatched(null); return; }
    setMatched(
      agents.filter((a) =>
        (a.matchCategories ?? []).some((c) => c.toLowerCase().includes(q)) ||
        (a.matchKeywords   ?? []).some((k) => k.toLowerCase().includes(q))
      )
    );
  };

  return (
    <div style={page}>
      <H1 title="Signal Console" sub="Simulate receptor routing and inspect agent match rules" />
      <div style={body}>
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={label}>Signal Simulator</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && simulate()}
              placeholder="Type a signal or task description…"
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 6, padding: '7px 11px', color: 'var(--fg)', fontSize: 12, outline: 'none' }}
            />
            <button
              onClick={simulate}
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 6, padding: '7px 14px', fontSize: 11, fontWeight: 600 }}
            >Route →</button>
          </div>
          {matched !== null && (
            <div style={{ marginTop: 14 }}>
              {matched.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>No matching agents found</div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8 }}>✓ {matched.length} agent{matched.length > 1 ? 's' : ''} matched</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matched.map((a) => (
                      <div key={a.id} style={{ background: 'var(--panel)', border: '1px solid var(--accent)', borderRadius: 7, padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--accent)' }}>{a.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{a.autoApprove ? 'auto' : 'manual'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={label}>Receptor Registry</div>
        {agents.map((a) => (
          <div key={a.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 90 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{a.id}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>{a.role}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                {(a.matchCategories ?? []).map((c) => <Chip key={c} text={c} />)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(a.matchKeywords ?? []).map((k) => <Chip key={k} text={k} accent />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Schema Panel ──────────────────────────────────────────────────────────
export function SchemaPanel() {
  const [raw, setRaw]       = useState('');
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { tick } = useRnaEvents();

  useEffect(() => {
    api.memoryFile('rna-method/receptors.json').then((d) => {
      setRaw(d.content ?? '');
      try { setParsed(JSON.parse(d.content)); } catch { /* invalid JSON */ }
    }).finally(() => setLoading(false));
  }, [tick]);

  if (loading) return <Loading />;

  const agents  = Array.isArray(parsed?.agents)  ? parsed!.agents  as { id: string; role: string }[] : [];
  const rules   = Array.isArray(parsed?.rules)   ? parsed!.rules   as unknown[] : [];

  return (
    <div style={page}>
      <H1 title="Schema Studio" sub="Inspect the RNA agent registry (receptors.json)" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--line)', padding: 14, overflowY: 'auto', background: 'var(--panel)' }}>
          <div style={label}>Agents ({agents.length})</div>
          {agents.map((a) => (
            <div key={a.id} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>{a.id}</span>
              <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 5 }}>{a.role}</span>
            </div>
          ))}
          <div style={{ ...label, marginTop: 14 }}>Rules ({rules.length})</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 10 }}>_memory/rna-method/receptors.json</div>
          <pre style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--fg)', background: 'var(--panel)', borderRadius: 8, padding: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{raw}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Platforms Panel ───────────────────────────────────────────────────────
const PLATFORM_ICON: Record<string, string> = {
  cursor: '🖱️', copilot: '🤖', 'claude-code': '🔶', codex: '⚡', kimi: '🌙',
};

export function PlatformsPanel() {
  const [platforms, setPlatforms]   = useState<Platform[]>([]);
  const [selected, setSelected]     = useState<Platform | null>(null);
  const [loading, setLoading]       = useState(true);
  const { tick } = useRnaEvents();

  useEffect(() => {
    api.platforms().then((d) => setPlatforms(d.platforms ?? [])).finally(() => setLoading(false));
  }, [tick]);

  if (loading) return <Loading />;

  return (
    <div style={page}>
      <H1 title="Platform Adapters" sub="RNA Method adapters installed for each AI coding platform" />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                style={{
                  ...card, textAlign: 'left', cursor: 'pointer',
                  borderColor: selected?.id === p.id ? 'var(--accent)' : 'var(--line)',
                  background: selected?.id === p.id ? 'var(--accent-soft)' : 'var(--panel2)',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{PLATFORM_ICON[p.id] ?? '🔌'}</div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.5 }}>{p.description.slice(0, 80)}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {p.files.map((f) => <Chip key={f} text={f} />)}
                </div>
              </button>
            ))}
          </div>
        </div>
        {selected && (
          <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid var(--line)', background: 'var(--panel)', padding: 18, overflowY: 'auto' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{PLATFORM_ICON[selected.id] ?? '🔌'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{selected.name}</div>
            <div style={{ fontSize: 10, color: 'var(--success)', marginBottom: 14 }}>✓ Present</div>
            <div style={label}>Files</div>
            {selected.files.map((f) => (
              <div key={f} style={{ fontSize: 11, color: 'var(--fg)', padding: '2px 0' }}>{f}</div>
            ))}
            {selected.description && (
              <>
                <div style={{ ...label, marginTop: 14 }}>Description</div>
                <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.6 }}>{selected.description}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────
type View = 'joins' | 'memory' | 'team' | 'signals' | 'schema' | 'platforms';

export default function Panels({ view }: { view: View }) {
  if (view === 'joins')     return <JoinsPanel />;
  if (view === 'memory')    return <MemoryPanel />;
  if (view === 'team')      return <TeamPanel />;
  if (view === 'signals')   return <SignalsPanel />;
  if (view === 'schema')    return <SchemaPanel />;
  if (view === 'platforms') return <PlatformsPanel />;
  return null;
}
