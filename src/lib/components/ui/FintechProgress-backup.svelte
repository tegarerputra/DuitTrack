<script lang="ts">
  // Props
  export let value: number = 0;
  export let max: number = 100;
  export let variant: 'success' | 'warning' | 'danger' = 'success';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showLabel: boolean = false;
  export let className: string = '';

  // Calculate percentage
  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Dynamic classes
  $: progressClasses = [
    'fintech-progress',
    variant === 'success' && 'fintech-progress-success',
    variant === 'warning' && 'fintech-progress-warning',
    variant === 'danger' && 'fintech-progress-danger',
    className
  ].filter(Boolean).join(' ');

  $: heightClass = {
    'sm': 'h-2',
    'md': 'h-3',
    'lg': 'h-4'
  }[size];
</script>

<div class="space-y-1">
  {#if showLabel}
    <div class="flex justify-between items-center text-sm">
      <slot name="label" />
      <span class="font-medium fintech-text-secondary">
        {percentage.toFixed(0)}%
      </span>
    </div>
  {/if}

  <div class="{progressClasses} {heightClass}">
    <div
      class="fintech-progress-bar"
      style="width: {percentage}%"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    ></div>
  </div>
</div>