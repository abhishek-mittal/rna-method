<script>
  import { onMount } from 'svelte'
  import { inView } from 'motion'

  let section
  let visible = false

  // Node positions in an 800×500 viewport
  const agents = [
    { id: 'director',   label: '@director',   sub: 'DIRECTOR',   color: '#ffb800', x: 400, y:  80 },
    { id: 'developer',  label: '@developer',  sub: 'DEVELOPER',  color: '#00d4ff', x: 110, y: 250 },
    { id: 'reviewer',   label: '@reviewer',   sub: 'REVIEWER',   color: '#00ff88', x: 230, y: 420 },
    { id: 'architect',  label: '@architect',  sub: 'ARCHITECT',  color: '#a855f7', x: 570, y: 420 },
    { id: 'researcher', label: '@researcher', sub: 'RESEARCHER', color: '#3b82f6', x: 690, y: 250 },
    { id: 'ops',        label: '@ops',        sub: 'OPS',        color: '#f97316', x: 400, y: 335 },
  ]

  const nodeMap = Object.fromEntries(agents.map(a => [a.id, a]))

  /** Quadratic bezier path with perpendicular curve offset */
  function qp(fromId, toId) {
    const a = nodeMap[fromId], b = nodeMap[toId]
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
    const nx = (-dy / len) * 50, ny = (dx / len) * 50
    return `M${a.x},${a.y} Q${mx + nx},${my + ny} ${b.x},${b.y}`
  }

  const rawEdges = [
    { from: 'director',   to: 'developer',  dur: '2.8s', begin: '0s'    },
    { from: 'director',   to: 'researcher', dur: '3.2s', begin: '0.9s'  },
    { from: 'director',   to: 'architect',  dur: '3.0s', begin: '1.7s'  },
    { from: 'developer',  to: 'reviewer',   dur: '2.4s', begin: '0.4s'  },
    { from: 'architect',  to: 'reviewer',   dur: '2.6s', begin: '1.3s'  },
    { from: 'researcher', to: 'director',   dur: '3.4s', begin: '2.5s'  },
    { from: 'developer',  to: 'ops',        dur: '2.2s', begin: '0.7s'  },
    { from: 'architect',  to: 'ops',        dur: '2.5s', begin: '1.9s'  },
  ]

  const edges = rawEdges.map((e, i) => ({
    ...e,
    id: `studio-e${i}`,
    d: qp(e.from, e.to),
    color: nodeMap[e.from].color,
  }))

  // Minimap scale: viewport 100×88, offset (8, 18) inside minimap rect
  const MM_X = 0.12, MM_Y = 0.17, MM_OX = 8, MM_OY = 20
  function mmx(x) { return MM_OX + x * MM_X }
  function mmy(y) { return MM_OY + y * MM_Y }

  onMount(() => {
    inView(section, () => { visible = true }, { amount: 0.2 })
  })
</script>

