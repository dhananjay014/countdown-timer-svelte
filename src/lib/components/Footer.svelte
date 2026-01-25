<script>
  import { settings } from '../stores/settings.js';
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
  </div>

  <p class="credit">Built with Svelte + Vite</p>
</footer>

<style>
  footer {
    background: white;
    border-top: 1px solid #e0e0e0;
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
    color: #666;
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
    color: #666;
  }

  input[type="range"] {
    width: 100px;
    height: 6px;
    accent-color: #667eea;
    cursor: pointer;
  }

  .volume-value {
    font-size: 14px;
    color: #666;
    min-width: 40px;
  }

  .credit {
    text-align: center;
    font-size: 12px;
    color: #999;
    margin-top: 10px;
  }
</style>
