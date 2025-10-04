// Authentication stores for DuitTrack
import { writable, derived, type Writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { browser } from '$app/environment';

// Authentication state store
export const authStore: Writable<boolean> = writable(false);

// Current user store
export const userStore: Writable<User | null> = writable(null);

// Loading state for auth operations
export const authLoadingStore: Writable<boolean> = writable(true);

// Authentication status for different states
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export const authStatusStore: Writable<AuthStatus> = writable('loading');

// User profile data store
export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  currency: string;
  locale: string;
  budgetResetDate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const userProfileStore: Writable<UserProfile | null> = writable(null);

// Auth error store
export const authErrorStore: Writable<string | null> = writable(null);

// Session management
export interface SessionData {
  lastActivity: number;
  sessionStart: number;
  rememberMe: boolean;
}

export const sessionStore: Writable<SessionData | null> = writable(null);

// Derived stores for convenience
export const isAuthenticated = derived(
  authStore,
  ($authStore) => $authStore
);

export const currentUser = derived(
  userStore,
  ($userStore) => $userStore
);

export const isOnboardingComplete = derived(
  userProfileStore,
  ($userProfileStore) => $userProfileStore?.onboardingComplete ?? false
);

export const authReady = derived(
  authStatusStore,
  ($authStatus) => $authStatus !== 'loading'
);

export const hasAuthError = derived(
  authErrorStore,
  ($authError) => !!$authError
);

// Session management actions
export const sessionActions = {
  // Start a new session
  startSession: (rememberMe = false) => {
    const now = Date.now();
    sessionStore.set({
      lastActivity: now,
      sessionStart: now,
      rememberMe
    });

    if (browser) {
      localStorage.setItem('duittrack-session', JSON.stringify({
        lastActivity: now,
        sessionStart: now,
        rememberMe
      }));
    }
  },

  // Update last activity
  updateActivity: () => {
    const now = Date.now();
    sessionStore.update(session => {
      if (session) {
        const updated = { ...session, lastActivity: now };

        if (browser) {
          localStorage.setItem('duittrack-session', JSON.stringify(updated));
        }

        return updated;
      }
      return session;
    });
  },

  // Clear session
  clearSession: () => {
    sessionStore.set(null);

    if (browser) {
      localStorage.removeItem('duittrack-session');
    }
  },

  // Check if session is valid
  isSessionValid: (): boolean => {
    if (!browser) return false;

    const sessionData = localStorage.getItem('duittrack-session');
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();
      const sessionAge = now - session.sessionStart;
      const inactivityTime = now - session.lastActivity;

      // Session expires after 30 days if remember me, otherwise 24 hours
      const maxSessionAge = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      // Inactivity timeout: 2 hours
      const maxInactivity = 2 * 60 * 60 * 1000;

      return sessionAge < maxSessionAge && inactivityTime < maxInactivity;
    } catch {
      return false;
    }
  },

  // Restore session from localStorage
  restoreSession: () => {
    if (!browser) return;

    const sessionData = localStorage.getItem('duittrack-session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        sessionStore.set(session);
      } catch {
        // Invalid session data, clear it
        localStorage.removeItem('duittrack-session');
      }
    }
  }
};

// Auth actions
export const authActions = {
  // Set authentication state
  setAuthState: (authenticated: boolean, user: User | null = null) => {
    authStore.set(authenticated);
    userStore.set(user);
    authStatusStore.set(authenticated ? 'authenticated' : 'unauthenticated');

    if (authenticated && user) {
      sessionActions.startSession();
      sessionActions.updateActivity();
    } else {
      sessionActions.clearSession();
    }
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    authLoadingStore.set(loading);
    if (loading) {
      authStatusStore.set('loading');
    }
  },

  // Set error state
  setError: (error: string | null) => {
    authErrorStore.set(error);
    if (error) {
      authStatusStore.set('error');
    }
  },

  // Clear all auth data
  clearAuth: () => {
    authStore.set(false);
    userStore.set(null);
    userProfileStore.set(null);
    authErrorStore.set(null);
    authStatusStore.set('unauthenticated');
    sessionActions.clearSession();
  },

  // Set user profile
  setUserProfile: (profile: UserProfile | null) => {
    userProfileStore.set(profile);
  },

  // Update activity tracking
  updateActivity: () => {
    sessionActions.updateActivity();
  }
};

// Initialize session restoration on load
if (browser) {
  sessionActions.restoreSession();
}

// Compatibility alias for components expecting user
export const user = userStore;
