<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  let activeTab = 'bash'

  const tabs = [
    { id: 'bash', label: 'Quick Start (bash)' },
    { id: 'node', label: 'Node.js' },
    { id: 'invoke', label: 'Invoke Agent' },
  ]

  const code = {
    bash: {
      lang: 'bash',
      lines: [
        { type: 'comment', text: '# Option A — One-liner, zero dependencies' },
        { type: 'cmd', text: 'bash <(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/install.sh)' },
        { type: 'blank' },
        { type: 'comment', text: '# Dry run - see what would be written' },
        { type: 'cmd', text: 'bash tools/install.sh --dry-run' },
        { type: 'blank' },
        { type: 'comment', text: '# CI / fully scripted install' },
        { type: 'cmd', text: 'bash tools/install.sh --non-interactive \\' },
        { type: 'cont', text: '  --platform=copilot --collective=full' },
        { type: 'blank' },
        { type: 'output', text: '✓ Writing .github/agents/director.agent.md' },
        { type: 'output', text: '✓ Writing .github/agents/developer.agent.md' },
        { type: 'output', text: '✓ Writing .github/instructions/rules.md' },
        { type: 'output', text: '✓ Token footprint: ~4200 tokens / agent' },
      ],
    },
    node: {
      lang: 'bash',
      lines: [
        { type: 'comment', text: '# Option B — Node.js (18+), no clone required' },
        { type: 'cmd', text: 'node -e "$(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/init.js)"' },
        { type: 'blank' },
        { type: 'comment', text: '# Update existing install without losing customisations' },
        { type: 'cmd', text: 'node tools/init.js --update' },
        { type: 'blank' },
        { type: 'comment', text: '# After init: personalise in your AI editor' },
        { type: 'prompt', text: '/rna.setup' },
        { type: 'blank' },
        { type: 'comment', text: '# If platform or team changes:' },
        { type: 'prompt', text: '/rna.update' },
      ],
    },
    invoke: {
      lang: 'agent',
      lines: [
        { type: 'comment', text: '# Open your AI editor — activate the Director' },
        { type: 'mention', text: '@director' },
        { type: 'blank' },
        { type: 'chat', text: 'I need to: (1) implement JWT auth, (2) review the' },
        { type: 'chat', text: 'existing API for security issues, (3) design the' },
        { type: 'chat', text: 'payments DB schema.' },
        { type: 'blank' },
        { type: 'response', text: '// Director routes:' },
        { type: 'response', text: '//   @developer  → JWT auth implementation' },
        { type: 'response', text: '//   @reviewer   → API security audit' },
        { type: 'response', text: '//   @architect  → payment schema design' },
        { type: 'blank' },
        { type: 'mention', text: '@developer' },
        { type: 'chat', text: 'Implement JWT auth per the spec...' },
      ],
    },
  }

  onMount(() => {
    inView('.code-section', () => {
      animate('.code-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.code-block', { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, delay: 0.2 })
      animate('.cta-block', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: 0.4 })
    }, { amount: 0.2 })
  })
</script>

