<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let currentCategory: string;
  export let categories: Array<{ value: string; label: string; icon: string }> = [];

  const dispatch = createEventDispatcher();

  let isOpen = false; // Start closed, only open when category display is clicked
  let dropdownElement: HTMLDivElement;

  // Handle category display click - toggle dropdown
  function handleCategoryDisplayClick(event: Event) {
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleCategorySelect(categoryValue: string, event: Event) {
    event.stopPropagation();
    if (categoryValue !== currentCategory) {
      dispatch('categoryChange', { newCategory: categoryValue });
    }
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'FOOD': '🍽️',
      'food': '🍽️',
      'TRANSPORT': '🚗',
      'transport': '🚗',
      'SHOPPING': '🛍️',
      'shopping': '🛍️',
      'ENTERTAINMENT': '🎬',
      'entertainment': '🎬',
      'HEALTH': '💊',
      'health': '💊',
      'EDUCATION': '📚',
      'education': '📚',
      'UTILITIES': '⚡',
      'utilities': '⚡',
      'SAVINGS': '💰',
      'savings': '💰',
      'OTHER': '📦',
      'other': '📦'
    };
    return icons[category] || icons[category.toUpperCase()] || '📦';
  }

  function formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      'FOOD': 'Makanan',
      'food': 'Makanan',
      'TRANSPORT': 'Transport',
      'transport': 'Transport',
      'SHOPPING': 'Belanja',
      'shopping': 'Belanja',
      'ENTERTAINMENT': 'Hiburan',
      'entertainment': 'Hiburan',
      'HEALTH': 'Kesehatan',
      'health': 'Kesehatan',
      'EDUCATION': 'Pendidikan',
      'education': 'Pendidikan',
      'UTILITIES': 'Tagihan',
      'utilities': 'Tagihan',
      'SAVINGS': 'Tabungan',
      'savings': 'Tabungan',
      'OTHER': 'Lainnya',
      'other': 'Lainnya'
    };
    return names[category] || names[category.toLowerCase()] || category;
  }

  onMount(() => {
    // Stop event propagation from the entire component
    if (dropdownElement) {
      dropdownElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });
</script>

<div class="inline-category-selector" bind:this={dropdownElement}>
  <!-- Category Name Display (clickable to toggle dropdown) -->
  <button
    class="category-display"
    class:dropdown-open={isOpen}
    on:click={handleCategoryDisplayClick}
    type="button"
  >
    <span class="category-text">{formatCategoryName(currentCategory)}</span>
    <span class="dropdown-indicator" class:rotate={isOpen}>▼</span>
  </button>

  <!-- Dropdown List (always visible when component mounted) -->
  {#if isOpen}
    <div class="category-dropdown" transition:slide={{ duration: 200, easing: quintOut }}>
      {#each categories as category}
        <button
          class="category-option"
          class:active={category.value.toUpperCase() === currentCategory.toUpperCase()}
          on:click={(e) => handleCategorySelect(category.value, e)}
          type="button"
        >
          <span class="category-icon">{getCategoryIcon(category.value)}</span>
          <span class="category-label">{category.label}</span>
          {#if category.value.toUpperCase() === currentCategory.toUpperCase()}
            <span class="checkmark">✓</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inline-category-selector {
    position: relative;
    width: 100%;
    z-index: 100;
  }

  .category-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 6px;
    color: #1f2937;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
  }

  .category-display:hover {
    background: rgba(6, 182, 212, 0.15);
    border-color: rgba(6, 182, 212, 0.4);
  }

  .category-display.dropdown-open {
    background: rgba(6, 182, 212, 0.2);
    border-color: rgba(6, 182, 212, 0.5);
  }

  .category-text {
    flex: 1;
  }

  .dropdown-indicator {
    font-size: 0.75rem;
    color: #0891B2;
    margin-left: 6px;
    transition: transform 0.2s ease;
  }

  .dropdown-indicator.rotate {
    transform: rotate(180deg);
  }

  .category-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 8px;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 191, 255, 0.2);
    z-index: 10000;
    max-height: 280px;
    overflow-y: auto;
    backdrop-filter: blur(10px);
  }

  .category-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    background: white;
    border: none;
    border-bottom: 1px solid rgba(6, 182, 212, 0.08);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    text-align: left;
  }

  .category-option:last-child {
    border-bottom: none;
    border-radius: 0 0 8px 8px;
  }

  .category-option:first-child {
    border-radius: 8px 8px 0 0;
  }

  .category-option:hover {
    background: rgba(6, 182, 212, 0.1);
  }

  .category-option.active {
    background: rgba(6, 182, 212, 0.15);
    font-weight: 600;
  }

  .category-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .category-label {
    flex: 1;
    color: #1f2937;
  }

  .checkmark {
    color: #0891B2;
    font-weight: bold;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  /* Mobile optimization */
  @media (max-width: 767px) {
    .category-display {
      font-size: 0.9rem;
      padding: 2px 6px;
    }

    .category-dropdown {
      max-height: 240px;
    }

    .category-option {
      padding: 10px 12px;
      font-size: 0.9rem;
    }

    .category-icon {
      font-size: 16px;
      width: 20px;
    }
  }

  /* Scrollbar styling for dropdown */
  .category-dropdown::-webkit-scrollbar {
    width: 6px;
  }

  .category-dropdown::-webkit-scrollbar-track {
    background: rgba(6, 182, 212, 0.05);
    border-radius: 4px;
  }

  .category-dropdown::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 4px;
  }

  .category-dropdown::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
  }
</style>
