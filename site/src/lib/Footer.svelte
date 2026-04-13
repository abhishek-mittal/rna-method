<footer>
  <div class="container footer-inner">
    <div class="footer-brand">
      <div class="logo">
        <span class="logo-rna">RNA</span>
        <span class="logo-sep">/</span>
        <span class="logo-method">Method</span>
      </div>
      <p class="tagline">Reusable Neural Activators — schema-driven AI agent collectives.</p>
      <div class="badges">
        <a href="https://github.com/abhishek-mittal/rna-method/blob/main/LICENSE" target="_blank" rel="noopener" class="badge-link">MIT License</a>
        <span class="badge-sep">·</span>
        <a href="https://github.com/abhishek-mittal/rna-method/blob/main/schema/rna-schema.json" target="_blank" rel="noopener" class="badge-link">Schema v1.0.0</a>
      </div>
    </div>

    <div class="footer-links">
      <div class="link-group">
        <div class="link-group-title">Docs</div>
        <a href="https://rna.webnco.xyz/docs/getting-started">Getting Started</a>
        <a href="https://rna.webnco.xyz/docs/reference/schema-reference">Schema Reference</a>
        <a href="https://rna.webnco.xyz/docs/guides/cross-platform">Platform Guide</a>
        <a href="https://rna.webnco.xyz/docs/guides/failure-modes">Failure Modes</a>
      </div>
      <div class="link-group">
        <div class="link-group-title">Project</div>
        <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener">GitHub</a>
        <a href="https://github.com/abhishek-mittal/rna-method/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Changelog</a>
        <a href="https://github.com/abhishek-mittal/rna-method/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Contributing</a>
        <a href="https://github.com/abhishek-mittal/rna-method/blob/main/SECURITY.md" target="_blank" rel="noopener">Security</a>
      </div>
      <div class="link-group">
        <div class="link-group-title">Templates</div>
        <a href="https://github.com/abhishek-mittal/rna-method/tree/main/templates/minimal-collective" target="_blank" rel="noopener">Minimal Collective</a>
        <a href="https://github.com/abhishek-mittal/rna-method/tree/main/templates/full-collective" target="_blank" rel="noopener">Full Collective</a>
        <a href="https://github.com/abhishek-mittal/rna-method/tree/main/adapters" target="_blank" rel="noopener">Adapters</a>
        <a href="https://rna.webnco.xyz/docs/research/research-paper">Research Paper</a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="container bottom-inner">
      <span>© 2025 Abhishek Mittal · RNA Method is MIT-licensed open source software.</span>
      <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener" class="gh-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        abhishek-mittal/rna-method
      </a>
    </div>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--border);
    position: relative;
    z-index: 1;
    background: var(--surface);
  }
  .footer-inner {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 64px;
    padding-top: 60px;
    padding-bottom: 60px;
    align-items: start;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .logo-rna {
    color: var(--accent-cyan);
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .logo-sep { color: var(--text-dim); }
  .logo-method { color: var(--text-muted); font-weight: 400; }
  .tagline {
    font-size: 14px;
    color: var(--text-muted);
    max-width: 320px;
    margin-bottom: 14px;
  }
  .badges {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .badge-link {
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.2s;
  }
  .badge-link:hover { color: var(--text-muted); text-decoration: none; }
  .badge-sep { color: var(--text-dim); }

  .footer-links {
    display: flex;
    gap: 48px;
  }
  .link-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .link-group-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 2px;
  }
  .link-group a {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .link-group a:hover { color: var(--text); text-decoration: none; }

  .footer-bottom {
    border-top: 1px solid var(--border);
    padding: 16px 0;
  }
  .bottom-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-dim);
  }
  .gh-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.2s;
  }
  .gh-link:hover { color: var(--text-muted); text-decoration: none; }

  @media (max-width: 900px) {
    .footer-inner { grid-template-columns: 1fr; gap: 40px; }
    .footer-links { flex-wrap: wrap; gap: 32px; }
  }
  @media (max-width: 600px) {
    .bottom-inner { flex-direction: column; gap: 8px; text-align: center; }
  }
</style>
