<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { expenseActions } from '../../stores/expenses';
  import { budgetStore, budgetActions } from '../../stores/budget';
  import { authService } from '../../services/authService';
  import { userProfileStore } from '../../stores/auth';
  import { DataService } from '../../services/dataService';
  import { checkBudgetSetup } from '$lib/utils/budgetHelpers';
  import { goto } from '$app/navigation';
  import SmartWarning from './SmartWarning.svelte';
  import SuccessState from './SuccessState.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let isOpen = false;
  export let editingExpense: any = null;
  export let categories: any[] = [];

  // Internal state
  let dataService: DataService | null = null;
  let budgetData: any = null;
  let isSubmitting = false;
  let showSuccessState = false;
  let dailyWarnings = new Map();
  let hasBudgetSetup = false;
  let isLoadingBudget = false;

  // Helper function to get current date
  function getCurrentDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Local state for form fields - Initialize with explicit date
  let dateValue: string = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Form data stores
  const formData = writable({
    amount: '',
    category: 'UNCATEGORIZED',
    description: '',
    date: dateValue
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

  // Reactive variables
  $: isEditMode = !!editingExpense;
  $: hasCategories = categories && categories.length > 0 && !categories.every(cat => cat.disabled);

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

  // Component initialization
  onMount(() => {
    initializeExpenseForm();
  });

  // Watch for form changes to trigger smart validation
  $: if ($formData.amount && $formData.category !== 'UNCATEGORIZED') {
    debounceSmartValidation();
  }

  // Watch for editing expense changes
  $: if (editingExpense && isOpen && isEditMode) {
    populateEditForm(editingExpense);
  }

  // Watch for modal open/close
  $: if (isOpen) {
    if (!isEditMode) {
      resetForm(); // Only reset for new expenses, not edit mode
    }
    loadBudgetData();
  } else {
    resetSuccessState();
  }

  async function initializeExpenseForm() {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        dataService = new DataService(user.uid);
      }

      // Check budget setup status
      userProfileStore.subscribe((profile) => {
        if (profile) {
          hasBudgetSetup = checkBudgetSetup(profile);
        }
      });
    } catch (error) {
      console.error('Error initializing expense form:', error);
    }
  }

  function resetForm() {
    dateValue = getCurrentDate();
    formData.set({
      amount: '',
      category: 'UNCATEGORIZED',
      description: '',
      date: dateValue
    });

    errors.set({
      amount: '',
      category: '',
      description: '',
      date: '',
      system: ''
    });

    smartWarning.set({
      show: false,
      type: '',
      data: {}
    });

    showSuccessState = false;
    isSubmitting = false;
  }

  function resetSuccessState() {
    showSuccessState = false;
  }

  function populateEditForm(expense: any) {
    const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);

    dateValue = expenseDate.toISOString().split('T')[0];
    formData.set({
      amount: formatCurrencyInput(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: dateValue
    });

    errors.set({
      amount: '',
      category: '',
      description: '',
      date: '',
      system: ''
    });
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
    dateValue = target.value;
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

    if (amount <= 0 || category === 'UNCATEGORIZED') {
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
      if (isEditMode && editingExpense) {
        // Update existing expense
        if (dataService) {
          await dataService.updateTransaction(editingExpense.id, expenseData);
        }
        expenseId = editingExpense.id;
        dispatch('expenseUpdated', { id: expenseId, ...expenseData });
      } else {
        // Create new expense
        if (dataService) {
          expenseId = await dataService.createTransaction(expenseData);
        } else {
          expenseId = generateTempId();
        }
        dispatch('expenseCreated', { id: expenseId, ...expenseData });
      }

      // Show success state
      await showSuccessWithData(expenseData, expenseId);

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

  async function showSuccessWithData(expenseData: any, expenseId: string) {
    showSuccessState = true;

    // Wait a bit before allowing form interactions again
    setTimeout(() => {
      // Allow user to add another expense or close
    }, 1000);
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

  function handleAddAnother() {
    showSuccessState = false;
    resetForm();
    // Focus on amount input
    setTimeout(() => {
      const amountInput = document.getElementById('expenseAmount');
      if (amountInput) amountInput.focus();
    }, 100);
  }

  function handleViewDashboard() {
    dispatch('close');
    dispatch('viewDashboard');
  }

  function handleClose() {
    dispatch('close');
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
      'OTHER': 'Lainnya',
      'UNCATEGORIZED': 'Tanpa Kategori'
    };
    return names[category.toUpperCase()] || category;
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

<!-- Modal Backdrop -->
{#if isOpen}
  <div class="modal-backdrop" on:click={handleClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-container glass-card" on:click|stopPropagation>
      {#if !showSuccessState}
        <!-- Form Content -->
        <div class="modal-content" id="modalFormContent">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">
              {isEditMode ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button class="modal-close" on:click={handleClose} aria-label="Close modal">
              &times;
            </button>
          </div>

          <!-- Smart Warning -->
          {#if $smartWarning.show}
            <SmartWarning type={$smartWarning.type} data={$smartWarning.data} />
          {/if}

          <!-- Form -->
          <form class="expense-form" on:submit={handleSubmit}>
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
              <label for="expenseCategory" class="form-label">Category</label>
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
                    <option value="UNCATEGORIZED">Tanpa Kategori</option>
                    {#each categories as category}
                      {#if !category.disabled}
                        <option value={category.value}>{category.label}</option>
                      {/if}
                    {/each}
                  {:else}
                    <option value="UNCATEGORIZED">Tanpa Kategori</option>
                  {/if}
                </select>
                <div class="select-arrow">▼</div>
              </div>
              {#if $errors.category}
                <div class="field-error">{$errors.category}</div>
              {/if}

              <!-- Budget Setup CTA -->
              {#if !hasBudgetSetup}
                <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <span class="text-lg">💡</span>
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-blue-900 mb-1">
                        Setup budget untuk tracking lebih detail!
                      </div>
                      <div class="text-xs text-blue-700 mb-2">
                        Track pengeluaran per kategori dan dapatkan warning otomatis
                      </div>
                      <button
                        type="button"
                        on:click={() => goto('/budget')}
                        class="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                      >
                        Setup Budget Sekarang →
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Description Input -->
            <div class="form-group">
              <label for="expenseDescription" class="form-label">Description</label>
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

            <!-- Date Input -->
            <div class="form-group">
              <label for="expenseDate" class="form-label">Date *</label>
              <input
                type="date"
                id="expenseDate"
                class="glass-input date-input"
                class:error-state={$errors.date}
                bind:value={dateValue}
                on:change={handleDateChange}
                required
              />
              {#if $errors.date}
                <div class="field-error">{$errors.date}</div>
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
              <button type="button" class="btn-secondary" on:click={handleClose}>
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
                  {isEditMode ? 'Update Expense' : 'Save Expense'}
                {/if}
              </button>
            </div>
          </form>
        </div>
      {:else}
        <!-- Success State -->
        <SuccessState
          expenseData={$formData}
          on:addAnother={handleAddAnother}
          on:viewDashboard={handleViewDashboard}
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.3s ease;
  }

  .modal-container {
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 20px;
    /* Secondary glassmorphism styling for modal */
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
    animation: slideUp 0.4s ease;
  }

  .modal-content {
    padding: 0;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .modal-close {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-secondary);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    transform: scale(1.1);
  }

  .expense-form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: #4a5568;
    font-size: 0.95rem;
  }

  .glass-input {
    padding: 0.875rem 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.3s ease;
    width: 100%;
  }

  .glass-input:focus {
    outline: none;
    border-color: var(--primary-accent);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 3px rgba(var(--primary-accent-rgb), 0.1);
  }

  .glass-input.error-state {
    border-color: var(--danger-color);
    background: rgba(244, 67, 54, 0.05);
  }

  .currency-input-group {
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency-prefix {
    position: absolute;
    left: 1rem;
    color: var(--text-secondary);
    font-weight: 500;
    z-index: 1;
    pointer-events: none;
  }

  .currency-input {
    padding-left: 2.75rem;
    text-align: right;
    font-weight: 500;
  }

  .select-wrapper {
    position: relative;
  }

  .category-select {
    appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
  }

  .category-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .select-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
    font-size: 0.8rem;
    transition: transform 0.3s ease;
  }

  .category-select:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
  }

  .date-input {
    font-family: inherit;
  }

  .field-error {
    color: var(--danger-color);
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.25rem;
    animation: shake 0.5s ease;
  }

  .system-error-container {
    margin: 0.5rem 0;
  }

  .system-error {
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    color: var(--danger-color);
    font-weight: 500;
    text-align: center;
  }

  .form-actions {
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
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .btn-primary {
    /* Floating glassmorphism for primary action */
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.85) 0%,
      rgba(30, 144, 255, 0.9) 100%);
    transform: translateY(-3px) scale(1.03);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-width: 100%;
      max-height: 95vh;
    }

    .modal-header {
      padding: 1rem 1rem 0.75rem;
    }

    .modal-title {
      font-size: 1.3rem;
    }

    .expense-form {
      padding: 1rem;
      gap: 1rem;
    }

    .form-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-secondary, .btn-primary {
      padding: 1rem;
    }
  }

  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.25rem;
    }

    .expense-form {
      padding: 0.75rem;
    }

    .currency-input {
      font-size: 1.1rem;
    }
  }

  /* Enhanced focus states for accessibility */
  .modal-close:focus,
  .btn-secondary:focus,
  .btn-primary:focus {
    outline: 2px solid var(--primary-accent);
    outline-offset: 2px;
  }

  /* Glass morphism enhancements */
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
</style>