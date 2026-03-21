<script>
  import Nav from './lib/Nav.svelte'
  import Hero from './lib/Hero.svelte'
  import Problem from './lib/Problem.svelte'
  import HowItWorks from './lib/HowItWorks.svelte'
  import AgentCollective from './lib/AgentCollective.svelte'
  import JoinPatterns from './lib/JoinPatterns.svelte'
  import PlatformSupport from './lib/PlatformSupport.svelte'
  import CodePreview from './lib/CodePreview.svelte'
  import Footer from './lib/Footer.svelte'
</script>

<div class="bg-mesh" aria-hidden="true"></div>
<Nav />
<main>
  <Hero />
  <Problem />
  <HowItWorks />
  <AgentCollective />
  <JoinPatterns />
  <PlatformSupport />
  <CodePreview />
</main>
<Footer />

<style>
  .bg-mesh {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 60%, rgba(168, 85, 247, 0.04) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 50% 10%, rgba(0, 255, 136, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  main {
    position: relative;
    z-index: 1;
  }
</style>

<section id="center">
  <div class="hero">
    <img src={heroImg} class="base" width="170" height="179" alt="" />
    <img src={svelteLogo} class="framework" alt="Svelte logo" />
    <img src={viteLogo} class="vite" alt="Vite logo" />
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/App.svelte</code> and save to test <code>HMR</code></p>
  </div>
  <Counter />
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="docs">
    <svg class="icon" role="presentation" aria-hidden="true">
      <use href="/icons.svg#documentation-icon"></use>
    </svg>
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <ul>
      <li>
        <a href="https://vite.dev/" target="_blank" rel="noreferrer">
          <img class="logo" src={viteLogo} alt="" />
          Explore Vite
        </a>
      </li>
      <li>
        <a href="https://svelte.dev/" target="_blank" rel="noreferrer">
          <img class="button-icon" src={svelteLogo} alt="" />
          Learn more
        </a>
      </li>
    </ul>
  </div>
  <div id="social">
    <svg class="icon" role="presentation" aria-hidden="true">
      <use href="/icons.svg#social-icon"></use>
    </svg>
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li>
        <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
          <svg class="button-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#github-icon"></use>
          </svg>
          GitHub
        </a>
      </li>
      <li>
        <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
          <svg class="button-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#discord-icon"></use>
          </svg>
          Discord
        </a>
      </li>
      <li>
        <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
          <svg class="button-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#x-icon"></use>
          </svg>
          X.com
        </a>
      </li>
      <li>
        <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
          <svg class="button-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#bluesky-icon"></use>
          </svg>
          Bluesky
        </a>
      </li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
