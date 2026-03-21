<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  const patterns = [
    {
      id: 'build-review',
      name: 'Build → Review',
      desc: 'Standard development loop. Developer implements, Reviewer validates quality and security before merge.',
      steps: [
        { agent: 'developer', icon: '⚡', color: '#00d4ff' },
        { agent: 'reviewer', icon: '◉', color: '#00ff88' },
      ],
      tag: 'Most Used',
      tagColor: '#00d4ff',
    },
    {
      id: 'design-build',
      name: 'Design → Build',
      desc: 'Architecture-first. Architect designs the system and contracts, then Developer implements with full blueprint.',
      steps: [
        { agent: 'architect', icon: '▲', color: '#a855f7' },
        { agent: 'developer', icon: '⚡', color: '#00d4ff' },
      ],
      tag: 'Greenfield',
      tagColor: '#a855f7',
    },
    {
      id: 'research-build',
      name: 'Research → Build',
      desc: 'Unknown territory. Researcher synthesizes a path through unknowns, Developer executes with confidence.',
      steps: [
        { agent: 'researcher', icon: '◎', color: '#4d9fff' },
        { agent: 'developer', icon: '⚡', color: '#00d4ff' },
      ],
      tag: 'Exploration',
      tagColor: '#4d9fff',
    },
    {
      id: 'full-pipeline',
      name: 'Full Pipeline',
      desc: 'End-to-end complex feature. Research → Architecture → Development → Review. All four agents, sequentially.',
      steps: [
        { agent: 'researcher', icon: '◎', color: '#4d9fff' },
        { agent: 'architect', icon: '▲', color: '#a855f7' },
        { agent: 'developer', icon: '⚡', color: '#00d4ff' },
        { agent: 'reviewer', icon: '◉', color: '#00ff88' },
      ],
      tag: 'Complex Feature',
      tagColor: '#00ff88',
    },
  ]

  onMount(() => {
    inView('.patterns-section', () => {
      animate('.patterns-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.pattern-card', { opacity: [0, 1], y: [24, 0] }, {
        duration: 0.55,
        delay: (i) => 0.2 + i * 0.1,
      })
    }, { amount: 0.2 })
  })
</script>

<section class="patterns-section">
  <div class="container">
    <div class="patterns-header">
      <span class="section-tag">Join Patterns</span>
      <h2 class="section-title">Coordinated agent pipelines</h2>
      <p class="section-sub">Join patterns define how agents hand off work to each other. The Director initializes and tracks each join.</p>
    </div>

    <div class="patterns-grid">
      {#each patterns as p, i}
        <div class="pattern-card">
          <div class="pattern-head">
            <div>
              <div class="pattern-name">{p.name}</div>
              <span class="pattern-tag" style="color: {p.tagColor}; background: {p.tagColor}15; border-color: {p.tagColor}30">
                {p.tag}
              </span>
            </div>
          </div>
          <p class="pattern-desc">{p.desc}</p>
          <div class="flow">
            {#each p.steps as step, si}
              {#if si > 0}
                <div class="flow-arrow" aria-hidden="true">→</div>
              {/if}
              <div class="flow-agent" style="--c: {step.color}">
                <span class="flow-icon">{step.icon}</span>
                <span class="flow-name">@{step.agent}</span>
              </div>
            {/each}
          </div>
          <div class="join-cmd">
            <span class="cmd-label">Activate with</span>
            <code>/join {p.id}</code>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .patterns-section { padding: 100px 0; }
  .patterns-header {
    text-align: center;
    margin-bottom: 56px;
    opacity: 0;
  }
  .section-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-green);
    margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(26px, 3.5vw, 40px);
    font-weight: 700;
    margin-bottom: 12px;
  }
  .section-sub {
    font-size: 17px;
    color: var(--text-muted);
    max-width: 520px;
    margin: 0 auto;
  }

  .patterns-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .pattern-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    opacity: 0;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pattern-card:hover {
    border-color: var(--border-bright);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .pattern-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .pattern-name {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
  }
  .pattern-tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
    border: 1px solid;
    letter-spacing: 0.03em;
  }
  .pattern-desc {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.65;
  }

  .flow {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 14px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .flow-agent {
    display: flex;
    align-items: center;
    gap: 5px;
    background: color-mix(in srgb, var(--c) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 25%, transparent);
    border-radius: 8px;
    padding: 6px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--c);
    font-weight: 600;
  }
  .flow-icon { font-size: 14px; }
  .flow-arrow {
    color: var(--text-dim);
    font-size: 14px;
  }

  .join-cmd {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  .cmd-label {
    color: var(--text-dim);
    font-size: 12px;
    white-space: nowrap;
  }
  .join-cmd code {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: var(--accent-green);
    font-family: var(--font-mono);
  }

  @media (max-width: 700px) {
    .patterns-grid { grid-template-columns: 1fr; }
  }
</style>
