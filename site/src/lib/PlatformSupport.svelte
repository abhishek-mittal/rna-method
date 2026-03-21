<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  const platforms = [
    {
      name: 'Cursor',
      status: 'Stable',
      files: '.cursor/agents/',
      hooks: '.cursor/rules/',
      desc: 'Full native agent support with hook automation via Cursor rules.',
      color: '#00d4ff',
      logo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="rgba(0,212,255,0.15)"/>
        <path d="M8 8l6 6-6 6M14 20h6" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      name: 'GitHub Copilot',
      status: 'Stable',
      files: '.github/agents/',
      hooks: '.github/instructions/',
      desc: 'Native agent support with instruction files for automating behavioral rules.',
      color: '#e0e0e0',
      logo: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect width="28" height="28" rx="7" fill="rgba(200,200,200,0.1)"/>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.218.682-.484 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="rgba(200,200,200,0.8)"/>
      </svg>`,
    },
    {
      name: 'Claude Code',
      status: 'Stable',
      files: 'CLAUDE.md',
      hooks: 'Inline rules',
      desc: 'Single-document approach with embedded agent sections and inline behavioral rules.',
      color: '#ff8c4b',
      logo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="rgba(255,140,75,0.12)"/>
        <text x="14" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="#ff8c4b">C</text>
      </svg>`,
    },
    {
      name: 'OpenAI Codex',
      status: 'Stable',
      files: 'AGENTS.md',
      hooks: 'Advisory only',
      desc: 'Section-based agent definitions in AGENTS.md with advisory hook support.',
      color: '#10b981',
      logo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="rgba(16,185,129,0.12)"/>
        <text x="14" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="#10b981">O</text>
      </svg>`,
    },
    {
      name: 'Kimi Code',
      status: 'Experimental',
      files: 'Manual switching',
      hooks: 'Not automated',
      desc: 'Manual agent switching with basic support. Active development roadmap.',
      color: '#7a7a9e',
      logo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="rgba(122,122,158,0.12)"/>
        <text x="14" y="19" text-anchor="middle" font-size="14" font-weight="bold" fill="#7a7a9e">K</text>
      </svg>`,
    },
  ]

  onMount(() => {
    inView('.platforms-section', () => {
      animate('.platforms-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.platform-card', { opacity: [0, 1], y: [24, 0], scale: [0.97, 1] }, {
        duration: 0.5,
        delay: (i) => 0.2 + i * 0.07,
      })
    }, { amount: 0.2 })
  })
</script>

<section class="platforms-section" id="platforms">
  <div class="container">
    <div class="platforms-header">
      <span class="section-tag">Platform Support</span>
      <h2 class="section-title">One schema. Five platforms.</h2>
      <p class="section-sub">Write your collective once in rna-schema.json. Platform adapters generate native files for each AI editor.</p>
    </div>

    <div class="platforms-grid">
      {#each platforms as p}
        <div class="platform-card" style="--c: {p.color}">
          <div class="platform-top">
            <div class="platform-logo">
              {@html p.logo}
            </div>
            <div>
              <div class="platform-name">{p.name}</div>
              <span class="status-badge" class:experimental={p.status === 'Experimental'}>
                {p.status}
              </span>
            </div>
          </div>
          <p class="platform-desc">{p.desc}</p>
          <div class="platform-files">
            <div class="file-row">
              <span class="file-label">Agents</span>
              <code>{p.files}</code>
            </div>
            <div class="file-row">
              <span class="file-label">Hooks</span>
              <code>{p.hooks}</code>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .platforms-section { padding: 100px 0; }
  .platforms-header {
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
    color: var(--accent-amber);
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

  .platforms-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }

  .platform-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    opacity: 0;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .platform-card:hover {
    border-color: var(--c);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px color-mix(in srgb, var(--c) 10%, transparent);
  }

  .platform-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .platform-logo :global(svg) { flex-shrink: 0; }
  .platform-name {
    font-weight: 700;
    font-size: 14px;
    color: #fff;
    margin-bottom: 4px;
  }
  .status-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 100px;
    background: rgba(0, 255, 136, 0.1);
    color: var(--accent-green);
    border: 1px solid rgba(0, 255, 136, 0.2);
    letter-spacing: 0.04em;
  }
  .status-badge.experimental {
    background: rgba(122, 122, 158, 0.12);
    color: var(--text-muted);
    border-color: var(--border);
  }

  .platform-desc {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .platform-files {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .file-label {
    color: var(--text-dim);
    font-weight: 500;
    width: 38px;
    flex-shrink: 0;
  }
  .platform-files code {
    font-size: 11px;
    color: var(--c);
    font-family: var(--font-mono);
    background: none;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 1024px) {
    .platforms-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 640px) {
    .platforms-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 400px) {
    .platforms-grid { grid-template-columns: 1fr; }
  }
</style>
