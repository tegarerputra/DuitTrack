<script lang="ts">
  export let count: number = 5;
  export let variant: 'transaction' | 'expense' | 'category' = 'transaction';
</script>

<div class="skeleton-list">
  {#each Array(count) as _, index}
    <div class="skeleton-list-item skeleton-glassmorphism" style="animation-delay: {index * 0.05}s">
      {#if variant === 'category'}
        <!-- Category Item -->
        <div class="skeleton-category-icon skeleton-shimmer"></div>
        <div class="skeleton-category-details">
          <div class="skeleton-category-name skeleton-shimmer"></div>
          <div class="skeleton-category-budget skeleton-shimmer"></div>
        </div>
        <div class="skeleton-category-progress">
          <div class="skeleton-progress-bar skeleton-shimmer"></div>
          <div class="skeleton-progress-text skeleton-shimmer"></div>
        </div>
      {:else if variant === 'expense'}
        <!-- Expense Item -->
        <div class="skeleton-expense-icon skeleton-shimmer"></div>
        <div class="skeleton-expense-details">
          <div class="skeleton-expense-category skeleton-shimmer"></div>
          <div class="skeleton-expense-description skeleton-shimmer"></div>
        </div>
        <div class="skeleton-expense-amount skeleton-shimmer"></div>
      {:else}
        <!-- Transaction Item -->
        <div class="skeleton-transaction-icon skeleton-shimmer"></div>
        <div class="skeleton-transaction-details">
          <div class="skeleton-transaction-title skeleton-shimmer"></div>
          <div class="skeleton-transaction-subtitle skeleton-shimmer"></div>
        </div>
        <div class="skeleton-transaction-amount skeleton-shimmer"></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* List Item Base */
  .skeleton-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    animation: skeleton-fade-in 0.3s ease-out;
    transition: all 0.3s ease;
  }

  /* Icon Variations */
  .skeleton-transaction-icon,
  .skeleton-expense-icon,
  .skeleton-category-icon {
    border-radius: 12px;
    flex-shrink: 0;
    background: rgba(0, 191, 255, 0.15);
  }

  .skeleton-transaction-icon {
    width: 40px;
    height: 40px;
  }

  .skeleton-expense-icon {
    width: 44px;
    height: 44px;
  }

  .skeleton-category-icon {
    width: 48px;
    height: 48px;
  }

  /* Details Sections */
  .skeleton-transaction-details,
  .skeleton-expense-details,
  .skeleton-category-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  /* Transaction Variant */
  .skeleton-transaction-title {
    width: 140px;
    height: 18px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.12);
  }

  .skeleton-transaction-subtitle {
    width: 100px;
    height: 14px;
    border-radius: 4px;
    background: rgba(0, 191, 255, 0.08);
  }

  .skeleton-transaction-amount {
    width: 90px;
    height: 20px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.15);
    flex-shrink: 0;
  }

  /* Expense Variant */
  .skeleton-expense-category {
    width: 120px;
    height: 18px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.12);
  }

  .skeleton-expense-description {
    width: 160px;
    height: 14px;
    border-radius: 4px;
    background: rgba(0, 191, 255, 0.08);
  }

  .skeleton-expense-amount {
    width: 100px;
    height: 20px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.15);
    flex-shrink: 0;
  }

  /* Category Variant */
  .skeleton-category-name {
    width: 140px;
    height: 18px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.12);
  }

  .skeleton-category-budget {
    width: 110px;
    height: 14px;
    border-radius: 4px;
    background: rgba(0, 191, 255, 0.08);
  }

  .skeleton-category-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 120px;
    flex-shrink: 0;
  }

  .skeleton-progress-bar {
    height: 8px;
    border-radius: 4px;
    background: rgba(0, 191, 255, 0.15);
  }

  .skeleton-progress-text {
    width: 60px;
    height: 12px;
    border-radius: 4px;
    background: rgba(0, 191, 255, 0.1);
    align-self: flex-end;
  }

  /* Animations */
  .skeleton-shimmer {
    background: linear-gradient(90deg,
      rgba(0, 191, 255, 0.08) 0%,
      rgba(0, 191, 255, 0.2) 50%,
      rgba(0, 191, 255, 0.08) 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes skeleton-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .skeleton-list {
      gap: 8px;
    }

    .skeleton-list-item {
      padding: 12px;
      gap: 10px;
    }

    .skeleton-transaction-icon {
      width: 36px;
      height: 36px;
    }

    .skeleton-expense-icon {
      width: 38px;
      height: 38px;
    }

    .skeleton-category-icon {
      width: 42px;
      height: 42px;
    }

    .skeleton-category-progress {
      width: 100px;
    }
  }
</style>
