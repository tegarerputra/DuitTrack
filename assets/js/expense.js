// ========================================
// DuitTrack - Optimized Expense Manager
// Streamlined expense CRUD operations
// ========================================

class ExpenseManager {
  constructor() {
    this.currentExpenses = [];
    this.categories = [];
    this.budgetData = null;
    this.dailyWarnings = new Map(); // Track daily warnings to avoid spam
    this.cache = new Map(); // Unified caching system
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.init();
  }

  async init() {
    console.log('💰 ExpenseManager initialized');
    await this.loadCategories();
    this.setupEventListeners();
    this.setupFieldValidation();
  }

  setupEventListeners() {
    // Add expense card click
    const addExpenseCard = document.getElementById('addExpenseCard');
    if (addExpenseCard) {
      addExpenseCard.addEventListener('click', () => this.openAddExpenseModal());
    }

    // Modal event listeners
    const modal = document.getElementById('addExpenseModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const expenseForm = document.getElementById('expenseForm');

    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeAddExpenseModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeAddExpenseModal());
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAddExpenseModal();
        }
      });
    }

    // Form submission
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
    }

    // Set default date to today with budget period constraints
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate) {
      const today = new Date().toISOString().split('T')[0];
      expenseDate.value = today;
      this.setBudgetPeriodConstraints(expenseDate);
    }

    // Setup dropdown arrow states for category dropdown
    const categoryDropdown = document.getElementById('expenseCategory');
    if (categoryDropdown) {
      this.setupDropdownArrowStates(categoryDropdown);
    }

    // Setup smart validation triggers
    this.setupSmartValidationTriggers();

    // Setup enhanced date picker UX
    this.setupDatePickerEnhancements();

    // Handle reset date changes from Budget
    document.addEventListener('resetDateChanged', (e) => {
      const newResetDate = e.detail.newResetDate;
      console.log('📅 Expense Manager received reset date change:', newResetDate);

      // Update date constraints for expense form
      const expenseDate = document.getElementById('expenseDate');
      if (expenseDate) {
        this.setBudgetPeriodConstraints(expenseDate);
      }
    });
  }

  async openAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
      // Show modal immediately for better perceived performance
      modal.classList.add('active');
      
      // Clear any existing errors and reset form
      this.clearAllErrors();
      this.resetForm();
      
      // Load categories with caching in parallel
      const categoriesPromise = this.loadCategoriesWithCache();
      const setupPromise = this.setupModalDefaults();
      
      // Wait for both to complete
      await Promise.all([categoriesPromise, setupPromise]);
      
      // Update dropdown after categories are loaded
      await this.updateCategoryDropdown();

      // If in edit mode, populate the form with existing data
      if (this.isEditMode && this.editingExpenseData) {
        this.populateEditForm(this.editingExpenseData);
      }

      // Focus on amount input after everything is ready
      this.focusFirstField();
    }
  }

  async loadCategoriesWithCache() {
    const cacheKey = 'categories';
    const cached = this.cache.get(cacheKey);
    
    // Check cache validity
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('📂 Using cached categories');
      this.categories = cached.data;
      return this.categories;
    }

    // Fresh load required
    console.log('📂 Loading fresh categories...');
    await this.loadCategories();
    
    // Update cache
    this.cache.set(cacheKey, {
      data: [...this.categories],
      timestamp: Date.now()
    });
    
    return this.categories;
  }

  async setupModalDefaults() {
    // Set today's date
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate) {
      const today = new Date().toISOString().split('T')[0];
      expenseDate.value = today;

      // Set date constraints based on current budget period
      this.setBudgetPeriodConstraints(expenseDate);
    }

    // Clear smart warnings
    this.clearSmartWarnings();
    
    // Reset success state if it was showing
    const formContent = document.getElementById('modalFormContent');
    const successState = document.getElementById('modalSuccessState');
    
    if (formContent && successState) {
      formContent.style.display = 'block';
      formContent.classList.remove('slide-out');
      formContent.style.transform = 'translateX(0)';
      
      successState.style.display = 'none';
      successState.classList.remove('slide-in');
    }
  }

  focusFirstField() {
    setTimeout(() => {
      const amountInput = document.getElementById('expenseAmount');
      if (amountInput) {
        amountInput.focus();
      }
    }, 150); // Small delay to ensure modal is fully rendered
  }

  closeAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
      modal.classList.remove('active');
      this.resetForm();
      this.resetEditMode(); // Reset edit mode when closing
    }
  }

  resetForm() {
    const form = document.getElementById('expenseForm');
    if (form) {
      form.reset();
      // Set default date and constraints again
      const expenseDate = document.getElementById('expenseDate');
      if (expenseDate) {
        const today = new Date().toISOString().split('T')[0];
        expenseDate.value = today;
        this.setBudgetPeriodConstraints(expenseDate);
      }

      // Clear all error states and smart warnings
      this.clearAllErrors();
      this.clearSmartWarnings();
    }
  }

  // ========================================
  // 🔄 DROPDOWN ARROW STATES MANAGEMENT
  // ========================================

  setupDropdownArrowStates(selectElement) {
    let isOpen = false;

    // Handle focus (dropdown opening)
    selectElement.addEventListener('focus', () => {
      isOpen = true;
      selectElement.classList.add('dropdown-open');
    });

    // Handle blur (dropdown closing)
    selectElement.addEventListener('blur', () => {
      isOpen = false;
      selectElement.classList.remove('dropdown-open');
    });

    // Handle change (option selected) - auto blur for better UX
    selectElement.addEventListener('change', () => {
      // Auto-blur after selection for cleaner visual feedback
      setTimeout(() => {
        selectElement.blur(); // This will trigger the blur event above
        isOpen = false;
        selectElement.classList.remove('dropdown-open');
      }, 50); // Short delay to ensure change event completes
    });

    // Handle mousedown on select (opening dropdown)
    selectElement.addEventListener('mousedown', () => {
      if (!isOpen) {
        selectElement.classList.add('dropdown-open');
      }
    });
  }

  // ========================================
  // 📅 SIMPLIFIED DATE PICKER SETUP
  // ========================================

  setupDatePickerEnhancements() {
    const dateInput = document.getElementById('expenseDate');
    if (!dateInput) return;

    // Basic date validation on input
    dateInput.addEventListener('input', (e) => {
      this.clearFieldError(dateInput);
      if (e.target.value && e.target.value.length >= 10) {
        this.validateDateInput(e.target.value);
      }
    });

    // Validate on blur
    dateInput.addEventListener('blur', () => {
      if (dateInput.value) {
        this.validateDateInput(dateInput.value);
      }
    });

    // Enable showPicker if supported (modern browsers)
    if (dateInput.showPicker) {
      dateInput.addEventListener('click', () => {
        try {
          dateInput.showPicker();
        } catch (error) {
          // Fallback to native behavior
        }
      });
    }
  }

  validateDateInput(dateValue) {
    const date = new Date(dateValue);
    const today = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      this.showFieldError(document.getElementById('expenseDate'), '📅 Please enter a valid date');
      return false;
    }

    // Check if date is within current budget period (if budget periods are configured)
    if (window.budgetDateUtils && window.DashboardManager?.userResetDate) {
      const currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(window.DashboardManager.userResetDate);
      if (!window.budgetDateUtils.isDateInPeriod(date, currentPeriodId)) {
        const periodDetails = window.budgetDateUtils.getPeriodDetails(currentPeriodId);
        const startDate = periodDetails.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const endDate = periodDetails.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        this.showFieldError(document.getElementById('expenseDate'), `📅 Date must be within current budget period: ${startDate} - ${endDate}`);
        return false;
      }
    }

    // Check if date is not too far in the future (more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (date > oneYearFromNow) {
      this.showFieldError(document.getElementById('expenseDate'), '📅 Date cannot be more than 1 year in the future');
      return false;
    }

    return true;
  }

  setBudgetPeriodConstraints(dateInput) {
    if (!window.budgetDateUtils || !window.DashboardManager?.userResetDate) return;

    try {
      const currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(window.DashboardManager.userResetDate);
      const periodDetails = window.budgetDateUtils.getPeriodDetails(currentPeriodId);

      // Set min and max dates based on current budget period
      const minDate = periodDetails.start.toISOString().split('T')[0];
      const maxDate = periodDetails.end.toISOString().split('T')[0];

      dateInput.setAttribute('min', minDate);
      dateInput.setAttribute('max', maxDate);

      console.log('📅 Expense date constraints set:', { minDate, maxDate, periodId: currentPeriodId });
    } catch (error) {
      console.warn('⚠️ Could not set budget period constraints:', error);
    }
  }

  // ========================================
  // 🧠 SMART VALIDATION SYSTEM
  // ========================================

  setupSmartValidationTriggers() {
    const amountInput = document.getElementById('expenseAmount');
    const categorySelect = document.getElementById('expenseCategory');

    // Debounced smart validation trigger
    let validationTimeout;

    const triggerSmartValidation = () => {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => {
        this.checkSmartValidation();
      }, 200); // Small debounce for smooth UX
    };

    // Trigger validation when amount changes (after category selected)
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        if (categorySelect && categorySelect.value !== 'OTHER') {
          triggerSmartValidation();
        }
      });
    }

    // Trigger validation when category changes (if amount filled)
    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        if (amountInput && amountInput.value.trim()) {
          triggerSmartValidation();
        }
      });
    }

    console.log('✅ Smart validation triggers setup complete');
  }

  async checkSmartValidation() {
    const amountInput = document.getElementById('expenseAmount');
    const categorySelect = document.getElementById('expenseCategory');

    if (!amountInput || !categorySelect) return;

    const amount = this.parseCurrencyInput(amountInput.value);
    const category = categorySelect.value;

    // Clear warnings when context changes
    if (amount <= 0 || category === 'OTHER') {
      this.clearSmartWarnings();
      return;
    }

    // Load budget data if not cached
    if (!this.budgetData) {
      await this.loadBudgetData();
    }

    // Check if budget exists for this category
    if (this.budgetData && this.budgetData.categories && this.budgetData.categories[category.toLowerCase()]) {
      await this.evaluateBudgetWarning(amount, category);
    } else {
      this.clearSmartWarnings(); // No budget data = no warnings
    }
  }

  async loadBudgetData() {
    try {
      if (!window.auth?.currentUser) {
        this.budgetData = null;
        return;
      }

      console.log('🧠 Loading budget data for smart validation...');
      const currentPeriodId = window.DashboardManager?.currentPeriodId ||
                              (window.budgetDateUtils?.getCurrentPeriodId(window.DashboardManager?.userResetDate || 1)) ||
                              this.getCurrentMonth();
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(currentPeriodId);
      const budgetDoc = await budgetRef.get();

      if (budgetDoc.exists) {
        this.budgetData = budgetDoc.data();
        console.log('✅ Budget data loaded for smart validation:', Object.keys(this.budgetData.categories || {}));
      } else {
        this.budgetData = null;
        console.log('ℹ️ No budget data found for smart validation');
      }
    } catch (error) {
      console.error('❌ Error loading budget data for smart validation:', error);
      this.budgetData = null;
    }
  }

  async evaluateBudgetWarning(amount, category) {
    const categoryData = this.budgetData.categories[category.toLowerCase()];
    if (!categoryData) return;

    const currentSpent = categoryData.spent || 0;
    const budget = categoryData.budget || 0;
    const newTotal = currentSpent + amount;
    const percentage = budget > 0 ? (newTotal / budget) * 100 : 0;

    // Check if we should show warning (first time per day per category+threshold)
    const warningKey = `${category.toLowerCase()}_${Math.floor(percentage / 10) * 10}`; // Round to nearest 10%
    const today = new Date().toDateString();
    const lastWarning = this.dailyWarnings.get(warningKey);

    // Skip if already warned today for this category+threshold
    if (lastWarning === today) {
      return;
    }

    let shouldWarn = false;
    let warningType = '';
    let warningData = {};

    if (percentage >= 100) {
      // Over budget warning
      shouldWarn = true;
      warningType = 'exceeded';
      warningData = {
        category: this.formatCategoryName(category),
        overage: this.formatRupiah(newTotal - budget),
        newTotal: this.formatRupiah(newTotal),
        budget: this.formatRupiah(budget),
        percentage: Math.round(percentage)
      };
    } else if (percentage >= 80) {
      // Approaching budget warning
      shouldWarn = true;
      warningType = 'caution';
      warningData = {
        category: this.formatCategoryName(category),
        percentage: Math.round(percentage),
        remaining: this.formatRupiah(budget - newTotal)
      };
    }

    if (shouldWarn) {
      this.showSmartWarning(warningType, warningData);
      // Mark as warned for today
      this.dailyWarnings.set(warningKey, today);
    } else {
      this.clearSmartWarnings();
    }
  }

  showSmartWarning(type, data) {
    const container = document.getElementById('smartWarningContainer');
    if (!container) return;

    let warningHTML = '';

    if (type === 'exceeded') {
      warningHTML = `
        <div class="smart-warning warning-exceeded">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h4>Budget Alert!</h4>
            <p><strong>${data.category}</strong> budget akan terlampaui <strong>${data.overage}</strong></p>
            <p class="warning-details">${data.newTotal} dari budget ${data.budget} (${data.percentage}%)</p>
          </div>
        </div>
      `;
    } else if (type === 'caution') {
      warningHTML = `
        <div class="smart-warning warning-caution">
          <div class="warning-icon">💡</div>
          <div class="warning-content">
            <h4>Budget Update</h4>
            <p><strong>${data.category}</strong> akan mencapai ${data.percentage}% dari budget</p>
            <p class="warning-details">Sisa budget: <strong>${data.remaining}</strong></p>
          </div>
        </div>
      `;
    }

    container.innerHTML = warningHTML;
    container.style.display = 'block';
    console.log(`💡 Smart warning shown: ${type} for ${data.category}`);
  }

  clearSmartWarnings() {
    const container = document.getElementById('smartWarningContainer');
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  }

  async handleExpenseSubmit(e) {
    e.preventDefault();
    
    try {
      // Check if user is authenticated
      if (!window.auth?.currentUser) {
        throw new Error('Please sign in to add expenses');
      }

      // Get form data
      const formData = this.getFormData();
      
      // Validate form data using new system
      if (!this.validateExpenseData(formData)) {
        return;
      }

      // Show loading state
      this.setSubmitButtonLoading(true);

      let expenseId;
      if (this.isEditMode) {
        // Update existing expense
        expenseId = await this.handleExpenseUpdate(formData);
        await this.showSuccessState(formData, expenseId, 'updated');
      } else {
        // Create new expense
        expenseId = await this.createExpense(formData);
        await this.showSuccessState(formData, expenseId, 'created');
      }
      
      // Trigger dashboard refresh (happens in background)
      document.dispatchEvent(new CustomEvent('expenseAdded'));

      // Refresh Expenses if we're in edit mode
      if (this.isEditMode) {
        await this.loadExpenses();
      }

      console.log(`✅ Expense ${this.isEditMode ? 'updated' : 'created'} with ID:`, expenseId);

    } catch (error) {
      console.error('❌ Error creating expense:', error);
      // System-level error handling
      if (error.code === 'permission-denied') {
        this.showSystemError('Unable to save expense. Please try signing in again');
      } else if (error.message?.includes('network')) {
        this.showSystemError('Something went wrong saving your expense: Network error');
      } else {
        this.showSystemError('Oops! Something went wrong. Please try again!');
      }
    } finally {
      this.setSubmitButtonLoading(false);
    }
  }

  getFormData() {
    const amountInput = document.getElementById('expenseAmount');
    const categorySelect = document.getElementById('expenseCategory');
    const descriptionInput = document.getElementById('expenseDescription');
    const dateInput = document.getElementById('expenseDate');

    // Parse currency input (remove dots, convert to number)
    const amount = this.parseCurrencyInput(amountInput.value);
    const category = categorySelect.value || 'OTHER'; // Auto fallback to OTHER
    const description = descriptionInput.value.trim() || '';
    const date = dateInput.value;

    return {
      amount,
      category,
      description,
      date
    };
  }

  async createExpense(expenseData) {
    try {
      // Use FirebaseUtils to create expense
      if (!window.FirebaseUtils) {
        throw new Error('Firebase not properly initialized');
      }

      const expenseDoc = {
        amount: expenseData.amount,
        category: expenseData.category.toUpperCase(),
        description: expenseData.description,
        date: expenseData.date,
        month: this.getExpenseMonth(expenseData.date), // Support both period ID and YYYY-MM format
        createdAt: new Date().toISOString()
      };

      const expenseId = await window.FirebaseUtils.createExpense(expenseDoc);
      
      // Update budget tracking - use appropriate period format
      const budgetPeriod = this.getExpenseMonth(expenseDoc.date);
      await window.FirebaseUtils.updateBudgetSpent(
        budgetPeriod,
        expenseDoc.category.toLowerCase(),
        expenseDoc.amount,
        'add'
      );

      return expenseId;

    } catch (error) {
      console.error('Error in createExpense:', error);
      throw error;
    }
  }


  getCategoryIcon(category) {
    // Use CategoryService for dynamic icon mapping
    if (window.categoryService) {
      return window.categoryService.getCategoryIcon(category);
    }
    
    // Fallback to default icon if service not loaded
    return '💰';
  }

  formatCategoryName(category) {
    const names = {
      'FOOD': 'Makanan',
      'SNACK': 'Jajan',
      'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan'
    };
    return names[category.toUpperCase()] || category;
  }

  formatRupiah(amount) {
    if (amount === null || amount === undefined) return 'Rp 0';
    
    // Use Indonesian number formatting with dot as thousand separator
    const formatted = Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }

  setSubmitButtonLoading(loading) {
    const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Expense';
      }
    }
  }

  showSuccessMessage(message) {
    // Simple success feedback - you can enhance this with toast notifications
    console.log('✅', message);
  }

  // ========================================
  // 🎯 SIMPLIFIED ERROR HANDLING
  // ========================================

  showFieldError(input, message) {
    input.classList.add('error-state');
    const errorContainer = this.getOrCreateErrorContainer(input);
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }

  clearFieldError(input) {
    input.classList.remove('error-state');
    const errorContainer = document.getElementById(input.id + '-error');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }

  showSystemError(message) {
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      // Remove any existing error
      const existing = formActions.parentNode.querySelector('.system-error-container');
      if (existing) existing.remove();
      
      const errorContainer = document.createElement('div');
      errorContainer.className = 'system-error-container';
      errorContainer.innerHTML = `<div class="system-error field-error show">${message}</div>`;
      formActions.parentNode.appendChild(errorContainer);
      
      setTimeout(() => errorContainer.remove(), 8000);
    }
  }

  getOrCreateErrorContainer(input) {
    let errorContainer = document.getElementById(input.id + '-error');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'field-error';
      errorContainer.id = input.id + '-error';
      
      const currencyGroup = input.closest('.currency-input-group');
      if (currencyGroup) {
        currencyGroup.parentNode.insertBefore(errorContainer, currencyGroup.nextSibling);
      } else {
        input.parentNode.insertBefore(errorContainer, input.nextSibling);
      }
    }
    return errorContainer;
  }

  clearAllErrors() {
    document.querySelectorAll('.glass-input.error-state').forEach(input => this.clearFieldError(input));
    document.querySelectorAll('.system-error-container').forEach(container => container.remove());
  }

  // ========================================
  // 💰 CURRENCY FORMATTING SYSTEM
  // ========================================

  setupCurrencyFormatting() {
    const amountInput = document.getElementById('expenseAmount');
    if (amountInput) {
      amountInput.addEventListener('input', (e) => {
        this.formatCurrencyInput(e.target);
      });

      // Handle paste events
      amountInput.addEventListener('paste', (e) => {
        setTimeout(() => this.formatCurrencyInput(e.target), 0);
      });
    }
  }

  formatCurrencyInput(input) {
    // Get cursor position
    const cursorPosition = input.selectionStart;
    const oldLength = input.value.length;

    // Clean input: remove all non-digits
    const cleanValue = input.value.replace(/[^\d]/g, '');
    
    // Format with dots as thousand separators
    const formattedValue = this.addThousandSeparators(cleanValue);
    
    // Update input value
    input.value = formattedValue;

    // Restore cursor position (account for added dots)
    const newLength = formattedValue.length;
    const lengthDiff = newLength - oldLength;
    const newCursorPosition = cursorPosition + lengthDiff;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  addThousandSeparators(value) {
    if (!value) return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  parseCurrencyInput(formattedValue) {
    return parseInt(formattedValue.replace(/\./g, '') || '0', 10);
  }

  // ========================================
  // 📂 CATEGORY LOADING SYSTEM
  // ========================================

  async loadCategories() {
    try {
      if (!window.auth?.currentUser) {
        // Use default categories if no user
        this.categories = [
          { value: 'OTHER', label: 'Other (default)', isDefault: true }
        ];
        return;
      }

      // Load budget categories from Firestore using current budget period
      const currentPeriodId = window.DashboardManager?.currentPeriodId ||
                              (window.budgetDateUtils?.getCurrentPeriodId(window.DashboardManager?.userResetDate || 1)) ||
                              this.getCurrentMonth();
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(currentPeriodId);
      const budgetDoc = await budgetRef.get();

      if (budgetDoc.exists && budgetDoc.data().categories) {
        const budgetCategories = budgetDoc.data().categories;
        this.categories = Object.keys(budgetCategories).map(key => ({
          value: key.toUpperCase(),
          label: `${this.getCategoryIcon(key)} ${this.formatCategoryName(key)}`,
          isDefault: false
        }));

        // OTHER option will be handled at UI level only - no need to add to categories array
      } else {
        // No budget setup - show helpful message to encourage budget setup
        this.categories = [
          { 
            value: 'OTHER', 
            label: '💡 Set up budget first to track by category',
            isDefault: true,
            disabled: true 
          }
        ];
      }

      console.log('📂 Categories loaded:', this.categories.length);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Fallback to default
      this.categories = [
        { value: 'OTHER', label: 'Other (default)', isDefault: true }
      ];
    }
  }

  async updateCategoryDropdown() {
    const categorySelect = document.getElementById('expenseCategory');
    if (!categorySelect) return;

    // Clear existing options
    categorySelect.innerHTML = '';

    if (this.categories.length === 1 && this.categories[0].disabled) {
      // No budget setup case
      const option = document.createElement('option');
      option.value = 'OTHER';
      option.textContent = this.categories[0].label;
      option.selected = true;
      categorySelect.appendChild(option);
      categorySelect.disabled = true;
    } else {
      // Normal case with categories
      categorySelect.disabled = false;
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = 'OTHER';
      defaultOption.textContent = 'Choose category';
      defaultOption.selected = true;
      categorySelect.appendChild(defaultOption);

      // Add budget categories
      this.categories.forEach(category => {
        if (!category.disabled) {
          const option = document.createElement('option');
          option.value = category.value;
          option.textContent = category.label;
          categorySelect.appendChild(option);
        }
      });
    }
  }

  // ========================================
  // 🎯 FIELD VALIDATION SYSTEM
  // ========================================

  setupFieldValidation() {
    // Setup currency formatting
    this.setupCurrencyFormatting();

    // Clear errors on input for better UX
    const inputs = ['expenseAmount', 'expenseDate'];
    inputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          this.clearFieldError(input);
        });
      }
    });
  }

  validateExpenseData(data) {
    let hasErrors = false;

    // Clear all previous errors
    this.clearAllErrors();

    // Validate amount
    const amountInput = document.getElementById('expenseAmount');
    if (!data.amount || data.amount <= 0) {
      this.showFieldError(amountInput, "Don't leave me empty! I need an amount!");
      hasErrors = true;
    } else if (data.amount > 999999999) {
      this.showFieldError(amountInput, "Whoa there, millionaire! Max Rp 999,999,999 please!");
      hasErrors = true;
    }

    // Validate date
    const dateInput = document.getElementById('expenseDate');
    if (!data.date) {
      this.showFieldError(dateInput, "Don't leave me empty! I need a date!");
      hasErrors = true;
    } else {
      // Use the enhanced date validation
      if (!this.validateDateInput(data.date)) {
        hasErrors = true;
      }
    }

    // Form-level validation removed - field-level errors are sufficient

    // Focus first error field if any
    if (hasErrors) {
      this.focusFirstErrorField();
    }

    return !hasErrors;
  }

  focusFirstErrorField() {
    const firstErrorField = document.querySelector('.glass-input.error-state');
    if (!firstErrorField) return;

    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Mobile: Gentle scroll + highlight (no keyboard popup)
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorField.classList.add('error-focus-highlight');
      setTimeout(() => {
        firstErrorField.classList.remove('error-focus-highlight');
      }, 2000);
    } else {
      // Desktop: Traditional focus + scroll
      firstErrorField.focus();
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ========================================
  // 🎊 TOAST NOTIFICATION SYSTEM  
  // ========================================

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    // Add to toast container or create one
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    toastContainer.appendChild(toast);

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getCurrentBudgetPeriod() {
    // Get current budget period based on dashboard settings
    if (window.DashboardManager?.currentPeriodId) {
      return window.DashboardManager.currentPeriodId;
    }

    // Fallback using budget date utils
    if (window.budgetDateUtils && window.DashboardManager?.userResetDate) {
      return window.budgetDateUtils.getCurrentPeriodId(window.DashboardManager.userResetDate);
    }

    // Final fallback to calendar month
    return this.getCurrentMonth();
  }

  getExpenseMonth(expenseDate) {
    // If budget periods are configured, use current period ID
    if (window.budgetDateUtils && window.DashboardManager?.userResetDate) {
      const date = new Date(expenseDate);
      const userResetDate = window.DashboardManager.userResetDate;

      // Determine which budget period this expense belongs to
      const currentDay = date.getDate();
      const currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(userResetDate);

      // Check if the expense date falls in the current period
      if (window.budgetDateUtils.isDateInPeriod(date, currentPeriodId)) {
        return currentPeriodId; // Return period ID format
      }

      // If not current period, calculate the appropriate period
      if (currentDay < userResetDate) {
        // Previous period
        const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, userResetDate);
        return window.budgetDateUtils.formatPeriodId(prevMonth);
      } else {
        // Current period starting from reset date
        const currentPeriod = new Date(date.getFullYear(), date.getMonth(), userResetDate);
        return window.budgetDateUtils.formatPeriodId(currentPeriod);
      }
    }

    // Fallback to YYYY-MM format
    return expenseDate.substring(0, 7);
  }

  showErrorMessage(message) {
    this.showSystemError(message);
    console.error('❌', message);
  }

  showSuccessMessage(message) {
    this.showToast(message, 'success');
    console.log('✅', message);
  }

  // ========================================
  // ✨ PROGRESSIVE SUCCESS STATE SYSTEM
  // ========================================

  async showSuccessState(expenseData, expenseId, action = 'created') {
    try {
      const formContent = document.getElementById('modalFormContent');
      const successState = document.getElementById('modalSuccessState');

      if (!formContent || !successState) {
        console.error('Modal elements not found, falling back to toast');
        const message = action === 'updated' ? 'Expense updated successfully! ✏️' : 'Expense added successfully! 💰';
        this.showSuccessMessage(message);
        this.closeAddExpenseModal();
        return;
      }

      // Populate success data
      await this.populateSuccessData(expenseData);
      
      // Smooth transition from form to success state
      formContent.classList.add('slide-out');
      
      setTimeout(() => {
        formContent.style.display = 'none';
        successState.style.display = 'block';
        successState.classList.add('slide-in');
        
        // Setup action buttons
        this.setupSuccessActions();
      }, 400); // Match CSS transition duration

      console.log('✨ Progressive success state shown');
      
    } catch (error) {
      console.error('❌ Error showing success state:', error);
      // Fallback to old behavior
      this.showSuccessMessage('Expense added successfully! 💰');
      this.closeAddExpenseModal();
    }
  }

  async populateSuccessData(expenseData) {
    // Update expense preview
    const successAmount = document.getElementById('successAmount');
    const successCategory = document.getElementById('successCategory');
    const successDate = document.getElementById('successDate');

    if (successAmount) {
      successAmount.textContent = this.formatRupiah(expenseData.amount);
    }

    if (successCategory) {
      const categoryIcon = this.getCategoryIcon(expenseData.category);
      const categoryName = this.formatCategoryName(expenseData.category);
      successCategory.textContent = `${categoryIcon} ${categoryName}`;
    }

    if (successDate) {
      successDate.textContent = this.formatRelativeDate(expenseData.date);
    }

    // Update budget information if available
    await this.updateSuccessBudgetInfo(expenseData);
  }

  async updateSuccessBudgetInfo(expenseData) {
    const budgetUpdate = document.getElementById('successBudgetUpdate');
    const budgetUpdateText = document.getElementById('budgetUpdateText');
    const miniProgressFill = document.getElementById('miniProgressFill');

    if (!budgetUpdate || !budgetUpdateText || !miniProgressFill) return;

    try {
      // Load fresh budget data to get updated spent amounts
      await this.loadBudgetData();
      
      if (this.budgetData && this.budgetData.categories) {
        const categoryData = this.budgetData.categories[expenseData.category.toLowerCase()];
        
        if (categoryData) {
          const spent = categoryData.spent || 0;
          const budget = categoryData.budget || 0;
          const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
          
          const categoryName = this.formatCategoryName(expenseData.category);
          budgetUpdateText.innerHTML = `
            <strong>${categoryName}</strong> budget: ${this.formatRupiah(spent)} / ${this.formatRupiah(budget)} (${Math.round(percentage)}%)
          `;
          
          miniProgressFill.style.width = `${percentage}%`;
          budgetUpdate.style.display = 'block';
          
          console.log('💡 Success budget info updated:', {spent, budget, percentage});
        }
      } else {
        budgetUpdate.style.display = 'none';
      }
    } catch (error) {
      console.error('❌ Error updating success budget info:', error);
      budgetUpdate.style.display = 'none';
    }
  }

  setupSuccessActions() {
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    const viewDashboardBtn = document.getElementById('viewDashboardBtn');

    // Add Another button
    if (addAnotherBtn) {
      addAnotherBtn.replaceWith(addAnotherBtn.cloneNode(true)); // Remove existing listeners
      const newAddAnotherBtn = document.getElementById('addAnotherBtn');
      
      newAddAnotherBtn.addEventListener('click', () => {
        this.resetEditMode(); // Reset edit mode first
        this.resetToFormState();
        this.resetForm();
        this.clearSmartWarnings();
        console.log('🔄 Resetting to form for another expense');
      });
    }

    // View Dashboard button
    if (viewDashboardBtn) {
      viewDashboardBtn.replaceWith(viewDashboardBtn.cloneNode(true)); // Remove existing listeners
      const newViewDashboardBtn = document.getElementById('viewDashboardBtn');
      
      newViewDashboardBtn.addEventListener('click', () => {
        this.closeAddExpenseModal();
        console.log('📊 Viewing dashboard after expense added');
      });
    }
  }

  resetToFormState() {
    const formContent = document.getElementById('modalFormContent');
    const successState = document.getElementById('modalSuccessState');

    if (formContent && successState) {
      // Reverse the transition
      successState.classList.remove('slide-in');
      successState.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        successState.style.display = 'none';
        formContent.style.display = 'block';
        formContent.classList.remove('slide-out');
        formContent.style.transform = 'translateX(0)';
        
        // Focus on amount input for quick entry
        setTimeout(() => {
          const amountInput = document.getElementById('expenseAmount');
          if (amountInput) {
            amountInput.focus();
          }
        }, 100);
      }, 300);
    }
  }

  // Cache management
  invalidateCache() {
    this.cache.clear();
    this.budgetData = null;
    console.log('🚀 Cache invalidated');
  }

  async refreshCategories() {
    this.invalidateCache();
    await this.loadCategoriesWithCache();
    await this.updateCategoryDropdown();
  }

  // ========================================
  // 💫 MONEY MOVES PAGE FUNCTIONALITY
  // ========================================

  async loadExpenses(periodId = null) {
    try {
      console.log('💸 Loading Expenses page...');
      console.log('🔍 DEBUG - Auth status:', {
        authExists: !!window.auth,
        currentUser: !!window.auth?.currentUser,
        userEmail: window.auth?.currentUser?.email
      });

      if (!window.auth?.currentUser) {
        console.warn('⚠️ No authenticated user found');
        this.showEmptyExpensesState();
        return;
      }

      // Use budget period system instead of calendar months
      const targetPeriod = periodId || this.getCurrentBudgetPeriod();
      console.log('📅 Loading expenses for period:', targetPeriod);
      
      // Show loading state
      this.showExpensesLoading();
      
      // Load expenses from Firestore
      console.log('🔍 DEBUG - Getting expenses reference...');
      const expensesRef = window.FirebaseUtils.getUserExpensesRef();
      console.log('🔍 DEBUG - Querying Firestore for period:', targetPeriod);

      // Try period ID first, then fallback to YYYY-MM format
      let snapshot = await expensesRef
        .where('month', '==', targetPeriod)
        .get();

      // If no results and period looks like YYYY-MM-DD, try YYYY-MM format
      if (snapshot.empty && targetPeriod.length > 7) {
        const monthFormat = targetPeriod.substring(0, 7); // Extract YYYY-MM
        console.log(`🔍 No data found for period ${targetPeriod}, trying month format ${monthFormat}`);
        snapshot = await expensesRef
          .where('month', '==', monthFormat)
          .get();
      }
        
      console.log('🔍 DEBUG - Firestore query completed:', {
        empty: snapshot.empty,
        size: snapshot.size
      });
        
      this.currentExpenses = [];
      snapshot.forEach(doc => {
        this.currentExpenses.push({ id: doc.id, ...doc.data() });
      });

      // Sort by date (newest first)
      this.currentExpenses.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });

      console.log(`✅ Loaded ${this.currentExpenses.length} expenses`);
      console.log('🔍 DEBUG - Expenses data:', this.currentExpenses);
      
      // Update UI
      this.updateExpensesTimeline();
      this.setupPeriodSelector(targetPeriod);
      this.setupEmptyStateActions();
      
    } catch (error) {
      console.error('❌ Error loading expenses:', error);
      this.showExpensesError(error.message);
    }
  }

  updateExpensesTimeline() {
    console.log('🔍 DEBUG - updateExpensesTimeline called');
    console.log('🔍 DEBUG - currentExpenses.length:', this.currentExpenses.length);
    
    const timeline = document.getElementById('expensesTimeline');
    const loading = document.getElementById('expensesLoading');
    const empty = document.getElementById('expensesEmpty');
    
    console.log('🔍 DEBUG - DOM elements found:', {
      timeline: !!timeline,
      loading: !!loading,
      empty: !!empty
    });
    
    if (!timeline) return;
    
    // Hide loading
    if (loading) loading.style.display = 'none';
    
    if (this.currentExpenses.length === 0) {
      console.log('🔍 DEBUG - No expenses found, showing empty state');
      timeline.innerHTML = '';
      if (empty) {
        empty.style.display = 'block';
        console.log('🔍 DEBUG - Empty state shown');
      }
      return;
    }
    
    console.log('🔍 DEBUG - Expenses found, hiding empty state and rendering timeline');
    
    // Hide empty state
    if (empty) empty.style.display = 'none';
    
    // Group expenses by date
    const groupedExpenses = this.groupExpensesByDate(this.currentExpenses);
    
    // Render timeline
    timeline.innerHTML = this.renderExpensesTimeline(groupedExpenses);
  }

  groupExpensesByDate(expenses) {
    const groups = {};
    
    expenses.forEach(expense => {
      const date = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          expenses: [],
          total: 0
        };
      }
      
      groups[dateKey].expenses.push(expense);
      groups[dateKey].total += expense.amount;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }

  renderExpensesTimeline(groupedExpenses) {
    return groupedExpenses.map(group => `
      <div class="expense-date-group glass-card">
        <div class="date-header">
          <div class="date-info">
            <h3 class="expense-date">${this.formatTimelineDate(group.date)}</h3>
            <div class="date-total">${this.formatRupiah(group.total)}</div>
          </div>
        </div>
        <div class="expenses-list">
          ${group.expenses.map(expense => this.renderExpenseItem(expense)).join('')}
        </div>
      </div>
    `).join('');
  }

  renderExpenseItem(expense) {
    return `
      <div class="expense-timeline-item" data-expense-id="${expense.id}">
        <div class="expense-icon">${this.getCategoryIcon(expense.category)}</div>
        <div class="expense-details">
          <div class="expense-description">${expense.description || 'No description'}</div>
          <div class="expense-category">${this.formatCategoryName(expense.category)}</div>
        </div>
        <div class="expense-amount">${this.formatRupiah(expense.amount)}</div>
        <div class="expense-actions">
          <button class="expense-action-btn edit-btn" onclick="window.ExpenseManager.editExpense('${expense.id}')" title="Edit expense">
            ✏️
          </button>
          <button class="expense-action-btn delete-btn" onclick="window.ExpenseManager.deleteExpense('${expense.id}')" title="Delete expense">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  formatTimelineDate(date) {
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

  setupPeriodSelector(selectedPeriod) {
    const periodSelector = document.getElementById('expenseMonthSelector');
    if (!periodSelector) return;

    // Clear existing options
    periodSelector.innerHTML = '';

    // Generate budget periods
    const periods = this.generatePeriodOptions();

    periods.forEach(period => {
      const option = document.createElement('option');
      option.value = period.id;
      option.textContent = period.displayName;
      option.selected = period.id === selectedPeriod;
      periodSelector.appendChild(option);
    });

    // Setup change event (remove existing listeners first)
    const newSelector = periodSelector.cloneNode(true);
    periodSelector.parentNode.replaceChild(newSelector, periodSelector);

    newSelector.addEventListener('change', (e) => {
      this.loadExpenses(e.target.value);
    });
  }

  generatePeriodOptions() {
    // Use budget periods if available, otherwise fallback to months
    if (window.budgetDateUtils && window.DashboardManager?.userResetDate) {
      return window.budgetDateUtils.getAvailablePeriods(window.DashboardManager.userResetDate, 12);
    }

    // Fallback to calendar months
    const months = [];
    const current = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const displayName = monthDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
      });

      months.push({
        id: monthStr,
        displayName: displayName,
        isCurrent: i === 0
      });
    }

    return months;
  }

  showExpensesLoading() {
    const timeline = document.getElementById('expensesTimeline');
    const loading = document.getElementById('expensesLoading');
    const empty = document.getElementById('expensesEmpty');
    
    if (timeline) timeline.innerHTML = '';
    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';
  }

  showEmptyExpensesState() {
    const timeline = document.getElementById('expensesTimeline');
    const loading = document.getElementById('expensesLoading');
    const empty = document.getElementById('expensesEmpty');
    
    if (timeline) timeline.innerHTML = '';
    if (loading) loading.style.display = 'none';
    if (empty) empty.style.display = 'block';
  }

  showExpensesError(message) {
    const timeline = document.getElementById('expensesTimeline');
    const loading = document.getElementById('expensesLoading');
    const empty = document.getElementById('expensesEmpty');
    
    if (loading) loading.style.display = 'none';
    if (empty) empty.style.display = 'none';
    
    if (timeline) {
      timeline.innerHTML = `
        <div class="expenses-error glass-card">
          <div class="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>${message}</p>
          <button class="btn-primary" onclick="window.ExpenseManager.loadExpenses()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  setupEmptyStateActions() {
    const addFirstExpenseBtn = document.getElementById('addFirstExpense');
    if (addFirstExpenseBtn) {
      addFirstExpenseBtn.addEventListener('click', () => {
        this.openAddExpenseModal();
      });
    }
  }

  // ========================================
  // ✏️ EDIT EXPENSE FUNCTIONALITY
  // ========================================

  async editExpense(expenseId) {
    try {
      console.log('✏️ Editing expense:', expenseId);

      // Find the expense in current data
      const expense = this.currentExpenses.find(exp => exp.id === expenseId);
      if (!expense) {
        console.error('Expense not found:', expenseId);
        return;
      }

      // Set edit mode flag BEFORE opening modal
      this.isEditMode = true;
      this.editingExpenseId = expenseId;
      this.editingExpenseData = expense; // Store the expense data

      // Open the modal and wait for it to be fully ready
      await this.openAddExpenseModal();

      // Update modal title and button text
      this.updateModalForEdit();

    } catch (error) {
      console.error('❌ Error opening edit expense:', error);
    }
  }

  populateEditForm(expense) {
    console.log('📝 Populating edit form with:', expense);

    // Populate amount
    const amountInput = document.getElementById('expenseAmount');
    if (amountInput) {
      const formattedAmount = this.addThousandSeparators(expense.amount.toString());
      amountInput.value = formattedAmount;
      console.log('✅ Amount populated:', formattedAmount);
    } else {
      console.error('❌ Amount input not found');
    }

    // Populate category
    const categorySelect = document.getElementById('expenseCategory');
    if (categorySelect) {
      categorySelect.value = expense.category;
      console.log('✅ Category populated:', expense.category);

      // Trigger change event to update dropdown appearance
      categorySelect.dispatchEvent(new Event('change'));
    } else {
      console.error('❌ Category select not found');
    }

    // Populate description
    const descriptionInput = document.getElementById('expenseDescription');
    if (descriptionInput) {
      descriptionInput.value = expense.description || '';
      console.log('✅ Description populated:', expense.description || '(empty)');
    } else {
      console.error('❌ Description input not found');
    }

    // Populate date
    const dateInput = document.getElementById('expenseDate');
    if (dateInput) {
      // Convert date to YYYY-MM-DD format for input
      const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      const dateStr = expenseDate.toISOString().split('T')[0];
      dateInput.value = dateStr;
      console.log('✅ Date populated:', dateStr);

      // Set budget period constraints
      this.setBudgetPeriodConstraints(dateInput);
    } else {
      console.error('❌ Date input not found');
    }

    console.log('✅ Edit form population completed');
  }

  updateModalForEdit() {
    // Update modal title
    const modalTitle = document.querySelector('#addExpenseModal .modal-title');
    if (modalTitle) {
      modalTitle.textContent = 'Edit Expense';
    }

    // Update submit button text
    const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Update Expense';
    }
  }

  async handleExpenseUpdate(formData) {
    try {
      // Update expense in Firestore
      const expenseDoc = {
        amount: formData.amount,
        category: formData.category.toUpperCase(),
        description: formData.description,
        date: formData.date,
        month: this.getExpenseMonth(formData.date),
        updatedAt: new Date().toISOString()
      };

      await window.FirebaseUtils.updateExpense(this.editingExpenseId, expenseDoc);

      // Update budget tracking (remove old, add new)
      const oldExpense = this.currentExpenses.find(exp => exp.id === this.editingExpenseId);
      if (oldExpense) {
        // Remove old amount
        const oldBudgetPeriod = this.getExpenseMonth(oldExpense.date?.toDate ? oldExpense.date.toDate().toISOString().split('T')[0] : oldExpense.date);
        await window.FirebaseUtils.updateBudgetSpent(
          oldBudgetPeriod,
          oldExpense.category.toLowerCase(),
          oldExpense.amount,
          'subtract'
        );

        // Add new amount
        const newBudgetPeriod = this.getExpenseMonth(expenseDoc.date);
        await window.FirebaseUtils.updateBudgetSpent(
          newBudgetPeriod,
          expenseDoc.category.toLowerCase(),
          expenseDoc.amount,
          'add'
        );
      }

      console.log('✅ Expense updated successfully');
      return this.editingExpenseId;

    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  }

  resetEditMode() {
    this.isEditMode = false;
    this.editingExpenseId = null;
    this.editingExpenseData = null; // Clear stored expense data

    // Reset modal title
    const modalTitle = document.querySelector('#addExpenseModal .modal-title');
    if (modalTitle) {
      modalTitle.textContent = 'Add Expense';
    }

    // Reset submit button text
    const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = 'Save Expense';
    }

    console.log('🔄 Edit mode reset');
  }

  // ========================================
  // 🗑️ DELETE EXPENSE FUNCTIONALITY
  // ========================================

  async deleteExpense(expenseId) {
    try {
      console.log('🗑️ Deleting expense:', expenseId);

      // Find the expense
      const expense = this.currentExpenses.find(exp => exp.id === expenseId);
      if (!expense) {
        console.error('Expense not found:', expenseId);
        return;
      }

      // Show confirmation dialog
      const confirmed = await this.showDeleteConfirmation(expense);
      if (!confirmed) return;

      // Delete from Firestore
      await window.FirebaseUtils.deleteExpense(expenseId);

      // Update budget tracking (subtract the amount)
      const budgetPeriod = this.getExpenseMonth(expense.date?.toDate ? expense.date.toDate().toISOString().split('T')[0] : expense.date);
      await window.FirebaseUtils.updateBudgetSpent(
        budgetPeriod,
        expense.category.toLowerCase(),
        expense.amount,
        'subtract'
      );

      // Refresh the Expenses page
      await this.loadExpenses();

      // Trigger dashboard refresh
      document.dispatchEvent(new CustomEvent('expenseAdded'));

      console.log('✅ Expense deleted successfully');

    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      this.showSystemError('Failed to delete expense. Please try again.');
    }
  }

  showDeleteConfirmation(expense) {
    return new Promise((resolve) => {
      const amount = this.formatRupiah(expense.amount);
      const category = this.formatCategoryName(expense.category);
      const description = expense.description || 'No description';

      const confirmed = confirm(
        `Are you sure you want to delete this expense?\n\n` +
        `Amount: ${amount}\n` +
        `Category: ${category}\n` +
        `Description: ${description}\n\n` +
        `This action cannot be undone.`
      );

      resolve(confirmed);
    });
  }

  // Memory management
  destroy() {
    this.invalidateCache();
    this.dailyWarnings.clear();
    console.log('💰 ExpenseManager destroyed');
  }
}

// Initialize ExpenseManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ExpenseManager = new ExpenseManager();
});

console.log('💰 Expense module loaded');