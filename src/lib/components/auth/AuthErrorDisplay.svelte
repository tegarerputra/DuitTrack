<script lang="ts">
  import { authErrorStore } from '$stores/auth';
  import { onMount, onDestroy } from 'svelte';

  export let showIcon = true;
  export let dismissible = true;
  export let autoHide = true;
  export let hideDelay = 5000;

  let error: string | null = null;
  let visible = false;
  let timeoutId: number | null = null;

  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    // Subscribe to auth error store
    unsubscribe = authErrorStore.subscribe((authError) => {
      error = authError;
      visible = !!authError;

      // Auto-hide functionality
      if (autoHide && authError && hideDelay > 0) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
          hideError();
        }, hideDelay);
      }
    });
  });

  onDestroy(() => {
    unsubscribe?.();
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  const hideError = () => {
    visible = false;
    authErrorStore.set(null);
  };

  const handleDismiss = () => {
    if (dismissible) {
      hideError();
    }
  };
</script>

{#if visible && error}
  <div
    class="error-container glass-card border-red-400/50 bg-red-500/10 p-4 rounded-lg mb-4 transition-all duration-300"
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-start">
      {#if showIcon}
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
      {/if}

      <div class="ml-3 flex-1">
        <div class="text-sm text-red-200 font-medium">
          {error}
        </div>
      </div>

      {#if dismissible}
        <div class="ml-4 flex-shrink-0">
          <button
            type="button"
            on:click={handleDismiss}
            class="inline-flex text-red-300 hover:text-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent rounded-md p-1"
            aria-label="Dismiss error"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .glass-card {
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .error-container {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>