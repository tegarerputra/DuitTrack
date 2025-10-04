<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let expenseData: any;

  function formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseCurrencyInput(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  }

  function parseCurrencyInput(formattedValue: string): number {
    return parseInt(formattedValue.replace(/\./g, '') || '0', 10);
  }

  function formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      'FOOD': 'Makanan',
      'TRANSPORT': 'Transport',
      'SHOPPING': 'Belanja',
      'ENTERTAINMENT': 'Hiburan',
      'HEALTH': 'Kesehatan',
      'EDUCATION': 'Pendidikan',
      'UTILITIES': 'Tagihan',
      'OTHER': 'Lainnya'
    };
    return names[category.toUpperCase()] || category;
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'FOOD': '🍽️',
      'TRANSPORT': '🚗',
      'SHOPPING': '🛍️',
      'ENTERTAINMENT': '🎬',
      'HEALTH': '⚕️',
      'EDUCATION': '📚',
      'UTILITIES': '💡',
      'OTHER': '📦'
    };
    return icons[category.toUpperCase()] || '📦';
  }

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'Today';
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }

  function handleAddAnother() {
    dispatch('addAnother');
  }

  function handleViewDashboard() {
    dispatch('viewDashboard');
  }
</script>

<div class="success-state-container">
  <!-- Success Header -->
  <div class="success-header">
    <div class="success-icon-container">
      <div class="success-icon">✅</div>
      <div class="success-rings">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
      </div>
    </div>
    <h2 class="success-title">Expense Added Successfully!</h2>
    <p class="success-subtitle">Your expense has been saved and budget updated</p>
  </div>

  <!-- Expense Preview -->
  <div class="expense-preview glass-card">
    <div class="preview-header">
      <h3 class="preview-title">Expense Summary</h3>
    </div>

    <div class="expense-details">
      <div class="detail-row main-detail">
        <div class="detail-icon">💰</div>
        <div class="detail-content">
          <span class="detail-label">Amount</span>
          <span class="detail-value amount-value" id="successAmount">
            {formatCurrency(expenseData.amount)}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-icon">{getCategoryIcon(expenseData.category)}</div>
        <div class="detail-content">
          <span class="detail-label">Category</span>
          <span class="detail-value" id="successCategory">
            {formatCategoryName(expenseData.category)}
          </span>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-icon">📅</div>
        <div class="detail-content">
          <span class="detail-label">Date</span>
          <span class="detail-value" id="successDate">
            {formatRelativeDate(expenseData.date)}
          </span>
        </div>
      </div>

      {#if expenseData.description}
        <div class="detail-row">
          <div class="detail-icon">📝</div>
          <div class="detail-content">
            <span class="detail-label">Description</span>
            <span class="detail-value">{expenseData.description}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Budget Update Info (placeholder) -->
  <div class="budget-update-info glass-card" id="successBudgetUpdate">
    <div class="budget-header">
      <h4 class="budget-title">Budget Impact</h4>
    </div>
    <div class="budget-content">
      <p id="budgetUpdateText" class="budget-text">
        Budget updated for <strong>{formatCategoryName(expenseData.category)}</strong>
      </p>
      <div class="mini-progress-container">
        <div class="mini-progress-bar">
          <div class="mini-progress-fill" id="miniProgressFill" style="width: 65%"></div>
        </div>
        <span class="progress-text">Budget tracking updated</span>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="success-actions">
    <button
      class="btn-secondary"
      id="addAnotherBtn"
      on:click={handleAddAnother}
    >
      <span class="btn-icon">➕</span>
      Add Another
    </button>
    <button
      class="btn-primary"
      id="viewDashboardBtn"
      on:click={handleViewDashboard}
    >
      <span class="btn-icon">📊</span>
      View Dashboard
    </button>
  </div>
</div>

<style>
  .success-state-container {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: slideIn 0.5s ease;
    max-height: 80vh;
    overflow-y: auto;
  }

  .success-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .success-icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .success-icon {
    font-size: 3rem;
    z-index: 2;
    position: relative;
    animation: bounce 1s ease infinite alternate;
  }

  .success-rings {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ring {
    position: absolute;
    border: 2px solid rgba(76, 175, 80, 0.3);
    border-radius: 50%;
    animation: ripple 2s linear infinite;
  }

  .ring-1 {
    width: 4rem;
    height: 4rem;
    animation-delay: 0s;
  }

  .ring-2 {
    width: 5rem;
    height: 5rem;
    animation-delay: 0.5s;
  }

  .ring-3 {
    width: 6rem;
    height: 6rem;
    animation-delay: 1s;
  }

  .success-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .success-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0;
    text-align: center;
  }

  .expense-preview {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .preview-header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .preview-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .expense-details {
    padding: 1rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .detail-row.main-detail {
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 0.25rem;
  }

  .detail-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .detail-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .detail-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .detail-value {
    font-size: 1rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .amount-value {
    font-size: 1.25rem;
    color: var(--safe-color);
    font-weight: 700;
  }

  .budget-update-info {
    border-radius: 16px;
    background: rgba(76, 175, 80, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(76, 175, 80, 0.2);
  }

  .budget-header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  }

  .budget-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--safe-color);
    margin: 0;
  }

  .budget-content {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .budget-text {
    font-size: 0.9rem;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.4;
  }

  .mini-progress-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mini-progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #66BB6A);
    border-radius: 3px;
    transition: width 0.5s ease;
    animation: progressFill 1s ease;
  }

  .progress-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .success-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
    border: 1px solid var(--primary-accent);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(var(--primary-accent-rgb), 0.3);
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  /* Animations */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes bounce {
    0% { transform: scale(1); }
    100% { transform: scale(1.1); }
  }

  @keyframes ripple {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }

  @keyframes progressFill {
    from { width: 0%; }
    to { width: var(--final-width, 65%); }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .success-state-container {
      padding: 1rem;
      gap: 1rem;
    }

    .success-icon {
      font-size: 2.5rem;
    }

    .ring-1 { width: 3.5rem; height: 3.5rem; }
    .ring-2 { width: 4.5rem; height: 4.5rem; }
    .ring-3 { width: 5.5rem; height: 5.5rem; }

    .success-title {
      font-size: 1.3rem;
    }

    .preview-header, .budget-header {
      padding: 0.875rem 1rem 0.625rem;
    }

    .expense-details, .budget-content {
      padding: 0.875rem 1rem 1rem;
    }

    .success-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-secondary, .btn-primary {
      padding: 1rem;
    }
  }

  @media (max-width: 480px) {
    .success-state-container {
      padding: 0.75rem;
    }

    .success-icon {
      font-size: 2rem;
    }

    .success-title {
      font-size: 1.2rem;
    }

    .success-subtitle {
      font-size: 0.9rem;
    }

    .detail-icon {
      width: 2.25rem;
      height: 2.25rem;
      font-size: 1.1rem;
    }

    .amount-value {
      font-size: 1.1rem;
    }
  }

  /* Enhanced glass morphism */
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  /* Focus states for accessibility */
  .btn-secondary:focus,
  .btn-primary:focus {
    outline: 2px solid var(--primary-accent);
    outline-offset: 2px;
  }

  /* Loading states */
  .success-state-container {
    opacity: 0;
    animation: slideIn 0.5s ease forwards;
  }
</style>