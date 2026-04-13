<script>
  import { onMount } from 'svelte'
  import { animate, inView } from 'motion'

  const features = [
    { label: 'Define agent roles & responsibilities', others: true,  rna: true  },
    { label: 'Schema-driven configuration',           others: false, rna: true  },
    { label: 'Cross-platform (Copilot, Cursor, Claude Code, Codex, Kimi)', others: false, rna: true },
    { label: 'Built-in join patterns (multi-agent coordination)', others: false, rna: true },
    { label: 'Shared memory & timeline across agents', others: false, rna: true  },
    { label: 'Auto tool/MCP discovery during setup',   others: false, rna: true  },
    { label: 'Director Plan Mode (structured planning before execution)', others: false, rna: true },
    { label: 'Session-zero bootstrap (one command)',    others: false, rna: true  },
    { label: 'Zero runtime dependencies',              others: false, rna: true  },
    { label: 'Token-efficient context injection',       others: false, rna: true  },
    { label: 'Open source (MIT)',                       others: true,  rna: true  },
  ]

  onMount(() => {
    inView('.comparison-section', () => {
      animate('.comp-header', { opacity: [0, 1], y: [20, 0] }, { duration: 0.6 })
      animate('.comp-table-wrap', { opacity: [0, 1], y: [28, 0] }, { duration: 0.7, delay: 0.2 })
    }, { amount: 0.25 })
  })
</script>

<section class="comparison-section">
  <div class="container">
    <div class="comp-header">
      <span class="section-tag">Why RNA Method</span>
      <h2 class="section-title">Agents vs. agent <em>collectives</em></h2>
      <p class="section-sub">
        Other frameworks help you define agents.
        RNA Method helps you make them <strong>work together</strong>.
      </p>
    </div>

    <div class="comp-table-wrap">
      <table class="comp-table">
        <thead>
          <tr>
            <th class="feature-col"></th>
            <th class="others-col">Others</th>
            <th class="rna-col">RNA Method</th>
          </tr>
        </thead>
        <tbody>
          {#each features as feat}
            <tr>
              <td class="feature-label">{feat.label}</td>
              <td class="check-cell">
                {#if feat.others}
                  <span class="check yes-dim">Yes</span>
                {:else}
                  <span class="check no">No</span>
                {/if}
              </td>
              <td class="check-cell rna-cell">
                <span class="check yes">Yes</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>

<style>
  .comparison-section {
    padding: 100px 0;
  }

  .comp-header {
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
    color: var(--accent-amber, #ffb800);
    margin-bottom: 12px;
  }

  .section-title {
    font-size: clamp(26px, 3.5vw, 40px);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .section-title em {
    font-style: normal;
    background: linear-gradient(120deg, var(--accent-cyan) 0%, var(--accent-green) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-sub {
    font-size: 17px;
    color: var(--text-muted);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.65;
  }

  .section-sub strong {
    color: var(--text);
    font-weight: 600;
  }

  .comp-table-wrap {
    max-width: 740px;
    margin: 0 auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
  }

  .comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  thead tr {
    border-bottom: 1px solid var(--border);
  }

  th {
    padding: 16px 20px;
    font-weight: 600;
    text-align: center;
    font-size: 14px;
    letter-spacing: 0.02em;
  }

  .feature-col {
    text-align: left;
    width: 60%;
  }

  .others-col {
    color: var(--text-muted);
    width: 20%;
  }

  .rna-col {
    color: var(--accent-cyan);
    width: 20%;
  }

  tbody tr {
    border-top: 1px solid var(--border);
    transition: background 0.15s;
  }

  tbody tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .feature-label {
    padding: 14px 20px;
    color: var(--text-muted);
    font-size: 13.5px;
    line-height: 1.5;
  }

  .check-cell {
    padding: 14px 20px;
    text-align: center;
  }

  .check {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .yes {
    color: var(--accent-cyan);
  }

  .yes-dim {
    color: var(--accent-green);
  }

  .no {
    color: var(--text-dim);
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .comp-table {
      font-size: 12px;
    }

    th, .feature-label, .check-cell {
      padding: 10px 12px;
    }
  }
</style>
