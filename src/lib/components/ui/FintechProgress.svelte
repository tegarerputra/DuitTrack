<script lang="ts">
  // Props
  export let value: number = 0;
  export let max: number = 100;
  export let variant: 'success' | 'warning' | 'danger' | 'primary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showLabel: boolean = false;
  export let showInfo: boolean = false;
  export let className: string = '';
  export let category: string = '';
  export let remaining: number = 0;

  // Calculate percentage
  $: percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Clean progress classes - no unnecessary effects
  $: progressClasses = [
    'enhanced-progress',
    `enhanced-progress-${variant}`,
    `enhanced-progress-${size}`,
    className
  ].filter(Boolean).join(' ');

  // Format currency for display
  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
</script>

<div class="progress-container">
  {#if showLabel && category}
    <div class="progress-header">
      <div class="flex items-center gap-2">
        <slot name="icon" />
        <span class="category-name">{category}</span>
      </div>
      <span class="percentage-label">
        {percentage.toFixed(0)}%
      </span>
    </div>
  {/if}

  <div class={progressClasses}>
    <div
      class="progress-fill"
      style="width: {percentage}%"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
    </div>
  </div>

  {#if showInfo}
    <div class="progress-info">
      <span class="spent-amount">{formatRupiah(value)} / {formatRupiah(max)}</span>
      <span class="remaining-amount">{formatRupiah(remaining)} tersisa</span>
    </div>
  {/if}
</div>

<style>
  /* Clean, Informative Progress Bar */
  .progress-container {
    width: 100%;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .category-name {
    font-weight: 500;
    color: var(--fintech-text-primary, #1f2937);
    font-size: 14px;
  }

  .percentage-label {
    font-weight: 600;
    font-size: 14px;
    color: var(--fintech-text-secondary, #4b5563);
  }

  /* Enhanced Progress Bar Base */
  .enhanced-progress {
    background: rgba(6, 182, 212, 0.1);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(6, 182, 212, 0.2);
    transition: all 0.3s ease-in-out;
  }

  .progress-fill {
    height: 100%;
    border-radius: 7px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  /* Size Variants */
  .enhanced-progress-sm {
    height: 8px;
  }

  .enhanced-progress-md {
    height: 12px;
  }

  .enhanced-progress-lg {
    height: 16px;
  }

  /* Status-based Color Variants */
  .enhanced-progress-success .progress-fill {
    background: linear-gradient(90deg, #06B6D4 0%, #0891B2 100%);
  }

  .enhanced-progress-warning .progress-fill {
    background: linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%);
  }

  .enhanced-progress-warning .percentage-label {
    color: #F59E0B;
  }

  .enhanced-progress-danger .progress-fill {
    background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
  }

  .enhanced-progress-danger .percentage-label {
    color: #EF4444;
  }

  .enhanced-progress-primary .progress-fill {
    background: linear-gradient(90deg, #06B6D4 0%, #0891B2 100%);
  }

  .enhanced-progress-primary .percentage-label {
    color: #06B6D4;
  }

  /* Information Display */
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
  }

  .spent-amount {
    color: var(--fintech-text-primary, #1f2937);
    font-weight: 500;
  }

  .remaining-amount {
    color: var(--fintech-text-secondary, #6b7280);
    font-weight: 400;
  }

  /* Subtle Hover Effect */
  .enhanced-progress:hover {
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
    border-color: rgba(6, 182, 212, 0.3);
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .category-name {
      font-size: 13px;
    }

    .percentage-label {
      font-size: 13px;
    }

    .progress-info {
      font-size: 13px;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .progress-fill {
      transition: none;
    }

    .enhanced-progress {
      transition: none;
    }
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .enhanced-progress {
      border: 2px solid currentColor;
    }

    .progress-fill {
      background: currentColor !important;
    }
  }
</style>