<script>
  let scrolled = false
  function handleScroll() { scrolled = window.scrollY > 20 }
</script>

<svelte:window on:scroll={handleScroll} />

<header class:scrolled>
  <div class="container nav-inner">
    <a href="#top" class="logo">
      <span class="logo-rna">RNA</span>
      <span class="logo-sep">/</span>
      <span class="logo-method">Method</span>
    </a>
    <nav>
      <a href="#how-it-works">How it works</a>
      <a href="#agents">Agents</a>
      <a href="#platforms">Platforms</a>
      <a href="https://rna.webnco.xyz/docs/" class="nav-docs">Docs</a>
      <a href="https://github.com/abhishek-mittal/rna-method" target="_blank" rel="noopener" class="btn-github">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        GitHub
      </a>
    </nav>
  </div>
</header>

<style>
  header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
    border-bottom: 1px solid transparent;
  }
  header.scrolled {
    background: rgba(7, 7, 18, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-color: var(--border);
  }
  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-decoration: none;
  }
  .logo:hover { text-decoration: none; }
  .logo-rna {
    color: var(--accent-cyan);
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .logo-sep { color: var(--text-dim); }
  .logo-method { color: var(--text-muted); font-weight: 400; }
  nav {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  nav a {
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }
  nav a:hover { color: var(--text); text-decoration: none; }
  .btn-github {
    display: flex !important;
    align-items: center;
    gap: 6px;
    background: var(--surface-2);
    border: 1px solid var(--border-bright);
    border-radius: 8px;
    padding: 6px 14px;
    color: var(--text) !important;
    font-size: 13px !important;
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-github:hover {
    background: var(--surface-3);
    border-color: var(--accent-cyan) !important;
  }
  @media (max-width: 640px) {
    nav a:not(.btn-github) { display: none; }
  }
</style>
