// ========================================
// DuitTrack - Optimized Dashboard Manager
// Streamlined and performance-focused implementation
// ========================================

class DashboardManager {
  constructor() {
    this.currentPeriodId = null; // Changed from currentMonth to currentPeriodId
    this.userResetDate = 1; // Default reset date
    this.budgetData = null;
    this.isLoading = false;
    this.cache = new Map(); // Simple caching for budget data
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.init();
  }

  async init() {
    console.log('📊 DashboardManager initialized - Period ID v3.0');
    await this.loadUserSettings(); // Load user reset date first
    this.currentPeriodId = window.budgetDateUtils?.getCurrentPeriodId(this.userResetDate) || this.getCurrentMonth();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Month selector change - now handles period IDs
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => {
        this.currentPeriodId = e.target.value;
        this.loadDashboard();
      });
      this.setupDropdownArrowStates(monthSelector);
      // Initialize month selector options
      this.setupMonthSelector();
    }

    // Refresh dashboard when expense is added
    document.addEventListener('expenseAdded', () => {
      this.invalidateCache();
      this.loadDashboard();
    });
    
    // Refresh dashboard when budget is updated (from Budget)
    document.addEventListener('budgetUpdated', () => {
      this.invalidateCache();
      this.loadDashboard();
    });

    // Handle reset date changes from Budget
    document.addEventListener('resetDateChanged', async (e) => {
      const newResetDate = e.detail.newResetDate;
      console.log('📅 Dashboard received reset date change:', newResetDate);

      this.userResetDate = newResetDate;

      // Recalculate current period with new reset date
      this.currentPeriodId = window.budgetDateUtils?.getCurrentPeriodId(this.userResetDate);

      // Update month selector with new periods
      await this.setupMonthSelector();

      // Reload dashboard with new period system
      this.invalidateCache();
      this.loadDashboard();
    });
  }

  setupDropdownArrowStates(selectElement) {
    const toggleState = (isOpen) => {
      selectElement.classList.toggle('dropdown-open', isOpen);
    };

    selectElement.addEventListener('focus', () => toggleState(true));
    selectElement.addEventListener('blur', () => toggleState(false));
    selectElement.addEventListener('change', () => {
      setTimeout(() => {
        selectElement.blur();
        toggleState(false);
      }, 50);
    });
  }

  async loadDashboard(periodId = null) {
    if (this.isLoading || !window.auth?.currentUser) return;

    try {
      this.isLoading = true;
      console.log('📊 Loading dashboard data...');

      const targetPeriodId = periodId || this.currentPeriodId;

      // Show loading states
      this.showLoadingStates();

      // Load budget data with caching
      await this.loadBudgetDataCached(targetPeriodId);

      // Update all UI components
      this.updateAllComponents();

      console.log('✅ Dashboard loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showErrorState(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async loadBudgetDataCached(periodId) {
    const cacheKey = `budget_${periodId}`;
    const cached = this.cache.get(cacheKey);

    console.log('📊 DASHBOARD LOAD DEBUG:');
    console.log('   - User Reset Date:', this.userResetDate);
    console.log('   - Looking for Period ID:', periodId);
    console.log('   - Cache Key:', cacheKey);

    // Check cache validity
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      this.budgetData = cached.data;
      console.log('📂 Using cached budget data');
      return;
    }

    try {
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(periodId);
      const budgetDoc = await budgetRef.get();

      if (budgetDoc.exists) {
        this.budgetData = budgetDoc.data();
        // Cache the data
        this.cache.set(cacheKey, {
          data: this.budgetData,
          timestamp: Date.now()
        });
        console.log('✅ Budget data found for period:', periodId);
      } else {
        console.log('📝 No budget data found for period:', periodId);

        // FALLBACK: Try to find data with different reset dates
        console.log('🔍 Attempting fallback search...');
        const fallbackFound = await this.attemptFallbackDataSearch();

        if (!fallbackFound) {
          this.budgetData = {
            periodId,
            totalBudget: 0,
            categories: {},
            updatedAt: null
          };
          console.log('📝 No data found in fallback search either');
        }
      }
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      throw error;
    }
  }

  // Consolidated update method to avoid duplication
  updateAllComponents() {
    const totals = this.calculateBudgetTotals();
    
    // Update main components
    this.updateBudgetStatus(totals);
    this.updateFinancialIntelligence(totals);
    this.updateCategoryAccordion();
    this.updateMonthSelector(this.currentPeriodId);
  }

  calculateBudgetTotals() {
    if (!this.budgetData?.categories) {
      return { totalBudget: 0, totalSpent: 0, spentPercentage: 0 };
    }

    const { totalBudget, totalSpent } = Object.values(this.budgetData.categories)
      .reduce((acc, category) => ({
        totalBudget: acc.totalBudget + (category.budget || 0),
        totalSpent: acc.totalSpent + (category.spent || 0)
      }), { totalBudget: 0, totalSpent: 0 });

    return {
      totalBudget,
      totalSpent,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }

  updateBudgetStatus(totals) {
    // Update horizontal progress bar
    const progressBarFill = document.getElementById('progressBarFill');
    const spentEl = document.getElementById('totalSpent');
    const budgetLabelEl = document.getElementById('totalBudgetLabel');
    const percentageEl = document.getElementById('budgetPercentage');
    const statusTextEl = document.getElementById('budgetStatusText');
    const remainingEl = document.getElementById('totalRemaining');
    const healthIndicator = document.getElementById('budgetHealthIndicator');
    
    if (!progressBarFill) return;
    
    const percentage = Math.min(100, totals.spentPercentage);
    const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
    
    // Single DOM update batch
    const updates = [
      { el: progressBarFill, prop: 'style.width', value: `${percentage}%` },
      { el: spentEl, prop: 'textContent', value: this.formatRupiah(totals.totalSpent) },
      { el: budgetLabelEl, prop: 'textContent', value: `/ ${this.formatRupiah(totals.totalBudget)}` },
      { el: percentageEl, prop: 'textContent', value: `${percentage.toFixed(0)}%` },
      { el: remainingEl, prop: 'textContent', value: this.formatRupiah(remaining) }
    ];

    updates.forEach(({ el, prop, value }) => {
      if (el) this.setElementProperty(el, prop, value);
    });

    // Status and health indicator
    const { statusText, healthIcon, colorClass } = this.getBudgetStatus(percentage);
    
    if (statusTextEl) statusTextEl.textContent = statusText;
    if (healthIndicator) healthIndicator.textContent = healthIcon;
    if (progressBarFill) {
      progressBarFill.className = `progress-bar-fill ${colorClass}`;
    }

    // Update quick stats
    this.updateQuickStats(totals);
  }

  getBudgetStatus(percentage) {
    if (percentage >= 90) {
      return { statusText: 'Budget alert!', healthIcon: '🔴', colorClass: 'danger' };
    } else if (percentage >= 70) {
      return { statusText: 'Watch out!', healthIcon: '🟡', colorClass: 'warning' };
    } else {
      return { statusText: 'Looking good!', healthIcon: '🟢', colorClass: 'safe' };
    }
  }

  updateQuickStats(totals) {
    const now = new Date();
    // Use budget period for accurate days left calculation
    const daysLeft = this.currentPeriodId ?
      window.budgetDateUtils.getDaysLeftInPeriod(this.currentPeriodId) : 0;

    // Calculate days elapsed in current period for projections
    const periodDetails = this.currentPeriodId ?
      window.budgetDateUtils.getPeriodDetails(this.currentPeriodId) : null;
    const daysElapsed = periodDetails ?
      Math.max(1, Math.ceil((now - periodDetails.start) / (1000 * 60 * 60 * 24))) : now.getDate();
    const totalDaysInPeriod = periodDetails ?
      Math.ceil((periodDetails.end - periodDetails.start) / (1000 * 60 * 60 * 24)) + 1 : 30;
    
    // Calculate projections
    const dailyRate = totals.totalSpent / daysElapsed;
    const periodProjection = dailyRate * totalDaysInPeriod;
    
    // Update elements efficiently
    const elements = {
      dailyAverageAmount: this.formatRupiah(dailyRate),
      monthlyProjectionAmount: this.formatRupiah(periodProjection),
      daysLeftCount: `${daysLeft} days`
    };

    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  updateFinancialIntelligence(totals) {
    this.updateSmartInsights(totals);
    this.updateMetrics(totals);
  }

  updateSmartInsights(totals) {
    const insightsList = document.getElementById('insightsList');
    if (!insightsList) return;
    
    if (!this.budgetData?.categories) {
      insightsList.innerHTML = this.getEmptyInsightsHTML();
      return;
    }

    const insights = this.generateSmartInsights(totals);
    
    if (insights.length === 0) {
      insightsList.innerHTML = this.getNoInsightsHTML();
      return;
    }

    insightsList.innerHTML = insights.slice(0, 3).map((insight, index) => 
      `<div class="insight-item ${insight.type} ${index === 0 ? 'primary' : 'secondary'}">
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-description">${insight.description}</div>
        </div>
      </div>`
    ).join('');
  }

  generateSmartInsights(totals) {
    const insights = [];
    const now = new Date();

    // Use budget period for accurate insights
    const periodDetails = this.currentPeriodId ?
      window.budgetDateUtils.getPeriodDetails(this.currentPeriodId) : null;
    const totalDaysInPeriod = periodDetails ?
      Math.ceil((periodDetails.end - periodDetails.start) / (1000 * 60 * 60 * 24)) + 1 : 30;
    const daysElapsed = periodDetails ?
      Math.max(1, Math.ceil((now - periodDetails.start) / (1000 * 60 * 60 * 24))) : now.getDate();
    const timeProgress = (daysElapsed / totalDaysInPeriod) * 100;
    
    // Budget efficiency insight
    if (totals.totalBudget > 0 && totals.spentPercentage > 0) {
      if (totals.spentPercentage > timeProgress + 15) {
        insights.push({
          type: 'danger',
          icon: '⚠️',
          title: 'Spending too fast!',
          description: `You've used ${totals.spentPercentage.toFixed(0)}% of your budget in just ${timeProgress.toFixed(0)}% of the month.`
        });
      } else if (totals.spentPercentage < timeProgress - 15) {
        insights.push({
          type: 'success',
          icon: '🎉',
          title: 'Excellent budget control!',
          description: `Only used ${totals.spentPercentage.toFixed(0)}% of budget in ${timeProgress.toFixed(0)}% of the month.`
        });
      }
    }
    
    // Category-specific insights
    if (this.budgetData.categories) {
      Object.entries(this.budgetData.categories).forEach(([categoryKey, categoryData]) => {
        const spent = categoryData.spent || 0;
        const budget = categoryData.budget || 0;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        if (percentage > 90 && budget > 0) {
          const categoryName = this.formatCategoryName(categoryKey);
          insights.push({
            type: percentage > 100 ? 'danger' : 'warning',
            icon: percentage > 100 ? '🚨' : '💸',
            title: `${categoryName} ${percentage > 100 ? 'exceeded!' : 'running low!'}`,
            description: `${percentage.toFixed(0)}% of ${categoryName} budget used (${this.formatRupiah(spent)} / ${this.formatRupiah(budget)})`
          });
        }
      });
    }
    
    return insights.slice(0, 4); // Limit to 4 insights
  }

  updateMetrics(totals) {
    if (!this.budgetData) return;

    const now = new Date();
    // Use budget period for accurate metrics
    const periodDetails = this.currentPeriodId ?
      window.budgetDateUtils.getPeriodDetails(this.currentPeriodId) : null;
    const totalDaysInPeriod = periodDetails ?
      Math.ceil((periodDetails.end - periodDetails.start) / (1000 * 60 * 60 * 24)) + 1 : 30;
    const daysElapsed = periodDetails ?
      Math.max(1, Math.ceil((now - periodDetails.start) / (1000 * 60 * 60 * 24))) : now.getDate();

    // Calculate metrics
    const timeProgress = (daysElapsed / totalDaysInPeriod) * 100;
    const efficiency = Math.max(0, 100 - Math.abs(totals.spentPercentage - timeProgress));

    const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
    const currentDailySpend = daysElapsed > 0 ? totals.totalSpent / daysElapsed : 0;
    const optimalDailySpend = totals.totalBudget / totalDaysInPeriod;
    
    const daysLeft = totalDaysInPeriod - daysElapsed;
    const savingsPotential = currentDailySpend < optimalDailySpend && remaining > 0 ?
      Math.max(0, remaining - (currentDailySpend * daysLeft)) : 0;
    
    // Spending trend
    let trend = 'Stable';
    if (currentDailySpend > optimalDailySpend * 1.1) trend = 'Increasing';
    else if (currentDailySpend < optimalDailySpend * 0.9) trend = 'Decreasing';
    
    const goalProgress = Math.min(100, (timeProgress - totals.spentPercentage + 100) / 2);
    
    // Update metrics UI
    const metrics = {
      budgetEfficiency: `${efficiency.toFixed(0)}%`,
      savingsPotential: this.formatRupiah(savingsPotential),
      spendingTrend: trend,
      goalProgress: `${goalProgress.toFixed(0)}%`
    };

    Object.entries(metrics).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  }

  updateCategoryAccordion() {
    const accordionContainer = document.getElementById('categoryAccordion');
    if (!accordionContainer) return;

    if (!this.budgetData?.categories || Object.keys(this.budgetData.categories).length === 0) {
      accordionContainer.innerHTML = this.getEmptyCategoryHTML();
      return;
    }

    // Sort categories by percentage (overbudget first, then highest percentage)
    const sortedCategories = Object.entries(this.budgetData.categories)
      .filter(([_, data]) => data.spent > 0 || data.budget > 0)
      .sort((a, b) => {
        const percentageA = a[1].budget > 0 ? (a[1].spent / a[1].budget) * 100 : 0;
        const percentageB = b[1].budget > 0 ? (b[1].spent / b[1].budget) * 100 : 0;
        
        if (percentageA >= 100 && percentageB < 100) return -1;
        if (percentageA < 100 && percentageB >= 100) return 1;
        return percentageB - percentageA;
      });

    const categoryItems = sortedCategories.map(([category, data]) => {
      const percentage = data.budget > 0 ? Math.min(100, (data.spent / data.budget) * 100) : 0;
      const healthStatus = this.getCategoryHealthStatus(percentage);
      
      return `
        <div class="category-accordion-item" data-category="${category}" onclick="window.DashboardManager.toggleCategoryCard('${category}')" style="cursor: pointer;">
          <div class="category-header">
            <div class="category-info">
              <span class="category-icon">${this.getCategoryIcon(category)}</span>
              <span class="category-name">${this.formatCategoryName(category)}</span>
              <span class="category-health-indicator ${healthStatus.class}">${healthStatus.indicator}</span>
            </div>
          </div>
          <div class="category-amounts-row">
            <span class="category-spent">${this.formatRupiah(data.spent)}</span>
            <span class="category-budget">${this.formatRupiah(data.budget)}</span>
          </div>
          <div class="category-progress-container">
            <span class="category-percentage ${healthStatus.class}">${percentage.toFixed(0)}%</span>
            <div class="category-progress-bg">
              <div class="category-progress-fill ${healthStatus.class}" style="width: ${Math.min(100, percentage)}%"></div>
            </div>
          </div>
          <div class="category-content" id="content-${category}">
            <div class="category-expenses"></div>
          </div>
        </div>
      `;
    }).join('');

    accordionContainer.innerHTML = sortedCategories.length === 0 ? 
      this.getEmptyCategoryHTML() : 
      `<div class="category-accordion-list">${categoryItems}</div>`;
  }

  async toggleCategoryCard(category) {
    const item = document.querySelector(`[data-category="${category}"]`);
    const content = document.getElementById(`content-${category}`);
    
    if (!item || !content) return;

    const isExpanded = content.classList.contains('expanded');
    
    // Collapse all other categories
    document.querySelectorAll('.category-content.expanded').forEach(el => {
      el.classList.remove('expanded');
      el.style.maxHeight = '0';
    });
    document.querySelectorAll('.category-accordion-item.active').forEach(el => {
      el.classList.remove('active');
    });
    
    // Expand this category if it wasn't expanded
    if (!isExpanded) {
      item.classList.add('active');
      content.classList.add('expanded');
      
      await this.loadCategoryExpenses(category, content);
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  async loadCategoryExpenses(category, contentElement) {
    const expensesContainer = contentElement.querySelector('.category-expenses');
    if (!expensesContainer) return;
    
    // Show loading skeleton
    expensesContainer.innerHTML = this.getExpenseSkeletonHTML();
    
    try {
      if (!window.auth?.currentUser) {
        expensesContainer.innerHTML = '<div class="no-expenses"><p>Please log in first</p></div>';
        return;
      }
      
      const expensesRef = window.FirebaseUtils.getUserExpensesRef();

      // Try period ID first (YYYY-MM-DD format)
      let snapshot = await expensesRef
        .where('month', '==', this.currentPeriodId)
        .where('category', '==', category.toUpperCase())
        .get();

      // If no results and we have a period ID, try month format (YYYY-MM)
      if (snapshot.empty && this.currentPeriodId?.length > 7) {
        const monthFormat = this.currentPeriodId.substring(0, 7); // Extract YYYY-MM
        console.log(`🔍 Category expenses: No data found for period ${this.currentPeriodId}, trying month format ${monthFormat}`);

        snapshot = await expensesRef
          .where('month', '==', monthFormat)
          .where('category', '==', category.toUpperCase())
          .get();
      }
      
      const expenses = [];
      snapshot.forEach(doc => {
        expenses.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by date (newest first)
      expenses.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      
      if (expenses.length === 0) {
        expensesContainer.innerHTML = '<div class="category-empty-expenses"><p>No expenses in this category yet</p></div>';
        return;
      }
      
      const expenseItems = expenses.map(expense => {
        const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
        const formattedDate = this.formatSmartDate(expenseDate);
        
        return `
          <div class="expense-card">
            <div class="expense-date-amount">
              <span class="expense-date">${formattedDate}</span>
              <span class="expense-amount">${this.formatRupiah(expense.amount)}</span>
            </div>
            <div class="expense-description">${expense.description || 'Expense'}</div>
          </div>
        `;
      }).join('');
      
      expensesContainer.innerHTML = expenseItems;
      
    } catch (error) {
      console.error('Error loading category expenses:', error);
      expensesContainer.innerHTML = `
        <div class="no-expenses">
          <p>Failed to load expense data</p>
          <button onclick="window.DashboardManager.loadCategoryExpenses('${category}', this.closest('.category-content'))" class="retry-btn">Try Again</button>
        </div>
      `;
    }
  }

  updateMonthSelector(selectedPeriodId) {
    const monthSelector = document.getElementById('monthSelector');
    if (!monthSelector) return;

    monthSelector.innerHTML = '';
    const periods = this.generatePeriodOptions();

    periods.forEach(period => {
      const option = document.createElement('option');
      option.value = period.id;
      option.textContent = period.displayName;
      option.selected = period.id === selectedPeriodId;
      monthSelector.appendChild(option);
    });
  }

  generatePeriodOptions() {
    if (!window.budgetDateUtils) {
      console.warn('budgetDateUtils not available, using fallback');
      return this.generateFallbackMonthOptions();
    }
    return window.budgetDateUtils.getAvailablePeriods(this.userResetDate, 12);
  }

  generateFallbackMonthOptions() {
    const months = [];
    const current = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const displayName = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      months.push({ id: monthStr, displayName: displayName });
    }
    return months;
  }

  showLoadingStates() {
    const loadingElements = [
      { id: 'totalBudget', html: '<div class="skeleton skeleton-budget-item"></div>' },
      { id: 'totalSpent', html: '<div class="skeleton skeleton-budget-item"></div>' },
      { id: 'totalRemaining', html: '<div class="skeleton skeleton-budget-item"></div>' },
      { id: 'insightsList', html: '<div class="skeleton skeleton-chart"></div>' }
    ];

    loadingElements.forEach(({ id, html }) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });

    const progressBar = document.getElementById('progressBarFill');
    if (progressBar) {
      progressBar.className = 'skeleton skeleton-progress-bar';
      progressBar.style.width = '100%';
    }
  }

  showErrorState(message) {
    console.error('Dashboard error:', message);
  }

  // Utility methods
  formatRupiah(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
    const numAmount = Math.abs(Math.floor(amount));
    const formatted = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }

  formatSmartDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  getCategoryIcon(category) {
    return window.categoryService ? window.categoryService.getCategoryIcon(category) : '💰';
  }

  formatCategoryName(category) {
    const names = {
      'FOOD': 'Makanan', 'SNACK': 'Jajan', 'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan', 'TRANSPORT': 'Transportasi', 'ENTERTAINMENT': 'Hiburan',
      'HIBURAN': 'Hiburan', 'HEALTH': 'Kesehatan', 'EDUCATION': 'Pendidikan',
      'SHOPPING': 'Belanja', 'BILLS': 'Tagihan', 'OTHER': 'Lainnya'
    };
    return names[category?.toUpperCase()] || category || 'Lainnya';
  }

  getCategoryHealthStatus(percentage) {
    if (percentage <= 70) {
      return { class: 'budget-safe', indicator: '🟢', text: 'Looking good' };
    } else if (percentage <= 90) {
      return { class: 'budget-warning', indicator: '🟡', text: 'Watch out' };
    } else {
      return { class: 'budget-danger', indicator: '🔴', text: 'Budget alert' };
    }
  }

  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
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
        console.log('📅 Dashboard loaded user reset date:', this.userResetDate);
      } else {
        console.log('No user document found, using default reset date');
      }
    } catch (error) {
      console.error('❌ Error loading user settings:', error);
      // Use default reset date on error
      this.userResetDate = 1;
    }
  }

  async setupMonthSelector() {
    const monthSelector = document.getElementById('monthSelector');
    if (!monthSelector) return;

    try {
      // Generate available periods based on user's reset date
      const availablePeriods = window.budgetDateUtils.getAvailablePeriods(this.userResetDate, 12);

      monthSelector.innerHTML = availablePeriods.map(period =>
        `<option value="${period.id}" ${period.isCurrent ? 'selected' : ''}>${period.displayName}</option>`
      ).join('');

      // Update current period ID if not set
      if (!this.currentPeriodId) {
        this.currentPeriodId = availablePeriods.find(p => p.isCurrent)?.id || availablePeriods[0]?.id;
      }

      console.log('📅 Month selector setup complete, current period:', this.currentPeriodId);

    } catch (error) {
      console.error('❌ Error setting up month selector:', error);
      // Fallback to current period with default reset date
      this.currentPeriodId = window.budgetDateUtils.getCurrentPeriodId(this.userResetDate);
    }
  }

  // Cache management
  invalidateCache() {
    this.cache.clear();
  }

  // Utility helper methods
  setElementProperty(element, property, value) {
    const props = property.split('.');
    let obj = element;
    for (let i = 0; i < props.length - 1; i++) {
      obj = obj[props[i]];
    }
    obj[props[props.length - 1]] = value;
  }

  // HTML templates for better maintainability
  getEmptyInsightsHTML() {
    return `
      <div class="insights-empty">
        <div class="empty-icon">🧠</div>
        <p>No data to analyze yet</p>
        <p>Add some budget and expenses to get smart insights!</p>
      </div>
    `;
  }

  getNoInsightsHTML() {
    return `
      <div class="insights-empty">
        <div class="empty-icon">✨</div>
        <p>Everything looks great!</p>
        <p>No special insights to show right now</p>
      </div>
    `;
  }

  getEmptyCategoryHTML() {
    return `
      <div class="chart-empty-state">
        <div class="chart-empty-icon">📊</div>
        <p>No category data yet</p>
        <p class="chart-empty-subtitle">Add some expenses to see category breakdown</p>
      </div>
    `;
  }

  getExpenseSkeletonHTML() {
    return Array(3).fill().map(() => `
      <div class="expense-skeleton">
        <div class="expense-skeleton-info">
          <div class="expense-skeleton-description"></div>
          <div class="expense-skeleton-date"></div>
        </div>
        <div class="expense-skeleton-amount"></div>
      </div>
    `).join('');
  }

  // Public refresh method
  async refresh() {
    this.invalidateCache();
    await this.loadDashboard();
  }

  // Fallback method to search for budget data with different period IDs
  async attemptFallbackDataSearch() {
    const fallbackPeriods = [
      window.budgetDateUtils.getCurrentPeriodId(1),   // Reset date 1
      window.budgetDateUtils.getCurrentPeriodId(15),  // Reset date 15
      window.budgetDateUtils.getCurrentPeriodId(25),  // Reset date 25
      this.getCurrentMonth() // Legacy YYYY-MM format
    ];

    console.log('🔍 Fallback search periods:', fallbackPeriods);

    for (const periodId of fallbackPeriods) {
      try {
        const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(periodId);
        const budgetDoc = await budgetRef.get();

        if (budgetDoc.exists) {
          this.budgetData = budgetDoc.data();
          console.log(`🎯 FOUND data at period: ${periodId}`);
          console.log('📊 Found data:', this.budgetData);

          // Update our current period ID to match the found data
          this.currentPeriodId = periodId;

          // Extract the reset date from the found period ID and update user reset date
          const foundResetDate = new Date(periodId).getDate();
          if (foundResetDate !== this.userResetDate) {
            console.log(`🔧 Updating user reset date from ${this.userResetDate} to ${foundResetDate}`);
            this.userResetDate = foundResetDate;

            // Update month selector with correct reset date
            this.setupMonthSelector();
          }

          return true; // Found data
        }
      } catch (error) {
        console.log(`⚠️ Error checking period ${periodId}:`, error.message);
      }
    }

    return false; // No data found
  }

  // Memory management
  destroy() {
    this.invalidateCache();
    this.isLoading = false;
    console.log('📊 DashboardManager destroyed');
  }
}

// Initialize DashboardManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.DashboardManager = new DashboardManager();
});

// Auto-load dashboard when user is authenticated
document.addEventListener('userAuthenticated', () => {
  if (window.DashboardManager) {
    window.DashboardManager.loadDashboard();
  }
});

console.log('📊 Dashboard module loaded - Optimized v2.0');