import { useState, lazy, Suspense } from 'react';
import { useRnaEvents } from './use-rna-events';

const AgentCanvas  = lazy(() => import('./canvas'));
const Panels       = lazy(() => import('./panels'));

const TABS = [
  { id: 'canvas',    label: 'Canvas',    icon: '◉' },
  { id: 'joins',     label: 'Joins',     icon: '⌥' },
  { id: 'memory',    label: 'Memory',    icon: '⊞' },
  { id: 'team',      label: 'Team',      icon: '⊛' },
  { id: 'signals',   label: 'Signals',   icon: '⌁' },
  { id: 'schema',    label: 'Schema',    icon: '⊡' },
  { id: 'platforms', label: 'Platforms', icon: '⊟' },
] as const;

type Tab = typeof TABS[number]['id'];

const nav: React.CSSProperties = {
  width: 176, flexShrink: 0, background: 'var(--panel)',
  borderRight: '1px solid var(--line)', display: 'flex',
  flexDirection: 'column', padding: '14px 8px', gap: 2,
};

const btnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
  borderRadius: 7, background: 'transparent', color: 'var(--fg-muted)',
  width: '100%', textAlign: 'left', fontSize: 12.5, transition: 'background .12s, color .12s',
};

const btnActive: React.CSSProperties = {
  background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600,
};

function Loader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 12 }}>
      Loading…
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('canvas');
  const { connected } = useRnaEvents();

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <nav style={nav}>
        <div style={{ padding: '0 6px 10px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6 }}>
            RNA STUDIO
            <span
              title={connected ? 'Live — watching RNA files' : 'Connecting…'}
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                background: connected ? 'var(--success)' : '#44444a',
                boxShadow: connected ? '0 0 4px var(--success)' : 'none',
                transition: 'background .4s, box-shadow .4s',
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 1 }}>Agent Collective</div>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={tab === t.id ? { ...btnBase, ...btnActive } : btnBase}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Suspense fallback={<Loader />}>
          {tab === 'canvas' ? (
            <AgentCanvas />
          ) : (
            <Panels view={tab} />
          )}
        </Suspense>
      </main>
    </div>
  );
}
