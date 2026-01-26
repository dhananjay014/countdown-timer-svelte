import { writable, get } from 'svelte/store';
import { authStore, currentUser } from './auth.js';
import { isFirebaseConfigured } from '../firebase/config.js';
import {
  subscribeToTimers,
  syncTimerToCloud,
  deleteTimerFromCloud,
  generateId
} from '../firebase/sync.js';

const STORAGE_KEY = 'countdown-timers';
const MAX_TIMERS = 20;

function createTimersStore() {
  // Load from localStorage
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    : [];

  const { subscribe, set, update } = writable(stored);

  let unsubscribeFirestore = null;
  let isCloudMode = false;

  // Save to localStorage on every change (always, for offline fallback)
  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
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

        // Subscribe to Firestore timers
        unsubscribeFirestore = subscribeToTimers($auth.user.uid, (cloudTimers) => {
          // Merge cloud timers with local state (preserving running status)
          update(localTimers => {
            return cloudTimers.map(cloudTimer => {
              const localTimer = localTimers.find(t => t.id === cloudTimer.id);
              if (localTimer && (localTimer.status === 'running' || localTimer.status === 'paused')) {
                // Preserve local running/paused state
                return {
                  ...cloudTimer,
                  status: localTimer.status,
                  remaining: localTimer.remaining,
                  endTime: localTimer.endTime
                };
              }
              return cloudTimer;
            });
          });
        });
      } else if ($auth.initialized && !$auth.user) {
        // User signed out - switch to local mode
        isCloudMode = false;

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }

        // Reload from localStorage
        const localData = typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
          : [];
        set(localData);
      }
    });
  }

  // Helper to sync to cloud if authenticated
  function syncToCloud(timer) {
    const user = get(currentUser);
    if (isCloudMode && user) {
      syncTimerToCloud(user.uid, timer).catch(console.error);
    }
  }

  function deleteFromCloud(timerId) {
    const user = get(currentUser);
    if (isCloudMode && user) {
      deleteTimerFromCloud(user.uid, timerId).catch(console.error);
    }
  }

  return {
    subscribe,
    add: () => {
      let newTimer;
      update(timers => {
        if (timers.length >= MAX_TIMERS) return timers;
        newTimer = {
          id: generateId(),
          name: 'Untitled Timer',
          duration: 60, // 1 minute default
          remaining: 60,
          status: 'idle', // idle, running, paused, completed
          endTime: null
        };
        return [...timers, newTimer];
      });
      if (newTimer) {
        syncToCloud(newTimer);
      }
    },
    remove: (id) => {
      update(timers => timers.filter(t => t.id !== id));
      deleteFromCloud(id);
    },
    start: (id) => {
      update(timers => timers.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'running',
            endTime: Date.now() + t.remaining * 1000
          };
        }
        return t;
      }));
      // Don't sync running state to cloud (ephemeral)
    },
    pause: (id) => {
      update(timers => timers.map(t => {
        if (t.id === id && t.endTime) {
          const remaining = Math.max(0, Math.ceil((t.endTime - Date.now()) / 1000));
          return {
            ...t,
            status: 'paused',
            remaining,
            endTime: null
          };
        }
        return t;
      }));
      // Don't sync paused state to cloud (ephemeral)
    },
    reset: (id) => {
      update(timers => timers.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'idle',
            remaining: t.duration,
            endTime: null
          };
        }
        return t;
      }));
      // Don't sync reset to cloud (ephemeral state)
    },
    complete: (id) => {
      update(timers => timers.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'completed',
            remaining: 0,
            endTime: null
          };
        }
        return t;
      }));
      // Don't sync completed state to cloud (ephemeral)
    },
    updateRemaining: (id, remaining) => {
      update(timers => timers.map(t => {
        if (t.id === id) {
          return { ...t, remaining };
        }
        return t;
      }));
    },
    setDuration: (id, duration) => {
      let updatedTimer;
      update(timers => timers.map(t => {
        if (t.id === id) {
          updatedTimer = {
            ...t,
            duration,
            remaining: duration,
            status: 'idle',
            endTime: null
          };
          return updatedTimer;
        }
        return t;
      }));
      if (updatedTimer) {
        syncToCloud(updatedTimer);
      }
    },
    setName: (id, name) => {
      let updatedTimer;
      update(timers => timers.map(t => {
        if (t.id === id) {
          updatedTimer = { ...t, name };
          return updatedTimer;
        }
        return t;
      }));
      if (updatedTimer) {
        syncToCloud(updatedTimer);
      }
    },
    clearAll: () => {
      const currentTimers = get({ subscribe });
      set([]);
      // Delete all from cloud
      currentTimers.forEach(timer => deleteFromCloud(timer.id));
    }
  };
}

export const timers = createTimersStore();
