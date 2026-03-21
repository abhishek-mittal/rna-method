<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  const steps = [
    {
      num: '01',
      title: 'Define your collective',
      desc: 'Edit rna-schema.json to configure your agent roles, rules, skills, and join patterns. This single file is your source of truth.',
      code: `{\n  "agents": [\n    { "id": "director", "role": "Orchestrator",\n      "isPrimaryDirector": true },\n    { "id": "developer", "role": "Full-Stack Developer" },\n    { "id": "reviewer", "role": "Security Analyst" }\n  ]\n}`,
      color: '#00d4ff',
      accent: 'rgba(0, 212, 255, 0.12)',
    },
    {
      num: '02',
      title: 'Run the installer',
      desc: 'One bash command generates native platform files for Cursor, GitHub Copilot, Claude Code, Codex, or Kimi — no Node.js required.',
      code: `$ bash <(curl -fsSL https://raw.githubusercontent.com/\n  abhishek-mittal/rna-method/main/tools/install.sh)\n\n✓ Writing .github/agents/director.agent.md\n✓ Writing .github/agents/developer.agent.md\n✓ Writing .github/instructions/rules.md`,
      color: '#00ff88',
      accent: 'rgba(0, 255, 136, 0.1)',
    },
    {
      num: '03',
      title: 'Invoke your first agent',
      desc: 'Open your AI editor and activate the Director. It reads your memory state, routes tasks, and coordinates the whole collective.',
      code: `@director\n\nI need to implement user authentication,\nreview the existing API endpoints for\nsecurity issues, and design the DB schema.\n\n// Director activates @developer, @reviewer,\n// and @architect in the right sequence`,
      color: '#a855f7',
      accent: 'rgba(168, 85, 247, 0.1)',
    },
  ]

  onMount(() => {
    inView('.hiw-section', () => {
      animate('.hiw-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.step-card', { opacity: [0, 1], y: [30, 0] }, {
        duration: 0.6,
        delay: (i) => 0.2 + i * 0.15,
      })
    }, { amount: 0.2 })
  })
</script>

<section class="hiw-section" id="how-it-works">
  <div class="container">
    <div class="hiw-header">
      <span class="section-tag">How it works</span>
      <h2 class="section-title">Up and running in 3 steps</h2>
      <p class="section-sub">From zero to a coordinated AI collective in under 5 minutes.</p>
    </div>

    <div class="steps">
      {#each steps as step, i}
        <div class="step-card" style="--step-color: {step.color}; --step-accent: {step.accent}">
          <div class="step-head">
            <span class="step-num">{step.num}</span>
            <div>
              <h3 class="step-title">{step.title}</h3>
              <p class="step-desc">{step.desc}</p>
            </div>
          </div>
          <div class="step-code">
            <pre><code>{step.code}</code></pre>
          </div>
          {#if i < steps.length - 1}
            <div class="step-connector" aria-hidden="true">↓</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .hiw-section { padding: 100px 0; }
  .hiw-header {
    text-align: center;
    margin-bottom: 60px;
    opacity: 0;
  }
  .section-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-cyan);
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
    max-width: 500px;
    margin: 0 auto;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-width: 800px;
    margin: 0 auto;
    position: relative;
  }

  .step-card {
    background: var(--surface);
    border: 1px solid var(--step-accent, var(--border));
    border-radius: 16px;
    padding: 32px;
    position: relative;
    opacity: 0;
    transition: border-color 0.3s, box-shadow 0.3s;
    margin-bottom: 8px;
  }
  .step-card:hover {
    border-color: var(--step-color);
    box-shadow: 0 0 30px color-mix(in srgb, var(--step-color) 10%, transparent);
  }

  .step-head {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .step-num {
    font-size: 48px;
    font-weight: 800;
    font-family: var(--font-mono);
    color: var(--step-color);
    line-height: 1;
    opacity: 0.25;
    flex-shrink: 0;
    letter-spacing: -0.05em;
  }
  .step-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #fff;
  }
  .step-desc {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.65;
  }

  .step-code {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  .step-code pre {
    margin: 0;
    padding: 16px 20px;
    overflow-x: auto;
  }
  .step-code code {
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--text-muted);
    white-space: pre;
  }

  .step-connector {
    text-align: center;
    font-size: 20px;
    color: var(--text-dim);
    padding: 6px 0;
    margin: 0;
  }
</style>
