<script>
  import { onMount, onDestroy } from 'svelte';
  import { events } from '../stores/events.js';
  import { isAuthenticated, currentUser } from '../stores/auth.js';

  export let event;

  let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  let interval;
  let showShareMenu = false;
  let shareUrl = '';
  let copying = false;
  let copied = false;

  $: isOwner = $currentUser && event.ownerId === $currentUser.uid;
  $: canShare = $isAuthenticated && isOwner && !event.isLinkedCopy;
  $: shareDisabledReason = ! $isAuthenticated
    ? 'Sign in to share events'
    : (!isOwner
      ? 'Only the owner can share'
      : (event.isLinkedCopy ? 'Linked copies cannot be shared' : ''));

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
    if (event.isLinkedCopy) {
      events.removeLinkedCopy(event.id);
    } else {
      events.remove(event.id);
    }
  }

  async function handleShare() {
    if (!canShare) return;

    if (event.isShared && event.shareId) {
      // Already shared, show the share URL
      shareUrl = `${window.location.origin}/e/${event.shareId}`;
      showShareMenu = true;
    } else {
      // Enable sharing
      const shareId = await events.enableSharing(event.id);
      if (shareId) {
        shareUrl = `${window.location.origin}/e/${shareId}`;
        showShareMenu = true;
      }
    }
  }

  async function copyShareUrl() {
    copying = true;
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    } finally {
      copying = false;
    }
  }

  function handleStopSharing() {
    events.disableSharing(event.id);
    showShareMenu = false;
  }

  function closeShareMenu() {
    showShareMenu = false;
  }
</script>

<div class="card" class:orphaned={event.isOrphaned}>
  <div class="card-header">
    <div class="title-area">
      <span class="event-name">{event.name}</span>
      {#if event.isLinkedCopy}
        <span class="badge linked">Linked</span>
      {/if}
      {#if event.isShared}
        <span class="badge shared">Shared</span>
      {/if}
    </div>
    <div class="actions">
      <button
        class="action-btn share-btn"
        on:click={handleShare}
        title={shareDisabledReason || 'Share event'}
        disabled={!canShare}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
      <button class="action-btn delete-btn" on:click={handleDelete} title="Delete event">×</button>
    </div>
  </div>

  {#if event.isLinkedCopy && event.ownerDisplayName}
    <p class="owner-info">By {event.ownerDisplayName}</p>
  {/if}

  {#if event.isOrphaned}
    <div class="orphan-notice">
      Original event was deleted by its owner
    </div>
  {/if}

  <p class="target-date">{formatDate(event.targetDate)}</p>

  {#if timeLeft.isPast}
    <div class="past-message">
      <span class="celebration">&#127881;</span>
      Event has passed
      <span class="celebration">&#127881;</span>
    </div>
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

{#if showShareMenu}
  <div class="share-overlay" on:click={closeShareMenu}>
    <div class="share-modal" on:click|stopPropagation>
      <h3>Share Event</h3>
      <p class="share-description">Anyone with this link can view and add this event to their account.</p>

      <div class="share-url-container">
        <input type="text" readonly value={shareUrl} class="share-url-input" />
        <button class="copy-btn" on:click={copyShareUrl} disabled={copying}>
          {#if copied}
            &#10003; Copied
          {:else}
            Copy
          {/if}
        </button>
      </div>

      <div class="share-actions">
        <button class="btn secondary" on:click={handleStopSharing}>
          Stop Sharing
        </button>
        <button class="btn primary" on:click={closeShareMenu}>
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.08));
    width: 100%;
    max-width: 400px;
  }

  .card.orphaned {
    opacity: 0.7;
    border: 2px dashed var(--border-color, #ccc);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .title-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .event-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }

  .badge.linked {
    background: #e0f2fe;
    color: #0284c7;
  }

  .badge.shared {
    background: #dcfce7;
    color: #16a34a;
  }

  .actions {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .share-btn {
    background: #e0f2fe;
    color: #0284c7;
  }

  .share-btn:hover {
    background: #bae6fd;
  }

  .delete-btn {
    background: #ffebee;
    color: #f44336;
    font-size: 20px;
    line-height: 1;
  }

  .delete-btn:hover {
    background: #ffcdd2;
  }

  .owner-info {
    color: var(--text-muted, #888);
    font-size: 12px;
    margin: 4px 0 0;
    font-style: italic;
  }

  .orphan-notice {
    background: #fef3c7;
    color: #92400e;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    margin-top: 12px;
    text-align: center;
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
    color: #10b981;
    font-size: 16px;
    font-weight: 500;
    padding: 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .celebration {
    font-size: 20px;
  }

  /* Share Modal */
  .share-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .share-modal {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  .share-modal h3 {
    margin: 0 0 8px;
    font-size: 20px;
    color: var(--text-primary, #333);
  }

  .share-description {
    color: var(--text-secondary, #666);
    font-size: 14px;
    margin-bottom: 16px;
  }

  .share-url-container {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .share-url-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 14px;
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-primary, #333);
  }

  .copy-btn {
    padding: 10px 16px;
    border: none;
    background: #667eea;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .copy-btn:hover {
    background: #5b6edc;
  }

  .copy-btn:disabled {
    opacity: 0.7;
  }

  .share-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn.primary {
    background: #667eea;
    color: white;
  }

  .btn.primary:hover {
    background: #5b6edc;
  }

  .btn.secondary {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-primary, #333);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .btn.secondary:hover {
    background: var(--border-color, #e0e0e0);
  }
</style>
