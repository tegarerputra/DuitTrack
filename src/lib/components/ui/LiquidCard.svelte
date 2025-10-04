<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'default' | 'success' | 'warning' | 'danger' | 'primary' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let interactive: boolean = false;
  export let floating: boolean = false;
  export let glowing: boolean = false;
  export let className: string = '';

  // Optional click handler
  export let clickable: boolean = false;

  const dispatch = createEventDispatcher();

  // Dynamic classes based on props
  $: cardClasses = [
    'liquid-card',
    interactive && 'liquid-interactive',
    floating && 'liquid-float',
    glowing && 'animate-liquid-glow',
    clickable && 'cursor-pointer',
    // Variant classes
    variant === 'success' && 'liquid-card-success',
    variant === 'warning' && 'liquid-card-warning',
    variant === 'danger' && 'liquid-card-danger',
    variant === 'primary' && 'liquid-card-primary',
    // Size classes
    size === 'sm' && 'p-3',
    size === 'md' && 'p-4',
    size === 'lg' && 'p-6',
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (clickable) {
      dispatch('click', event);
    }
  }
</script>

<div
  class={cardClasses}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && clickable && handleClick(e)}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
>
  <slot />

  <!-- Optional shimmer effect -->
  {#if interactive}
    <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
      <div class="absolute inset-0 animate-liquid-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
    </div>
  {/if}
</div>

<style>
  /* Component-specific liquid card enhancements */
  .liquid-card-primary {
    background: linear-gradient(135deg,
      rgba(102, 126, 234, 0.15) 0%,
      rgba(255, 255, 255, 0.25) 100%);
    border: 1px solid rgba(102, 126, 234, 0.3);
  }

  .liquid-card-primary:hover {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(102, 126, 234, 0.4);
  }
</style>