<script>
  import { settings } from '../stores/settings.js';

  const themeOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
  ];
</script>

<footer>
  <div class="controls">
    <label class="sound-toggle">
      <input
        type="checkbox"
        checked={$settings.soundOn}
        on:change={(e) => settings.setSoundOn(e.target.checked)}
      />
      <span class="bell">🔔</span>
      Sound {$settings.soundOn ? 'On' : 'Off'}
    </label>

    <div class="volume-control">
      <span class="speaker">🔊</span>
      <input
        type="range"
        min="0"
        max="100"
        value={$settings.volume}
        on:input={(e) => settings.setVolume(parseInt(e.target.value))}
      />
      <span class="volume-value">{$settings.volume}%</span>
    </div>

    <div class="theme-control">
      <span class="theme-label">Theme</span>
      <div class="theme-options">
        {#each themeOptions as option}
          <button
            class:selected={$settings.themePreference === option.value}
            on:click={() => settings.setThemePreference(option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <p class="credit">Built with Svelte + Vite</p>
</footer>

<style>
  footer {
    background: var(--bg-card, white);
    border-top: 1px solid var(--border-color, #e0e0e0);
    padding: 14px 20px;
  }

  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    flex-wrap: wrap;
  }

  .sound-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary, #666);
  }

  .sound-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #667eea;
    cursor: pointer;
  }

  .bell {
    font-size: 16px;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .speaker {
    font-size: 16px;
    color: var(--text-secondary, #666);
  }

  input[type="range"] {
    width: 100px;
    height: 6px;
    accent-color: #667eea;
    cursor: pointer;
  }

  .volume-value {
    font-size: 14px;
    color: var(--text-secondary, #666);
    min-width: 40px;
  }

  .theme-control {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .theme-label {
    font-size: 14px;
    color: var(--text-secondary, #666);
  }

  .theme-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .theme-options button {
    border: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-secondary, #666);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-options button:hover {
    background: var(--border-color, #eee);
  }

  .theme-options button.selected {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }

  .credit {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted, #999);
    margin-top: 10px;
  }
</style>
