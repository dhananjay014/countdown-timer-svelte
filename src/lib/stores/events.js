import { writable, get } from 'svelte/store';
import { authStore, currentUser } from './auth.js';
import { isFirebaseConfigured } from '../firebase/config.js';
import {
  subscribeToUserEvents,
  syncEventToCloud,
  deleteEventFromCloud,
  generateId,
  generateShareId
} from '../firebase/sync.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const STORAGE_KEY = 'countdown-events';

function createEventsStore() {
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

        // Subscribe to Firestore events
        unsubscribeFirestore = subscribeToUserEvents($auth.user.uid, (cloudEvents) => {
          set(cloudEvents);
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

  // Helper to get current user info
  function getUserInfo() {
    const user = get(currentUser);
    if (!user) return null;
    return {
      uid: user.uid,
      displayName: user.displayName || 'User',
      email: user.email
    };
  }

  // Helper to sync to cloud if authenticated
  function syncToCloud(event) {
    const userInfo = getUserInfo();
    if (isCloudMode && userInfo) {
      syncEventToCloud(userInfo.uid, userInfo.displayName, userInfo.email, event).catch(console.error);
    }
  }

  function deleteFromCloud(eventId) {
    const userInfo = getUserInfo();
    if (isCloudMode && userInfo) {
      deleteEventFromCloud(userInfo.uid, eventId).catch(console.error);
    }
  }

  return {
    subscribe,
    add: (name, targetDate) => {
      const userInfo = getUserInfo();
      const newEvent = {
        id: generateId(),
        name,
        targetDate: targetDate.getTime(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Ownership fields
        ownerId: userInfo?.uid || null,
        ownerDisplayName: userInfo?.displayName || null,
        ownerEmail: userInfo?.email || null,
        // Sharing fields
        isShared: false,
        shareId: null,
        visibility: 'private',
        // Linked copy fields
        isLinkedCopy: false,
        originalEventId: null,
        originalOwnerId: null,
        isOrphaned: false
      };

      update(events => [...events, newEvent]);
      syncToCloud(newEvent);
    },
    remove: (id) => {
      update(events => events.filter(e => e.id !== id));
      deleteFromCloud(id);
    },
    update: (id, updates) => {
      let updatedEvent;
      update(events => events.map(e => {
        if (e.id === id) {
          updatedEvent = { ...e, ...updates, updatedAt: Date.now() };
          return updatedEvent;
        }
        return e;
      }));
      if (updatedEvent) {
        syncToCloud(updatedEvent);
      }
    },
    // Enable sharing for an event
    enableSharing: async (id) => {
      const userInfo = getUserInfo();
      if (!userInfo || !isCloudMode) {
        console.warn('Must be signed in to share events');
        return null;
      }

      const shareId = generateShareId();

      update(events => events.map(e => {
        if (e.id === id && e.ownerId === userInfo.uid) {
          const updatedEvent = {
            ...e,
            isShared: true,
            shareId,
            visibility: 'public',
            updatedAt: Date.now()
          };
          syncToCloud(updatedEvent);

          // Create share link lookup document
          const shareLinkRef = doc(db, 'shareLinks', shareId);
          setDoc(shareLinkRef, {
            eventId: id,
            ownerId: userInfo.uid,
            createdAt: serverTimestamp()
          }).catch(console.error);

          return updatedEvent;
        }
        return e;
      }));

      return shareId;
    },
    // Disable sharing for an event
    disableSharing: (id) => {
      const userInfo = getUserInfo();
      if (!userInfo || !isCloudMode) return;

      update(events => events.map(e => {
        if (e.id === id && e.ownerId === userInfo.uid) {
          const updatedEvent = {
            ...e,
            isShared: false,
            visibility: 'private',
            updatedAt: Date.now()
          };
          syncToCloud(updatedEvent);
          return updatedEvent;
        }
        return e;
      }));
    },
    // Add a linked copy of a shared event to user's account
    addLinkedCopy: async (originalEvent) => {
      const userInfo = getUserInfo();
      if (!userInfo || !isCloudMode) {
        console.warn('Must be signed in to add events');
        return null;
      }

      const linkedEvent = {
        id: generateId(),
        name: originalEvent.name,
        targetDate: originalEvent.targetDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Ownership fields
        ownerId: userInfo.uid,
        ownerDisplayName: userInfo.displayName,
        ownerEmail: userInfo.email,
        // Sharing fields
        isShared: false,
        shareId: null,
        visibility: 'private',
        // Linked copy fields
        isLinkedCopy: true,
        originalEventId: originalEvent.id,
        originalOwnerId: originalEvent.ownerId,
        isOrphaned: false
      };

      update(events => [...events, linkedEvent]);
      syncToCloud(linkedEvent);

      return linkedEvent;
    },
    // Remove linked copy from user's events
    removeLinkedCopy: (id) => {
      update(events => events.filter(e => e.id !== id));
      deleteFromCloud(id);
    },
    clearAll: () => {
      const currentEvents = get({ subscribe });
      set([]);
      // Delete all from cloud
      currentEvents.forEach(event => deleteFromCloud(event.id));
    }
  };
}

export const events = createEventsStore();
