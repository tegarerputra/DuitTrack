// ========================================
// Budget - Advanced Budget Management
// Powerful budget editing and management interface
// ========================================

class Budget {
  constructor() {
    this.currentPeriodId = null; // Will be set based on user's reset date
    this.userResetDate = 1; // Default to 1st of month
    this.budgetData = null;
    this.categories = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    console.log('💰 Budget Boss initialized');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    console.log('🔧 Budget Boss setup started');
    this.setupEventListeners();

    // Load user settings first, then setup month selector
    await this.loadUserSettings();
    await this.setupMonthSelector();

    this.watchForPageActivation();
  }

  watchForPageActivation() {
    // Watch for when budget page becomes active
    const observer = new MutationObserver(() => {
      const budgetPage = document.getElementById('budgetPage');
      if (budgetPage && budgetPage.classList.contains('active')) {
        console.log('💰 Budget Boss page activated, loading data...');
        // Re-setup event listeners when page becomes active
        this.setupEventListeners();
        // Ensure setup is complete before loading data
        this.ensureSetupComplete().then(() => {
          this.loadBudgetData();
        });
        observer.disconnect();
      }
    });
    
    const budgetPage = document.getElementById('budgetPage');
    if (budgetPage) {
      observer.observe(budgetPage, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    // Also check if already active
    if (budgetPage && budgetPage.classList.contains('active')) {
      this.setupEventListeners();
      // Ensure setup is complete before loading data
      this.ensureSetupComplete().then(() => {
        this.loadBudgetData();
      });
    }
  }

  setupEventListeners() {
    console.log('🔧 Setting up Budget Boss event listeners...');
    
    // Month selector
    const monthSelector = document.getElementById('budgetMonthSelector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => {
        this.currentPeriodId = e.target.value;
        this.loadBudgetData();
      });
      console.log('✅ Period selector listener attached');
    }

    // Category action buttons (only add button)
    const budgetAddCategoryBtn = document.getElementById('budgetAddCategoryButton');

    console.log('🔍 Finding buttons:', {
      budgetAddCategoryBtn: !!budgetAddCategoryBtn
    });

    // Single add category button (always visible)
    if (budgetAddCategoryBtn) {
      const button = budgetAddCategoryBtn.querySelector('button');
      console.log('🔍 Button inside budgetAddCategoryBtn:', !!button);
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('🔥 Budget add category button clicked!');
          this.showAddCategoryForm();
        });
        console.log('✅ Add category button listener attached');
      }
    }

    // Edit total budget button
    const editTotalBtn = document.getElementById('editTotalBudgetBtn');
    if (editTotalBtn) {
      editTotalBtn.addEventListener('click', () => this.showEditTotalBudgetModal());
    }

    // Budget insights actions
    const optimizeBtn = document.getElementById('optimizeBudgetBtn');
    const trendsBtn = document.getElementById('viewTrendsBtn');

    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.showBudgetOptimization());
    }

    if (trendsBtn) {
      trendsBtn.addEventListener('click', () => this.showBudgetTrends());
    }

    console.log('✅ Budget Boss event listeners setup complete');
  }

  async setupMonthSelector() {
    const monthSelector = document.getElementById('budgetMonthSelector');
    if (!monthSelector) {
      console.warn('⚠️ Budget month selector not found');
      return;
    }

    try {
      // STEP 1: Ensure user settings are loaded first
      if (this.userResetDate === 1) { // Only load if still default
        await this.loadUserSettings();
      }

      console.log('📅 Setting up month selector with reset date:', this.userResetDate);

      // STEP 2: Generate available periods based on user's reset date
      const availablePeriods = window.budgetDateUtils.getAvailablePeriods(this.userResetDate, 12);

      monthSelector.innerHTML = availablePeriods.map(period =>
        `<option value="${period.id}" ${period.isCurrent ? 'selected' : ''}>${period.displayName}</option>`
      ).join('');

      // STEP 3: Set current period ID with validation
      const currentPeriod = availablePeriods.find(p => p.isCurrent);
      this.currentPeriodId = currentPeriod?.id || availablePeriods[0]?.id;

      console.log('✅ Budget Boss month selector setup complete. Period ID:', this.currentPeriodId);
      console.log('📊 Available periods:', availablePeriods.map(p => p.id));

    } catch (error) {
      console.error('❌ Error setting up month selector:', error);
      // Fallback to current period with current reset date
      this.currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(this.userResetDate);
      console.log('🔄 Fallback period ID:', this.currentPeriodId);
    }
  }

  async loadUserSettings() {
    if (!window.auth?.currentUser) {
      console.log('No authenticated user, using default reset date');
      return;
    }

    try {
      const userId = window.auth.currentUser.uid;
      const userDoc = await window.db.collection('users').doc(userId).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        this.userResetDate = userData.budgetResetDate || 1;
        console.log('📅 Budget Boss loaded user reset date:', this.userResetDate);
      } else {
        console.log('⚠️ No user document found, using default reset date');
        this.userResetDate = 1;
      }
    } catch (error) {
      console.error('❌ Error loading user settings:', error);
      // Use default reset date on error
      this.userResetDate = 1;
    }
  }

  async loadBudgetData() {
    try {
      if (!window.auth?.currentUser) {
        console.log('⚠️ No authenticated user, cannot load budget data');
        this.showEmptyState();
        return;
      }

      // CRITICAL: Ensure we have user settings loaded AND currentPeriodId is set
      if (!this.currentPeriodId) {
        console.log('🔄 No currentPeriodId, setting up month selector...');
        await this.setupMonthSelector();

        // Double check after setup
        if (!this.currentPeriodId) {
          console.error('❌ Failed to set currentPeriodId, using fallback');
          this.currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(this.userResetDate);
        }
      }

      this.showLoadingState();

      const userId = window.auth.currentUser.uid;
      console.log(`📊 Loading budget data for ${userId} - ${this.currentPeriodId}`);

      // Load budget data from Firestore using new period ID system
      const budgetDoc = await window.db.collection('users').doc(userId)
        .collection('budgets').doc(this.currentPeriodId).get();

      if (budgetDoc.exists) {
        this.budgetData = budgetDoc.data();
        console.log('✅ Budget data loaded:', this.budgetData);
        
        // Convert categories object to array for easier manipulation
        this.categories = Object.keys(this.budgetData.categories || {}).map(key => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          emoji: this.getCategoryEmoji(key),
          budget: this.budgetData.categories[key].budget || 0,
          spent: this.budgetData.categories[key].spent || 0
        }));

        this.renderBudgetOverview();
        this.renderCategoriesList();
        this.renderBudgetInsights();
      } else {
        console.log('📝 No budget data found for this period, attempting fallback search...');

        // Try fallback search like dashboard
        const fallbackFound = await this.attemptFallbackDataSearch();

        if (!fallbackFound) {
          this.budgetData = null;
          this.categories = [];
          this.showEmptyState();
        }
      }

      this.hideLoadingState();

    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      this.showError('Failed to load budget data: ' + error.message);
      this.hideLoadingState();
    }
  }

  showLoadingState() {
    const loadingElement = document.getElementById('categoriesLoading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    // Disable controls during loading
    const monthSelector = document.getElementById('budgetMonthSelector');
    if (monthSelector) monthSelector.disabled = true;
    
    this.isLoading = true;
  }

  hideLoadingState() {
    const loadingElement = document.getElementById('categoriesLoading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Re-enable controls
    const monthSelector = document.getElementById('budgetMonthSelector');
    if (monthSelector) monthSelector.disabled = false;
    
    this.isLoading = false;
  }

  showEmptyState() {
    const emptyState = document.getElementById('budgetEmptyState');
    const categoriesList = document.getElementById('budgetCategoryBudgetsList');
    
    if (emptyState) emptyState.style.display = 'block';
    
    // Clear existing categories but keep actions section
    if (categoriesList) {
      const existingCategories = categoriesList.querySelectorAll('.simple-category-item');
      existingCategories.forEach(item => item.remove());
    }
    
    // Reset overview
    this.renderEmptyOverview();
  }

  hideEmptyState() {
    const emptyState = document.getElementById('budgetEmptyState');
    if (emptyState) emptyState.style.display = 'none';
  }

  renderBudgetOverview() {
    const totalBudget = this.categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const usagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Update total budget amount
    const totalBudgetElement = document.getElementById('totalBudgetAmount');
    if (totalBudgetElement) {
      totalBudgetElement.textContent = this.formatCurrency(totalBudget);
    }

    // Update spent amount
    const totalSpentElement = document.getElementById('totalSpentAmount');
    if (totalSpentElement) {
      totalSpentElement.textContent = this.formatCurrency(totalSpent);
    }

    // Update remaining amount
    const totalRemainingElement = document.getElementById('totalRemainingAmount');
    if (totalRemainingElement) {
      totalRemainingElement.textContent = this.formatCurrency(totalRemaining);
      totalRemainingElement.className = `stat-value ${totalRemaining < 0 ? 'text-danger' : totalRemaining < (totalBudget * 0.1) ? 'text-warning' : ''}`;
    }

    // Update usage percentage
    const usagePercentElement = document.getElementById('budgetUsagePercent');
    if (usagePercentElement) {
      usagePercentElement.textContent = `${usagePercent}%`;
    }

    // Update days left in month
    const daysLeftElement = document.getElementById('daysLeftInMonth');
    if (daysLeftElement) {
      const daysLeft = this.getDaysLeftInPeriod();
      daysLeftElement.textContent = `${daysLeft}`;
    }

    // Update budget health indicator
    this.updateBudgetHealth(usagePercent, totalRemaining, totalBudget);

    // Update categories summary
    this.updateCategoriesSummary();
  }

  renderEmptyOverview() {
    // Reset all overview values to 0
    const elements = [
      'totalBudgetAmount',
      'totalSpentAmount', 
      'totalRemainingAmount',
      'budgetUsagePercent'
    ];

    elements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = elementId === 'budgetUsagePercent' ? '0%' : 'Rp 0';
      }
    });

    // Update days left
    const daysLeftElement = document.getElementById('daysLeftInMonth');
    if (daysLeftElement) {
      daysLeftElement.textContent = this.getDaysLeftInPeriod();
    }

    // Set health to neutral
    this.updateBudgetHealth(0, 0, 0);
    this.updateCategoriesSummary();
  }

  updateBudgetHealth(usagePercent, remaining, total) {
    const healthIndicator = document.getElementById('budgetHealthIndicator');
    if (!healthIndicator) return;

    let healthIcon = '🟢';
    let healthText = 'Healthy';
    let healthClass = 'healthy';

    if (remaining < 0) {
      healthIcon = '🔴';
      healthText = 'Over Budget';
      healthClass = 'over-budget';
    } else if (usagePercent >= 90) {
      healthIcon = '🟡';
      healthText = 'Nearly Depleted';
      healthClass = 'warning';
    } else if (usagePercent >= 75) {
      healthIcon = '🟠';
      healthText = 'High Usage';
      healthClass = 'caution';
    }

    const iconElement = healthIndicator.querySelector('.health-icon');
    const textElement = healthIndicator.querySelector('.health-text');

    if (iconElement) iconElement.textContent = healthIcon;
    if (textElement) textElement.textContent = healthText;

    // Update classes
    healthIndicator.className = `budget-health-indicator ${healthClass}`;
  }

  updateCategoriesSummary() {
    const categoriesCountElement = document.getElementById('categoriesCount');
    const activeCategoriesCountElement = document.getElementById('activeCategoriesCount');

    if (categoriesCountElement) {
      const count = this.categories.length;
      categoriesCountElement.textContent = `${count} ${count === 1 ? 'category' : 'categories'}`;
    }

    if (activeCategoriesCountElement) {
      const activeCount = this.categories.filter(cat => cat.budget > 0).length;
      activeCategoriesCountElement.textContent = `${activeCount} active`;
    }
  }

  renderCategoriesList() {
    const categoriesContainer = document.getElementById('budgetCategoryBudgetsList');
    
    if (!categoriesContainer) return;

    this.hideEmptyState();

    // Clear existing categories (preserve empty state)
    const existingCategories = categoriesContainer.querySelectorAll('.simple-category-item');
    existingCategories.forEach(item => item.remove());

    if (this.categories.length === 0) {
      return;
    }

    // Sort categories by budget amount (descending)
    const sortedCategories = [...this.categories].sort((a, b) => b.budget - a.budget);

    // Render categories using onboarding style (same as SimpleOnboarding)
    sortedCategories.forEach(category => {
      const categoryElement = this.createOnboardingCategoryElement(category);
      // Insert before empty state element (categories should appear first)
      const emptyState = categoriesContainer.querySelector('#budgetEmptyState');
      if (emptyState) {
        categoriesContainer.insertBefore(categoryElement, emptyState);
      } else {
        categoriesContainer.appendChild(categoryElement);
      }
    });

    console.log('✅ Categories list rendered (onboarding style)');
  }

  createOnboardingCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'simple-category-item category-budget-item';
    div.dataset.categoryId = category.id;
    div.innerHTML = `
      <div class="category-info">
        <div class="category-icon">${category.emoji}</div>
        <div class="category-details">
          <div class="category-name">${category.name}</div>
          <div class="category-description">${category.name.toLowerCase()}</div>
        </div>
      </div>
      <div class="budget-input-group">
        <input type="text" class="glass-input simple-budget-input" 
               placeholder="0" value="${category.budget || ''}" min="0"
               id="budget-${category.id}"
               onchange="budget.updateCategoryBudget('${category.id}', this.value)"
               oninput="budget.handleBudgetInput('${category.id}', this.value)">
        <span class="currency">Rp</span>
      </div>
      <div class="budget-warning" id="warning-${category.id}" style="display: none; color: #ff4444; font-size: 12px; margin-top: 4px; text-align: right;">
        ⚠️ Max. Rp 999.999.999
      </div>
      <div class="category-actions">
        <button type="button" class="simple-delete-btn" onclick="budget.deleteCategory('${category.id}')" title="Delete category">&times;</button>
      </div>
    `;

    // Add real-time budget formatting (reuse from SimpleOnboarding)
    const budgetInput = div.querySelector(`#budget-${category.id}`);
    if (budgetInput && window.simpleOnboarding) {
      window.simpleOnboarding.setupBudgetInputFormatting(budgetInput);
      window.simpleOnboarding.setupFieldValidation(budgetInput, 'budget');
    }

    return div;
  }

  renderBudgetInsights() {
    const insightsList = document.getElementById('budgetInsightsList');
    if (!insightsList) return;

    const insights = this.generateBudgetInsights();
    
    if (insights.length === 0) {
      insightsList.innerHTML = '<p class="no-insights">No insights available yet. Add some expenses to get smart recommendations!</p>';
      return;
    }

    insightsList.innerHTML = insights.map(insight => `
      <div class="budget-insight-item ${insight.type}">
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <h4 class="insight-title">${insight.title}</h4>
          <p class="insight-description">${insight.description}</p>
          ${insight.action ? `<button class="insight-action-btn" onclick="${insight.action.handler}">${insight.action.text}</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  generateBudgetInsights() {
    if (!this.categories.length) return [];

    const insights = [];
    const totalBudget = this.categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);

    // Over-budget categories
    const overBudgetCategories = this.categories.filter(cat => cat.spent > cat.budget);
    if (overBudgetCategories.length > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Categories Over Budget',
        description: `${overBudgetCategories.length} ${overBudgetCategories.length === 1 ? 'category has' : 'categories have'} exceeded their budget limits.`,
        action: {
          text: 'Review & Adjust',
          handler: 'budget.reviewOverBudgetCategories()'
        }
      });
    }

    // High spending categories
    const highSpendingCategories = this.categories
      .filter(cat => cat.budget > 0)
      .filter(cat => (cat.spent / cat.budget) >= 0.8)
      .filter(cat => cat.spent <= cat.budget); // Not over budget

    if (highSpendingCategories.length > 0) {
      insights.push({
        type: 'caution',
        icon: '📊',
        title: 'High Spending Alert',
        description: `${highSpendingCategories.length} ${highSpendingCategories.length === 1 ? 'category is' : 'categories are'} using 80%+ of their budget.`,
        action: {
          text: 'Monitor Closely',
          handler: 'budget.showHighSpendingCategories()'
        }
      });
    }

    // Budget efficiency
    if (totalBudget > 0) {
      const usagePercent = (totalSpent / totalBudget) * 100;
      if (usagePercent < 50) {
        insights.push({
          type: 'info',
          icon: '💡',
          title: 'Budget Underutilized',
          description: `You're only using ${Math.round(usagePercent)}% of your budget. Consider reallocating or increasing savings.`,
          action: {
            text: 'Optimize Budget',
            handler: 'budget.showBudgetOptimization()'
          }
        });
      }
    }

    // Daily spending rate using budget period
    const periodDetails = this.currentPeriodId ?
      window.budgetDateUtils.getPeriodDetails(this.currentPeriodId) : null;
    const totalDaysInPeriod = periodDetails ?
      Math.ceil((periodDetails.end - periodDetails.start) / (1000 * 60 * 60 * 24)) + 1 : 30;
    const daysElapsed = periodDetails ?
      Math.max(1, Math.ceil((new Date() - periodDetails.start) / (1000 * 60 * 60 * 24))) : new Date().getDate();
    const expectedSpending = (daysElapsed / totalDaysInPeriod) * totalBudget;
    
    if (totalSpent > expectedSpending * 1.2) {
      insights.push({
        type: 'warning',
        icon: '📈',
        title: 'Spending Pace Too High',
        description: 'You\'re spending faster than your budget period allows. Consider slowing down.',
        action: {
          text: 'View Spending Trends',
          handler: 'budget.showBudgetTrends()'
        }
      });
    }

    return insights;
  }

  getDaysLeftInPeriod() {
    if (!this.currentPeriodId) return 0;
    return window.budgetDateUtils.getDaysLeftInPeriod(this.currentPeriodId);
  }

  getCategoryEmoji(categoryKey) {
    // Use CategoryService for consistent emoji mapping
    if (window.categoryService) {
      return window.categoryService.getCategoryIcon(categoryKey);
    }

    // Fallback emoji mapping
    const emojiMap = {
      'makan': '🍽️',
      'makanan': '🍽️',
      'food': '🍽️',
      'bensin': '⛽',
      'transport': '🚗',
      'transportasi': '🚗',
      'jajan': '🍿',
      'snack': '🍿',
      'hiburan': '🎮',
      'entertainment': '🎮',
      'rumah': '🏠',
      'house': '🏠',
      'buah': '🍎',
      'fruit': '🍎'
    };

    return emojiMap[categoryKey.toLowerCase()] || '💰';
  }

  formatCurrency(amount) {
    if (!amount) return 'Rp 0';
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Budget Input Handling (from onboarding)
  handleBudgetInput(categoryId, value) {
    // Real-time budget update as user types
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.budget = numericValue;
      console.log(`💰 Updated ${category.name} budget:`, numericValue.toLocaleString('id-ID'));
    }
  }

  updateCategoryBudget(categoryId, value) {
    // Handle formatted input (with dots)
    const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
    const category = this.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.budget = numericValue;
      console.log(`💰 Updated ${category.name} budget:`, numericValue.toLocaleString('id-ID'));
      
      // Auto-save to Firebase after budget update
      this.saveBudgetData().catch(error => {
        console.error('❌ Error saving budget update:', error);
      });
    }
  }

  // Category Management Methods (Direct Implementation)
  showAddCategoryForm() {
    console.log('🔥 showAddCategoryForm called!');
    
    const container = document.getElementById('budgetCategoryBudgetsList');
    const addButtonContainer = document.getElementById('budgetAddCategoryButton');
    
    if (!container || !addButtonContainer) {
      console.error('❌ Budget container or add button not found');
      return;
    }
    
    // Check if form already exists
    const existingForm = container.querySelector('.inline-add-form');
    if (existingForm) {
      existingForm.remove();
    }

    // Hide add button
    addButtonContainer.style.display = 'none';

    // Create inline form (same as SimpleOnboarding)
    const formElement = document.createElement('div');
    formElement.className = 'inline-add-form';
    formElement.innerHTML = `
      <div class="simple-category-item" style="border: 2px dashed rgba(184, 134, 11, 0.4); background: rgba(184, 134, 11, 0.05); padding: 16px;">
        <!-- Category Name Row with Emoji -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div class="category-icon" id="inlineEmojiPreview" style="font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 6px; flex-shrink: 0;">💰</div>
          <input type="text" id="inlineCategoryName" class="glass-input" placeholder="Category name (e.g., Transport, Food)" style="flex: 1; font-weight: 500; font-size: 16px;">
        </div>
        
        <!-- Description Field (Full Width) -->
        <div style="margin-bottom: 12px;">
          <input type="text" id="inlineCategoryDesc" class="glass-input" placeholder="Optional description" style="width: 100%; font-size: 14px; opacity: 0.8;">
        </div>
        
        <!-- Budget Amount Field (Same as existing) -->
        <div class="budget-input-group" style="margin-bottom: 8px;">
          <input type="text" id="inlineCategoryBudget" class="glass-input simple-budget-input" placeholder="0" min="0">
          <span class="currency">Rp</span>
        </div>
        
        <div class="budget-warning" id="warning-inlineCategoryBudget" style="display: none; color: #ff4444; font-size: 12px; margin-bottom: 12px; text-align: right;">
          ⚠️ Max. Rp 999.999.999
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="cancel-btn" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; cursor: pointer;">Cancel</button>
          <button type="button" class="save-btn" style="padding: 8px 16px; background: rgba(184, 134, 11, 0.8); border: 1px solid rgba(184, 134, 11, 0.5); border-radius: 6px; color: #fff; cursor: pointer; font-weight: 500;">Add Category</button>
        </div>
      </div>
    `;

    // Insert form above add button
    addButtonContainer.parentNode.insertBefore(formElement, addButtonContainer);

    // Setup form interactions
    this.setupInlineFormHandlers(formElement, addButtonContainer);

    // Setup budget input formatting
    const inlineBudgetInput = formElement.querySelector('#inlineCategoryBudget');
    const inlineNameInput = formElement.querySelector('#inlineCategoryName');
    
    if (window.simpleOnboarding) {
      window.simpleOnboarding.setupBudgetInputFormatting(inlineBudgetInput);
      window.simpleOnboarding.setupFieldValidation(inlineNameInput, 'name');
      window.simpleOnboarding.setupFieldValidation(inlineBudgetInput, 'budget');
    }

    // Focus on name input
    setTimeout(() => {
      inlineNameInput.focus();
    }, 100);

    console.log('✅ Inline form created and setup complete');
  }

  setupInlineFormHandlers(formElement, addButtonContainer) {
    const cancelBtn = formElement.querySelector('.cancel-btn');
    const saveBtn = formElement.querySelector('.save-btn');
    const nameInput = formElement.querySelector('#inlineCategoryName');
    const budgetInput = formElement.querySelector('#inlineCategoryBudget');
    const emojiPreview = formElement.querySelector('#inlineEmojiPreview');

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      formElement.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        formElement.remove();
        addButtonContainer.style.display = 'block';
      }, 300);
    });

    // Save button
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleInlineFormSubmit(formElement, addButtonContainer);
    });

    // Auto emoji detection
    nameInput.addEventListener('input', (e) => {
      const name = e.target.value.toLowerCase();
      const emoji = this.getCategoryEmoji(name) || '💰';
      emojiPreview.textContent = emoji;
    });

    // Enter key handling
    [nameInput, budgetInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleInlineFormSubmit(formElement, addButtonContainer);
        }
      });
    });
  }

  handleInlineFormSubmit(formElement, addButtonContainer) {
    const nameInput = formElement.querySelector('#inlineCategoryName');
    const descInput = formElement.querySelector('#inlineCategoryDesc');
    const budgetInput = formElement.querySelector('#inlineCategoryBudget');
    const emojiPreview = formElement.querySelector('#inlineEmojiPreview');
    
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    const budget = parseInt(budgetInput.value.replace(/[^\d]/g, '')) || 0;

    // Basic validation
    if (!name) {
      nameInput.focus();
      nameInput.style.border = '1px solid #ff4444';
      return;
    }

    const customCategory = {
      id: name.toLowerCase(),
      emoji: emojiPreview.textContent || '💰',
      name: name,
      desc: desc || 'Custom category',
      budget: budget,
      spent: 0 // Initialize spent to 0
    };

    // Add to Budget Boss categories
    this.categories.push(customCategory);
    
    // Save to Firebase
    this.saveBudgetData().then(() => {
      console.log('✅ Category added successfully');
      this.renderCategoriesList();
      this.renderBudgetOverview();
      
      // Remove form with animation
      formElement.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        formElement.remove();
        addButtonContainer.style.display = 'block';
      }, 300);
      
    }).catch(error => {
      console.error('❌ Error adding category:', error);
    });
  }

  showFallbackAddCategoryForm() {
    // Simple prompt-based fallback when SimpleOnboarding not available
    const categoryName = prompt('Enter category name:');
    if (categoryName && categoryName.trim()) {
      const budgetAmount = prompt('Enter monthly budget (Rp):');
      if (budgetAmount) {
        const numericBudget = parseInt(budgetAmount.replace(/[^\d]/g, '')) || 0;
        this.addCategoryDirectly(categoryName.trim(), numericBudget);
      }
    }
  }

  addCategoryDirectly(name, budget) {
    const customCategory = {
      id: name.toLowerCase(),
      emoji: '💰', // Default emoji
      name: name,
      desc: 'Custom category',
      budget: budget,
      spent: 0
    };

    // Add to Budget Boss categories
    this.categories.push(customCategory);
    
    // Save to Firebase
    this.saveBudgetData().then(() => {
      console.log('✅ Category added successfully');
      this.renderCategoriesList();
      this.renderBudgetOverview();
    }).catch(error => {
      console.error('❌ Error adding category:', error);
    });
  }

  handleBudgetAddCategorySubmit(e, formElement) {
    e.preventDefault();
    e.stopPropagation();
    
    const nameInput = formElement.querySelector('#inlineCategoryName');
    const descInput = formElement.querySelector('#inlineCategoryDesc');
    const budgetInput = formElement.querySelector('#inlineCategoryBudget');
    const emojiPreview = formElement.querySelector('#inlineEmojiPreview');
    
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    const budget = parseInt(budgetInput.value.replace(/[^\d]/g, '')) || 0;

    // Validate using SimpleOnboarding methods
    if (window.simpleOnboarding) {
      if (!window.simpleOnboarding.validateCategoryName(nameInput, name)) {
        nameInput.focus();
        return;
      }

      if (budgetInput.value.trim()) {
        if (!window.simpleOnboarding.validateBudgetInput(budgetInput, budgetInput.value, true)) {
          budgetInput.focus();
          return;
        }
      }
    }

    const customCategory = {
      id: name.toLowerCase(),
      emoji: emojiPreview.textContent || '💰',
      name: name,
      desc: desc || 'Custom category',
      budget: budget,
      spent: 0 // Initialize spent to 0
    };

    // Add to Budget Boss categories
    this.categories.push(customCategory);
    
    // Save to Firebase
    this.saveBudgetData().then(() => {
      console.log('✅ Category added successfully');
      this.renderCategoriesList();
      
      // Remove form
      formElement.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => {
        formElement.remove();
        document.getElementById('budgetAddCategoryButton').style.display = 'block';
      }, 300);
      
    }).catch(error => {
      console.error('❌ Error adding category:', error);
    });
  }

  editCategory(categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Show inline edit form or modal
    this.showEditCategoryModal(category);
  }

  showEditCategoryModal(category) {
    const modal = document.getElementById('budgetCategoryModal');
    if (modal) {
      modal.classList.add('active');
      
      // Set title for editing
      const title = document.getElementById('categoryModalTitle');
      if (title) title.textContent = 'Edit Budget Category';

      // Populate form with category data
      this.populateCategoryForm(category);
    }
  }

  resetCategoryForm() {
    const nameInput = document.getElementById('categoryName');
    const budgetInput = document.getElementById('categoryBudget');
    const emojiDisplay = document.getElementById('categoryEmojiDisplay');

    if (nameInput) nameInput.value = '';
    if (budgetInput) budgetInput.value = '';
    if (emojiDisplay) emojiDisplay.textContent = '💰';
  }

  populateCategoryForm(category) {
    const nameInput = document.getElementById('categoryName');
    const budgetInput = document.getElementById('categoryBudget');
    const emojiDisplay = document.getElementById('categoryEmojiDisplay');

    if (nameInput) nameInput.value = category.name;
    if (budgetInput) budgetInput.value = this.formatCurrency(category.budget);
    if (emojiDisplay) emojiDisplay.textContent = category.emoji;
  }

  async deleteCategory(categoryId) {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${category.name}" category?\n\nThis will also remove all associated expenses.`)) {
      return;
    }

    try {
      // Remove category from local data
      this.categories = this.categories.filter(cat => cat.id !== categoryId);
      
      // Update budget data structure
      if (this.budgetData && this.budgetData.categories) {
        delete this.budgetData.categories[categoryId];
      }

      // Save to Firestore
      await this.saveBudgetData();
      
      // Re-render UI
      this.renderBudgetOverview();
      this.renderCategoriesList();
      this.renderBudgetInsights();

      // Show success feedback
      this.showSuccess(`Category "${category.name}" deleted successfully!`);

    } catch (error) {
      console.error('❌ Error deleting category:', error);
      this.showError('Failed to delete category: ' + error.message);
    }
  }

  async saveBudgetData() {
    if (!window.auth?.currentUser) return;

    try {
      const userId = window.auth.currentUser.uid;

      // Initialize budget data if null (for new period/empty state)
      if (!this.budgetData) {
        const periodDetails = window.budgetDateUtils.getPeriodDetails(this.currentPeriodId);
        this.budgetData = {
          periodId: this.currentPeriodId,
          resetDate: this.userResetDate,
          periodStart: periodDetails.start.toISOString(),
          periodEnd: periodDetails.end.toISOString(),
          displayName: periodDetails.displayName,
          totalBudget: 0,
          categories: {},
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }

      // Update budget data structure
      this.budgetData.categories = {};
      this.budgetData.totalBudget = 0;

      this.categories.forEach(category => {
        this.budgetData.categories[category.id] = {
          budget: category.budget,
          spent: category.spent
        };
        this.budgetData.totalBudget += category.budget;
      });

      this.budgetData.lastUpdated = new Date().toISOString();

      // Save to Firestore using period ID
      await window.db.collection('users').doc(userId)
        .collection('budgets').doc(this.currentPeriodId)
        .set(this.budgetData);

      console.log('✅ Budget data saved successfully');

      // Dispatch event to notify other components of budget update
      document.dispatchEvent(new CustomEvent('budgetUpdated', {
        detail: { periodId: this.currentPeriodId, budgetData: this.budgetData }
      }));

    } catch (error) {
      console.error('❌ Error saving budget data:', error);
      throw error;
    }
  }

  // UI Feedback Methods
  showSuccess(message) {
    console.log('✅ Success:', message);

    // Create simple toast notification
    const toast = document.createElement('div');
    toast.className = 'budget-toast success-toast';
    toast.innerHTML = `
      <div class="toast-icon">✅</div>
      <div class="toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  showError(message) {
    console.error('❌ Error:', message);

    // Create simple toast notification
    const toast = document.createElement('div');
    toast.className = 'budget-toast error-toast';
    toast.innerHTML = `
      <div class="toast-icon">❌</div>
      <div class="toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove toast after 4 seconds (longer for errors)
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
  }

  // Insight Action Handlers
  reviewOverBudgetCategories() {
    console.log('📊 Reviewing over-budget categories...');
    // TODO: Show detailed over-budget analysis
  }

  showHighSpendingCategories() {
    console.log('📈 Showing high spending categories...');
    // TODO: Show high spending analysis
  }

  showBudgetOptimization() {
    console.log('⚡ Showing budget optimization...');
    // TODO: Show optimization suggestions
  }

  showBudgetTrends() {
    console.log('📊 Showing budget trends...');
    // TODO: Show spending trends analysis
  }

  showResetBudgetConfirmation() {
    if (confirm('Are you sure you want to reset this month\'s budget?\n\nThis will clear all categories and spent amounts.')) {
      this.resetBudget();
    }
  }

  async resetBudget() {
    try {
      const userId = window.auth.currentUser.uid;

      // Delete the budget document using currentPeriodId instead of currentMonth
      await window.db.collection('users').doc(userId)
        .collection('budgets').doc(this.currentPeriodId)
        .delete();

      // Reset local data
      this.budgetData = null;
      this.categories = [];

      // Show empty state
      this.showEmptyState();
      this.renderEmptyOverview();

      this.showSuccess('Budget reset successfully!');

    } catch (error) {
      console.error('❌ Error resetting budget:', error);
      this.showError('Failed to reset budget: ' + error.message);
    }
  }

  showEditTotalBudgetModal() {
    console.log('✏️ Edit total budget modal...');
    // TODO: Implement total budget editing modal
  }

  // Budget Reset Date Settings
  showResetDateSettingsModal() {
    console.log('📅 Showing reset date settings modal...');

    // Initialize selectedResetDate with current userResetDate
    this.selectedResetDate = this.userResetDate;

    // Create modal if it doesn't exist
    let modal = document.getElementById('resetDateSettingsModal');
    if (!modal) {
      modal = this.createResetDateSettingsModal();
    }

    // Populate current settings
    this.populateResetDateSettings();

    // Show modal
    modal.classList.add('active');
  }

  createResetDateSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'resetDateSettingsModal';
    modal.className = 'modal reset-date-settings-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="budget.closeResetDateSettingsModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Budget Reset Date Settings</h3>
          <button class="modal-close-btn" onclick="budget.closeResetDateSettingsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-explanation">
            <p>Choose when your budget period resets. This affects how your expenses are grouped and budget limits are calculated.</p>
          </div>

          <!-- Current Period Info -->
          <div class="current-period-info">
            <div class="info-label">Current Budget Period:</div>
            <div class="current-period-display" id="currentPeriodDisplay"></div>
          </div>

          <!-- Reset Date Presets -->
          <div class="reset-date-section">
            <label class="section-label">Reset Date</label>
            <div class="reset-date-presets" id="budgetResetDatePresets"></div>
          </div>

          <!-- Custom Date Selector -->
          <div class="custom-date-section" id="budgetResetDateCustom" style="display: none;">
            <label for="budgetCustomResetDate">Custom Reset Date</label>
            <select id="budgetCustomResetDate" class="glass-input"></select>
          </div>

          <!-- Preview Section -->
          <div class="period-preview-section">
            <div class="preview-label">Preview:</div>
            <div class="period-preview-card">
              <div class="preview-icon">📅</div>
              <div class="preview-content">
                <div class="preview-title">New Budget Period</div>
                <div class="preview-period" id="budgetPreviewPeriodText">Loading...</div>
              </div>
            </div>
          </div>

          <!-- Warning -->
          <div class="settings-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">Changing the reset date will affect future budget periods. Current data will remain unchanged.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="budget.closeResetDateSettingsModal()">Cancel</button>
          <button type="button" class="btn-primary" onclick="budget.saveResetDateSettings()">Save Settings</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  populateResetDateSettings() {
    const presetsContainer = document.getElementById('budgetResetDatePresets');
    const customContainer = document.getElementById('budgetResetDateCustom');
    const customSelect = document.getElementById('budgetCustomResetDate');
    const currentPeriodDisplay = document.getElementById('currentPeriodDisplay');

    console.log('🔧 Populating reset date settings:', {
      presetsContainer: !!presetsContainer,
      currentResetDate: this.userResetDate,
      currentPeriodId: this.currentPeriodId
    });

    if (!presetsContainer) {
      console.error('❌ Presets container not found');
      return;
    }

    // Show current period
    if (currentPeriodDisplay) {
      if (this.currentPeriodId) {
        const periodDetails = window.budgetDateUtils.getPeriodDetails(this.currentPeriodId);
        currentPeriodDisplay.textContent = periodDetails.displayName;
      } else {
        currentPeriodDisplay.textContent = 'Current period loading...';
      }
    }

    // Create preset buttons
    const presetOptions = [
      { value: 1, label: '1st', description: 'Awal Bulan' },
      { value: 15, label: '15th', description: 'Pertengahan' },
      { value: 25, label: '25th', description: 'Akhir Bulan' }
    ];

    presetsContainer.innerHTML = '';
    presetOptions.forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reset-date-preset-btn';
      button.dataset.resetDate = preset.value;
      button.innerHTML = `
        <div class="preset-label">${preset.label}</div>
        <div class="preset-desc">${preset.description}</div>
      `;

      if (preset.value === this.userResetDate) {
        button.classList.add('selected');
      }

      button.onclick = () => this.selectBudgetResetDate(preset.value, false);
      presetsContainer.appendChild(button);
    });

    // Add "Custom" button
    const customButton = document.createElement('button');
    customButton.type = 'button';
    customButton.className = 'reset-date-preset-btn custom-btn';
    customButton.innerHTML = `
      <div class="preset-label">Custom</div>
      <div class="preset-desc">Choose Date</div>
    `;
    customButton.onclick = () => this.showBudgetCustomDateSelector();
    presetsContainer.appendChild(customButton);

    // Populate custom select
    if (customSelect) {
      customSelect.innerHTML = '';
      for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Tanggal ${i}`;
        customSelect.appendChild(option);
      }

      customSelect.addEventListener('change', (e) => {
        this.selectBudgetResetDate(parseInt(e.target.value), true);
      });
    }

    // Initialize with current reset date
    this.selectedResetDate = this.userResetDate;
    this.updateBudgetResetDatePreview();
  }

  selectBudgetResetDate(resetDate, isCustom = false) {
    console.log('📅 Selecting budget reset date:', {
      resetDate: resetDate,
      isCustom: isCustom,
      previousValue: this.selectedResetDate
    });

    this.selectedResetDate = resetDate;

    // Update UI
    const presetButtons = document.querySelectorAll('#budgetResetDatePresets .reset-date-preset-btn:not(.custom-btn)');
    const customButton = document.querySelector('#budgetResetDatePresets .reset-date-preset-btn.custom-btn');
    const customContainer = document.getElementById('budgetResetDateCustom');

    console.log('🔧 UI Elements:', {
      presetButtons: presetButtons.length,
      customButton: !!customButton,
      customContainer: !!customContainer
    });

    // Clear all selections
    presetButtons.forEach(btn => btn.classList.remove('selected'));
    if (customButton) customButton.classList.remove('selected');

    if (isCustom) {
      if (customButton) customButton.classList.add('selected');
      if (customContainer) {
        customContainer.style.display = 'block';
        const customSelect = document.getElementById('budgetCustomResetDate');
        if (customSelect) customSelect.value = resetDate;
      }
    } else {
      // Find and select the matching preset button
      const matchingButton = Array.from(presetButtons).find(btn =>
        parseInt(btn.dataset.resetDate) === resetDate
      );
      if (matchingButton) {
        matchingButton.classList.add('selected');
      }
      if (customContainer) customContainer.style.display = 'none';
    }

    this.updateBudgetResetDatePreview();
    console.log('📅 Budget reset date selected:', resetDate);
  }

  showBudgetCustomDateSelector() {
    const customContainer = document.getElementById('budgetResetDateCustom');
    const customButton = document.querySelector('#budgetResetDatePresets .reset-date-preset-btn.custom-btn');

    // Clear preset selections
    document.querySelectorAll('#budgetResetDatePresets .reset-date-preset-btn:not(.custom-btn)').forEach(btn =>
      btn.classList.remove('selected')
    );

    if (customButton) customButton.classList.add('selected');
    if (customContainer) customContainer.style.display = 'block';

    // Focus on select
    setTimeout(() => {
      const customSelect = document.getElementById('budgetCustomResetDate');
      if (customSelect) customSelect.focus();
    }, 100);
  }

  updateBudgetResetDatePreview() {
    const previewText = document.getElementById('budgetPreviewPeriodText');
    if (!previewText) return;

    // Use budget date utils to calculate period with selected reset date
    const currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(this.selectedResetDate);
    const periodDetails = window.budgetDateUtils.getPeriodDetails(currentPeriodId);

    previewText.textContent = periodDetails.displayName;
  }

  async saveResetDateSettings() {
    try {
      if (!window.auth?.currentUser) {
        console.error('❌ No authenticated user');
        this.showError('Please log in to save settings');
        return;
      }

      const userId = window.auth.currentUser.uid;

      // Validate selectedResetDate
      if (!this.selectedResetDate || this.selectedResetDate < 1 || this.selectedResetDate > 31) {
        console.error('❌ Invalid selected reset date:', this.selectedResetDate);
        this.showError('Please select a valid reset date');
        return;
      }

      console.log('💾 Saving reset date settings:', {
        selectedResetDate: this.selectedResetDate,
        userResetDate: this.userResetDate,
        userId: userId
      });

      // Check if user document exists first
      const userDocRef = window.db.collection('users').doc(userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        await userDocRef.set({
          budgetResetDate: this.selectedResetDate,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Created new user document with reset date');
      } else {
        // Update existing user document
        await userDocRef.update({
          budgetResetDate: this.selectedResetDate,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Updated existing user document with reset date');
      }

      // Update local state
      this.userResetDate = this.selectedResetDate;

      // Update DashboardManager if available
      if (window.DashboardManager) {
        window.DashboardManager.userResetDate = this.selectedResetDate;
        console.log('🔄 Updated DashboardManager reset date:', this.selectedResetDate);
      }

      // Refresh the budget system with new reset date
      await this.setupMonthSelector();
      await this.loadBudgetData();

      // Close modal
      this.closeResetDateSettingsModal();

      // Show success
      this.showSuccess('Reset date settings saved successfully!');

      // Dispatch event to notify other components
      document.dispatchEvent(new CustomEvent('resetDateChanged', {
        detail: { newResetDate: this.selectedResetDate }
      }));

      console.log('✅ Reset date settings saved:', this.selectedResetDate);

    } catch (error) {
      console.error('❌ Error saving reset date settings:', error);
      this.showError('Failed to save settings: ' + error.message);
    }
  }

  closeResetDateSettingsModal() {
    const modal = document.getElementById('resetDateSettingsModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Fallback method to search for budget data with different period IDs (same as Dashboard)
  async attemptFallbackDataSearch() {
    const fallbackPeriods = [
      window.budgetDateUtils.getCurrentPeriodId(1),   // Reset date 1
      window.budgetDateUtils.getCurrentPeriodId(15),  // Reset date 15
      window.budgetDateUtils.getCurrentPeriodId(25),  // Reset date 25
    ];

    console.log('🔍 Budget Boss fallback search periods:', fallbackPeriods);

    for (const periodId of fallbackPeriods) {
      try {
        const budgetDoc = await window.db.collection('users').doc(window.auth.currentUser.uid)
          .collection('budgets').doc(periodId).get();

        if (budgetDoc.exists) {
          this.budgetData = budgetDoc.data();
          console.log(`🎯 Budget Boss FOUND data at period: ${periodId}`);
          console.log('📊 Found budget data:', this.budgetData);

          // Update our current period ID
          this.currentPeriodId = periodId;

          // Extract reset date and update
          const foundResetDate = new Date(periodId).getDate();
          if (foundResetDate !== this.userResetDate) {
            console.log(`🔧 Budget Boss updating reset date from ${this.userResetDate} to ${foundResetDate}`);
            this.userResetDate = foundResetDate;
            await this.setupMonthSelector(); // Refresh month selector
          }

          // Convert categories and render
          this.categories = Object.keys(this.budgetData.categories || {}).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            emoji: this.getCategoryEmoji(key),
            budget: this.budgetData.categories[key].budget || 0,
            spent: this.budgetData.categories[key].spent || 0
          }));

          this.renderBudgetOverview();
          this.renderCategoriesList();
          this.renderBudgetInsights();

          return true;
        }
      } catch (error) {
        console.log(`⚠️ Budget Boss error checking period ${periodId}:`, error.message);
      }
    }

    return false;
  }

  // Utility method to ensure setup is complete before loading data
  async ensureSetupComplete() {
    if (!this.currentPeriodId) {
      console.log('🔄 Setup not complete, running setup...');
      await this.loadUserSettings();
      await this.setupMonthSelector();
    }

    if (!this.currentPeriodId) {
      console.error('❌ Failed to complete setup, using emergency fallback');
      this.currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(1); // Emergency fallback
    }

    console.log('✅ Setup complete, current period ID:', this.currentPeriodId);
  }
}

// Initialize Budget
window.budget = new Budget();
console.log('💰 Budget module loaded');