<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { authStore, userStore, authLoadingStore } from '$stores/auth';
  import type { User } from 'firebase/auth';

  export let requireAuth = true;
  export let redirectTo = '/';
  export let fallback: string | null = null;

  let isAuthenticated = false;
  let user: User | null = null;
  let loading = true;

  onMount(() => {
    if (!browser) {
      loading = false;
      return;
    }

    // Subscribe to auth state
    const unsubscribeAuth = authStore.subscribe((auth) => {
      isAuthenticated = auth;
    });

    const unsubscribeUser = userStore.subscribe((userData) => {
      user = userData;
    });

    const unsubscribeLoading = authLoadingStore.subscribe((authLoading) => {
      loading = authLoading;

      // Handle navigation when auth state is determined
      if (!authLoading) {
        if (requireAuth && !isAuthenticated) {
          goto(redirectTo);
        } else if (!requireAuth && isAuthenticated && fallback) {
          goto(fallback);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeLoading();
    };
  });

  // Show loading state while determining auth
  $: showLoading = loading;
  $: shouldRender = !loading && (
    (requireAuth && isAuthenticated) ||
    (!requireAuth && !isAuthenticated)
  );
</script>

{#if showLoading}
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mb-4 mx-auto"></div>
      <p class="text-white font-medium">Memuat...</p>
    </div>
  </div>
{:else if shouldRender}
  <slot {user} {isAuthenticated} />
{:else}
  <!-- Unauthorized/Wrong state - will redirect via onMount -->
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div class="glass-card p-8 max-w-md mx-4 text-center">
      <div class="text-yellow-400 text-6xl mb-4">🔐</div>
      <h2 class="text-xl font-semibold text-white mb-2">
        {requireAuth ? 'Authentication Required' : 'Already Signed In'}
      </h2>
      <p class="text-gray-300 mb-6">
        {requireAuth
          ? 'Please sign in to access this page'
          : 'You are already signed in'}
      </p>
      <button
        on:click={() => goto(requireAuth ? redirectTo : (fallback || '/dashboard'))}
        class="glass-button"
      >
        {requireAuth ? 'Go to Sign In' : 'Go to Dashboard'}
      </button>
    </div>
  </div>
{/if}

<style>
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .glass-button {
    @apply w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 backdrop-blur-sm;
  }
</style>