<section class="code-section">
  <div class="container">
    <div class="code-header">
      <span class="section-tag">Quick Start</span>
      <h2 class="section-title">Get started in seconds</h2>
      <p class="section-sub">No runtime. No accounts. Just bash or Node.js and your AI editor.</p>
    </div>

    <div class="code-block">
      <div class="tabs">
        {#each tabs as tab}
          <button class="tab" class:active={activeTab === tab.id} on:click={() => activeTab = tab.id}>
            {tab.label}
          </button>
        {/each}
      </div>

      <div class="code-window">
        <div class="window-header">
          <span class="wdot wd-r"></span>
          <span class="wdot wd-y"></span>
          <span class="wdot wd-g"></span>
          <span class="window-title">
            {#if activeTab === 'invoke'}chat{:else}terminal{/if}
          </span>
        </div>
        <pre class="code-content"><code>{#each code[activeTab].lines as line}{#if line.type === 'blank'}<span class="blank"> </span>
{:else if line.type === 'comment'}<span class="clr-dim">{line.text}</span>
{:else if line.type === 'cmd'}<span class="clr-prompt">$ </span><span class="clr-text">{line.text}</span>
{:else if line.type === 'cont'}<span class="clr-text">{line.text}</span>
{:else if line.type === 'output'}<span class="clr-green">{line.text}</span>
{:else if line.type === 'prompt'}<span class="clr-cyan">{line.text}</span>
{:else if line.type === 'mention'}<span class="clr-purple">{line.text}</span>
{:else if line.type === 'chat'}<span class="clr-text">{line.text}</span>
{:else if line.type === 'response'}<span class="clr-dim">{line.text}</span>
{/if}{/each}</code></pre>
      </div>
    </div>

    <div class="cta-block">
      <div class="cta-inner">
        <div>
          <div class="cta-title">Ready to build your collective?</div>
          <div class="cta-sub">Open-source, MIT licensed. Works with the AI editor you already use.</div>
        </div>
        <div class="cta-actions">
          <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener" class="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
          <a href="https://rna.webnco.xyz/docs/getting-started" class="btn-docs">
            Read the docs →
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .code-section { padding: 100px 0; }
  .code-header {
    text-align: center;
    margin-bottom: 48px;
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
    max-width: 480px;
    margin: 0 auto;
  }

  .code-block {
    max-width: 800px;
    margin: 0 auto 32px;
    opacity: 0;
  }

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: -1px;
    position: relative;
    z-index: 1;
  }
  .tab {
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-color: var(--surface);
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .tab:hover { color: var(--text); }
  .tab.active {
    background: var(--surface-2);
    color: var(--accent-cyan);
    border-color: var(--border-bright);
    border-bottom-color: var(--surface-2);
  }

  .code-window {
    background: var(--surface-2);
    border: 1px solid var(--border-bright);
    border-radius: 0 12px 12px 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
  .window-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.025);
    border-bottom: 1px solid var(--border);
  }
  .wdot {
    width: 11px; height: 11px;
    border-radius: 50%;
  }
  .wd-r { background: #ff5f57; }
  .wd-y { background: #ffbd2e; }
  .wd-g { background: #28ca41; }
  .window-title {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
  }

  .code-content {
    margin: 0;
    padding: 20px 24px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.75;
    overflow-x: auto;
    white-space: pre;
  }
  .code-content code { background: none; padding: 0; }

  :global(.clr-dim) { color: var(--text-dim); }
  :global(.clr-prompt) { color: var(--accent-green); }
  :global(.clr-text) { color: var(--text); }
  :global(.clr-green) { color: var(--accent-green); }
  :global(.clr-cyan) { color: var(--accent-cyan); }
  :global(.clr-purple) { color: var(--accent-purple); }
  :global(.blank) { display: block; height: 8px; }

  .cta-block {
    max-width: 800px;
    margin: 0 auto;
    opacity: 0;
  }
  .cta-inner {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%);
    border: 1px solid var(--border-bright);
    border-radius: 16px;
    padding: 32px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }
  .cta-title {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
  }
  .cta-sub {
    font-size: 14px;
    color: var(--text-muted);
  }
  .cta-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--accent-cyan);
    color: #020c10;
    font-weight: 700;
    font-size: 14px;
    padding: 11px 22px;
    border-radius: 9px;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
    text-decoration: none;
  }
  .btn-docs {
    display: inline-flex;
    align-items: center;
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    padding: 11px 18px;
    border-radius: 9px;
    border: 1px solid var(--border);
    text-decoration: none;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .btn-docs:hover {
    color: var(--text);
    border-color: var(--border-bright);
    text-decoration: none;
  }

  @media (max-width: 700px) {
    .cta-inner { flex-direction: column; align-items: flex-start; }
    .tabs { overflow-x: auto; }
  }
</style>
