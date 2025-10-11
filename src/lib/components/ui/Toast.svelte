<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  export let message: string = '';
  export let type: 'success' | 'error' | 'info' = 'info';
  export let duration: number = 3000;
  export let onClose: () => void = () => {};

  let visible = true;

  onMount(() => {
    const timer = setTimeout(() => {
      visible = false;
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  });

  function handleClose() {
    visible = false;
    setTimeout(onClose, 300);
  }
</script>

{#if visible}
  <div
    class="toast toast-{type}"
    transition:fly={{ y: -20, duration: 300 }}
  >
    <div class="toast-content">
      <span class="toast-icon">
        {#if type === 'success'}✅
        {:else if type === 'error'}❌
        {:else}ℹ️{/if}
      </span>
      <span class="toast-message">{message}</span>
    </div>
    <button class="toast-close" on:click={handleClose}>×</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    min-width: 300px;
    max-width: 500px;
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: slide-in 0.3s ease-out;
  }

  @keyframes slide-in {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: linear-gradient(135deg,
      rgba(76, 175, 80, 0.95) 0%,
      rgba(102, 187, 106, 0.9) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
  }

  .toast-error {
    background: linear-gradient(135deg,
      rgba(244, 67, 54, 0.95) 0%,
      rgba(239, 83, 80, 0.9) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
  }

  .toast-info {
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.95) 0%,
      rgba(30, 144, 255, 0.9) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .toast-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .toast-message {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }

  .toast-close {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .toast {
      top: 10px;
      right: 10px;
      left: 10px;
      min-width: auto;
      max-width: none;
    }

    .toast-message {
      font-size: 13px;
    }
  }
</style>
