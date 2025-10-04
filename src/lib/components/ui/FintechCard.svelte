<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'default' | 'success' | 'warning' | 'danger' | 'primary' = 'default';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let interactive: boolean = false;
  export let clickable: boolean = false;
  export let className: string = '';
  export let loading: boolean = false;
  export let waterEffect: boolean = true; // New: Enable water-themed effects

  const dispatch = createEventDispatcher();

  // Dynamic classes based on props with water theme integration
  $: cardClasses = [
    'fintech-card',
    waterEffect && 'liquid-card',
    interactive && 'liquid-interactive',
    clickable && 'cursor-pointer',
    loading && 'fintech-loading',
    // Water-themed variant classes
    variant === 'success' && (waterEffect ? 'liquid-card-success' : 'fintech-card-success'),
    variant === 'warning' && (waterEffect ? 'liquid-card-warning' : 'fintech-card-warning'),
    variant === 'danger' && (waterEffect ? 'liquid-card-danger' : 'fintech-card-danger'),
    variant === 'primary' && (waterEffect ? 'liquid-card-primary' : 'fintech-card-primary'),
    // Size classes
    size === 'sm' && 'fintech-card-sm',
    size === 'md' && 'fintech-card-md',
    size === 'lg' && 'fintech-card-lg',
    size === 'xl' && 'fintech-card-xl',
    // Water animation classes
    waterEffect && interactive && 'animate-water-ripple',
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (clickable && !loading) {
      dispatch('click', event);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (clickable && !loading && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      dispatch('click', event);
    }
  }
</script>

<!-- Enhanced Water-Themed Fintech Card -->
<div
  class={cardClasses}
  on:click={handleClick}
  on:keydown={handleKeydown}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  aria-disabled={loading}
>
  {#if waterEffect && interactive}
    <!-- Subtle water-themed decorative elements (only for interactive cards) -->
    <div class="water-effect-overlay">
      <div class="water-droplet animate-water-droplet" style="animation-delay: 0s;"></div>
    </div>
  {/if}

  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  /* Enhanced Card with Water Theme Integration */
  .fintech-card {
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Water Effect Overlay */
  .water-effect-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: inherit;
    opacity: 0.3;
  }

  .water-droplet {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(
      circle,
      var(--water-light, #67E8F9) 0%,
      var(--water-primary, #06B6D4) 50%,
      transparent 100%
    );
    border-radius: 50%;
    opacity: 0;
  }

  .water-droplet:nth-child(1) {
    top: 20%;
    left: 25%;
  }

  .water-droplet:nth-child(2) {
    top: 60%;
    right: 30%;
  }

  .water-droplet:nth-child(3) {
    bottom: 25%;
    left: 60%;
  }

  /* Card Content */
  .card-content {
    position: relative;
    z-index: 2;
    height: 100%;
  }

  /* Enhanced interactive states for water-themed cards */
  .liquid-card.liquid-interactive:hover .water-effect-overlay {
    opacity: 0.6;
  }

  .liquid-card.liquid-interactive:hover .water-droplet {
    animation-duration: calc(var(--water-droplet-speed, 1.5s) * 0.8);
  }

  /* Primary variant with special water effects */
  .liquid-card-primary {
    background: linear-gradient(135deg,
      var(--water-glass-primary, rgba(6, 182, 212, 0.15)) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      var(--water-glass-secondary, rgba(8, 145, 178, 0.12)) 100%);
    border: 1px solid var(--water-primary, #06B6D4);
  }

  .liquid-card-primary:hover {
    box-shadow: var(--water-shadow-strong, 0 20px 60px rgba(6, 182, 212, 0.2));
    transform: translateY(-6px) scale(1.02);
  }

  .liquid-card-primary .water-droplet {
    background: radial-gradient(
      circle,
      var(--water-primary, #06B6D4) 0%,
      var(--water-secondary, #0891B2) 50%,
      transparent 100%
    );
  }

  /* Loading state with water theme */
  .fintech-loading.liquid-card::before {
    background: linear-gradient(
      90deg,
      transparent,
      var(--water-glass-light, rgba(103, 232, 249, 0.08)),
      transparent
    );
  }

  /* Responsive adjustments */
  @media (max-width: 767px) {
    .liquid-card:hover {
      transform: translateY(-2px) scale(1.005);
    }

    .water-droplet {
      width: 3px;
      height: 3px;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .water-droplet {
      animation: none !important;
    }

    .water-effect-overlay {
      display: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .water-effect-overlay {
      display: none;
    }

    .liquid-card {
      border: 2px solid var(--water-primary, #06B6D4);
    }
  }
</style>