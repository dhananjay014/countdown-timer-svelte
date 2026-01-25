import { writable } from 'svelte/store';

const STORAGE_KEY = 'countdown-events';

function createEventsStore() {
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    : [];

  const { subscribe, set, update } = writable(stored);

  subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    add: (name, targetDate) => {
      update(events => [...events, {
        id: Date.now().toString(),
        name,
        targetDate: targetDate.getTime()
      }]);
    },
    remove: (id) => {
      update(events => events.filter(e => e.id !== id));
    },
    clearAll: () => set([])
  };
}

export const events = createEventsStore();
