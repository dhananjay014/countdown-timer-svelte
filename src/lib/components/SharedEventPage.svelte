<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { doc, getDoc } from 'firebase/firestore';
  import { db, isFirebaseConfigured } from '../firebase/config.js';
  import { timestampToMillis } from '../firebase/sync.js';
  import { isAuthenticated, currentUser } from '../stores/auth.js';
  import { events } from '../stores/events.js';
  import AuthButton from './AuthButton.svelte';

  export let shareId;

  const dispatch = createEventDispatcher();

  let loading = true;
  let error = null;
  let event = null;
  let timeRemaining = '';
  let isPast = false;
  let addingToAccount = false;
  let addedToAccount = false;

  onMount(async () => {
    if (!isFirebaseConfigured()) {
      error = 'Firebase is not configured';
      loading = false;
      return;
    }

    try {
      // Look up the share link
      const shareLinkRef = doc(db, 'shareLinks', shareId);
      const shareLinkSnap = await getDoc(shareLinkRef);

      if (!shareLinkSnap.exists()) {
        error = 'Event not found';
        loading = false;
        return;
      }

      const shareLinkData = shareLinkSnap.data();
      const eventId = shareLinkData.eventId;

      // Fetch the event
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        error = 'Event not found';
        loading = false;
        return;
      }

      const data = eventSnap.data();

      // Only show if public
      if (data.visibility !== 'public') {
        error = 'This event is not publicly shared';
        loading = false;
        return;
      }

      event = {
        id: eventSnap.id,
        name: data.name,
        targetDate: timestampToMillis(data.targetDate),
        ownerDisplayName: data.ownerDisplayName || 'Someone',
        ownerId: data.ownerId
      };

      loading = false;

      // Start countdown
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    } catch (e) {
      console.error('Error fetching shared event:', e);
      error = 'Failed to load event';
      loading = false;
    }
  });

  function updateCountdown() {
    if (!event) return;

    const now = Date.now();
    const target = event.targetDate;
    const diff = target - now;

    if (diff <= 0) {
      isPast = true;
      timeRemaining = 'Event has passed!';
      return;
    }

    isPast = false;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      timeRemaining = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      timeRemaining = `${minutes}m ${seconds}s`;
    } else {
      timeRemaining = `${seconds}s`;
    }
  }

  function formatDate(millis) {
    return new Date(millis).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  async function handleAddToMyEvents() {
    if (!$currentUser || !event) return;

    addingToAccount = true;

    try {
      await events.addLinkedCopy(event);
      addedToAccount = true;
    } catch (e) {
      console.error('Error adding to account:', e);
      alert('Failed to add event to your account');
    } finally {
      addingToAccount = false;
    }
  }

  function handleGoHome() {
    dispatch('navigate-home');
  }
</script>

<div class="shared-page">
  <header>
    <button class="back-btn" on:click={handleGoHome}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to App
    </button>
  </header>

  <main>
    {#if loading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading event...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <div class="error-icon">&#9888;</div>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button class="btn primary" on:click={handleGoHome}>
          Go to App
        </button>
      </div>
    {:else if event}
      <div class="event-card" class:past={isPast}>
        <div class="shared-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Shared by {event.ownerDisplayName}
        </div>

        <h1>{event.name}</h1>

        <div class="countdown">
          {#if isPast}
            <span class="celebration">&#127881;</span>
          {/if}
          <span class="time">{timeRemaining}</span>
          {#if isPast}
            <span class="celebration">&#127881;</span>
          {/if}
        </div>

        <p class="target-date">{formatDate(event.targetDate)}</p>

        {#if isPast}
          <div class="past-badge">Event Completed!</div>
        {/if}
      </div>

      <div class="actions">
        {#if $isAuthenticated}
          {#if addedToAccount}
            <div class="success-message">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Added to your events!
            </div>
            <button class="btn primary" on:click={handleGoHome}>
              View My Events
            </button>
          {:else if $currentUser?.uid === event.ownerId}
            <p class="info">This is your event</p>
            <button class="btn primary" on:click={handleGoHome}>
              Go to My Events
            </button>
          {:else}
            <button
              class="btn primary"
              on:click={handleAddToMyEvents}
              disabled={addingToAccount}
            >
              {#if addingToAccount}
                <span class="spinner small"></span>
                Adding...
              {:else}
                Add to My Events
              {/if}
            </button>
          {/if}
        {:else}
          <p class="sign-in-prompt">Sign in to add this event to your account</p>
          <AuthButton />
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .shared-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 16px 20px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .loading {
    text-align: center;
    color: white;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  .spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    text-align: center;
    color: white;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-state h2 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .error-state p {
    opacity: 0.9;
    margin-bottom: 24px;
  }

  .event-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 32px;
    text-align: center;
    max-width: 500px;
    width: 100%;
    color: white;
  }

  .event-card.past {
    background: rgba(16, 185, 129, 0.3);
  }

  .shared-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    margin-bottom: 20px;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .countdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .time {
    font-size: 36px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .celebration {
    font-size: 32px;
  }

  .target-date {
    font-size: 15px;
    opacity: 0.9;
  }

  .past-badge {
    margin-top: 16px;
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
  }

  .actions {
    margin-top: 32px;
    text-align: center;
  }

  .btn {
    padding: 14px 28px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn.primary {
    background: white;
    color: #667eea;
  }

  .btn.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .sign-in-prompt {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 16px;
    font-size: 15px;
  }

  .info {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 16px;
    font-size: 15px;
  }

  .success-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: white;
    font-weight: 600;
    margin-bottom: 16px;
    font-size: 16px;
  }
</style>
