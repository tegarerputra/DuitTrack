<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let category: {
    id: string;
    name: string;
    emoji: string;
    budget: number;
    spent: number;
  };

  let budgetInput = '';
  let originalBudget = '';
  let isEditing = false;

  // Initialize budget input with formatted value
  $: {
    if (!isEditing) {
      budgetInput = formatCurrencyInput(category.budget);
      originalBudget = budgetInput;
    }
  }

  // Calculate progress metrics
  $: progressPercent = category.budget > 0 ? Math.min((category.spent / category.budget) * 100, 100) : 0;
  $: remainingAmount = Math.max(category.budget - category.spent, 0);
  $: progressStatus = getProgressStatus(category.spent, category.budget, progressPercent);

  function getProgressStatus(spent: number, budget: number, percent: number): string {
    if (spent > budget) return 'over-budget';
    if (percent >= 90) return 'danger';
    if (percent >= 75) return 'warning';
    return 'safe';
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatCurrencyInput(amount: number): string {
    if (!amount) return '';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseCurrencyInput(value: string): number {
    return parseInt(value.replace(/\./g, '') || '0', 10);
  }

  function handleBudgetInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Clean input: remove all non-digits
    const cleanValue = value.replace(/[^\d]/g, '');

    // Format with dots as thousand separators
    const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Update input value
    budgetInput = formattedValue;
    target.value = formattedValue;

    // Validate amount
    const amount = parseCurrencyInput(formattedValue);
    const warningElement = document.getElementById(`warning-${category.id}`);

    if (warningElement) {
      if (amount > 999999999) {
        warningElement.style.display = 'block';
      } else {
        warningElement.style.display = 'none';
      }
    }
  }

  function handleBudgetChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const amount = parseCurrencyInput(target.value);

    if (amount <= 999999999) {
      dispatch('budgetUpdate', { amount });
    }
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete the ${category.name} category?`)) {
      dispatch('delete');
    }
  }

  function startEditing() {
    isEditing = true;
    originalBudget = budgetInput;
    // Focus input after enabling edit mode
    setTimeout(() => {
      const input = document.getElementById(`budget-${category.id}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  function handleSaveBudget() {
    const amount = parseCurrencyInput(budgetInput);

    if (amount <= 999999999 && amount >= 0) {
      dispatch('budgetUpdate', { amount });
      isEditing = false;
    }
  }

  function handleCancelEdit() {
    budgetInput = originalBudget;
    isEditing = false;

    // Hide warning if shown
    const warningElement = document.getElementById(`warning-${category.id}`);
    if (warningElement) {
      warningElement.style.display = 'none';
    }
  }
</script>

<div class="category-budget-item glass-card">
  <!-- Header: Icon + Name + Status Badge -->
  <div class="category-header">
    <div class="category-icon">{category.emoji}</div>
    <div class="category-title-group">
      <h4 class="category-name">{category.name}</h4>
      <span class="status-badge status-{progressStatus}">
        {#if progressStatus === 'over-budget'}
          🚨 Over Budget
        {:else if progressStatus === 'danger'}
          ⚠️ Critical
        {:else if progressStatus === 'warning'}
          ⚡ Warning
        {:else}
          ✅ Safe
        {/if}
      </span>
    </div>
    <button
      type="button"
      class="delete-btn"
      on:click={handleDelete}
      title="Delete category"
      aria-label="Delete {category.name} category"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Trash bin icon -->
        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.667 7.333v4M9.333 7.333v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Budget Input Section -->
  <div class="budget-section">
    <label for="budget-{category.id}" class="budget-label">Budget Target</label>
    <div class="budget-input-wrapper">
      <span class="currency-prefix">Rp</span>
      <input
        type="text"
        class="budget-input"
        class:readonly={!isEditing}
        placeholder="0"
        value={budgetInput}
        id="budget-{category.id}"
        readonly={!isEditing}
        on:input={handleBudgetInput}
        on:change={handleBudgetChange}
        aria-label="Budget amount for {category.name}"
      />
      {#if isEditing}
        <button
          type="button"
          class="budget-action-btn save-btn"
          on:click={handleSaveBudget}
          title="Save budget"
          aria-label="Save budget"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          class="budget-action-btn cancel-btn"
          on:click={handleCancelEdit}
          title="Cancel"
          aria-label="Cancel edit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      {:else}
        <button
          type="button"
          class="budget-action-btn edit-btn"
          on:click={startEditing}
          title="Edit budget"
          aria-label="Edit budget for {category.name}"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 4L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>
    <div id="warning-{category.id}" class="budget-warning" style="display: none;">
      ⚠️ Max. Rp 999.999.999
    </div>
  </div>

  <!-- Progress Section -->
  <div class="progress-section">
    <div class="progress-header">
      <span class="progress-label">Progress</span>
      <span class="progress-percentage">{Math.round(progressPercent)}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill {progressStatus}" style="width: {Math.min(progressPercent, 100)}%">
        <div class="progress-shimmer"></div>
      </div>
    </div>
  </div>

  <!-- Spent & Remaining Info -->
  <div class="amount-details">
    <div class="amount-item">
      <span class="amount-label">Spent</span>
      <span class="amount-value spent-value">{formatCurrency(category.spent)}</span>
    </div>
    <div class="divider"></div>
    <div class="amount-item">
      <span class="amount-label">Remaining</span>
      <span class="amount-value remaining-value {remainingAmount === 0 ? 'depleted' : ''}">{formatCurrency(remainingAmount)}</span>
    </div>
  </div>
</div>

<style>
  /* ===== CARD CONTAINER ===== */
  .category-budget-item {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
    border-radius: 16px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .category-budget-item:hover {
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.25);
    transform: translateY(-2px);
  }

  /* Over-budget state */
  .category-budget-item:has(.status-over-budget) {
    border-color: rgba(244, 67, 54, 0.3);
    background: linear-gradient(135deg,
      rgba(255, 245, 245, 0.5) 0%,
      rgba(255, 240, 240, 0.4) 50%,
      rgba(255, 248, 248, 0.6) 100%);
  }

  .category-budget-item:has(.status-over-budget):hover {
    border-color: rgba(244, 67, 54, 0.5);
    box-shadow:
      0 12px 40px rgba(244, 67, 54, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  /* ===== HEADER SECTION ===== */
  .category-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .category-icon {
    font-size: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 14px;
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.15) 0%,
      rgba(6, 182, 212, 0.08) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(6, 182, 212, 0.2);
    flex-shrink: 0;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.05));
  }

  .category-budget-item:hover .category-icon {
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.25) 0%,
      rgba(6, 182, 212, 0.15) 100%);
    border-color: rgba(6, 182, 212, 0.35);
    transform: scale(1.05);
  }

  .category-title-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .category-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    width: fit-content;
    transition: all 0.3s ease;
  }

  .status-safe {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(102, 187, 106, 0.1));
    color: #2e7d32;
    border: 1px solid rgba(76, 175, 80, 0.25);
  }

  .status-warning {
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 183, 77, 0.1));
    color: #e65100;
    border: 1px solid rgba(255, 152, 0, 0.25);
  }

  .status-danger {
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(239, 83, 80, 0.1));
    color: #c62828;
    border: 1px solid rgba(244, 67, 54, 0.25);
  }

  .status-over-budget {
    background: linear-gradient(135deg, rgba(211, 47, 47, 0.2), rgba(244, 67, 54, 0.15));
    color: #b71c1c;
    border: 1px solid rgba(211, 47, 47, 0.35);
    animation: pulse-badge 2s ease-in-out infinite;
  }

  @keyframes pulse-badge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  .delete-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 8px;
    background: rgba(244, 67, 54, 0.08);
    border: 1px solid rgba(244, 67, 54, 0.2);
    color: #d32f2f;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .delete-btn:hover {
    background: rgba(244, 67, 54, 0.15);
    border-color: rgba(244, 67, 54, 0.35);
    transform: scale(1.1);
  }

  .delete-btn:focus {
    outline: 2px solid rgba(244, 67, 54, 0.5);
    outline-offset: 2px;
  }

  /* ===== BUDGET INPUT SECTION ===== */
  .budget-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .budget-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .budget-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .currency-prefix {
    position: absolute;
    left: 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #64748b;
    pointer-events: none;
    z-index: 1;
  }

  .budget-input {
    flex: 1;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.4);
    border: 2px solid rgba(6, 182, 212, 0.15);
    color: #1e293b;
    font-size: 1.125rem;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  .budget-input.readonly {
    cursor: default;
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(148, 163, 184, 0.15);
    pointer-events: none;
  }

  .budget-input.readonly:focus {
    outline: none;
    border-color: rgba(148, 163, 184, 0.15);
    background: rgba(255, 255, 255, 0.25);
    box-shadow: none;
  }

  .budget-input:not(.readonly):focus {
    outline: none;
    border-color: rgba(6, 182, 212, 0.4);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.08);
  }

  .budget-input::placeholder {
    color: #cbd5e1;
  }

  /* Budget Action Buttons */
  .budget-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 10px;
    border: 1.5px solid;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .edit-btn {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
    border-color: rgba(6, 182, 212, 0.25);
    color: #0891b2;
  }

  .edit-btn:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1));
    border-color: rgba(6, 182, 212, 0.4);
    transform: scale(1.05);
  }

  .save-btn {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08));
    border-color: rgba(34, 197, 94, 0.3);
    color: #16a34a;
  }

  .save-btn:hover {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.15));
    border-color: rgba(34, 197, 94, 0.45);
    transform: scale(1.05);
  }

  .cancel-btn {
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.08));
    border-color: rgba(148, 163, 184, 0.3);
    color: #64748b;
  }

  .cancel-btn:hover {
    background: linear-gradient(135deg, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.15));
    border-color: rgba(148, 163, 184, 0.45);
    transform: scale(1.05);
  }

  .budget-action-btn:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .budget-warning {
    color: #d32f2f;
    font-size: 0.75rem;
    font-weight: 600;
    animation: pulse-warning 1.5s ease-in-out infinite;
  }

  @keyframes pulse-warning {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* ===== PROGRESS SECTION ===== */
  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .progress-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progress-percentage {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
  }

  .progress-bar {
    height: 10px;
    background: rgba(148, 163, 184, 0.15);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    border-radius: 10px;
    position: relative;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .progress-fill.safe {
    background: linear-gradient(90deg, #4CAF50, #66BB6A);
  }

  .progress-fill.warning {
    background: linear-gradient(90deg, #FF9800, #FFB74D);
  }

  .progress-fill.danger {
    background: linear-gradient(90deg, #F44336, #EF5350);
  }

  .progress-fill.over-budget {
    background: linear-gradient(90deg, #D32F2F, #F44336);
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.4);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(244, 67, 54, 0.4);
    }
    50% {
      box-shadow: 0 0 25px rgba(244, 67, 54, 0.7);
    }
  }

  .progress-shimmer {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: shimmer 2.5s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  /* ===== AMOUNT DETAILS ===== */
  .amount-details {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(6, 182, 212, 0.1);
  }

  .amount-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .amount-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .amount-value {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
  }

  .spent-value {
    color: #0891b2;
  }

  .remaining-value {
    color: #059669;
  }

  .remaining-value.depleted {
    color: #dc2626;
  }

  .divider {
    width: 1px;
    height: 2.5rem;
    background: linear-gradient(to bottom,
      transparent,
      rgba(148, 163, 184, 0.3),
      transparent
    );
  }

  /* ===== MOBILE RESPONSIVENESS ===== */
  @media (max-width: 768px) {
    .category-budget-item {
      padding: 1.25rem;
      gap: 1rem;
    }

    .category-header {
      gap: 0.75rem;
    }

    .category-icon {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 2rem;
    }

    .category-name {
      font-size: 1rem;
    }

    .status-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
    }

    .budget-input {
      font-size: 1rem;
      padding: 0.75rem 0.875rem 0.75rem 2.75rem;
    }

    .currency-prefix {
      left: 0.875rem;
      font-size: 0.875rem;
    }

    .amount-details {
      padding: 0.875rem;
    }

    .amount-value {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .category-budget-item {
      padding: 1rem;
      gap: 0.875rem;
    }

    .category-icon {
      width: 3rem;
      height: 3rem;
      font-size: 1.75rem;
    }

    .category-name {
      font-size: 0.95rem;
    }

    .budget-label,
    .progress-label,
    .amount-label {
      font-size: 0.7rem;
    }

    .budget-input {
      font-size: 0.95rem;
      padding: 0.7rem 0.75rem 0.7rem 2.5rem;
    }

    .currency-prefix {
      left: 0.75rem;
      font-size: 0.8rem;
    }

    .amount-details {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .divider {
      width: 100%;
      height: 1px;
      background: linear-gradient(to right,
        transparent,
        rgba(148, 163, 184, 0.3),
        transparent
      );
    }

    .amount-item {
      text-align: center;
    }
  }
</style>