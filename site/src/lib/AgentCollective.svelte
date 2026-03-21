<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  const agents = [
    {
      id: 'director',
      role: 'Director',
      title: 'Orchestrator',
      desc: 'The only agent humans invoke directly. Routes tasks to the right agent, manages join patterns, and maintains team state.',
      icon: '★',
      color: '#ffb800',
      bg: 'rgba(255, 184, 0, 0.08)',
      border: 'rgba(255, 184, 0, 0.2)',
      tags: ['isPrimaryDirector', 'orchestrator', 'router'],
    },
    {
      id: 'developer',
      role: 'Developer',
      title: 'Full-Stack Engineer',
      desc: 'Writes production-quality code, implements features, fixes bugs, and maintains tech standards with full project context.',
      icon: '⚡',
      color: '#00d4ff',
      bg: 'rgba(0, 212, 255, 0.08)',
      border: 'rgba(0, 212, 255, 0.2)',
      tags: ['feature-dev', 'bug-fix', 'refactor'],
    },
    {
      id: 'reviewer',
      role: 'Reviewer',
      title: 'Security Analyst',
      desc: 'Reviews code for quality, security vulnerabilities (OWASP Top 10), and architectural conformance before merge.',
      icon: '◉',
      color: '#00ff88',
      bg: 'rgba(0, 255, 136, 0.07)',
      border: 'rgba(0, 255, 136, 0.18)',
      tags: ['OWASP', 'code-review', 'security'],
    },
    {
      id: 'architect',
      role: 'Architect',
      title: 'System Designer',
      desc: 'Owns system architecture, API contracts, data models, and technical direction. Raises flags on design trade-offs.',
      icon: '▲',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.08)',
      border: 'rgba(168, 85, 247, 0.2)',
      tags: ['system-design', 'API', 'DB-schema'],
    },
    {
      id: 'researcher',
      role: 'Researcher',
      title: 'Explorer',
      desc: 'Digs into unknowns, evaluates libraries, researches edge cases, and synthesizes findings into actionable insights.',
      icon: '◎',
      color: '#4d9fff',
      bg: 'rgba(77, 159, 255, 0.08)',
      border: 'rgba(77, 159, 255, 0.2)',
      tags: ['deep-dive', 'edge-cases', 'synthesis'],
    },
    {
      id: 'ops',
      role: 'Ops',
      title: 'Automation Specialist',
      desc: 'Manages CI/CD, infrastructure, deployments, monitoring, and automation pipelines. Keeps the machine running.',
      icon: '⬡',
      color: '#ff6b2b',
      bg: 'rgba(255, 107, 43, 0.08)',
      border: 'rgba(255, 107, 43, 0.2)',
      tags: ['CI/CD', 'infra', 'automation'],
    },
  ]

  onMount(() => {
    inView('.agents-section', () => {
      animate('.agents-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.agent-card', { opacity: [0, 1], y: [28, 0], scale: [0.97, 1] }, {
        duration: 0.5,
        delay: (i) => 0.2 + i * 0.08,
      })
    }, { amount: 0.2 })
  })
</script>

<section class="agents-section" id="agents">
  <div class="container">
    <div class="agents-header">
      <span class="section-tag">The Collective</span>
      <h2 class="section-title">Six specialized agents. One coordinated team.</h2>
      <p class="section-sub">Each agent has a defined role, domain, escalation path, and behavioral contract inherited from <code>_base-agent</code>.</p>
    </div>

    <div class="agents-grid">
      {#each agents as agent, i}
        <div class="agent-card" style="--c: {agent.color}; --bg: {agent.bg}; --border: {agent.border}">
          <div class="agent-icon-wrap">
            <span class="agent-icon">{agent.icon}</span>
          </div>
          <div class="agent-info">
            <div class="agent-name-row">
              <span class="agent-at">@</span><span class="agent-name">{agent.id}</span>
              {#if agent.tags.includes('isPrimaryDirector')}
                <span class="director-badge">Primary Director</span>
              {/if}
            </div>
            <div class="agent-role">{agent.title}</div>
            <p class="agent-desc">{agent.desc}</p>
            <div class="agent-tags">
              {#each agent.tags.filter(t => t !== 'isPrimaryDirector') as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="base-note">
      <span class="base-icon">§</span>
      <div>
        <strong>_base-agent</strong> — Every agent inherits shared behavioral contracts: handoff format, checkpoint rules, memory conventions, and limits. Never invoked directly.
      </div>
    </div>
  </div>
</section>

<style>
  .agents-section { padding: 100px 0; }
  .agents-header {
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
    color: var(--accent-purple);
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
    max-width: 560px;
    margin: 0 auto;
  }
  .section-sub code {
    font-size: 14px;
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    color: var(--accent-amber);
  }

  .agents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .agent-card {
    background: var(--surface);
    border: 1px solid var(--border, var(--border));
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    opacity: 0;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .agent-card:hover {
    border-color: var(--c);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px color-mix(in srgb, var(--c) 12%, transparent);
  }

  .agent-icon-wrap {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .agent-name-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  }
  .agent-at {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 14px;
  }
  .agent-name {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 15px;
    color: var(--c);
  }
  .director-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 100px;
    background: rgba(255, 184, 0, 0.12);
    color: var(--accent-amber);
    border: 1px solid rgba(255, 184, 0, 0.25);
    margin-left: 4px;
    letter-spacing: 0.03em;
  }
  .agent-role {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .agent-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .agent-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .tag {
    font-size: 11px;
    font-family: var(--font-mono);
    padding: 2px 8px;
    border-radius: 5px;
    background: var(--bg);
    color: var(--c);
    border: 1px solid var(--border);
  }

  .base-note {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--surface);
    border: 1px solid rgba(255, 184, 0, 0.15);
    border-radius: 12px;
    padding: 18px 22px;
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .base-note strong { color: var(--accent-amber); }
  .base-icon {
    font-size: 20px;
    color: var(--accent-amber);
    font-family: var(--font-mono);
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }

  @media (max-width: 900px) {
    .agents-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .agents-grid { grid-template-columns: 1fr; }
  }
</style>
