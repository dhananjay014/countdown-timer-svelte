<script>
  import { onMount } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import TabNav from './lib/components/TabNav.svelte';
  import TimersList from './lib/components/TimersList.svelte';
  import EventsList from './lib/components/EventsList.svelte';
  import Footer from './lib/components/Footer.svelte';
  import SharedEventPage from './lib/components/SharedEventPage.svelte';
  import MigrationModal from './lib/components/MigrationModal.svelte';
  import { themeMode } from './lib/stores/settings.js';
  import { authStore, isAuthenticated, signOutUser } from './lib/stores/auth.js';
  import { hasLocalData } from './lib/firebase/sync.js';
  import { isFirebaseConfigured } from './lib/firebase/config.js';

  let activeTab = 'timers';
  let route = 'home';
  let shareId = null;
  let showMigrationModal = false;
  let hasCheckedMigration = false;

  // Parse route from URL
  function parseRoute() {
    const path = window.location.pathname;
    const match = path.match(/^\/e(?:vent)?\/([a-zA-Z0-9]+)$/);
    if (match) {
      route = 'shared';
      shareId = match[1];
    } else {
      route = 'home';
      shareId = null;
    }
  }

  onMount(() => {
    parseRoute();

    // Listen for navigation events
    window.addEventListener('popstate', parseRoute);

    return () => {
      window.removeEventListener('popstate', parseRoute);
    };
  });

  // Navigate to home
  function navigateHome() {
    window.history.pushState({}, '', '/');
    route = 'home';
    shareId = null;
  }

  // Check for migration when user signs in
  $: if (isFirebaseConfigured() && $authStore.initialized && $isAuthenticated && !hasCheckedMigration) {
    hasCheckedMigration = true;
    if (hasLocalData()) {
      showMigrationModal = true;
    }
  }

  // Reset migration check when user signs out
  $: if (!$isAuthenticated) {
    hasCheckedMigration = false;
  }

  function handleMigrationComplete(event) {
    showMigrationModal = false;
    // Data will be synced automatically via store subscriptions
  }

  function handleMigrationCancel() {
    showMigrationModal = false;
    // Sign out user if they cancel
    signOutUser();
  }
</script>

<main class:dark={$themeMode === 'dark'}>
  {#if route === 'shared' && shareId}
    <SharedEventPage {shareId} on:navigate-home={navigateHome} />
  {:else}
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
  {/if}

  <MigrationModal
    show={showMigrationModal}
    on:complete={handleMigrationComplete}
    on:cancel={handleMigrationCancel}
  />
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
