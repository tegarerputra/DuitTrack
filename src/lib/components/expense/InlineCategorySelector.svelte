<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Portal from '$lib/components/ui/Portal.svelte';
  import { getCategoryIcon, formatCategoryName } from '$lib/utils/categoryHelpers';

  export let currentCategory: string;
  export let categories: Array<{ value: string; label: string; icon: string }> = [];
  export let isOpen: boolean = false; // Controlled by parent component

  const dispatch = createEventDispatcher();

  let dropdownElement: HTMLDivElement;
  let categoryDisplayElement: HTMLButtonElement;
  let dropdownStyle = '';

  // Calculate dropdown position only when opened
  $: if (isOpen && categoryDisplayElement) {
    // Calculate position immediately without animation frame to prevent scroll
    const rect = categoryDisplayElement.getBoundingClientRect();
    dropdownStyle = `
      position: fixed;
      top: ${rect.bottom + 4}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
    `;
  }

  // Handle category display click - toggle dropdown via parent
  function handleCategoryDisplayClick(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Dispatch toggle event to parent
    dispatch('toggle');

    // Set flags to prevent handleClickOutside and handleScroll from closing immediately
    if (!isOpen) {
      justOpened = true;
      // Ignore scroll events for 300ms after opening dropdown
      ignoreScrollUntil = Date.now() + 300;
    }
  }

  function handleCategorySelect(categoryValue: string, event: Event) {
    event.stopPropagation();
    if (categoryValue !== currentCategory) {
      dispatch('categoryChange', { newCategory: categoryValue });
    }
  }

  let justOpened = false;
  let ignoreScrollUntil = 0; // Timestamp to ignore scroll events

  onMount(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If dropdown was just opened in this same click, ignore
      if (justOpened) {
        justOpened = false;
        return;
      }

      // Don't process if dropdown is already closed
      if (!isOpen) {
        return;
      }

      // Don't close if clicking on the category display button or its children
      if (categoryDisplayElement && (categoryDisplayElement === target || categoryDisplayElement.contains(target))) {
        return;
      }

      // Don't close if clicking inside the dropdown
      if (dropdownElement && (dropdownElement === target || dropdownElement.contains(target))) {
        return;
      }

      // Close dropdown by dispatching toggle event
      dispatch('toggle');
    };

    // Close dropdown when scrolling (but ignore scroll events right after opening)
    const handleScroll = (event: Event) => {
      const now = Date.now();
      if (now < ignoreScrollUntil) {
        return;
      }

      // Don't close if scrolling inside the dropdown itself
      const target = event.target as HTMLElement;
      if (dropdownElement && (dropdownElement === target || dropdownElement.contains(target))) {
        return;
      }

      if (isOpen) {
        dispatch('toggle');
      }
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  });
</script>

<div class="inline-category-selector">
  <!-- Category Name Display (clickable to toggle dropdown) -->
  <button
    bind:this={categoryDisplayElement}
    class="category-display"
    class:dropdown-open={isOpen}
    on:click={handleCategoryDisplayClick}
    type="button"
  >
    <span class="category-text">{formatCategoryName(currentCategory)}</span>
    <span class="dropdown-indicator" class:rotate={isOpen}>▼</span>
  </button>
</div>

<!-- Dropdown rendered in Portal (outside normal DOM hierarchy) -->
{#if isOpen}
  <Portal>
    <div
      class="category-dropdown"
      style={dropdownStyle}
      bind:this={dropdownElement}
      transition:slide={{ duration: 200, easing: quintOut }}
    >
      {#if categories.length === 0}
        <!-- Empty state when no categories are set up -->
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          <div class="empty-message">
            <div class="empty-title">Belum Ada Kategori</div>
            <div class="empty-subtitle">Setup budget terlebih dahulu untuk menambahkan kategori pengeluaran</div>
          </div>
        </div>
      {:else}
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
      {/if}
    </div>
  </Portal>
{/if}

<style>
  .inline-category-selector {
    position: relative; /* Changed to relative so absolute dropdown positions relative to this */
    width: 100%;
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
    /* Position set via inline style (fixed positioning from Portal) */
    background: white;
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 8px;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 191, 255, 0.2);
    z-index: 999999; /* Highest z-index - rendered in Portal outside stacking contexts */
    max-height: 280px;
    overflow-y: auto;
    backdrop-filter: blur(10px);

    /* Prevent scroll jumps */
    contain: layout style paint;
    will-change: transform;
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

  /* Empty state styling */
  .empty-state {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .empty-icon {
    font-size: 2.5rem;
    opacity: 0.8;
  }

  .empty-message {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .empty-subtitle {
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.4;
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
