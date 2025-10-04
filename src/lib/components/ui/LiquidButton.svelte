<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth: boolean = false;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let icon: string = '';
  export let className: string = '';

  // Button element
  export let type: 'button' | 'submit' | 'reset' = 'button';

  const dispatch = createEventDispatcher();

  // Size mappings
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  // Variant mappings
  const variantClasses = {
    primary: 'liquid-btn-primary',
    secondary: 'liquid-glass-medium text-primary-glass hover:text-vital',
    success: 'liquid-btn-success',
    warning: 'liquid-btn-warning',
    danger: 'liquid-btn-danger'
  };

  $: buttonClasses = [
    'liquid-btn',
    'liquid-interactive',
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'cursor-wait',
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button
  class={buttonClasses}
  {type}
  {disabled}
  on:click={handleClick}
>
  <div class="flex items-center justify-center gap-2 relative z-10">
    <!-- Loading spinner -->
    {#if loading}
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else if icon}
      <!-- Custom icon -->
      <span class="text-lg">{icon}</span>
    {/if}

    <!-- Button content -->
    <slot />
  </div>
</button>

<style>
  /* Additional button variant styles */
  .liquid-btn-warning {
    background: linear-gradient(135deg,
      rgba(245, 158, 11, 0.8) 0%,
      rgba(245, 158, 11, 0.6) 100%);
    color: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .liquid-btn-danger {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.8) 0%,
      rgba(239, 68, 68, 0.6) 100%);
    color: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(239, 68, 68, 0.4);
  }
</style>