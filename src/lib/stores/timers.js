import { writable } from 'svelte/store';

const STORAGE_KEY = 'countdown-timers';
const MAX_TIMERS = 20;

function createTimersStore() {
  // Load from localStorage
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    : [];

  const { subscribe, set, update } = writable(stored);

  // Save to localStorage on every change
  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    add: () => {
      update(timers => {
        if (timers.length >= MAX_TIMERS) return timers;
        return [...timers, {
          id: Date.now().toString(),
          name: 'Untitled Timer',
          duration: 60, // 1 minute default
          remaining: 60,
          status: 'idle', // idle, running, paused, completed
          endTime: null
        }];
      });
    },
    remove: (id) => {
      update(timers => timers.filter(t => t.id !== id));
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
      update(timers => timers.map(t => {
        if (t.id === id) {
          return {
            ...t,
            duration,
            remaining: duration,
            status: 'idle',
            endTime: null
          };
        }
        return t;
      }));
    },
    setName: (id, name) => {
      update(timers => timers.map(t => {
        if (t.id === id) {
          return { ...t, name };
        }
        return t;
      }));
    },
    clearAll: () => set([])
  };
}

export const timers = createTimersStore();
