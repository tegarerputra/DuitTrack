<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let fullWidth: boolean = false;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let icon: string = '';
  export let className: string = '';
  export let href: string = '';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let waterEffect: boolean = true; // New: Enable water-themed effects

  const dispatch = createEventDispatcher();

  // Dynamic classes based on props with water theme integration
  $: buttonClasses = [
    'fintech-button',
    waterEffect && 'liquid-btn',
    fullWidth && 'fintech-button-full',
    // Water-themed variant classes
    variant === 'primary' && (waterEffect ? 'liquid-btn-primary' : 'fintech-button-primary'),
    variant === 'success' && (waterEffect ? 'liquid-btn-success' : 'fintech-button-success'),
    variant === 'warning' && (waterEffect ? 'liquid-btn-warning' : 'fintech-button-warning'),
    variant === 'danger' && (waterEffect ? 'liquid-btn-danger' : 'fintech-button-danger'),
    variant === 'secondary' && (waterEffect ? 'liquid-btn-secondary' : 'fintech-button-secondary'),
    variant === 'ghost' && (waterEffect ? 'liquid-btn-ghost' : 'fintech-button-ghost'),
    // Size classes
    size === 'sm' && 'fintech-button-sm',
    size === 'md' && 'fintech-button-md',
    size === 'lg' && 'fintech-button-lg',
    size === 'xl' && 'fintech-button-xl',
    // Water animation classes
    waterEffect && 'liquid-interactive',
    waterEffect && 'animate-liquid-bounce',
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!disabled && !loading && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      dispatch('click', event);
    }
  }
</script>

