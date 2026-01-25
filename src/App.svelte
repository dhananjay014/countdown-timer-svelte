<script>
  import Header from './lib/components/Header.svelte';
  import TabNav from './lib/components/TabNav.svelte';
  import TimersList from './lib/components/TimersList.svelte';
  import EventsList from './lib/components/EventsList.svelte';
  import Footer from './lib/components/Footer.svelte';
  import { themeMode } from './lib/stores/settings.js';

  let activeTab = 'timers';
</script>

<main class:dark={$themeMode === 'dark'}>
  <Header />
  <TabNav bind:activeTab />

  <div class="content">
    {#if activeTab === 'timers'}
      <TimersList />
    {:else}
      <EventsList />
    {/if}
  </div>

  <Footer />
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    min-height: 100vh;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    --bg-primary: #f5f5f5;
    --bg-card: #ffffff;
    --bg-secondary: #f5f5f5;
    --text-primary: #333333;
    --text-secondary: #666666;
    --text-muted: #999999;
    --border-color: #e0e0e0;
    --shadow-color: rgba(0, 0, 0, 0.08);
  }

  main.dark {
    --bg-primary: #1a1a2e;
    --bg-card: #16213e;
    --bg-secondary: #0f3460;
    --text-primary: #eaeaea;
    --text-secondary: #b8b8b8;
    --text-muted: #888888;
    --border-color: #2a2a4a;
    --shadow-color: rgba(0, 0, 0, 0.3);
  }

  .content {
    flex: 1;
    background-color: var(--bg-primary);
  }

  :global(body) {
    background-color: var(--bg-primary);
  }
</style>
