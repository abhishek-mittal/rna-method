import { useEffect, useCallback, useState } from 'react';
import { useRnaEvents } from './use-rna-events';
import {
  ReactFlow, Background, Controls, MiniMap, Panel,
  useNodesState, useEdgesState, Handle, Position,
  BackgroundVariant, MarkerType,
  type Node, type Edge, type NodeProps, type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api, type Agent, type AgentActivity } from './api';

const TIER_COLOR: Record<string, string> = {
  'foundation':    '#d97706',   // amber — the base substrate
  'high-reasoning': '#9333ea',
  balanced:         '#2563eb',
  fast:             '#059669',
};

// ── Custom node ────────────────────────────────────────────────────────────
function AgentNodeComponent({ data, selected }: NodeProps) {
  const a          = data as unknown as Agent;
  const color      = TIER_COLOR[a.modelTier] ?? '#555566';
  const isBase     = a.id === '_base-agent' || a.modelTier === 'foundation';
  const isDirector = !isBase && (a.isPrimaryDirector === true || (a.id === 'abhishek' && a.modelTier === 'high-reasoning'));
  const daysAgo    = a.lastActive
    ? Math.floor((Date.now() - new Date(a.lastActive).getTime()) / 86_400_000)
    : 999;
  const isRecent = daysAgo <= 30;

  return (
    <>
      <Handle type="target" position={Position.Top}
        style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <div
        className={[
          'rna-node',
          selected     ? 'rna-node--float'       : '',
          isBase       ? 'rna-node--base'        : '',
        ].filter(Boolean).join(' ')}
        style={{
          '--nc': color,
          borderColor: `${color}55`,
          boxShadow: selected
            ? `0 0 0 2px ${color}, 0 4px 24px ${color}50`
            : isBase ? `0 0 20px ${color}30, 0 2px 12px #00000050`
            : `0 2px 12px #00000050`,
        } as React.CSSProperties}
      >
        {isDirector && (
          <div className="rna-orbit-ring" style={{ borderColor: `${color}40` }} />
        )}
        {isBase && (
          <div className="rna-base-ring" style={{ borderColor: `${color}35` }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Crown indicator — human entry point */}
            {isDirector && (
              <span title="Human entry point" style={{ fontSize: 12, lineHeight: 1 }}>&#x1F451;</span>
            )}
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--fg)' }}>{a.id}</div>
          </div>
          {isRecent && !a.status && (
            <span
              className="rna-active-dot"
              style={{ '--nc': color } as React.CSSProperties}
              title={`Active ${daysAgo}d ago`}
            />
          )}
        </div>
        {/* role */}
        <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginBottom: 5, lineHeight: 1.4 }}>{a.role}</div>
        {/* Jira-style status lozenge */}
        {a.status === 'in-progress' && (
          <div className="rna-status-badge rna-status--in-progress" style={{ marginBottom: 5 }}>
            <span className="rna-status-spinner" />
            In Progress
          </div>
        )}
        {a.status === 'pending' && (
          <div className="rna-status-badge rna-status--pending" style={{ marginBottom: 5 }}>
            <span style={{ fontSize: 9 }}>●</span>
            Pending
          </div>
        )}
        <div style={{
          display: 'inline-block', fontSize: 9, fontWeight: 700,
          background: `${color}22`, color, padding: '2px 6px', borderRadius: 4,
        }}>
          {isBase   ? '§base'          :
           isDirector ? '§director'      :
           a.modelTier}
        </div>
        {/* Task chip — what the agent is currently working on */}
        {a.currentTask && (
          <div className="rna-task-chip" title={a.currentTask}>{a.currentTask}</div>
        )}
        {/* Base-agent shows that it is foundation encapsulation, not invokable */}
        {isBase && (
          <div style={{ fontSize: 9, color: `${color}99`, marginTop: 5, lineHeight: 1.5, fontStyle: 'italic' }}>
            base encapsulation — not invoked directly
          </div>
        )}
        {/* Director shows human-accessible indicator */}
        {isDirector && (
          <div style={{ fontSize: 9, color: 'var(--success)', marginTop: 4 }}>● human entry point</div>
        )}
        {!isBase && !isDirector && a.autoApprove && (
          <div style={{ fontSize: 9, color: 'var(--success)', marginTop: 4 }}>● auto-approve</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom}
        style={{ background: color, border: 'none', width: 7, height: 7 }} />
    </>
  );
}
AgentNodeComponent.displayName = 'AgentNode';

const NODE_TYPES: NodeTypes = { agentNode: AgentNodeComponent };

