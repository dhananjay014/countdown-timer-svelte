<script>
  import { events } from '../stores/events.js';

  export let show = false;
  export let onClose = () => {};

  let name = '';
  let dateStr = '';
  let timeStr = '12:00';
  let error = '';

  // Default to tomorrow
  $: {
    if (show && !dateStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateStr = tomorrow.toISOString().split('T')[0];
    }
  }

  function handleSubmit() {
    error = '';

    if (!name.trim()) {
      error = 'Please enter an event name';
      return;
    }

    if (!dateStr) {
      error = 'Please enter a date';
      return;
    }

    const targetDate = new Date(`${dateStr}T${timeStr}`);

    if (isNaN(targetDate.getTime())) {
      error = 'Invalid date/time';
      return;
    }

    events.add(name.trim(), targetDate);
    handleClose();
  }

  function handleClose() {
    name = '';
    dateStr = '';
    timeStr = '12:00';
    error = '';
    onClose();
  }
</script>

{#if show}
  <div class="overlay" on:click={handleClose}>
    <div class="modal" on:click|stopPropagation>
      <h2>New Event</h2>

      <div class="field">
        <label for="name">Event Name</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Birthday, Meeting, etc."
        />
      </div>

      <div class="field">
        <label for="date">Date</label>
        <input
          id="date"
          type="date"
          bind:value={dateStr}
        />
      </div>

      <div class="field">
        <label for="time">Time</label>
        <input
          id="time"
          type="time"
          bind:value={timeStr}
        />
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="buttons">
        <button class="btn cancel" on:click={handleClose}>Cancel</button>
        <button class="btn submit" on:click={handleSubmit}>Add Event</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  h2 {
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary, #333);
    margin: 0 0 24px;
  }

  .field {
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary, #555);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 14px;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    font-size: 16px;
    color: var(--text-primary, #333);
    background: var(--bg-secondary, #f9f9f9);
  }

  input:focus {
    outline: none;
    border-color: #667eea;
    background: var(--bg-card, white);
  }

  .error {
    color: #f44336;
    font-size: 14px;
    text-align: center;
    margin-bottom: 16px;
  }

  .buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .btn {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.cancel {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-secondary, #666);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .btn.cancel:hover {
    background: var(--border-color, #eee);
  }

  .btn.submit {
    background: #667eea;
    color: white;
    border: none;
  }

  .btn.submit:hover {
    background: #5a6fd6;
  }
</style>
