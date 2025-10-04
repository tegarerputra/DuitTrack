// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  // Global types for DuitTrack fintech app
  interface Window {
    // Firebase globals for compatibility with existing code
    firebase: typeof import('firebase/compat/app').default;
    auth: import('firebase/compat/auth').Auth;
    db: import('firebase/compat/firestore').Firestore;
    FirebaseUtils: typeof import('$lib/config/firebase').FirebaseUtils;

    // Legacy app globals during migration
    app?: any;
    showDashboard?: () => void;
    showLanding?: () => void;
    showBudgetOnboarding?: () => void;
    loadUserData?: () => void;
  }

  // Environment variables
  declare const __APP_VERSION__: string;
  declare const __BUILD_TIME__: string;
  declare const __CURRENCY__: string;
  declare const __LOCALE__: string;
}

export {};