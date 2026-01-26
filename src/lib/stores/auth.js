import { writable, derived, get } from 'svelte/store';
import { onAuthStateChanged, signInWithRedirect, signOut, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config.js';

// Auth state store
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
    initialized: false,
    error: null
  });

  // Only set up auth listener if Firebase is configured
  if (isFirebaseConfigured()) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create or update user document in Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            // New user - create document
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              settings: {
                soundEnabled: true,
                vibrationEnabled: true,
                volume: 70,
                keepScreenAwake: false,
                themePreference: 'system'
              }
            });
          } else {
            // Existing user - update last login
            await setDoc(userRef, {
              lastLoginAt: serverTimestamp(),
              displayName: user.displayName,
              photoURL: user.photoURL
            }, { merge: true });
          }
        } catch (error) {
          console.warn('Error updating user document:', error);
        }
      }

      set({
        user,
        loading: false,
        initialized: true,
        error: null
      });
    }, (error) => {
      set({
        user: null,
        loading: false,
        initialized: true,
        error: error.message
      });
    });
  } else {
    // Firebase not configured - set as initialized with no user
    set({
      user: null,
      loading: false,
      initialized: true,
      error: null
    });
  }

  return {
    subscribe,
    setError: (error) => update(s => ({ ...s, error })),
    clearError: () => update(s => ({ ...s, error: null }))
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const isAuthenticated = derived(authStore, $auth => !!$auth.user);
export const currentUser = derived(authStore, $auth => $auth.user);
export const isLoading = derived(authStore, $auth => $auth.loading);
export const isInitialized = derived(authStore, $auth => $auth.initialized);
export const authError = derived(authStore, $auth => $auth.error);

// Check if this is a new user (for migration prompt)
export async function isNewUser(userId) {
  if (!isFirebaseConfigured()) return false;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return true;

    // Check if user has any timers or events
    // If they don't, treat as new for migration purposes
    const timersRef = doc(db, 'users', userId, 'timers', '__check__');
    const eventsRef = doc(db, 'users', userId, 'eventRefs', '__check__');

    return true; // For simplicity, always offer migration on first sign-in
  } catch (error) {
    console.warn('Error checking if new user:', error);
    return false;
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    await signInWithRedirect(auth, provider);
    // User will be redirected, result handled by getRedirectResult
  } catch (error) {
    console.error('Google sign-in error:', error);
    authStore.setError(error.message);
    throw error;
  }
}

// Handle redirect result (call this on app init)
export async function handleRedirectResult() {
  if (!isFirebaseConfigured()) return null;

  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Redirect result error:', error);
    authStore.setError(error.message);
    return null;
  }
}

// Sign out
export async function signOutUser() {
  if (!isFirebaseConfigured()) {
    return;
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    authStore.setError(error.message);
    throw error;
  }
}

// Get current auth state synchronously
export function getAuthState() {
  return get(authStore);
}
