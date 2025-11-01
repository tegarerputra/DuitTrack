<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { getCategoryIcon, formatCategoryName } from '$lib/utils/categoryHelpers';

  export let selectedCategory: string = '';  // Empty by default - no selection
  export let categories: Array<{ value: string; label: string; budget?: number; spent?: number }> = [];
  export let isLoading: boolean = false;
  export let showBudgetInfo: boolean = true;

  const dispatch = createEventDispatcher();

  function handleCategorySelect(categoryValue: string) {
    // Allow deselecting by clicking the same tile
    if (categoryValue === selectedCategory) {
      selectedCategory = '';
      dispatch('categoryChange', { category: '' });
    } else {
      selectedCategory = categoryValue;
      dispatch('categoryChange', { category: categoryValue });
    }
  }

  function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}K`;
    }
    return `Rp ${amount}`;
  }

  function getBudgetPercentage(spent: number, budget: number): number {
    if (!budget || budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  }

  function getBudgetStatus(spent: number, budget: number): 'safe' | 'warning' | 'danger' {
    const percentage = getBudgetPercentage(spent, budget);
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'safe';
  }

  // Keyboard navigation support
  onMount(() => {
    const container = document.querySelector('.tiles-grid');
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tiles = Array.from(container.querySelectorAll('.category-tile:not([disabled])')) as HTMLElement[];
      const currentIndex = tiles.findIndex(tile => tile === document.activeElement);

      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (currentIndex + 1) % tiles.length;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) newIndex = tiles.length - 1;
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Move to next row (assuming 3 columns on desktop, 2 on mobile)
          const columns = window.innerWidth > 768 ? 3 : 2;
          newIndex = currentIndex + columns;
          if (newIndex >= tiles.length) newIndex = currentIndex;
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Move to previous row
          const cols = window.innerWidth > 768 ? 3 : 2;
          newIndex = currentIndex - cols;
          if (newIndex < 0) newIndex = currentIndex;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tiles.length - 1;
          break;
      }

      if (newIndex !== currentIndex && tiles[newIndex]) {
        tiles[newIndex].focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="category-tile-selector" role="radiogroup" aria-label="Select expense category" {...$$restProps}>
  {#if isLoading}
    <!-- Loading State - Skeleton Tiles -->
    <div class="tiles-grid">
      {#each Array(6) as _, i}
        <div class="category-tile skeleton" aria-hidden="true">
          <div class="tile-content">
            <div class="skeleton-icon"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-budget"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if categories.length === 0}
    <!-- Empty State - No Budget Setup -->
    <div class="empty-state">
      <div class="empty-icon">💡</div>
      <div class="empty-message">
        <div class="empty-title">Belum ada kategori budget</div>
        <div class="empty-subtitle">
          Setup budget untuk tracking pengeluaran per kategori
        </div>
      </div>
      <button
        type="button"
        class="setup-budget-btn"
        on:click={() => dispatch('setupBudget')}
      >
        Setup Budget Sekarang →
      </button>
      <div class="empty-note">
        💡 Expense ini akan disimpan sebagai "Tanpa Kategori"
      </div>
    </div>
  {:else}
    <!-- Category Tiles Grid -->
    <div class="tiles-grid">
      {#each categories as category (category.value)}
        {@const isSelected = category.value.toUpperCase() === selectedCategory.toUpperCase()}
        {@const budgetStatus = category.budget ? getBudgetStatus(category.spent || 0, category.budget) : 'safe'}
        {@const percentage = category.budget ? getBudgetPercentage(category.spent || 0, category.budget) : 0}
        {@const remaining = category.budget ? category.budget - (category.spent || 0) : 0}

        <button
          type="button"
          class="category-tile"
          class:selected={isSelected}
          class:status-warning={budgetStatus === 'warning'}
          class:status-danger={budgetStatus === 'danger'}
          on:click={() => handleCategorySelect(category.value)}
          role="radio"
          aria-checked={isSelected}
          aria-label="{category.label}{category.budget ? `, tersisa ${formatCurrency(remaining)}` : ''}"
          tabindex={isSelected ? 0 : -1}
        >
          <div class="tile-content">
            <div class="tile-icon">{getCategoryIcon(category.value)}</div>
            <div class="tile-label">{category.label}</div>

            {#if showBudgetInfo && category.budget}
              <div class="tile-budget">
                <span class="budget-remaining">Sisa: {formatCurrency(remaining)}</span>
              </div>
            {/if}
          </div>

          {#if isSelected}
            <div class="selected-indicator">✓</div>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Helper Text -->
    <div class="helper-text">
      <span class="helper-icon">💡</span>
      <span class="helper-message">Kosongkan kategori untuk menyimpan sebagai "Tanpa Kategori"</span>
    </div>
  {/if}
</div>

<style>
  .category-tile-selector {
    width: 100%;
  }

  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.625rem;
    width: 100%;
  }

  .category-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 0.5rem;
    min-height: 90px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(203, 213, 225, 0.6);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .category-tile:hover {
    transform: translateY(-2px) scale(1.02);
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(0, 191, 255, 0.4);
    box-shadow:
      0 4px 12px rgba(0, 191, 255, 0.15),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .category-tile:active {
    transform: translateY(-1px) scale(1.01);
  }

  .category-tile.selected {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.15) 0%,
      rgba(30, 144, 255, 0.12) 100%);
    border-color: #00BFFF;
    border-width: 2.5px;
    box-shadow:
      0 4px 16px rgba(0, 191, 255, 0.25),
      0 0 0 4px rgba(0, 191, 255, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .category-tile.selected:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 6px 20px rgba(0, 191, 255, 0.3),
      0 0 0 4px rgba(0, 191, 255, 0.15),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .category-tile.status-warning {
    border-color: rgba(251, 191, 36, 0.5);
  }

  .category-tile.status-warning.selected {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.15) 0%,
      rgba(245, 158, 11, 0.12) 100%);
    border-color: #fbbf24;
    box-shadow:
      0 4px 16px rgba(251, 191, 36, 0.25),
      0 0 0 4px rgba(251, 191, 36, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .category-tile.status-danger {
    border-color: rgba(239, 68, 68, 0.5);
  }

  .category-tile.status-danger.selected {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.15) 0%,
      rgba(220, 38, 38, 0.12) 100%);
    border-color: #ef4444;
    box-shadow:
      0 4px 16px rgba(239, 68, 68, 0.25),
      0 0 0 4px rgba(239, 68, 68, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .tile-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
  }

  .tile-icon {
    font-size: 2rem;
    line-height: 1;
    margin-bottom: 0.375rem;
  }

  .tile-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
    line-height: 1.2;
    word-break: break-word;
  }

  .tile-budget {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 0.375rem;
  }

  .budget-remaining {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #0891B2;
    line-height: 1;
  }

  .selected-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #00BFFF;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 191, 255, 0.3);
    animation: checkmark-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .category-tile.status-warning .selected-indicator {
    background: #fbbf24;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  }

  .category-tile.status-danger .selected-indicator {
    background: #ef4444;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  }

  /* Loading Skeleton */
  .category-tile.skeleton {
    pointer-events: none;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  .skeleton-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: rgba(203, 213, 225, 0.3);
  }

  .skeleton-text {
    width: 70%;
    height: 0.875rem;
    border-radius: 4px;
    background: rgba(203, 213, 225, 0.3);
    margin-top: 0.5rem;
  }

  .skeleton-budget {
    width: 50%;
    height: 0.75rem;
    border-radius: 4px;
    background: rgba(203, 213, 225, 0.3);
    margin-top: 0.5rem;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2rem 1.5rem;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px dashed rgba(203, 213, 225, 0.6);
    border-radius: 12px;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.8;
  }

  .empty-message {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .setup-budget-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    background: linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.25);
  }

  .setup-budget-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 191, 255, 0.35);
  }

  .empty-note {
    font-size: 0.8rem;
    color: #6b7280;
    padding: 0.75rem 1rem;
    background: rgba(6, 182, 212, 0.05);
    border-radius: 8px;
    text-align: center;
    line-height: 1.4;
  }

  /* Helper Text */
  .helper-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.15);
    border-radius: 8px;
  }

  .helper-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .helper-message {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.4;
    text-align: center;
  }

  /* Animations */
  @keyframes checkmark-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Focus state for accessibility */
  .category-tile:focus {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(0, 191, 255, 0.4),
      0 4px 12px rgba(0, 191, 255, 0.15),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .category-tile:focus-visible {
    outline: 2px solid #00BFFF;
    outline-offset: 2px;
  }

  /* Mobile Responsive - Keep 3 columns */
  @media (max-width: 768px) {
    .tiles-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .category-tile {
      padding: 0.75rem 0.375rem;
      min-height: 85px;
    }

    .tile-icon {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }

    .tile-label {
      font-size: 0.75rem;
    }

    .budget-remaining {
      font-size: 0.75rem;
    }

    .selected-indicator {
      width: 18px;
      height: 18px;
      font-size: 0.7rem;
      top: 0.25rem;
      right: 0.25rem;
    }

    .tile-budget {
      margin-top: 0.25rem;
    }
  }

  @media (max-width: 480px) {
    .tiles-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.375rem;
    }

    .category-tile {
      padding: 0.625rem 0.25rem;
      min-height: 80px;
      border-radius: 8px;
    }

    .tile-icon {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    .tile-label {
      font-size: 0.7rem;
      line-height: 1.1;
    }

    .budget-remaining {
      font-size: 0.7rem;
    }

    .selected-indicator {
      width: 16px;
      height: 16px;
      font-size: 0.65rem;
      top: 0.25rem;
      right: 0.25rem;
    }

    .empty-state {
      padding: 1.5rem 1rem;
    }

    .empty-icon {
      font-size: 2.5rem;
    }

    .empty-title {
      font-size: 0.9rem;
    }

    .empty-subtitle {
      font-size: 0.8rem;
    }

    .helper-text {
      padding: 0.625rem 0.75rem;
      margin-top: 0.5rem;
    }

    .helper-message {
      font-size: 0.75rem;
    }
  }

  /* Keyboard Navigation Enhancement */
  @media (prefers-reduced-motion: no-preference) {
    .category-tile {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .category-tile,
    .selected-indicator {
      transition: none;
      animation: none;
    }
  }
</style>
