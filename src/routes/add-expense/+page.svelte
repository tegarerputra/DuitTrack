<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { writable, derived } from 'svelte/store';
  import { expenseActions } from '../../lib/stores/expenses';
  import { budgetStore, budgetActions } from '../../lib/stores/budget';
  import { authService } from '../../lib/services/authService';
  import { DataService } from '../../lib/services/dataService';
  import SmartWarning from '../../lib/components/expense/SmartWarning.svelte';

  // Navigation context
  let returnPath = '';
  let dataService: DataService | null = null;
  let budgetData: any = null;
  let isSubmitting = false;
  let showSuccessState = false;
  let dailyWarnings = new Map();
  let categories: any[] = [];
  let isLoadingBudget = false;

  // Helper function to get current date
  function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Form data stores - Initialize with today's date
  const formData = writable({
    amount: '',
    category: 'OTHER',
    description: '',
    date: getCurrentDate()
  });

  const errors = writable({
    amount: '',
    category: '',
    description: '',
    date: '',
    system: ''
  });

  const smartWarning = writable({
    show: false,
    type: '',
    data: {}
  });

  // Derived stores
  const isFormValid = derived(
    [formData, errors],
    ([$formData, $errors]) => {
      const amount = parseCurrencyInput($formData.amount);
      return amount > 0 &&
             amount <= 999999999 &&
             $formData.date &&
             !$errors.date &&
             !$errors.amount;
    }
  );

  // Reactive variable for categories check
  $: hasCategories = categories && categories.length > 0 && !categories.every(cat => cat.disabled);

  // Reactive subscription to budget store - automatically update categories when budget changes
  $: if ($budgetStore && $budgetStore.categories) {
    categories = Object.entries($budgetStore.categories).map(([key, data]: [string, any]) => ({
      value: key.toUpperCase(),
      label: formatCategoryName(key),
      disabled: false
    }));
  }

  // Component initialization
  onMount(async () => {
    // Get return path from URL params
    returnPath = $page.url.searchParams.get('return') || 'dashboard';

    await initializeExpenseForm();
    await loadCategories();
  });

  // Watch for form changes to trigger smart validation
  $: if ($formData.amount && $formData.category !== 'OTHER') {
    debounceSmartValidation();
  }

  async function initializeExpenseForm() {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        dataService = new DataService(user.uid);
      }
    } catch (error) {
      console.error('Error initializing expense form:', error);
    }
  }

  async function loadCategories() {
    try {
      // Load budget data - reactive statement will handle updating categories
      await budgetActions.loadBudgetData();
    } catch (error) {
      console.error('Error loading categories:', error);
      categories = [];
    }
  }

  function formatCurrencyInput(amount: number): string {
    if (!amount) return '';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseCurrencyInput(formattedValue: string): number {
    return parseInt(formattedValue.replace(/\./g, '') || '0', 10);
  }

  function handleAmountInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Clean input: remove all non-digits
    const cleanValue = value.replace(/[^\d]/g, '');

    // Format with dots as thousand separators
    const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Update input and store
    target.value = formattedValue;
    formData.update(data => ({ ...data, amount: formattedValue }));

    // Clear previous amount errors
    errors.update(errs => ({ ...errs, amount: '' }));

    // Validate amount
    const amount = parseCurrencyInput(formattedValue);
    if (amount > 999999999) {
      errors.update(errs => ({ ...errs, amount: "Whoa there, millionaire! Max Rp 999,999,999 please!" }));
    }
  }

  function handleCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    formData.update(data => ({ ...data, category: target.value }));
    errors.update(errs => ({ ...errs, category: '' }));
  }

  function handleDescriptionInput(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.update(data => ({ ...data, description: target.value }));
    errors.update(errs => ({ ...errs, description: '' }));
  }

  function handleDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.update(data => ({ ...data, date: target.value }));
    errors.update(errs => ({ ...errs, date: '' }));

    // Validate date
    if (target.value) {
      validateDateInput(target.value);
    }
  }

  function validateDateInput(dateValue: string): boolean {
    const date = new Date(dateValue);
    const today = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      errors.update(errs => ({ ...errs, date: '📅 Please enter a valid date' }));
      return false;
    }

    // Check if date is not too far in the future (more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (date > oneYearFromNow) {
      errors.update(errs => ({ ...errs, date: '📅 Date cannot be more than 1 year in the future' }));
      return false;
    }

    errors.update(errs => ({ ...errs, date: '' }));
    return true;
  }

  let validationTimeout: number;
  function debounceSmartValidation() {
    clearTimeout(validationTimeout);
    validationTimeout = setTimeout(() => {
      checkSmartValidation();
    }, 200);
  }

  async function checkSmartValidation() {
    const data = $formData;
    const amount = parseCurrencyInput(data.amount);
    const category = data.category;

    if (amount <= 0 || category === 'OTHER') {
      smartWarning.set({ show: false, type: '', data: {} });
      return;
    }

    // Prevent race condition - don't load if already loading
    if (isLoadingBudget) {
      return;
    }

    if (!budgetData) {
      await loadBudgetData();
    }

    if (budgetData && budgetData.categories && budgetData.categories[category.toLowerCase()]) {
      await evaluateBudgetWarning(amount, category);
    } else {
      smartWarning.set({ show: false, type: '', data: {} });
    }
  }

  async function loadBudgetData() {
    if (isLoadingBudget) return;

    try {
      isLoadingBudget = true;

      if (!dataService) return;

      // Load from budget store
      await budgetActions.loadBudgetData();

      // Get from budget store
      const currentBudget = $budgetStore;
      if (currentBudget && currentBudget.categories) {
        budgetData = {
          categories: currentBudget.categories
        };
      } else {
        budgetData = null;
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      budgetData = null;
    } finally {
      isLoadingBudget = false;
    }
  }

  async function evaluateBudgetWarning(amount: number, category: string) {
    const categoryData = budgetData.categories[category.toLowerCase()];
    if (!categoryData) return;

    const currentSpent = categoryData.spent || 0;
    const budget = categoryData.budget || 0;
    const newTotal = currentSpent + amount;
    const percentage = budget > 0 ? (newTotal / budget) * 100 : 0;

    // Check if we should show warning (first time per day per category+threshold)
    const warningKey = `${category.toLowerCase()}_${Math.floor(percentage / 10) * 10}`;
    const today = new Date().toDateString();
    const lastWarning = dailyWarnings.get(warningKey);

    if (lastWarning === today) return;

    let shouldWarn = false;
    let warningType = '';
    let warningData = {};

    if (percentage >= 100) {
      shouldWarn = true;
      warningType = 'exceeded';
      warningData = {
        category: formatCategoryName(category),
        overage: formatCurrency(newTotal - budget),
        newTotal: formatCurrency(newTotal),
        budget: formatCurrency(budget),
        percentage: Math.round(percentage)
      };
    } else if (percentage >= 80) {
      shouldWarn = true;
      warningType = 'caution';
      warningData = {
        category: formatCategoryName(category),
        percentage: Math.round(percentage),
        remaining: formatCurrency(budget - newTotal)
      };
    }

    if (shouldWarn) {
      smartWarning.set({
        show: true,
        type: warningType,
        data: warningData
      });
      dailyWarnings.set(warningKey, today);
    } else {
      smartWarning.set({ show: false, type: '', data: {} });
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!$isFormValid || isSubmitting) return;

    try {
      isSubmitting = true;
      errors.update(errs => ({ ...errs, system: '' }));

      const data = $formData;
      const amount = parseCurrencyInput(data.amount);

      // Validate form data
      if (!validateFormData(amount, data)) {
        return;
      }

      const expenseData = {
        amount,
        category: data.category.toUpperCase(),
        description: data.description,
        date: data.date,
        type: 'expense' as const,
        periodId: getCurrentPeriodId(),
        categoryId: data.category.toLowerCase()
      };

      let expenseId: string;
      // Create new expense
      if (dataService) {
        expenseId = await dataService.createTransaction(expenseData);
      } else {
        expenseId = generateTempId();
      }

      // Update stores
      await expenseActions.addExpense({ id: expenseId, ...expenseData });
      await budgetActions.updateCategorySpending(data.category.toLowerCase(), amount);

      // Show success and redirect
      showSuccessState = true;
      setTimeout(() => {
        handleReturn();
      }, 1500);

    } catch (error) {
      console.error('Error saving expense:', error);
      handleSubmissionError(error);
    } finally {
      isSubmitting = false;
    }
  }

  function validateFormData(amount: number, data: any): boolean {
    let hasErrors = false;

    if (!amount || amount <= 0) {
      errors.update(errs => ({ ...errs, amount: "Don't leave me empty! I need an amount!" }));
      hasErrors = true;
    } else if (amount > 999999999) {
      errors.update(errs => ({ ...errs, amount: "Whoa there, millionaire! Max Rp 999,999,999 please!" }));
      hasErrors = true;
    }

    if (!data.date) {
      errors.update(errs => ({ ...errs, date: "Don't leave me empty! I need a date!" }));
      hasErrors = true;
    } else if (!validateDateInput(data.date)) {
      hasErrors = true;
    }

    return !hasErrors;
  }

  function handleSubmissionError(error: any) {
    if (error.code === 'permission-denied') {
      errors.update(errs => ({ ...errs, system: 'Unable to save expense. Please try signing in again' }));
    } else if (error.message?.includes('network')) {
      errors.update(errs => ({ ...errs, system: 'Something went wrong saving your expense: Network error' }));
    } else {
      errors.update(errs => ({ ...errs, system: 'Oops! Something went wrong. Please try again!' }));
    }
  }

  function handleReturn() {
    // Smart return logic based on returnPath
    switch (returnPath) {
      case 'budget':
        goto('/budget');
        break;
      case 'expenses':
        goto('/expenses');
        break;
      case 'dashboard':
      default:
        goto('/dashboard');
        break;
    }
  }

  function handleCancel() {
    handleReturn();
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
      'OTHER': 'Lainnya',
      'other': 'Lainnya'
    };
    return names[category] || category;
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getCurrentPeriodId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
</script>

<div class="add-expense-page">
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">Add Expense</h1>
      <button class="close-button" on:click={handleCancel} aria-label="Close">
        ✕
      </button>
    </div>
  </div>

  <div class="expense-container">
    {#if !showSuccessState}
      <!-- Smart Warning -->
      {#if $smartWarning.show}
        <SmartWarning type={$smartWarning.type} data={$smartWarning.data} />
      {/if}

      <!-- Form -->
      <form class="expense-form glass-card" on:submit={handleSubmit}>
        <!-- Input Method Selection -->
        <div class="input-method-section">
          <button type="button" class="method-tab active">
            <div class="method-icon">✏️</div>
            <div class="method-label">Manual Input</div>
          </button>
          <button type="button" class="method-tab disabled" disabled>
            <div class="method-icon">📷</div>
            <div class="method-label">Invoice OCR</div>
            <span class="coming-soon-badge">Soon</span>
          </button>
        </div>

        <!-- Amount Input -->
        <div class="form-group">
          <label for="expenseAmount" class="form-label">Amount *</label>
          <div class="currency-input-group">
            <span class="currency-prefix">Rp</span>
            <input
              type="text"
              id="expenseAmount"
              class="glass-input currency-input"
              class:error-state={$errors.amount}
              placeholder="0"
              value={$formData.amount}
              on:input={handleAmountInput}
              required
            />
          </div>
          {#if $errors.amount}
            <div class="field-error">{$errors.amount}</div>
          {/if}
        </div>

        <!-- Category Selection -->
        <div class="form-group">
          <label for="expenseCategory" class="form-label">Category *</label>
          <div class="select-wrapper">
            <select
              id="expenseCategory"
              class="glass-input category-select"
              class:error-state={$errors.category}
              value={$formData.category}
              on:change={handleCategoryChange}
              disabled={!hasCategories}
            >
              {#if hasCategories}
                <option value="OTHER">Choose category</option>
                {#each categories as category}
                  {#if !category.disabled}
                    <option value={category.value}>{category.label}</option>
                  {/if}
                {/each}
              {:else}
                <option value="OTHER">💡 Set up budget first to track by category</option>
              {/if}
            </select>
            <div class="select-arrow">▼</div>
          </div>
          {#if $errors.category}
            <div class="field-error">{$errors.category}</div>
          {/if}
        </div>

        <!-- Date Input -->
        <div class="form-group">
          <label for="expenseDate" class="form-label">Date *</label>
          <input
            type="date"
            id="expenseDate"
            class="glass-input date-input"
            class:error-state={$errors.date}
            bind:value={$formData.date}
            on:change={handleDateChange}
            on:click={(e) => e.target.showPicker?.()}
            on:focus={(e) => e.target.showPicker?.()}
            required
          />
          {#if $errors.date}
            <div class="field-error">{$errors.date}</div>
          {/if}
        </div>

        <!-- Description Input -->
        <div class="form-group">
          <label for="expenseDescription" class="form-label">Notes (Optional)</label>
          <input
            type="text"
            id="expenseDescription"
            class="glass-input"
            class:error-state={$errors.description}
            placeholder="What did you spend on?"
            value={$formData.description}
            on:input={handleDescriptionInput}
          />
          {#if $errors.description}
            <div class="field-error">{$errors.description}</div>
          {/if}
        </div>

        <!-- System Error -->
        {#if $errors.system}
          <div class="system-error-container">
            <div class="system-error field-error show">{$errors.system}</div>
          </div>
        {/if}

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            disabled={!$isFormValid || isSubmitting}
          >
            {#if isSubmitting}
              <span class="loading-spinner"></span>
              Saving...
            {:else}
              Save Expense
            {/if}
          </button>
        </div>
      </form>
    {:else}
      <!-- Success State -->
      <div class="success-container glass-card">
        <div class="success-icon">✅</div>
        <h2>Expense Saved!</h2>
        <p>Your expense has been recorded successfully</p>
        <div class="expense-summary">
          <div class="amount">{formatCurrency(parseCurrencyInput($formData.amount))}</div>
          <div class="category">{formatCategoryName($formData.category)}</div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .add-expense-page {
    min-height: 100vh;
    position: relative;
    padding: 0;
    /* Enhanced glassmorphism background with stronger accents */
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.08) 0%, transparent 40%),
      linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    overflow: hidden;
  }

  .add-expense-page::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.18) 0%, transparent 35%),
      radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.15) 0%, transparent 35%),
      radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.12) 0%, transparent 30%);
    animation: float-accent 20s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  .add-expense-page::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 500px;
    background: radial-gradient(circle,
      rgba(0, 191, 255, 0.2) 0%,
      rgba(30, 144, 255, 0.15) 25%,
      rgba(6, 182, 212, 0.1) 50%,
      transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
    animation: pulse-glow 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  .page-header {
    padding: 20px 0;
    background: transparent;
    position: relative;
    z-index: 2;
    margin-bottom: 20px;
  }

  .header-content {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .close-button {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(203, 213, 225, 0.8);
    color: #6b7280;
    font-size: 1.5rem;
    font-weight: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
    line-height: 1;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .close-button:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--danger-red);
    transform: rotate(90deg);
  }

  .close-button:active {
    transform: rotate(90deg) scale(0.95);
  }

  .expense-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 1rem 2.5rem;
  }

  .glass-card {
    /* Secondary glassmorphism styling */
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  .expense-form {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-method-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .method-tab {
    position: relative;
    padding: 0.875rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.85rem;
    font-weight: 500;
    color: #6b7280;
  }

  .method-tab.active {
    border-color: #00BFFF;
    background: rgba(0, 191, 255, 0.1);
    color: #00BFFF;
    box-shadow: 0 2px 8px rgba(0, 191, 255, 0.15);
  }

  .method-tab.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .method-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .method-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
  }

  .coming-soon-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(251, 191, 36, 0.9);
    color: white;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-label {
    font-weight: 600;
    color: #4a5568;
    font-size: 0.875rem;
  }

  .glass-input {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(203, 213, 225, 0.8);
    color: #1f2937;
    font-size: 0.9375rem;
    transition: all 0.3s ease;
    width: 100%;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .glass-input::placeholder {
    color: #9ca3af;
  }

  .glass-input:focus {
    outline: none;
    border-color: #00BFFF;
    background: rgba(255, 255, 255, 0.75);
    box-shadow:
      0 0 0 3px rgba(0, 191, 255, 0.15),
      0 2px 8px rgba(0, 191, 255, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .glass-input.error-state {
    border-color: var(--danger-red);
    background: rgba(239, 68, 68, 0.05);
  }

  .currency-input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency-prefix {
    position: absolute;
    left: 1rem;
    color: #6b7280;
    font-weight: 500;
    z-index: 1;
    pointer-events: none;
  }

  .currency-input {
    padding-left: 2.75rem;
    text-align: right;
    font-weight: 600;
    color: #0f172a;
  }

  .select-wrapper {
    position: relative;
  }

  .category-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .category-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.4);
  }

  .category-select:focus {
    background: rgba(255, 255, 255, 0.75);
  }

  .select-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    pointer-events: none;
    font-size: 0.8rem;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  .category-select:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
    color: #00BFFF;
  }

  .date-input {
    font-family: inherit;
    color: #1f2937;
  }

  .date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .date-input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }

  .field-error {
    color: var(--danger-red);
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.25rem;
    animation: shake 0.5s ease;
  }

  .system-error-container {
    margin: 0.5rem 0;
  }

  .system-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: var(--danger-red);
    font-weight: 500;
    text-align: center;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .btn-secondary, .btn-primary {
    flex: 1;
    padding: 0.875rem 1.25rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1.5px solid rgba(0, 191, 255, 0.3);
    color: #00BFFF;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 191, 255, 0.5);
    color: #1E90FF;
    transform: translateY(-1px);
    box-shadow:
      0 2px 6px rgba(0, 191, 255, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.9);
  }

  .btn-secondary:active {
    transform: translateY(0);
  }

  .btn-primary {
    /* Vibrant cyan gradient matching FintechButton */
    background: linear-gradient(135deg,
      #00BFFF 0%,
      #1E90FF 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    box-shadow: 0 4px 16px rgba(0, 191, 255, 0.25);
    position: relative;
    overflow: hidden;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg,
      #00A8E8 0%,
      #1873CC 100%);
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 191, 255, 0.35);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(-1px) scale(1.01);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 191, 255, 0.15);
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .success-container {
    padding: 2rem;
    text-align: center;
  }

  .success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .success-container h2 {
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .success-container p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .expense-summary {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    padding: 1rem;
  }

  .expense-summary .amount {
    font-size: 1.5rem;
    font-weight: 600;
    color: #10b981;
    margin-bottom: 0.25rem;
  }

  .expense-summary .category {
    color: #6b7280;
    font-size: 0.9rem;
  }

  /* Animations */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes float-accent {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 1;
    }
    33% {
      transform: translateY(-15px) rotate(120deg);
      opacity: 0.8;
    }
    66% {
      transform: translateY(10px) rotate(240deg);
      opacity: 0.9;
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
      opacity: 0.8;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .page-header {
      padding: 1rem 0 0.5rem 0;
      margin-bottom: 0.75rem;
    }

    .header-content {
      padding: 0 1rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .expense-container {
      padding: 0 1rem 2rem;
    }

    .expense-form {
      padding: 1rem;
      gap: 0.875rem;
    }

    .input-method-section {
      margin-bottom: 0.25rem;
    }

    .method-tab {
      padding: 0.75rem 0.5rem;
    }

    .method-icon {
      font-size: 1.5rem;
    }

    .method-label {
      font-size: 0.75rem;
    }

    .form-group {
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.8125rem;
    }

    .glass-input {
      padding: 0.75rem 0.875rem;
      font-size: 0.9375rem;
    }

    .form-actions {
      flex-direction: column;
      gap: 0.625rem;
      margin-top: 0.5rem;
    }

    .btn-secondary, .btn-primary {
      padding: 0.875rem;
      font-size: 0.9375rem;
    }
  }
</style>