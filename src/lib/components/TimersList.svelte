<script>
  import { timers } from '../stores/timers.js';
  import TimerCard from './TimerCard.svelte';

  const MAX_TIMERS = 20;

  $: timerCount = $timers.length;
  $: canAddMore = timerCount < MAX_TIMERS;
</script>

<div class="timers-container">
  <div class="header-row">
    <h2>Countdown Timers</h2>
    <div class="actions">
      {#if timerCount > 0}
        <button class="btn clear" on:click={() => timers.clearAll()}>
          Clear All
        </button>
      {/if}
      <button
        class="btn add"
        on:click={() => timers.add()}
        disabled={!canAddMore}
      >
        + Add Timer
      </button>
    </div>
  </div>

  {#if timerCount === 0}
    <div class="empty-state">
      <div class="empty-card">
        <span class="empty-icon">⏱️</span>
        <h3>No timers yet</h3>
        <p>Create a countdown timer to track your tasks!</p>
        <button class="btn create" on:click={() => timers.add()}>
          + Create Your First Timer
        </button>
      </div>
    </div>
  {:else}
    <div class="timers-grid">
      {#each $timers as timer (timer.id)}
        <TimerCard {timer} />
      {/each}
    </div>
    <p class="timer-count">{timerCount} of {MAX_TIMERS} timers</p>
  {/if}
</div>

<style>
  .timers-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary, #333);
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.clear {
    background: var(--bg-card, white);
    color: var(--text-secondary, #666);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .btn.clear:hover {
    background: var(--bg-secondary, #f5f5f5);
  }

  .btn.add {
    background: #667eea;
    color: white;
    border: none;
  }

  .btn.add:hover:not(:disabled) {
    background: #5a6fd6;
  }

  .btn.add:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .empty-card {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 50px;
    text-align: center;
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.08));
    max-width: 500px;
    width: 100%;
  }

  .empty-icon {
    font-size: 56px;
    display: block;
    margin-bottom: 16px;
  }

  .empty-card h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin: 0 0 8px;
  }

  .empty-card p {
    color: var(--text-secondary, #666);
    font-size: 15px;
    margin: 0 0 24px;
  }

  .btn.create {
    background: #667eea;
    color: white;
    border: none;
    padding: 14px 28px;
    font-size: 15px;
  }

  .btn.create:hover {
    background: #5a6fd6;
  }

  .timers-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .timer-count {
    text-align: center;
    color: var(--text-muted, #999);
    font-size: 14px;
    margin-top: 24px;
  }
</style>
