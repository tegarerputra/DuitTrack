// ========================================
// DuitTrack - Expense Manager
// Handles expense CRUD operations
// ========================================

class ExpenseManager {
  constructor() {
    this.currentExpenses = [];
    this.categories = [];
    this.budgetData = null;
    this.dailyWarnings = new Map(); // Track daily warnings: categoryThreshold -> timestamp
    this.categoryCache = null;
    this.lastCacheUpdate = null;
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

    // Set default date to today
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate) {
      const today = new Date().toISOString().split('T')[0];
      expenseDate.value = today;
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
      
      // Focus on amount input after everything is ready
      this.focusFirstField();
    }
  }

  async loadCategoriesWithCache() {
    // Check if cache is still valid
    if (this.categoryCache && this.lastCacheUpdate && 
        (Date.now() - this.lastCacheUpdate < this.CACHE_DURATION)) {
      console.log('📂 Using cached categories');
      this.categories = this.categoryCache;
      return this.categories;
    }

    // Fresh load required
    console.log('📂 Loading fresh categories...');
    await this.loadCategories();
    
    // Update cache
    this.categoryCache = [...this.categories];
    this.lastCacheUpdate = Date.now();
    
    return this.categories;
  }

  async setupModalDefaults() {
    // Set today's date
    const expenseDate = document.getElementById('expenseDate');
    if (expenseDate) {
      const today = new Date().toISOString().split('T')[0];
      expenseDate.value = today;
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
    }
  }

  resetForm() {
    const form = document.getElementById('expenseForm');
    if (form) {
      form.reset();
      // Set default date again
      const expenseDate = document.getElementById('expenseDate');
      if (expenseDate) {
        const today = new Date().toISOString().split('T')[0];
        expenseDate.value = today;
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
  // 📅 DATE PICKER ENHANCEMENTS
  // ========================================

  setupDatePickerEnhancements() {
    const dateInput = document.getElementById('expenseDate');
    if (!dateInput) return;

    // Enhanced full-field clickable behavior
    this.setupFullFieldClickable(dateInput);
    
    // Better typing experience
    this.setupTypingEnhancements(dateInput);
    
    // Visual feedback improvements
    this.setupDatePickerFeedback(dateInput);
  }

  setupFullFieldClickable(dateInput) {
    // Make entire field area clickable to trigger date picker
    dateInput.addEventListener('click', (e) => {
      // Ensure date picker opens when clicking anywhere on the field
      if (!dateInput.matches(':focus')) {
        dateInput.focus();
      }
      
      // For WebKit browsers, trigger the calendar picker
      if (dateInput.showPicker && typeof dateInput.showPicker === 'function') {
        try {
          dateInput.showPicker();
        } catch (error) {
          // Fallback: showPicker might not be supported in all browsers
          console.debug('showPicker not supported, using native behavior');
        }
      }
    });

    // Improve keyboard navigation
    dateInput.addEventListener('keydown', (e) => {
      // Space or Enter should open date picker
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (dateInput.showPicker && typeof dateInput.showPicker === 'function') {
          try {
            dateInput.showPicker();
          } catch (error) {
            // Fallback: focus and let native behavior handle it
            dateInput.focus();
          }
        }
      }
    });
  }

  setupTypingEnhancements(dateInput) {
    // Allow direct typing with format validation
    dateInput.addEventListener('input', (e) => {
      const value = e.target.value;
      
      // Clear any previous date validation errors when user starts typing
      this.clearFieldError('expenseDate');
      
      // Auto-format if user types numbers (basic format assistance)
      if (value && value.length >= 10) { // Full date format: YYYY-MM-DD
        this.validateDateInput(value);
      }
    });

    // Enhanced focus behavior
    dateInput.addEventListener('focus', () => {
      // Add visual feedback that field is active
      dateInput.parentElement.classList.add('date-focused');
    });

    dateInput.addEventListener('blur', () => {
      // Remove visual feedback
      dateInput.parentElement.classList.remove('date-focused');
      
      // Validate date when user leaves field
      if (dateInput.value) {
        this.validateDateInput(dateInput.value);
      }
    });
  }

  setupDatePickerFeedback(dateInput) {
    // Enhanced hover effect for better UX indication
    dateInput.addEventListener('mouseenter', () => {
      dateInput.style.transform = 'translateY(-1px)';
    });

    dateInput.addEventListener('mouseleave', () => {
      dateInput.style.transform = 'translateY(0)';
    });

    // Calendar icon glow effect on hover
    dateInput.addEventListener('mouseenter', () => {
      dateInput.classList.add('date-hover-glow');
    });

    dateInput.addEventListener('mouseleave', () => {
      dateInput.classList.remove('date-hover-glow');
    });
  }

  validateDateInput(dateValue) {
    const date = new Date(dateValue);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      this.showFieldError('expenseDate', '📅 Please enter a valid date');
      return false;
    }
    
    // Check if date is not too far in the future (more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (date > oneYearFromNow) {
      this.showFieldError('expenseDate', '📅 Date cannot be more than 1 year in the future');
      return false;
    }
    
    return true;
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
      const currentMonth = window.FirebaseUtils?.getCurrentMonth() || this.getCurrentMonth();
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(currentMonth);
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

      // Create expense in Firestore
      const expenseId = await this.createExpense(formData);

      // NEW: Show progressive success state instead of immediate close
      await this.showSuccessState(formData, expenseId);
      
      // Trigger dashboard refresh (happens in background)
      document.dispatchEvent(new CustomEvent('expenseAdded'));
      console.log('✅ Expense created with ID:', expenseId);

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
        month: expenseData.date.substring(0, 7), // YYYY-MM format
        createdAt: new Date().toISOString()
      };

      const expenseId = await window.FirebaseUtils.createExpense(expenseDoc);
      
      // Update budget tracking
      await window.FirebaseUtils.updateBudgetSpent(
        expenseDoc.month,
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
    const icons = {
      'FOOD': '🍔',
      'SNACK': '🍿',
      'HOUSEHOLD': '🏠',
      'FRUIT': '🍎'
    };
    return icons[category.toUpperCase()] || '💰';
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
  // 🎯 3-LAYER ERROR HANDLING SYSTEM
  // ========================================

  // Layer 1: Field-Level Errors (Below inputs)
  showFieldError(input, message) {
    input.classList.add('error-state');
    const errorContainer = this.getOrCreateErrorContainer(input);
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    errorContainer.classList.add('show');
  }

  clearFieldError(input) {
    input.classList.remove('error-state');
    const errorContainer = document.getElementById(input.id + '-error');
    if (errorContainer) {
      errorContainer.style.display = 'none';
      errorContainer.classList.remove('show');
    }
  }

  // Layer 2: Form-Level Errors (Above form actions)
  showFormError(message) {
    this.clearFormErrors();
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'form-error-container';
      errorContainer.innerHTML = `<div class="form-error field-error show">${message}</div>`;
      formActions.parentNode.insertBefore(errorContainer, formActions);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (errorContainer.parentNode) {
          errorContainer.remove();
        }
      }, 8000);
    }
  }

  // Layer 3: System-Level Errors (Below submit button)
  showSystemError(message) {
    this.clearSystemErrors();
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'system-error-container';
      errorContainer.innerHTML = `<div class="system-error field-error show">${message}</div>`;
      formActions.parentNode.appendChild(errorContainer);
      
      // Auto-remove after 12 seconds
      setTimeout(() => {
        if (errorContainer.parentNode) {
          errorContainer.remove();
        }
      }, 12000);
    }
  }

  // Smart error container creation
  getOrCreateErrorContainer(input) {
    let errorContainer = document.getElementById(input.id + '-error');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'field-error';
      errorContainer.id = input.id + '-error';
      
      // Handle currency input groups vs regular inputs
      const currencyGroup = input.closest('.currency-input-group');
      if (currencyGroup) {
        // Place error after currency-input-group
        currencyGroup.parentNode.insertBefore(errorContainer, currencyGroup.nextSibling);
      } else {
        // Place error after regular input
        input.parentNode.insertBefore(errorContainer, input.nextSibling);
      }
    }
    return errorContainer;
  }

  // Clear all error states
  clearAllErrors() {
    this.clearAllFieldErrors();
    this.clearFormErrors();
    this.clearSystemErrors();
  }

  clearAllFieldErrors() {
    const errorInputs = document.querySelectorAll('.glass-input.error-state');
    errorInputs.forEach(input => this.clearFieldError(input));
  }

  clearFormErrors() {
    const formErrors = document.querySelectorAll('.form-error-container');
    formErrors.forEach(container => container.remove());
  }

  clearSystemErrors() {
    const systemErrors = document.querySelectorAll('.system-error-container');
    systemErrors.forEach(container => container.remove());
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

      // Load budget categories from Firestore
      const currentMonth = window.FirebaseUtils?.getCurrentMonth() || this.getCurrentMonth();
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(currentMonth);
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
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        this.showFieldError(dateInput, "Time travel expenses not allowed! Use today or past dates");
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

  async showSuccessState(expenseData, expenseId) {
    try {
      const formContent = document.getElementById('modalFormContent');
      const successState = document.getElementById('modalSuccessState');
      
      if (!formContent || !successState) {
        console.error('Modal elements not found, falling back to toast');
        this.showSuccessMessage('Expense added successfully! 💰');
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

  // ========================================
  // 🚀 PERFORMANCE OPTIMIZATION METHODS
  // ========================================

  invalidateCache() {
    this.categoryCache = null;
    this.lastCacheUpdate = null;
    this.budgetData = null;
    console.log('🚀 Cache invalidated - will refresh on next load');
  }

  // Public method to refresh cache (called when budget changes)
  async refreshCategories() {
    this.invalidateCache();
    await this.loadCategoriesWithCache();
    await this.updateCategoryDropdown();
    console.log('🔄 Categories refreshed successfully');
  }

  // ========================================
  // 💫 MONEY MOVES PAGE FUNCTIONALITY
  // ========================================

  async loadExpenses(month = null) {
    try {
      console.log('💫 Loading Money Moves page...');
      
      if (!window.auth?.currentUser) {
        console.warn('⚠️ No authenticated user found');
        this.showEmptyExpensesState();
        return;
      }

      const targetMonth = month || this.getCurrentMonth();
      console.log('📅 Loading expenses for month:', targetMonth);
      
      // Show loading state
      this.showExpensesLoading();
      
      // Load expenses from Firestore
      const expensesRef = window.FirebaseUtils.getUserExpensesRef();
      const snapshot = await expensesRef
        .where('month', '==', targetMonth)
        .get();
        
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
      
      // Update UI
      this.updateExpensesTimeline();
      this.setupMonthSelector(targetMonth);
      this.setupEmptyStateActions();
      
    } catch (error) {
      console.error('❌ Error loading expenses:', error);
      this.showExpensesError(error.message);
    }
  }

  updateExpensesTimeline() {
    const timeline = document.getElementById('expensesTimeline');
    const loading = document.getElementById('expensesLoading');
    const empty = document.getElementById('expensesEmpty');
    
    if (!timeline) return;
    
    // Hide loading
    if (loading) loading.style.display = 'none';
    
    if (this.currentExpenses.length === 0) {
      timeline.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    
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

  setupMonthSelector(selectedMonth) {
    const monthSelector = document.getElementById('expenseMonthSelector');
    if (!monthSelector) return;

    // Clear existing options
    monthSelector.innerHTML = '';

    // Generate last 12 months
    const months = this.generateMonthOptions();
    
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month.value;
      option.textContent = month.display;
      option.selected = month.value === selectedMonth;
      monthSelector.appendChild(option);
    });

    // Setup change event
    monthSelector.addEventListener('change', (e) => {
      this.loadExpenses(e.target.value);
    });
  }

  generateMonthOptions() {
    const months = [];
    const current = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      const displayName = monthDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      months.push({
        value: monthStr,
        display: displayName
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
}

// Initialize ExpenseManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ExpenseManager = new ExpenseManager();
});

console.log('💰 Expense module loaded');