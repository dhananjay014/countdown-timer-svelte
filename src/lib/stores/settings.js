import { writable, readable, derived } from 'svelte/store';

const STORAGE_KEY = 'countdown-settings';

function createSettingsStore() {
  const defaults = { soundOn: true, volume: 70, themePreference: 'system' };
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaults))
    : defaults;
  const initial = { ...defaults, ...stored };

  if (stored?.darkMode !== undefined && stored?.themePreference === undefined) {
    initial.themePreference = stored.darkMode ? 'dark' : 'light';
  }

  const { subscribe, set, update } = writable(initial);

  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      const persistValue = {
        soundOn: value.soundOn,
        volume: value.volume,
        themePreference: value.themePreference,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistValue));
    }
  });

  return {
    subscribe,
    toggleSound: () => update(s => ({ ...s, soundOn: !s.soundOn })),
    setVolume: (volume) => update(s => ({ ...s, volume })),
    setSoundOn: (soundOn) => update(s => ({ ...s, soundOn })),
    setThemePreference: (themePreference) => update(s => ({ ...s, themePreference })),
  };
}

export const settings = createSettingsStore();

const systemPrefersDark = readable(false, (set) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return undefined;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => set(mediaQuery.matches);

  update();

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }

  mediaQuery.addListener(update);
  return () => mediaQuery.removeListener(update);
});

export const themeMode = derived([settings, systemPrefersDark], ([$settings, $systemPrefersDark]) => {
  if ($settings.themePreference === 'dark') return 'dark';
  if ($settings.themePreference === 'light') return 'light';
  return $systemPrefersDark ? 'dark' : 'light';
});
