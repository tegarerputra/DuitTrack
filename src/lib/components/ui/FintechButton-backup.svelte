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

  const dispatch = createEventDispatcher();

  // Dynamic classes based on props
  $: buttonClasses = [
    'fintech-button',
    fullWidth && 'fintech-button-full',
    // Variant classes
    variant === 'primary' && 'fintech-button-primary',
    variant === 'success' && 'fintech-button-success',
    variant === 'warning' && 'fintech-button-warning',
    variant === 'danger' && 'fintech-button-danger',
    variant === 'secondary' && 'fintech-button-secondary',
    variant === 'ghost' && 'fintech-button-ghost',
    // Size classes
    size === 'sm' && 'fintech-button-sm',
    size === 'md' && 'fintech-button-md',
    size === 'lg' && 'fintech-button-lg',
    size === 'xl' && 'fintech-button-xl',
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
    {#if loading}
      <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    {:else if icon}
      <span>{icon}</span>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    class={buttonClasses}
    {disabled}
    aria-disabled={disabled || loading}
    on:click={handleClick}
  >
    {#if loading}
      <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    {:else if icon}
      <span>{icon}</span>
    {/if}
    <slot />
  </button>
{/if}