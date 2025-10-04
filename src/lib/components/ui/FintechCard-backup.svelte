<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let variant: 'default' | 'success' | 'warning' | 'danger' | 'primary' = 'default';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let interactive: boolean = false;
  export let clickable: boolean = false;
  export let className: string = '';
  export let loading: boolean = false;

  const dispatch = createEventDispatcher();

  // Dynamic classes based on props
  $: cardClasses = [
    'fintech-card',
    interactive && 'fintech-card-interactive',
    clickable && 'cursor-pointer',
    loading && 'fintech-loading',
    // Variant classes
    variant === 'success' && 'fintech-card-success',
    variant === 'warning' && 'fintech-card-warning',
    variant === 'danger' && 'fintech-card-danger',
    variant === 'primary' && 'fintech-card-primary',
    // Size classes
    size === 'sm' && 'fintech-card-sm',
    size === 'md' && 'fintech-card-md',
    size === 'lg' && 'fintech-card-lg',
    size === 'xl' && 'fintech-card-xl',
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

<div
  class={cardClasses}
  on:click={handleClick}
  on:keydown={handleKeydown}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  aria-disabled={loading}
>
  <slot />
</div>