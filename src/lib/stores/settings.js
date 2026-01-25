import { writable } from 'svelte/store';

const STORAGE_KEY = 'countdown-settings';

function createSettingsStore() {
  const defaults = { soundOn: true, volume: 70, darkMode: false };
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaults))
    : defaults;

  const { subscribe, set, update } = writable(stored);

  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    toggleSound: () => update(s => ({ ...s, soundOn: !s.soundOn })),
    setVolume: (volume) => update(s => ({ ...s, volume })),
    setSoundOn: (soundOn) => update(s => ({ ...s, soundOn })),
    toggleDarkMode: () => update(s => ({ ...s, darkMode: !s.darkMode })),
    setDarkMode: (darkMode) => update(s => ({ ...s, darkMode }))
  };
}

export const settings = createSettingsStore();