{#if href}
  <a
    {href}
    class={buttonClasses}
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    aria-disabled={disabled || loading}
    on:click={handleClick}
    on:keydown={handleKeydown}
  >
    {#if waterEffect && variant === 'primary'}
      <!-- Subtle water-themed decorative effects (only for primary buttons) -->
      <div class="water-ripple-overlay">
        <div class="water-ripple animate-water-ripple"></div>
      </div>
    {/if}

    <div class="button-content">
      {#if loading}
        <span class="loading-spinner">
          <div class="water-loading-droplet animate-water-droplet"></div>
          <div class="water-loading-droplet animate-water-droplet" style="animation-delay: 0.2s;"></div>
          <div class="water-loading-droplet animate-water-droplet" style="animation-delay: 0.4s;"></div>
        </span>
      {:else if icon}
        <span class="button-icon animate-liquid-float">{icon}</span>
      {/if}
      <slot />
    </div>
  </a>
{:else}
  <button
    {type}
    class={buttonClasses}
    {disabled}
    aria-disabled={disabled || loading}
    on:click={handleClick}
  >
    {#if waterEffect && variant === 'primary'}
      <!-- Subtle water-themed decorative effects (only for primary buttons) -->
      <div class="water-ripple-overlay">
        <div class="water-ripple animate-water-ripple"></div>
      </div>
    {/if}

    <div class="button-content">
      {#if loading}
        <span class="loading-spinner">
          {#if waterEffect}
            <div class="water-loading-droplet animate-water-droplet"></div>
            <div class="water-loading-droplet animate-water-droplet" style="animation-delay: 0.2s;"></div>
            <div class="water-loading-droplet animate-water-droplet" style="animation-delay: 0.4s;"></div>
          {:else}
            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {/if}
        </span>
      {:else if icon}
        <span class="button-icon animate-liquid-float">{icon}</span>
      {/if}
      <slot />
    </div>
  </button>
{/if}

<style>
  /* Enhanced Button with Water Theme Integration */
  .fintech-button {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Water Ripple Overlay */
  .water-ripple-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: inherit;
    opacity: 0.4;
  }

  .water-ripple {
    position: absolute;
    width: 10px;
    height: 10px;
    background: radial-gradient(
      circle,
      var(--water-light, #67E8F9) 0%,
      var(--water-primary, #06B6D4) 30%,
      transparent 70%
    );
    border-radius: 50%;
    opacity: 0.6;
  }

  .water-ripple:nth-child(1) {
    top: 30%;
    left: 25%;
  }

  .water-ripple:nth-child(2) {
    top: 60%;
    right: 25%;
  }

  /* Button Content */
  .button-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .button-icon {
    display: inline-flex;
    align-items: center;
  }

  /* Water-themed Loading Spinner */
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .water-loading-droplet {
    width: 6px;
    height: 6px;
    background: radial-gradient(
      circle,
      currentColor 0%,
      rgba(255, 255, 255, 0.8) 50%,
      currentColor 100%
    );
    border-radius: 50%;
    opacity: 0.8;
  }

  /* Enhanced variant styles with water effects */
  .liquid-btn-primary {
    background: linear-gradient(135deg,
      var(--water-primary, #06B6D4) 0%,
      var(--water-secondary, #0891B2) 100%);
    color: white;
    border: 1px solid var(--water-glass-border, rgba(6, 182, 212, 0.2));
  }

  .liquid-btn-primary:hover {
    background: linear-gradient(135deg,
      var(--water-secondary, #0891B2) 0%,
      var(--water-dark, #0E7490) 100%);
    box-shadow: var(--water-shadow-medium, 0 12px 40px rgba(6, 182, 212, 0.15));
    transform: translateY(-2px) scale(1.05);
  }

  .liquid-btn-primary .water-ripple {
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
  }

  .liquid-btn-success {
    background: linear-gradient(135deg,
      var(--stability-success, #10B981) 0%,
      rgba(16, 185, 129, 0.8) 100%);
    color: white;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .liquid-btn-success:hover {
    background: linear-gradient(135deg,
      #059669 0%,
      var(--stability-success, #10B981) 100%);
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
    transform: translateY(-2px) scale(1.05);
  }

  .liquid-btn-warning {
    background: linear-gradient(135deg,
      var(--stability-warning, #F59E0B) 0%,
      rgba(245, 158, 11, 0.8) 100%);
    color: white;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .liquid-btn-warning:hover {
    background: linear-gradient(135deg,
      #d97706 0%,
      var(--stability-warning, #F59E0B) 100%);
    box-shadow: 0 12px 40px rgba(245, 158, 11, 0.15);
    transform: translateY(-2px) scale(1.05);
  }

  .liquid-btn-danger {
    background: linear-gradient(135deg,
      var(--stability-danger, #EF4444) 0%,
      rgba(239, 68, 68, 0.8) 100%);
    color: white;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .liquid-btn-danger:hover {
    background: linear-gradient(135deg,
      #dc2626 0%,
      var(--stability-danger, #EF4444) 100%);
    box-shadow: 0 12px 40px rgba(239, 68, 68, 0.15);
    transform: translateY(-2px) scale(1.05);
  }

  .liquid-btn-secondary {
    background: linear-gradient(135deg,
      var(--water-glass-light, rgba(103, 232, 249, 0.08)) 0%,
      var(--water-glass-secondary, rgba(8, 145, 178, 0.12)) 100%);
    color: var(--water-primary, #06B6D4);
    border: 1px solid var(--water-glass-border, rgba(6, 182, 212, 0.2));
  }

  .liquid-btn-secondary:hover {
    background: linear-gradient(135deg,
      var(--water-glass-secondary, rgba(8, 145, 178, 0.12)) 0%,
      var(--water-glass-primary, rgba(6, 182, 212, 0.15)) 100%);
    color: var(--water-secondary, #0891B2);
    transform: translateY(-2px) scale(1.05);
  }

  .liquid-btn-ghost {
    background: transparent;
    color: var(--water-primary, #06B6D4);
    border: 1px solid transparent;
  }

  .liquid-btn-ghost:hover {
    background: var(--water-glass-light, rgba(103, 232, 249, 0.08));
    border-color: var(--water-glass-border, rgba(6, 182, 212, 0.2));
    transform: translateY(-1px) scale(1.02);
  }

  /* Enhanced hover states for water-themed buttons */
  .liquid-btn.liquid-interactive:hover .water-ripple-overlay {
    opacity: 0.8;
  }

  .liquid-btn.liquid-interactive:hover .water-ripple {
    animation-duration: calc(var(--water-ripple-speed, 2s) * 0.8);
  }

  /* Disabled state */
  .liquid-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .liquid-btn:disabled .water-ripple-overlay {
    opacity: 0.2;
  }

  /* Full width */
  .fintech-button-full {
    width: 100%;
  }

  /* Responsive adjustments */
  @media (max-width: 767px) {
    .liquid-btn:hover {
      transform: translateY(-1px) scale(1.02);
    }

    .water-ripple {
      width: 8px;
      height: 8px;
    }

    .water-loading-droplet {
      width: 5px;
      height: 5px;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .water-ripple,
    .water-loading-droplet,
    .button-icon {
      animation: none !important;
    }

    .water-ripple-overlay {
      display: none;
    }

    .liquid-btn:hover {
      transform: none !important;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .water-ripple-overlay {
      display: none;
    }

    .liquid-btn {
      border: 2px solid currentColor;
    }
  }

  /* Focus states for accessibility */
  .liquid-btn:focus {
    outline: 2px solid var(--water-primary, #06B6D4);
    outline-offset: 2px;
  }

  .liquid-btn:focus .water-ripple-overlay {
    opacity: 1;
  }
</style>