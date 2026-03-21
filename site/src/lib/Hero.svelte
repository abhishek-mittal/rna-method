<script>
  import { onMount } from 'svelte'
  import { animate } from 'motion'

  let terminal = ''
  let cursorVisible = true
  const cmd = 'bash <(curl -fsSL https://raw.githubusercontent.com/abhishek-mittal/rna-method/main/tools/install.sh)'

  onMount(() => {
    animate('.hero-eyebrow', { opacity: [0, 1], y: [-8, 0] }, { duration: 0.5, delay: 0.1 })
    animate('.hero-title', { opacity: [0, 1], y: [28, 0] }, { duration: 0.7, delay: 0.25, easing: [0.22, 1, 0.36, 1] })
    animate('.hero-subtitle', { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, delay: 0.45 })
    animate('.hero-ctas', { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, delay: 0.65 })
    animate('.hero-terminal', { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.7, delay: 0.85, easing: [0.22, 1, 0.36, 1] })
    animate('.hero-stats', { opacity: [0, 1] }, { duration: 0.6, delay: 1.4 })

    setTimeout(() => {
      let i = 0
      const type = () => {
        if (i < cmd.length) {
          terminal += cmd[i++]
          setTimeout(type, 22 + Math.random() * 22)
        }
      }
      type()
    }, 1300)

    const blink = setInterval(() => { cursorVisible = !cursorVisible }, 530)
    return () => clearInterval(blink)
  })
</script>

<section class="hero" id="top">
  <div class="orb orb-1" aria-hidden="true"></div>
  <div class="orb orb-2" aria-hidden="true"></div>
  <div class="orb orb-3" aria-hidden="true"></div>

  <div class="container hero-content">
    <div class="hero-eyebrow">
      <span class="badge">
        <span class="badge-dot"></span>
        v1.0.0 &nbsp;·&nbsp; MIT License &nbsp;·&nbsp; 5 Platforms
      </span>
    </div>

    <h1 class="hero-title">
      <span class="title-word">Reusable</span>
      <span class="title-word accent-gradient">Neural</span>
      <span class="title-word">Activators</span>
    </h1>

    <p class="hero-subtitle">
      Turn your AI coding assistant into a <strong>coordinated agent collective</strong>.<br />
      One JSON schema. Every platform. Zero runtime infrastructure.
    </p>

    <div class="hero-ctas">
      <a href="#how-it-works" class="btn-primary">Get Started →</a>
      <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener" class="btn-secondary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        Star on GitHub
      </a>
    </div>

    <div class="hero-terminal">
      <div class="terminal-header">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="terminal-label">terminal</span>
      </div>
      <div class="terminal-body">
        <span class="prompt">$ </span><span class="tcmd">{terminal}</span><span class="tcursor" style="opacity: {cursorVisible ? 1 : 0}">█</span>
      </div>
    </div>

    <div class="hero-stats">
      {#each [['6', 'Agent Roles'], ['5', 'Platforms'], ['4', 'Join Patterns'], ['0', 'Runtime Deps']] as [num, label], i}
        {#if i > 0}<div class="stat-divider"></div>{/if}
        <div class="stat">
          <span class="stat-num">{num}</span>
          <span class="stat-label">{label}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 120px 0 80px;
    overflow: hidden;
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .orb-1 {
    width: 700px; height: 700px;
    left: -250px; top: -150px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.07) 0%, transparent 65%);
    animation: drift 14s ease-in-out infinite alternate;
  }
  .orb-2 {
    width: 600px; height: 600px;
    right: -200px; top: 50px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.07) 0%, transparent 65%);
    animation: drift 18s ease-in-out infinite alternate-reverse;
  }
  .orb-3 {
    width: 500px; height: 500px;
    left: 35%; bottom: -100px;
    background: radial-gradient(circle, rgba(0, 255, 136, 0.05) 0%, transparent 65%);
    animation: drift 11s ease-in-out infinite alternate;
  }
  @keyframes drift {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(25px, 18px) scale(1.06); }
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 28px;
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .hero-eyebrow, .hero-title, .hero-subtitle, .hero-ctas, .hero-terminal, .hero-stats {
    opacity: 0;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 212, 255, 0.07);
    border: 1px solid rgba(0, 212, 255, 0.18);
    border-radius: 100px;
    padding: 5px 16px;
    font-size: 12px;
    color: var(--accent-cyan);
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 0.04em;
  }
  .badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent-green);
    display: inline-block;
    box-shadow: 0 0 6px var(--accent-green);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .hero-title {
    font-size: clamp(52px, 9vw, 104px);
    font-weight: 800;
    line-height: 1.03;
    letter-spacing: -0.04em;
    max-width: 960px;
  }
  .title-word { display: block; }
  .accent-gradient {
    background: linear-gradient(120deg, var(--accent-cyan) 0%, var(--accent-purple) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: clamp(16px, 2.2vw, 21px);
    color: var(--text-muted);
    max-width: 580px;
    line-height: 1.65;
  }
  .hero-subtitle strong { color: var(--text); font-weight: 600; }

  .hero-ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    background: var(--accent-green);
    color: #030a06;
    font-weight: 700;
    font-size: 15px;
    padding: 13px 28px;
    border-radius: 10px;
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    box-shadow: 0 0 24px rgba(0, 255, 136, 0.22);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 32px rgba(0, 255, 136, 0.38);
    text-decoration: none;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--surface-2);
    color: var(--text);
    font-weight: 600;
    font-size: 15px;
    padding: 13px 24px;
    border-radius: 10px;
    border: 1px solid var(--border-bright);
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .btn-secondary:hover {
    border-color: var(--accent-cyan);
    background: var(--surface-3);
    text-decoration: none;
  }

  .hero-terminal {
    width: 100%;
    max-width: 720px;
    background: var(--surface);
    border: 1px solid var(--border-bright);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 0 50px rgba(0, 212, 255, 0.06), 0 24px 64px rgba(0, 0, 0, 0.5);
  }
  .terminal-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.025);
    border-bottom: 1px solid var(--border);
  }
  .dot {
    width: 11px; height: 11px;
    border-radius: 50%;
  }
  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #ffbd2e; }
  .dot-green { background: #28ca41; }
  .terminal-label {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
  }
  .terminal-body {
    padding: 16px 20px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.5;
    text-align: left;
    overflow-x: auto;
    white-space: nowrap;
  }
  .prompt { color: var(--accent-green); font-weight: 600; }
  .tcmd { color: var(--text); }
  .tcursor {
    color: var(--accent-cyan);
    transition: opacity 0.05s;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px 0;
    max-width: 600px;
    width: 100%;
  }
  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .stat-num {
    font-size: 34px;
    font-weight: 800;
    color: var(--accent-cyan);
    font-family: var(--font-mono);
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .stat-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .stat-divider {
    width: 1px;
    height: 44px;
    background: var(--border);
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .hero { padding: 100px 0 60px; }
    .hero-stats { max-width: 100%; }
    .stat-num { font-size: 26px; }
  }
</style>
