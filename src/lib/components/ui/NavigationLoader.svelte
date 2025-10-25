<script lang="ts">
  import { navigating } from '$app/stores';
  import { onMount } from 'svelte';

  let progress = 0;
  let isNavigating = false;
  let progressInterval: number | undefined;

  // Subscribe to SvelteKit navigation state
  $: {
    if ($navigating) {
      startLoading();
    } else {
      completeLoading();
    }
  }

  function startLoading() {
    isNavigating = true;
    progress = 0;

    // Smooth progress animation
    progressInterval = window.setInterval(() => {
      if (progress < 90) {
        // Speed up initially, then slow down
        const increment = progress < 30 ? 10 : progress < 60 ? 5 : 2;
        progress = Math.min(progress + increment, 90);
      }
    }, 100);
  }

  function completeLoading() {
    // Complete to 100%
    progress = 100;

    // Clear interval
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = undefined;
    }

    // Hide after completion animation
    setTimeout(() => {
      isNavigating = false;
      progress = 0;
    }, 300);
  }

  onMount(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  });
</script>

{#if isNavigating}
  <div class="navigation-loader" class:complete={progress === 100}>
    <div class="progress-bar" style="width: {progress}%"></div>
    <div class="glow-effect" style="left: {progress}%"></div>
  </div>
{/if}

<style>
  .navigation-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.05);
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg,
      rgba(0, 191, 255, 0.8) 0%,
      rgba(30, 144, 255, 1) 50%,
      rgba(0, 123, 255, 0.8) 100%);
    box-shadow:
      0 0 10px rgba(0, 191, 255, 0.5),
      0 0 20px rgba(0, 191, 255, 0.3);
    transition: width 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 0 2px 2px 0;
    position: relative;
  }

  .navigation-loader.complete .progress-bar {
    transition: width 0.2s cubic-bezier(0.4, 0, 1, 1);
  }

  .glow-effect {
    position: absolute;
    top: 0;
    height: 100%;
    width: 100px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.8) 50%,
      transparent 100%);
    transform: translateX(-50%);
    filter: blur(8px);
    animation: glow-pulse 1.5s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }

  /* Mobile optimization */
  @media (max-width: 768px) {
    .navigation-loader {
      height: 2px;
    }
  }
</style>
