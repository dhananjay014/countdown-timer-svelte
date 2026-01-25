<script>
  import Header from './lib/components/Header.svelte';
  import TabNav from './lib/components/TabNav.svelte';
  import TimersList from './lib/components/TimersList.svelte';
  import EventsList from './lib/components/EventsList.svelte';
  import Footer from './lib/components/Footer.svelte';

  let activeTab = 'timers';
</script>

<main>
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
    background-color: #f5f5f5;
    min-height: 100vh;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    background-color: #f5f5f5;
  }
</style>