<section bind:this={section} id="studio">
  <div class="container">
    <div class="hdr" class:visible>
      <div class="eyebrow">
        <span class="live-dot"></span>
        RNA Studio
        <span class="tag-preview">preview</span>
      </div>
      <h2>Your agents. <span class="grad">In sync.</span></h2>
      <p>RNA Studio gives you a live graph of every signal, handoff, and join pattern in flight. Watch your collective coordinate in real time.</p>
    </div>

    <div class="win" class:visible>
      <!-- macOS-style titlebar -->
      <div class="win-bar">
        <div class="mac-dots">
          <span style="background:#ff5f57"></span>
          <span style="background:#ffbd2e"></span>
          <span style="background:#28c840"></span>
        </div>
        <span class="win-title">rna-studio — collective-view</span>
        <span class="win-badge">
          <span class="pulse-dot"></span>
          6 agents · 8 signals active
        </span>
      </div>

      <!-- Flow graph canvas -->
      <div class="canvas">
        <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"
             aria-label="RNA agent communication graph" role="img">
          <defs>
            <!-- Dot-grid background -->
            <pattern id="studio-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill="rgba(100,100,210,0.14)"/>
            </pattern>
          </defs>

          <!-- Background -->
          <rect width="800" height="500" fill="url(#studio-dots)"/>

          <!-- Edge glow (wide soft) -->
          {#each edges as e}
            <path d={e.d} fill="none" stroke={e.color}
                  stroke-width="10" stroke-opacity="0.05" stroke-linecap="round"/>
          {/each}

          <!-- Edge dash lines (defines IDs for animateMotion) -->
          {#each edges as e}
            <path id={e.id} d={e.d} fill="none"
                  stroke={e.color} stroke-width="1.5"
                  stroke-opacity="0.3" stroke-dasharray="5 5" stroke-linecap="round"/>
          {/each}

          <!-- Animated signal packets -->
          {#each edges as e}
            <!-- halo -->
            <circle r="9" fill={e.color} opacity="0.15">
              <animateMotion dur={e.dur} begin={e.begin} repeatCount="indefinite">
                <mpath href="#{e.id}"/>
              </animateMotion>
            </circle>
            <!-- core -->
            <circle r="4" fill={e.color} opacity="1">
              <animateMotion dur={e.dur} begin={e.begin} repeatCount="indefinite">
                <mpath href="#{e.id}"/>
              </animateMotion>
            </circle>
          {/each}

          <!-- Nodes -->
          {#each agents as a}
            <!-- outer glow -->
            <rect x={a.x - 67} y={a.y - 31} width="134" height="62" rx="11"
                  fill={a.color} opacity="0.08"/>
            <!-- card body -->
            <rect x={a.x - 65} y={a.y - 29} width="130" height="58" rx="9"
                  fill="#070712" stroke={a.color} stroke-width="1.5" stroke-opacity="0.65"/>
            <!-- top accent strip -->
            <rect x={a.x - 65} y={a.y - 29} width="130" height="3" rx="0"
                  fill={a.color} opacity="0.55"/>
            <!-- square off rounded top corners on strip -->
            <rect x={a.x - 65} y={a.y - 29} width="9" height="9" rx="9" fill="#070712"/>
            <rect x={a.x + 56} y={a.y - 29} width="9" height="9" rx="9" fill="#070712"/>
            <!-- agent @id -->
            <text x={a.x} y={a.y - 5} text-anchor="middle"
                  font-family="JetBrains Mono, Fira Code, monospace"
                  font-size="12.5" font-weight="600" fill={a.color}
                  letter-spacing="0.01em">{a.label}</text>
            <!-- role sublabel -->
            <text x={a.x} y={a.y + 14} text-anchor="middle"
                  font-family="Inter, system-ui, sans-serif"
                  font-size="9" letter-spacing="0.09em"
                  fill="rgba(110,110,160,1)">{a.sub}</text>

            <!-- Director: concentric pulse rings -->
            {#if a.id === 'director'}
              <circle cx={a.x} cy={a.y} r="54" fill="none" stroke={a.color} stroke-width="1.2">
                <animate attributeName="r" values="54;82" dur="2.8s"
                         repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.3 1"/>
                <animate attributeName="opacity" values="0.4;0" dur="2.8s"
                         repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.3 1"/>
              </circle>
              <circle cx={a.x} cy={a.y} r="54" fill="none" stroke={a.color} stroke-width="0.6">
                <animate attributeName="r" values="54;108" dur="2.8s" begin="0.8s"
                         repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.3 1"/>
                <animate attributeName="opacity" values="0.18;0" dur="2.8s" begin="0.8s"
                         repeatCount="indefinite" calcMode="spline" keySplines="0.3 0 0.3 1"/>
              </circle>
            {/if}
          {/each}

          <!-- XY Flow-style controls panel (top-right) -->
          <g transform="translate(696, 12)">
            <rect width="92" height="28" rx="6"
                  fill="rgba(13,13,31,0.9)" stroke="rgba(100,100,200,0.22)" stroke-width="1"/>
            <text x="14" y="19" font-size="16" fill="rgba(140,140,200,0.7)" font-family="monospace">+</text>
            <line x1="33" y1="5" x2="33" y2="23" stroke="rgba(100,100,200,0.2)" stroke-width="1"/>
            <text x="40" y="19" font-size="16" fill="rgba(140,140,200,0.7)" font-family="monospace">−</text>
            <line x1="59" y1="5" x2="59" y2="23" stroke="rgba(100,100,200,0.2)" stroke-width="1"/>
            <text x="67" y="18" font-size="13" fill="rgba(140,140,200,0.7)" font-family="monospace">⊡</text>
          </g>

          <!-- Minimap (bottom-right, XY Flow signature) -->
          <g transform="translate(678, 372)">
            <rect width="116" height="120" rx="7"
                  fill="rgba(7,7,18,0.92)" stroke="rgba(100,100,200,0.22)" stroke-width="1"/>
            <text x="58" y="13" text-anchor="middle"
                  font-size="8" font-family="Inter, sans-serif"
                  fill="rgba(90,90,140,0.9)" letter-spacing="0.06em">MINIMAP</text>
            <!-- mini edges -->
            {#each edges as e}
              <line
                x1={mmx(nodeMap[e.from].x)} y1={mmy(nodeMap[e.from].y)}
                x2={mmx(nodeMap[e.to].x)}   y2={mmy(nodeMap[e.to].y)}
                stroke={e.color} stroke-width="0.8" stroke-opacity="0.35"
              />
            {/each}
            <!-- mini nodes -->
            {#each agents as a}
              <circle cx={mmx(a.x)} cy={mmy(a.y)} r="4.5"
                      fill={a.color} opacity="0.8"/>
            {/each}
          </g>

          <!-- Active join pattern label (floating chip) -->
          <g transform="translate(310, 470)">
            <rect width="176" height="22" rx="11"
                  fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
            <circle cx="14" cy="11" r="4" fill="#00d4ff" opacity="0.9">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <text x="24" y="15.5" font-size="10" font-family="Inter, sans-serif"
                  fill="rgba(0,212,255,0.9)" letter-spacing="0.04em">build-review · active</text>
          </g>
        </svg>
      </div>

      <!-- Status bar -->
      <div class="status-bar">
        <div class="sb-pill"><span class="sd cyan"></span>build-review · in progress</div>
        <div class="sb-pill"><span class="sd green"></span>research · complete</div>
        <div class="sb-pill"><span class="sd amber"></span>ops · deploying</div>
        <span class="sb-right">RNA Studio v0.1.0-preview</span>
      </div>
    </div>

    <p class="footnote">
      RNA Studio is a standalone visual debugger for your collective —
      <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener">built on XY Flow</a>, coming soon.
    </p>
  </div>
</section>

<style>
  section {
    padding: 100px 0;
    position: relative;
    z-index: 1;
  }

  .hdr {
    text-align: center;
    max-width: 620px;
    margin: 0 auto 52px;
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .hdr.visible { opacity: 1; transform: translateY(0); }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 16px;
  }
  .live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent-green);
    box-shadow: 0 0 7px var(--accent-green);
    animation: blink 1.8s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.75); }
  }
  .tag-preview {
    background: rgba(168, 85, 247, 0.12);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #a855f7;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  h2 {
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 800;
    color: #fff;
    margin-bottom: 14px;
  }
  .grad {
    background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hdr p {
    font-size: 16px;
    color: var(--text-muted);
    line-height: 1.7;
  }

  /* Window chrome */
  .win {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--surface);
    box-shadow:
      0 0 0 1px rgba(100,100,200,0.06),
      0 32px 80px rgba(0,0,0,0.5);
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s;
  }
  .win.visible { opacity: 1; transform: translateY(0); }

  .win-bar {
    display: flex;
    align-items: center;
    padding: 11px 16px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    user-select: none;
    gap: 0;
  }
  .mac-dots { display: flex; gap: 7px; margin-right: 16px; }
  .mac-dots span { width: 12px; height: 12px; border-radius: 50%; display: block; }
  .win-title {
    flex: 1;
    text-align: center;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    letter-spacing: 0.04em;
  }
  .win-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
  }
  .pulse-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-green);
    animation: blink 1.8s ease-in-out infinite;
    display: inline-block;
  }

  .canvas {
    background: var(--bg);
    line-height: 0;
  }
  .canvas svg { display: block; width: 100%; }

  /* Status bar */
  .status-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 8px 16px;
    background: var(--surface-2);
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 11px;
    overflow-x: auto;
  }
  .sb-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .sd {
    width: 6px; height: 6px;
    border-radius: 50%;
    display: block;
    flex-shrink: 0;
  }
  .sd.cyan  { background: var(--accent-cyan);  box-shadow: 0 0 5px var(--accent-cyan); }
  .sd.green { background: var(--accent-green); box-shadow: 0 0 5px var(--accent-green); }
  .sd.amber { background: var(--accent-amber); box-shadow: 0 0 5px var(--accent-amber); }
  .sb-right { margin-left: auto; color: var(--text-dim); opacity: 0.6; white-space: nowrap; }

  .footnote {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
    color: var(--text-dim);
  }
  .footnote a { color: var(--accent-cyan); }
  .footnote a:hover { text-decoration: underline; }
</style>
