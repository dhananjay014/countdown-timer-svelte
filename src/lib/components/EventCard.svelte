<script>
  import { onMount, onDestroy } from 'svelte';
  import { events } from '../stores/events.js';

  export let event;

  let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  let interval;

  function calculateTimeLeft() {
    const now = Date.now();
    const diff = event.targetDate - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isPast: false
    };
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onMount(() => {
    timeLeft = calculateTimeLeft();
    interval = setInterval(() => {
      timeLeft = calculateTimeLeft();
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  function handleDelete() {
    events.remove(event.id);
  }
</script>

<div class="card">
  <div class="card-header">
    <span class="event-name">{event.name}</span>
    <button class="delete-btn" on:click={handleDelete}>×</button>
  </div>

  <p class="target-date">{formatDate(event.targetDate)}</p>

  {#if timeLeft.isPast}
    <div class="past-message">Event has passed</div>
  {:else}
    <div class="countdown">
      <div class="time-unit">
        <span class="value">{timeLeft.days}</span>
        <span class="label">days</span>
      </div>
      <span class="separator">:</span>
      <div class="time-unit">
        <span class="value">{timeLeft.hours}</span>
        <span class="label">hrs</span>
      </div>
      <span class="separator">:</span>
      <div class="time-unit">
        <span class="value">{timeLeft.minutes}</span>
        <span class="label">min</span>
      </div>
      <span class="separator">:</span>
      <div class="time-unit">
        <span class="value">{timeLeft.seconds}</span>
        <span class="label">sec</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.08));
    width: 100%;
    max-width: 400px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .event-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .delete-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ffebee;
    border: none;
    color: #f44336;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background 0.2s;
  }

  .delete-btn:hover {
    background: #ffcdd2;
  }

  .target-date {
    color: var(--text-muted, #888);
    font-size: 13px;
    margin: 8px 0 20px;
  }

  .countdown {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .time-unit {
    text-align: center;
    min-width: 50px;
  }

  .value {
    display: block;
    font-size: 32px;
    font-weight: 300;
    color: #667eea;
  }

  .label {
    display: block;
    font-size: 12px;
    color: var(--text-muted, #888);
    margin-top: 4px;
  }

  .separator {
    font-size: 28px;
    color: var(--border-color, #ccc);
    margin-bottom: 20px;
  }

  .past-message {
    text-align: center;
    color: #f44336;
    font-size: 16px;
    font-weight: 500;
    padding: 20px 0;
  }
</style>
