<script>
  export let activeTab = 'timers';
</script>

<nav>
  <button
    class="tab"
    class:active={activeTab === 'timers'}
    on:click={() => activeTab = 'timers'}
  >
    <span class="tab-icon">⏱️</span> Timers
  </button>
  <button
    class="tab"
    class:active={activeTab === 'events'}
    on:click={() => activeTab = 'events'}
  >
    <span class="tab-icon">📅</span> Events
  </button>
</nav>

<style>
  nav {
    display: flex;
    background: white;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab {
    flex: 1;
    padding: 16px 24px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .tab:hover {
    background: #f8f8f8;
  }

  .tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .tab-icon {
    font-size: 16px;
  }
</style>
