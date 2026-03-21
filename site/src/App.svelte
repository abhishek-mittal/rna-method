<script>
  import Nav from './lib/Nav.svelte'
  import Hero from './lib/Hero.svelte'
  import Problem from './lib/Problem.svelte'
  import HowItWorks from './lib/HowItWorks.svelte'
  import AgentCollective from './lib/AgentCollective.svelte'
  import JoinPatterns from './lib/JoinPatterns.svelte'
  import AgentFlow from './lib/AgentFlow.svelte'
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
  <AgentFlow />
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