// ── Layout helpers ─────────────────────────────────────────────────────────
function layoutNodes(agents: Agent[]): Node[] {
  const cx = 480, cy = 360, radius = 300;
  const base     = agents.find((a) => a.id === '_base-agent' || a.modelTier === 'foundation');
  const director = agents.find((a) => a.isPrimaryDirector === true)
                ?? agents.find((a) => a.id !== '_base-agent' && (a.id === 'abhishek' || a.modelTier === 'high-reasoning'))
                ?? agents.find((a) => a.id !== '_base-agent')!;
  const rest = agents.filter((a) => a.id !== director?.id && a.id !== '_base-agent');

  const nodes: Node[] = [
    {
      id: director.id, type: 'agentNode',
      position: { x: cx - 75, y: cy - 40 },
      data: director as unknown as Record<string, unknown>,
    },
    ...rest.map((a, i) => {
      const angle = (2 * Math.PI * i) / rest.length - Math.PI / 2;
      return {
        id: a.id, type: 'agentNode',
        position: { x: cx + radius * Math.cos(angle) - 74, y: cy + radius * Math.sin(angle) - 40 },
        data: a as unknown as Record<string, unknown>,
      };
    }),
  ];

  // _base-agent anchors at the bottom-center of the entire layout — the foundation
  if (base) {
    nodes.push({
      id: base.id, type: 'agentNode',
      position: { x: cx - 75, y: cy + radius + 120 },
      data: base as unknown as Record<string, unknown>,
    });
  }

  return nodes;
}

