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
  let isEditing = false;

  // Initialize budget input with formatted value
  $: {
    budgetInput = formatCurrencyInput(category.budget);
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
  }

  function stopEditing() {
    isEditing = false;
  }
</script>

<div class="category-budget-item enhanced-category-item glass-card">
  <div class="category-info">
    <div class="category-icon">{category.emoji}</div>
    <div class="category-details">
      <div class="category-name">{category.name}</div>
      <div class="category-description">{category.name.toLowerCase()}</div>

      <!-- Enhanced Progress Section -->
      <div class="category-progress-section">
        <div class="progress-bar-container">
          <div class="progress-bar enhanced-progress">
            <div class="progress-fill {progressStatus}" style="width: {progressPercent}%">
              <div class="progress-shimmer"></div>
            </div>
          </div>
          <div class="progress-percentage">{Math.round(progressPercent)}%</div>
        </div>

        <div class="progress-details">
          <div class="spent-info">
            <span class="spent-label">Spent:</span>
            <span class="spent-amount">{formatCurrency(category.spent)}</span>
          </div>
          <div class="remaining-info {remainingAmount === 0 ? 'depleted' : ''}">
            <span class="remaining-label">Remaining:</span>
            <span class="remaining-amount">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="budget-input-section">
    <div class="budget-input-group">
      <input
        type="text"
        class="glass-input simple-budget-input"
        placeholder="0"
        value={budgetInput}
        min="0"
        id="budget-{category.id}"
        on:input={handleBudgetInput}
        on:change={handleBudgetChange}
        on:focus={startEditing}
        on:blur={stopEditing}
      />
      <span class="currency">Rp</span>
    </div>
    <div id="warning-{category.id}" class="budget-warning" style="display: none;">
      ⚠️ Max. Rp 999.999.999
    </div>
  </div>

  <div class="category-actions">
    <button
      type="button"
      class="simple-delete-btn"
      on:click={handleDelete}
      title="Delete category"
    >
      &times;
    </button>
  </div>
</div>

<style>
  .category-budget-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 16px;
    /* Enhanced glassmorphism effect */
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
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .category-budget-item:hover {
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
    box-shadow:
      0 25px 60px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    transform: translateY(-4px) scale(1.01);
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .category-icon {
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 12px;
    /* Enhanced glassmorphism icon container */
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.15) 0%,
      rgba(6, 182, 212, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(6, 182, 212, 0.2);
    flex-shrink: 0;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .category-budget-item:hover .category-icon {
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.25) 0%,
      rgba(6, 182, 212, 0.15) 100%);
    border-color: rgba(6, 182, 212, 0.4);
    transform: scale(1.1);
  }

  .category-details {
    flex: 1;
    min-width: 0;
  }

  .category-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .category-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    text-transform: capitalize;
  }

  .category-progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    position: relative;
    transition: width 0.6s ease;
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
    box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);
    }
    50% {
      box-shadow: 0 0 25px rgba(244, 67, 54, 0.8);
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
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  /* Over-budget card highlight */
  .category-budget-item:has(.progress-fill.over-budget) {
    border-color: rgba(244, 67, 54, 0.3);
    box-shadow:
      0 8px 32px rgba(244, 67, 54, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .category-budget-item:has(.progress-fill.over-budget):hover {
    border-color: rgba(244, 67, 54, 0.5);
    box-shadow:
      0 25px 60px rgba(244, 67, 54, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .progress-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    min-width: 40px;
    text-align: right;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .spent-info, .remaining-info {
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .spent-label, .remaining-label {
    color: #64748b;
    font-weight: 500;
  }

  .spent-amount, .remaining-amount {
    color: #1e293b;
    font-weight: 600;
  }

  .remaining-info.depleted .remaining-amount {
    color: var(--danger-color);
  }

  .budget-input-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    min-width: 120px;
  }

  .budget-input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .simple-budget-input {
    width: 120px;
    padding: 0.75rem 2rem 0.75rem 0.75rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #1e293b;
    font-size: 0.9rem;
    text-align: right;
    transition: all 0.3s ease;
  }

  .simple-budget-input:focus {
    outline: none;
    border-color: var(--primary-accent);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(var(--primary-accent-rgb), 0.1);
  }

  .currency {
    position: absolute;
    right: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
    pointer-events: none;
  }

  .budget-warning {
    color: var(--danger-color);
    font-size: 0.75rem;
    margin-top: 0.25rem;
    text-align: right;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .category-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .simple-delete-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
    color: var(--danger-color);
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .simple-delete-btn:hover {
    background: rgba(244, 67, 54, 0.2);
    border-color: rgba(244, 67, 54, 0.5);
    transform: scale(1.1);
  }

  .simple-delete-btn:focus {
    outline: 2px solid var(--danger-color);
    outline-offset: 2px;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .category-budget-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      padding: 1rem;
    }

    .category-info {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
    }

    .category-details {
      width: 100%;
    }

    .progress-details {
      justify-content: center;
      gap: 2rem;
    }

    .budget-input-section {
      align-items: center;
      min-width: auto;
      width: 100%;
    }

    .simple-budget-input {
      width: 150px;
    }

    .category-actions {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .category-icon {
      width: 3rem;
      height: 3rem;
      font-size: 1.5rem;
    }

    .category-name {
      font-size: 1rem;
    }

    .progress-details {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .spent-info, .remaining-info {
      align-items: center;
      text-align: center;
    }
  }

  /* Enhanced glass morphism */
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .glass-input {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>