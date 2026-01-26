<script>
  import { createEventDispatcher } from 'svelte';
  import { currentUser } from '../stores/auth.js';
  import {
    hasLocalData,
    getLocalData,
    migrateLocalDataToCloud,
    clearLocalData
  } from '../firebase/sync.js';

  export let show = false;

  const dispatch = createEventDispatcher();

  let loading = false;
  let error = null;
  let localDataInfo = { timers: 0, events: 0 };

  $: if (show) {
    const data = getLocalData();
    localDataInfo = {
      timers: data.timers.length,
      events: data.events.length
    };
  }

  async function handleMigrate() {
    if (!$currentUser) return;

    loading = true;
    error = null;

    try {
      const localData = getLocalData();
      await migrateLocalDataToCloud(
        $currentUser.uid,
        $currentUser.displayName || 'User',
        $currentUser.email,
        localData.timers,
        localData.events,
        localData.settings
      );
      clearLocalData();
      dispatch('complete', { migrated: true });
      show = false;
    } catch (e) {
      console.error('Migration error:', e);
      error = e.message || 'Migration failed. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleStartFresh() {
    clearLocalData();
    dispatch('complete', { migrated: false });
    show = false;
  }

  function handleCancel() {
    dispatch('cancel');
    show = false;
  }
</script>

{#if show}
  <div class="overlay" on:click={handleCancel}>
    <div class="modal" on:click|stopPropagation>
      <h2>Welcome Back!</h2>

      <p class="description">
        We found existing data on this device. Would you like to migrate it to your cloud account?
      </p>

      <div class="data-summary">
        <div class="data-item">
          <span class="icon">&#9200;</span>
          <span class="count">{localDataInfo.timers}</span>
          <span class="label">Timer{localDataInfo.timers !== 1 ? 's' : ''}</span>
        </div>
        <div class="data-item">
          <span class="icon">&#128197;</span>
          <span class="count">{localDataInfo.events}</span>
          <span class="label">Event{localDataInfo.events !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="actions">
        <button class="btn primary" on:click={handleMigrate} disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
            Migrating...
          {:else}
            Migrate to Cloud
          {/if}
        </button>

        <button class="btn secondary" on:click={handleStartFresh} disabled={loading}>
          Start Fresh
        </button>

        <button class="btn text" on:click={handleCancel} disabled={loading}>
          Stay Offline
        </button>
      </div>

      <p class="hint">
        Choosing "Start Fresh" will clear local data. "Stay Offline" will sign you out.
      </p>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 28px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 24px;
    color: var(--text-primary, #333);
    text-align: center;
  }

  .description {
    color: var(--text-secondary, #666);
    font-size: 15px;
    line-height: 1.5;
    text-align: center;
    margin-bottom: 20px;
  }

  .data-summary {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 12px;
  }

  .data-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .icon {
    font-size: 24px;
  }

  .count {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary, #333);
  }

  .label {
    font-size: 13px;
    color: var(--text-secondary, #666);
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn.secondary {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-primary, #333);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .btn.secondary:hover:not(:disabled) {
    background: var(--border-color, #e0e0e0);
  }

  .btn.text {
    background: none;
    color: var(--text-secondary, #666);
  }

  .btn.text:hover:not(:disabled) {
    color: var(--text-primary, #333);
  }

  .hint {
    font-size: 12px;
    color: var(--text-muted, #999);
    text-align: center;
    margin-top: 16px;
    margin-bottom: 0;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