function buildEdges(agents: Agent[]): Edge[] {
  const base     = agents.find((a) => a.id === '_base-agent' || a.modelTier === 'foundation');
  const director = agents.find((a) => a.isPrimaryDirector === true)
                ?? agents.find((a) => a.id !== '_base-agent' && (a.id === 'abhishek' || a.modelTier === 'high-reasoning'))
                ?? agents.find((a) => a.id !== '_base-agent')!;
  const dirColor = TIER_COLOR[director?.modelTier ?? 'high-reasoning'];

  // Director → all others: animated, tier-colored, with arrow
  const edges: Edge[] = agents
    .filter((a) => a.id !== director.id && a.id !== '_base-agent')
    .map((a) => ({
      id: `dir-${director.id}-${a.id}`,
      source: director.id, target: a.id,
      animated: true,
      style: { stroke: `${dirColor}44`, strokeWidth: 1.3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: `${dirColor}80`, width: 11, height: 11 },
    }));

  // CDC pattern: conductor → samba (fast animated, accent color)
  const conductor = agents.find((a) => a.id === 'conductor');
  const samba     = agents.find((a) => a.id === 'samba');
  if (conductor && samba) {
    edges.push({
      id: 'cdc-edge', source: conductor.id, target: samba.id,
      label: 'CDC', animated: true, className: 'rna-edge-cdc',
      style: { stroke: 'var(--accent)', strokeWidth: 2.2 },
      labelStyle: { fill: 'var(--accent)', fontSize: 9, fontWeight: 700 },
      labelBgStyle: { fill: 'var(--panel)', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#7c6aff', width: 14, height: 14 },
    });
  }

  // Briefing edge: conductor → riko
  const riko = agents.find((a) => a.id === 'riko');
  if (conductor && riko) {
    edges.push({
      id: 'brief-edge', source: conductor.id, target: riko.id,
      label: 'brief', animated: true,
      style: { stroke: `${TIER_COLOR.fast}60`, strokeWidth: 1 },
      labelStyle: { fill: TIER_COLOR.fast, fontSize: 9 },
      labelBgStyle: { fill: 'var(--panel)', fillOpacity: 0.85 },
    });
  }

  // Research handoff: shino → samba
  const shino = agents.find((a) => a.id === 'shino');
  if (shino && samba) {
    edges.push({
      id: 'research-edge', source: shino.id, target: samba.id,
      label: 'research', animated: true,
      style: { stroke: `${TIER_COLOR.balanced}55`, strokeWidth: 1 },
      labelStyle: { fill: TIER_COLOR.balanced, fontSize: 9 },
      labelBgStyle: { fill: 'var(--panel)', fillOpacity: 0.85 },
    });
  }

  // Inheritance edges: every non-base agent → _base-agent (thin dashed, subtly amber)
  // These show the [inherits: _base-agent] relationship declared in every agent file
  if (base) {
    const baseColor = TIER_COLOR.foundation;
    agents
      .filter((a) => a.id !== '_base-agent')
      .forEach((a) => {
        edges.push({
          id: `inherits-${a.id}`,
          source: a.id,
          target: '_base-agent',
          animated: false,
          style: { stroke: `${baseColor}28`, strokeWidth: 0.7, strokeDasharray: '4 5' },
          markerEnd: { type: MarkerType.Arrow, color: `${baseColor}40`, width: 9, height: 9 },
        });
      });
  }

  return edges;
}

// ── AgentCanvas ────────────────────────────────────────────────────────────
export default function AgentCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selected, setSelected]          = useState<Agent | null>(null);
  const [loading, setLoading]            = useState(true);
  const [agentCount, setAgentCount]      = useState(0);
  const [activeJoins, setActiveJoins]    = useState(0);
  const [canvasFlash, setCanvasFlash]    = useState(false);
  const { tick, connected }              = useRnaEvents();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, ctx, activityData] = await Promise.all([api.agents(), api.context(), api.agentActivity()]);
      const agents: Agent[] = d.agents ?? [];
      // Build status map: prefer activity.json (agent-written) over activeJoins derivation
      const ctxObj = ctx as Record<string, unknown>;
      type AssignedEntry = { agent: string; task: string };
      type ActiveJoinEntry = { joinId: string; assignedAgents?: AssignedEntry[] };
      const statusMap: Record<string, { status: 'in-progress'; currentTask: string; currentJoinId: string }> = {};
      // 1. Seed from activeJoins in agent-context.json
      for (const join of (ctxObj.activeJoins as ActiveJoinEntry[] | undefined) ?? []) {
        for (const { agent, task } of join.assignedAgents ?? []) {
          statusMap[agent] = { status: 'in-progress', currentTask: task, currentJoinId: join.joinId };
        }
      }
      // 2. Override with live activity.json data (agent-written, more granular)
      for (const act of ((activityData as Record<string, unknown>).activities as AgentActivity[] | undefined) ?? []) {
        if (act.status && act.status !== 'idle') {
          statusMap[act.agentId] = {
            status:        act.status as 'in-progress',
            currentTask:   act.currentTask ?? statusMap[act.agentId]?.currentTask ?? '',
            currentJoinId: act.currentJoinId ?? statusMap[act.agentId]?.currentJoinId ?? '',
          };
        }
      }
      const enriched = agents.map((a) => ({
        ...a,
        status:        statusMap[a.id]?.status        ?? ('idle' as const),
        currentTask:   statusMap[a.id]?.currentTask   ?? null,
        currentJoinId: statusMap[a.id]?.currentJoinId ?? null,
      }));
      setNodes(layoutNodes(enriched));
      setEdges(buildEdges(enriched));
      setAgentCount(enriched.length);
      setActiveJoins((ctxObj.activeJoins as unknown[] | undefined)?.length ?? 0);
    } finally { setLoading(false); }
  }, [setNodes, setEdges]);

  useEffect(() => { load(); }, [load]);
  // Flash all nodes + auto-refresh on every SSE tick
  useEffect(() => {
    if (tick > 0) {
      load();
      setCanvasFlash(true);
      const t = setTimeout(() => setCanvasFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [tick, load]);

  return (
    <div
      style={{ flex: 1, position: 'relative', background: 'var(--bg)' }}
      className={canvasFlash ? 'rna-canvas--flash' : ''}
    >
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 12, zIndex: 10 }}>
          Loading agents…
        </div>
      )}
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        onNodeClick={(_, node) => {
          const a = node.data as unknown as Agent;
          setSelected(selected?.id === a.id ? null : a);
        }}
        fitView fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} color="#1e1e2a" />
        <Controls />
        <MiniMap nodeColor={(n) => TIER_COLOR[(n.data as unknown as Agent).modelTier] ?? '#555'} />
        <Panel position="top-right">
          <button onClick={load} title="Refresh" style={{
            background: 'var(--panel2)', border: '1px solid var(--line)',
            color: 'var(--fg-muted)', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer',
          }}>↺ Refresh</button>
        </Panel>
        <Panel position="bottom-left">
          <div style={{
            background: 'var(--panel2)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '5px 12px', fontSize: 10,
            color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
              background: connected ? 'var(--success)' : '#44444a',
              boxShadow: connected ? '0 0 5px var(--success)' : 'none',
              transition: 'background .4s, box-shadow .4s',
              flexShrink: 0,
            }} />
            <span>{agentCount} agents</span>
            {activeJoins > 0 && (
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                ⌥ {activeJoins} active join{activeJoins !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Detail drawer */}
      {selected && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 280,
          background: 'var(--panel)', borderLeft: '1px solid var(--line)',
          padding: 20, overflowY: 'auto', zIndex: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>{selected.id}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{selected.role}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', color: 'var(--fg-muted)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          {([
            ['Model',       selected.model],
            ['Tier',        selected.modelTier],
            ['Last active', selected.lastActive ?? '—'],
            ['Last task',   selected.lastTask   ?? '—'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--fg)' }}>{v}</div>
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Capabilities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(selected.capabilities ?? []).map((c) => (
                <span key={c} style={{ fontSize: 10, background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 6px', color: 'var(--fg-muted)' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

