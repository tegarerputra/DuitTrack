<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { authErrorStore } from '$stores/auth';

  const dispatch = createEventDispatcher();

  export let loading = false;
  export let disabled = false;
  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let icon = true;

  let isLoading = false;

  const handleSignOut = async () => {
    if (!browser || isLoading || disabled) return;

    isLoading = true;
    authErrorStore.set(null);

    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('$lib/config/firebase');

      await signOut(auth);

      // Dispatch success event
      dispatch('success');

    } catch (error: any) {
      console.error('Sign out failed:', error);

      const errorMessage = 'Gagal keluar. Silakan coba lagi.';
      authErrorStore.set(errorMessage);

      // Dispatch error event
      dispatch('error', {
        error,
        message: errorMessage
      });
    } finally {
      isLoading = false;
    }
  };

  // Reactive loading state
  $: buttonLoading = loading || isLoading;

  // Button sizing classes
  $: sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }[size];

  // Button variant classes
  $: variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600'
  }[variant];
</script>

<button
  type="button"
  on:click={handleSignOut}
  disabled={buttonLoading || disabled}
  class="flex items-center justify-center {sizeClasses} {variantClasses} border rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if buttonLoading}
    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
    <span>Keluar...</span>
  {:else}
    {#if icon}
      <!-- Sign Out Icon -->
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
      </svg>
    {/if}
    <span>Keluar</span>
  {/if}
</button>