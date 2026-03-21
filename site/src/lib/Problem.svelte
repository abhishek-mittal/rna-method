<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  onMount(() => {
    inView('.problem-section', () => {
      animate('.prob-label', { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, delay: 0.1 })
      animate('.prob-card', { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, delay: 0.25 })
    }, { amount: 0.3 })
  })
</script>

<section class="problem-section" id="problem">
  <div class="container">
    <div class="section-header prob-label">
      <span class="section-tag">The Problem</span>
      <h2 class="section-title">One AI. Every task. No structure.</h2>
      <p class="section-sub">Most AI coding setups collapse under complexity because a single assistant is doing the work of an entire engineering team.</p>
    </div>

    <div class="prob-grid prob-card">
      <div class="prob-card-inner bad">
        <div class="card-tag bad-tag">Before RNA Method</div>
        <div class="chat-msgs">
          <div class="msg user">@ai fix this auth bug and also refactor the DB layer and review my PR and design the API schema and...</div>
          <div class="msg ai confused">
            <span class="ai-dot"></span>
            Trying to do everything at once... context overflowing... forgetting earlier instructions...
          </div>
          <div class="msg ai confused">
            <span class="ai-dot"></span>
            I may have broken the auth while fixing the DB...
          </div>
        </div>
        <div class="pain-pills">
          <span class="pill">Context overflow</span>
          <span class="pill">Role confusion</span>
          <span class="pill">No coordination</span>
          <span class="pill">Lost history</span>
        </div>
      </div>

      <div class="prob-arrow">→</div>

      <div class="prob-card-inner good">
        <div class="card-tag good-tag">With RNA Method</div>
        <div class="agent-flow">
          {#each [
            { role: 'Director', icon: '★', color: '#ffb800', msg: 'Routing: auth bug → @developer, PR → @reviewer' },
            { role: 'Developer', icon: '⚡', color: '#00d4ff', msg: 'Implementing auth fix with full context' },
            { role: 'Reviewer', icon: '◉', color: '#00ff88', msg: 'Reviewing PR: security pass ✓' },
            { role: 'Architect', icon: '▲', color: '#a855f7', msg: 'Designing API schema independently' },
          ] as agent}
            <div class="agent-msg">
              <span class="agent-chip" style="background: {agent.color}20; border-color: {agent.color}40; color: {agent.color}">
                {agent.icon} @{agent.role.toLowerCase()}
              </span>
              <span class="agent-text">{agent.msg}</span>
            </div>
          {/each}
        </div>
        <div class="pain-pills">
          <span class="pill good-pill">Focused context</span>
          <span class="pill good-pill">Clear roles</span>
          <span class="pill good-pill">Coordinated</span>
          <span class="pill good-pill">Schema-driven</span>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .problem-section {
    padding: 100px 0;
  }
  .section-header {
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
    color: var(--accent-pink);
    margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 700;
    margin-bottom: 14px;
  }
  .section-sub {
    font-size: 17px;
    color: var(--text-muted);
    max-width: 560px;
    margin: 0 auto;
  }

  .prob-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 24px;
    align-items: center;
    opacity: 0;
  }
  .prob-arrow {
    font-size: 28px;
    color: var(--text-dim);
    text-align: center;
    flex-shrink: 0;
  }

  .prob-card-inner {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
  }
  .bad { border-color: rgba(255, 77, 142, 0.2); }
  .good { border-color: rgba(0, 255, 136, 0.2); }

  .card-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 6px;
    width: fit-content;
  }
  .bad-tag { background: rgba(255, 77, 142, 0.1); color: var(--accent-pink); }
  .good-tag { background: rgba(0, 255, 136, 0.1); color: var(--accent-green); }

  .chat-msgs {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .msg {
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.55;
  }
  .msg.user {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text);
    border: 1px solid var(--border);
  }
  .msg.ai.confused {
    background: rgba(255, 77, 142, 0.06);
    color: var(--text-muted);
    border: 1px solid rgba(255, 77, 142, 0.15);
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .ai-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent-pink);
    flex-shrink: 0;
    margin-top: 4px;
    animation: blink 1.5s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .agent-flow {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .agent-msg {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
  }
  .agent-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid;
    border-radius: 6px;
    padding: 3px 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .agent-text {
    color: var(--text-muted);
    padding-top: 2px;
  }

  .pain-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pill {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 100px;
    background: rgba(255, 77, 142, 0.08);
    color: var(--accent-pink);
    border: 1px solid rgba(255, 77, 142, 0.18);
  }
  .good-pill {
    background: rgba(0, 255, 136, 0.08);
    color: var(--accent-green);
    border-color: rgba(0, 255, 136, 0.18);
  }

  @media (max-width: 768px) {
    .prob-grid {
      grid-template-columns: 1fr;
    }
    .prob-arrow { transform: rotate(90deg); }
  }
</style>
