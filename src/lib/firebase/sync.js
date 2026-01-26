import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config.js';

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate short share ID for URLs
export function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert Firestore Timestamp to JS Date/milliseconds
export function timestampToMillis(timestamp) {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  if (timestamp.seconds) {
    return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
  }
  return timestamp;
}

// Subscribe to user's timers collection
export function subscribeToTimers(userId, callback) {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  const timersRef = collection(db, 'users', userId, 'timers');

  return onSnapshot(
    timersRef,
    (snapshot) => {
      const timers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.label || data.name || 'Untitled Timer',
          duration: data.totalSeconds || 60,
          remaining: data.totalSeconds || 60,
          status: 'idle', // Always reset to idle from cloud
          endTime: null,
          // Store original cloud data for sync
          _cloud: {
            hours: data.hours || 0,
            minutes: data.minutes || 0,
            seconds: data.seconds || 0,
            label: data.label || '',
            createdAt: timestampToMillis(data.createdAt),
            updatedAt: timestampToMillis(data.updatedAt)
          }
        };
      });
      callback(timers);
    },
    (error) => {
      console.error('Error subscribing to timers:', error);
    }
  );
}

// Sync a timer to Firestore
export async function syncTimerToCloud(userId, timer) {
  if (!isFirebaseConfigured() || !userId) return;

  const timerRef = doc(db, 'users', userId, 'timers', timer.id);
  const hours = Math.floor(timer.duration / 3600);
  const minutes = Math.floor((timer.duration % 3600) / 60);
  const seconds = timer.duration % 60;

  await setDoc(timerRef, {
    id: timer.id,
    label: timer.name,
    hours,
    minutes,
    seconds,
    totalSeconds: timer.duration,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Delete a timer from Firestore
export async function deleteTimerFromCloud(userId, timerId) {
  if (!isFirebaseConfigured() || !userId) return;

  const timerRef = doc(db, 'users', userId, 'timers', timerId);
  await deleteDoc(timerRef);
}

// Subscribe to user's events (from top-level events collection)
export function subscribeToEvents(userId, callback) {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  // Subscribe to user's event references
  const eventRefsRef = collection(db, 'users', userId, 'eventRefs');

  return onSnapshot(
    eventRefsRef,
    async (snapshot) => {
      const eventIds = snapshot.docs.map((doc) => doc.data().eventId);

      if (eventIds.length === 0) {
        callback([]);
        return;
      }

      // Fetch all events
      const events = [];
      for (const eventId of eventIds) {
        try {
          const eventRef = doc(db, 'events', eventId);
          const eventSnap = await getDocs(query(collection(db, 'events')));
          // Actually, let's fetch individual docs
        } catch (error) {
          console.warn('Error fetching event:', eventId, error);
        }
      }

      // For simplicity, let's subscribe to events directly
      // This will be handled by separate event subscriptions
      callback([]);
    },
    (error) => {
      console.error('Error subscribing to event refs:', error);
    }
  );
}

// Subscribe to events owned by user or added to their account
export function subscribeToUserEvents(userId, callback) {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  // Subscribe to events collection where user is owner
  const eventsRef = collection(db, 'events');

  return onSnapshot(
    eventsRef,
    async (snapshot) => {
      const events = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Only include events owned by this user or where they have a ref
        if (data.ownerId === userId) {
          events.push({
            id: docSnap.id,
            name: data.name,
            targetDate: timestampToMillis(data.targetDate),
            createdAt: timestampToMillis(data.createdAt),
            updatedAt: timestampToMillis(data.updatedAt),
            // Ownership fields
            ownerId: data.ownerId,
            ownerDisplayName: data.ownerDisplayName,
            isShared: data.isShared || false,
            shareId: data.shareId || null,
            visibility: data.visibility || 'private',
            // Linked copy fields
            isLinkedCopy: data.isLinkedCopy || false,
            originalEventId: data.originalEventId || null,
            originalOwnerId: data.originalOwnerId || null,
            isOrphaned: data.isOrphaned || false
          });
        }
      }

      // Also check eventRefs for linked copies
      try {
        const eventRefsSnap = await getDocs(collection(db, 'users', userId, 'eventRefs'));
        for (const refDoc of eventRefsSnap.docs) {
          const refData = refDoc.data();
          if (!refData.isOwner && refData.eventId) {
            // Find this event in the snapshot
            const eventDoc = snapshot.docs.find(d => d.id === refData.eventId);
            if (eventDoc && !events.find(e => e.id === eventDoc.id)) {
              const data = eventDoc.data();
              events.push({
                id: eventDoc.id,
                name: data.name,
                targetDate: timestampToMillis(data.targetDate),
                createdAt: timestampToMillis(data.createdAt),
                updatedAt: timestampToMillis(data.updatedAt),
                ownerId: data.ownerId,
                ownerDisplayName: data.ownerDisplayName,
                isShared: data.isShared || false,
                shareId: data.shareId || null,
                visibility: data.visibility || 'private',
                isLinkedCopy: data.isLinkedCopy || false,
                originalEventId: data.originalEventId || null,
                originalOwnerId: data.originalOwnerId || null,
                isOrphaned: data.isOrphaned || false
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error fetching event refs:', error);
      }

      callback(events);
    },
    (error) => {
      console.error('Error subscribing to events:', error);
    }
  );
}

// Sync an event to Firestore
export async function syncEventToCloud(userId, userDisplayName, userEmail, event) {
  if (!isFirebaseConfigured() || !userId) return;

  const eventRef = doc(db, 'events', event.id);

  const eventData = {
    id: event.id,
    name: event.name,
    targetDate: Timestamp.fromMillis(event.targetDate),
    updatedAt: serverTimestamp(),
    ownerId: event.ownerId || userId,
    ownerDisplayName: event.ownerDisplayName || userDisplayName,
    ownerEmail: event.ownerEmail || userEmail,
    isShared: event.isShared || false,
    shareId: event.shareId || null,
    visibility: event.visibility || 'private',
    isLinkedCopy: event.isLinkedCopy || false,
    originalEventId: event.originalEventId || null,
    originalOwnerId: event.originalOwnerId || null,
    isOrphaned: event.isOrphaned || false
  };

  // Add createdAt only for new events
  if (!event.createdAt) {
    eventData.createdAt = serverTimestamp();
  }

  await setDoc(eventRef, eventData, { merge: true });

  // Also add to user's eventRefs
  const eventRefDoc = doc(db, 'users', userId, 'eventRefs', event.id);
  await setDoc(eventRefDoc, {
    eventId: event.id,
    addedAt: serverTimestamp(),
    isOwner: (event.ownerId || userId) === userId,
    originalEventId: event.originalEventId || null
  }, { merge: true });
}

// Delete an event from Firestore
export async function deleteEventFromCloud(userId, eventId) {
  if (!isFirebaseConfigured() || !userId) return;

  // Delete the event
  const eventRef = doc(db, 'events', eventId);
  await deleteDoc(eventRef);

  // Delete from user's eventRefs
  const eventRefDoc = doc(db, 'users', userId, 'eventRefs', eventId);
  await deleteDoc(eventRefDoc);
}

// Subscribe to user's settings
export function subscribeToSettings(userId, callback) {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.settings) {
          callback(data.settings);
        }
      }
    },
    (error) => {
      console.error('Error subscribing to settings:', error);
    }
  );
}

// Sync settings to Firestore
export async function syncSettingsToCloud(userId, settings) {
  if (!isFirebaseConfigured() || !userId) return;

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    settings: {
      soundEnabled: settings.soundOn ?? settings.soundEnabled,
      volume: settings.volume,
      themePreference: settings.themePreference,
      // Web doesn't have these, but include for compatibility
      vibrationEnabled: settings.vibrationEnabled ?? true,
      keepScreenAwake: settings.keepScreenAwake ?? false
    }
  }, { merge: true });
}

// Migrate local data to cloud
export async function migrateLocalDataToCloud(userId, userDisplayName, userEmail, localTimers, localEvents, localSettings) {
  if (!isFirebaseConfigured() || !userId) return;

  const batch = writeBatch(db);

  // Migrate timers
  for (const timer of localTimers) {
    const timerRef = doc(db, 'users', userId, 'timers', timer.id);
    const hours = Math.floor(timer.duration / 3600);
    const minutes = Math.floor((timer.duration % 3600) / 60);
    const seconds = timer.duration % 60;

    batch.set(timerRef, {
      id: timer.id,
      label: timer.name,
      hours,
      minutes,
      seconds,
      totalSeconds: timer.duration,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Migrate events
  for (const event of localEvents) {
    const eventRef = doc(db, 'events', event.id);
    batch.set(eventRef, {
      id: event.id,
      name: event.name,
      targetDate: Timestamp.fromMillis(event.targetDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: userId,
      ownerDisplayName: userDisplayName,
      ownerEmail: userEmail,
      isShared: false,
      shareId: null,
      visibility: 'private',
      isLinkedCopy: false,
      originalEventId: null,
      originalOwnerId: null,
      isOrphaned: false
    });

    // Add to eventRefs
    const eventRefDoc = doc(db, 'users', userId, 'eventRefs', event.id);
    batch.set(eventRefDoc, {
      eventId: event.id,
      addedAt: serverTimestamp(),
      isOwner: true,
      originalEventId: null
    });
  }

  // Migrate settings
  const userRef = doc(db, 'users', userId);
  batch.set(userRef, {
    settings: {
      soundEnabled: localSettings.soundOn,
      volume: localSettings.volume,
      themePreference: localSettings.themePreference,
      vibrationEnabled: true,
      keepScreenAwake: false
    }
  }, { merge: true });

  await batch.commit();
}

// Check if user has local data
export function hasLocalData() {
  if (typeof localStorage === 'undefined') return false;

  const timers = JSON.parse(localStorage.getItem('countdown-timers') || '[]');
  const events = JSON.parse(localStorage.getItem('countdown-events') || '[]');

  return timers.length > 0 || events.length > 0;
}

// Get local data for migration
export function getLocalData() {
  if (typeof localStorage === 'undefined') {
    return { timers: [], events: [], settings: {} };
  }

  return {
    timers: JSON.parse(localStorage.getItem('countdown-timers') || '[]'),
    events: JSON.parse(localStorage.getItem('countdown-events') || '[]'),
    settings: JSON.parse(localStorage.getItem('countdown-settings') || '{}')
  };
}

// Clear local data after migration
export function clearLocalData() {
  if (typeof localStorage === 'undefined') return;

  localStorage.removeItem('countdown-timers');
  localStorage.removeItem('countdown-events');
  // Keep settings locally for offline fallback
}
