import { writable, readable, derived, get } from 'svelte/store';
import { authStore, currentUser } from './auth.js';
import { isFirebaseConfigured } from '../firebase/config.js';
import { subscribeToSettings, syncSettingsToCloud } from '../firebase/sync.js';

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

  let unsubscribeFirestore = null;
  let isCloudMode = false;
  let skipNextSync = false; // Prevent sync loops

  // Save to localStorage on every change
  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      const persistValue = {
        soundOn: value.soundOn,
        volume: value.volume,
        themePreference: value.themePreference,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistValue));
    }

    // Sync to cloud if authenticated (debounced)
    if (isCloudMode && !skipNextSync) {
      const user = get(currentUser);
      if (user) {
        syncSettingsToCloud(user.uid, value).catch(console.error);
      }
    }
    skipNextSync = false;
  });

  // Subscribe to auth changes
  if (isFirebaseConfigured()) {
    authStore.subscribe($auth => {
      if ($auth.initialized && $auth.user) {
        // User signed in - switch to cloud mode
        isCloudMode = true;

        // Unsubscribe from previous listener if any
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }

        // Subscribe to Firestore settings
        unsubscribeFirestore = subscribeToSettings($auth.user.uid, (cloudSettings) => {
          if (cloudSettings) {
            skipNextSync = true; // Prevent sync back to cloud
            update(current => ({
              ...current,
              soundOn: cloudSettings.soundEnabled ?? current.soundOn,
              volume: cloudSettings.volume ?? current.volume,
              themePreference: cloudSettings.themePreference ?? current.themePreference
            }));
          }
        });
      } else if ($auth.initialized && !$auth.user) {
        // User signed out - switch to local mode
        isCloudMode = false;

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });
  }

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
