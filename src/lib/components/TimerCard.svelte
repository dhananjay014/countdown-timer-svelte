<script>
  import { onMount, onDestroy } from 'svelte';
  import { timers } from '../stores/timers.js';
  import { settings } from '../stores/settings.js';

  export let timer;

  let displayTime = timer.remaining;
  let interval;
  let editingName = false;
  let nameInput = timer.name;

  $: progress = timer.duration > 0 ? displayTime / timer.duration : 1;

  // SVG circle properties
  const radius = 70;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  $: strokeDashoffset = circumference * (1 - progress);
  const size = (radius + strokeWidth) * 2;

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function playAlarm() {
    if (!$settings.soundOn) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const volume = $settings.volume / 100;

      const playBeep = (time, freq = 880) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3 * volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        oscillator.start(time);
        oscillator.stop(time + 0.3);
      };

      const now = audioContext.currentTime;
      playBeep(now, 880);
      playBeep(now + 0.4, 880);
      playBeep(now + 0.8, 1100);
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  function tick() {
    if (timer.status === 'running' && timer.endTime) {
      const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
      displayTime = remaining;

      if (remaining <= 0) {
        timers.complete(timer.id);
        playAlarm();
      }
    } else {
      displayTime = timer.remaining;
    }
  }

  onMount(() => {
    interval = setInterval(tick, 100);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  function handleStartPause() {
    if (timer.status === 'running') {
      timers.pause(timer.id);
    } else if (timer.status === 'completed') {
      timers.reset(timer.id);
    } else {
      timers.start(timer.id);
    }
  }

  function handleReset() {
    timers.reset(timer.id);
  }

  function handleDelete() {
    timers.remove(timer.id);
  }

  function startEditingName() {
    nameInput = timer.name;
    editingName = true;
  }

  function saveName() {
    const newName = nameInput.trim() || 'Untitled Timer';
    timers.setName(timer.id, newName);
    editingName = false;
  }

  function handleNameKeydown(e) {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      editingName = false;
      nameInput = timer.name;
    }
  }

  $: buttonLabel = timer.status === 'running' ? 'Pause' :
                   timer.status === 'paused' ? 'Resume' :
                   timer.status === 'completed' ? 'Restart' : 'Start';
</script>

<div class="card" class:active={timer.status === 'running'}>
  <div class="card-header">
    {#if editingName}
      <input
        type="text"
        class="name-input"
        bind:value={nameInput}
        on:blur={saveName}
        on:keydown={handleNameKeydown}
        autofocus
      />
    {:else}
      <button class="timer-name" on:click={startEditingName} title="Click to edit name">
        {timer.name}
      </button>
    {/if}
    <button class="delete-btn" on:click={handleDelete}>×</button>
  </div>

  <div class="timer-circle">
    <svg width={size} height={size}>
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke="var(--border-color, #e0e0e0)"
        stroke-width={strokeWidth}
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke="#667eea"
        stroke-width={strokeWidth}
        stroke-dasharray={circumference}
        stroke-dashoffset={strokeDashoffset}
        stroke-linecap="round"
        transform="rotate(-90 {size/2} {size/2})"
      />
    </svg>
    <div class="time-display">
      {formatTime(displayTime)}
    </div>
  </div>

  <div class="controls">
    <button class="btn primary" on:click={handleStartPause}>
      {buttonLabel}
    </button>
    <button class="btn secondary" on:click={handleReset}>
      Reset
    </button>
  </div>
</div>

<style>
  .card {
    background: var(--bg-card, white);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.08));
    width: 290px;
    transition: box-shadow 0.2s ease;
  }

  .card.active {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 10px;
  }

  .timer-name {
    color: var(--text-secondary, #666);
    font-size: 15px;
    font-weight: 500;
    background: none;
    border: none;
    padding: 4px 8px;
    margin: -4px -8px;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timer-name:hover {
    background: var(--bg-secondary, #f5f5f5);
  }

  .name-input {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary, #333);
    background: var(--bg-card, white);
    padding: 4px 8px;
    border: 1px solid #667eea;
    border-radius: 4px;
    outline: none;
    min-width: 0;
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
    flex-shrink: 0;
  }

  .delete-btn:hover {
    background: #ffcdd2;
  }

  .timer-circle {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
  }

  .time-display {
    position: absolute;
    font-size: 32px;
    font-weight: 300;
    color: var(--text-primary, #333);
    letter-spacing: 2px;
  }

  .controls {
    display: flex;
    gap: 12px;
    margin-top: 16px;
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

  .btn.primary {
    background: #667eea;
    color: white;
    border: none;
  }

  .btn.primary:hover {
    background: #5a6fd6;
  }

  .btn.secondary {
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-secondary, #666);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .btn.secondary:hover {
    background: var(--border-color, #eee);
  }
</style>
