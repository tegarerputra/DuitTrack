<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { authActions, authStore, userStore, sessionActions } from '$stores/auth';
  import { uiActions } from '$stores/ui';
  import AuthErrorDisplay from '$components/auth/AuthErrorDisplay.svelte';
  import SimpleNav from '$components/navigation/SimpleNav.svelte';

  // FIXED: Accept route params to prevent unknown prop warnings
  export let params: Record<string, string> = {};

  let activityInterval: NodeJS.Timeout | null = null;

  // Initialize Firebase when component mounts
  onMount(async () => {
    if (browser) {
      // Import Firebase configuration
      await import('$lib/config/firebase');

      // Initialize PWA functionality - temporarily disabled for debugging
      // if ('serviceWorker' in navigator) {
      //   try {
      //     await navigator.serviceWorker.register('/sw.js');
      //   } catch (error) {
      //     console.warn('ServiceWorker registration failed:', error);
      //   }
      // }

      // Listen for PWA install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        uiActions.showPWAInstallPrompt();
      });

      // Listen for custom auth redirect events
      window.addEventListener('auth-redirect', (e: Event) => {
        const customEvent = e as CustomEvent;
        console.log('Auth redirect event:', customEvent.detail);
        const { path, reason } = customEvent.detail;

        // Use dynamic import to get SvelteKit's goto function
        import('$app/navigation').then(({ goto }) => {
          goto(path);
        });
      });

      // Set up activity tracking for authenticated users
      const unsubscribe = authStore.subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          startActivityTracking();
        } else {
          stopActivityTracking();
        }
      });

      // Add activity listeners
      setupActivityListeners();

      // Remove initial loader
      const loader = document.getElementById('initial-loader');
      if (loader) {
        setTimeout(() => {
          loader.style.opacity = '0';
          setTimeout(() => {
            loader.remove();
          }, 300);
        }, 1000);
      }

      // Cleanup function
      return () => {
        unsubscribe();
        stopActivityTracking();
        removeActivityListeners();
        window.removeEventListener('auth-redirect', () => {});
      };
    }
  });

  onDestroy(() => {
    if (browser) {
      stopActivityTracking();
      removeActivityListeners();
    }
  });

  function startActivityTracking() {
    // Update activity every 30 seconds for authenticated users
    activityInterval = setInterval(() => {
      authActions.updateActivity();
    }, 30000);
  }

  function stopActivityTracking() {
    if (activityInterval) {
      clearInterval(activityInterval);
      activityInterval = null;
    }
  }

  function updateUserActivity() {
    authActions.updateActivity();
  }

  function setupActivityListeners() {
    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, updateUserActivity, { passive: true });
    });
  }

  function removeActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.removeEventListener(event, updateUserActivity);
    });
  }
</script>

<main class="min-h-screen fintech-background">
  <!-- Simple Navigation -->
  <SimpleNav />

  <!-- Global error display for authentication -->
  <AuthErrorDisplay />

  <!-- Main Content with top padding for fixed navbar -->
  <div class="pt-16">
    <slot />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: #0D1117;
    color: #F0F6FC;
  }

  /* Light Background for better liquid glass contrast */
  .fintech-background {
    background: linear-gradient(135deg,
      #f8fafc 0%,
      #e2e8f0 25%,
      #cbd5e1 50%,
      #e2e8f0 75%,
      #f8fafc 100%);
    position: relative;
    overflow-x: hidden;
    min-height: 100vh;
  }

  .fintech-background::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  /* Global dark theme styles */
  :global(.glass-card) {
    background: rgba(13, 17, 23, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(184, 134, 11, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  :global(.text-gray-900) {
    color: #F0F6FC !important;
  }

  :global(.text-gray-600) {
    color: #8B949E !important;
  }

  :global(.text-gray-500) {
    color: #6E7681 !important;
  }

  :global(.text-primary-600) {
    color: #B8860B !important;
  }
</style>