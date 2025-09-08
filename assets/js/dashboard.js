// ========================================
// DuitTrack - Dashboard Manager
// Handles dashboard data loading and display
// ========================================

class DashboardManager {
  constructor() {
    this.currentMonth = null;
    this.budgetData = null;
    this.isLoading = false;
    this.init();
  }

  init() {
    console.log('📊 DashboardManager initialized');
    
    // Debug: Check Firebase initialization
    console.log('🔍 DEBUG - Firebase Status:', {
      auth: !!window.auth,
      currentUser: !!window.auth?.currentUser,
      FirebaseUtils: !!window.FirebaseUtils,
      getCurrentMonth: typeof window.FirebaseUtils?.getCurrentMonth
    });
    
    this.currentMonth = window.FirebaseUtils?.getCurrentMonth() || this.getCurrentMonth();
    console.log('📅 Current month:', this.currentMonth);
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Month selector change
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => {
        this.currentMonth = e.target.value;
        this.loadDashboard();
      });

      // Handle dropdown arrow states
      this.setupDropdownArrowStates(monthSelector);
    }

    // Refresh dashboard when expense is added
    document.addEventListener('expenseAdded', () => {
      console.log('📊 Expense added, refreshing dashboard');
      this.loadDashboard();
    });
  }

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

  async loadDashboard(month = null) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      console.log('📊 Loading dashboard data...');
      
      // Debug: Authentication check
      console.log('🔍 DEBUG - Authentication Check:', {
        authExists: !!window.auth,
        currentUser: !!window.auth?.currentUser,
        uid: window.auth?.currentUser?.uid,
        email: window.auth?.currentUser?.email
      });
      
      if (!window.auth?.currentUser) {
        console.warn('⚠️ No authenticated user found. Dashboard load aborted.');
        return;
      }
      
      // Use provided month or current month
      const targetMonth = month || this.currentMonth;
      console.log('📅 Loading data for month:', targetMonth);
      
      // Show loading states
      this.showLoadingStates();
      
      // Load all dashboard data in parallel
      await Promise.all([
        this.loadBudgetData(targetMonth)
      ]);
      
      // Update all UI components with consolidated design
      console.log('🔍 DEBUG - Starting UI updates...');
      console.log('🔍 Budget data available:', !!this.budgetData);
      
      this.updateConsolidatedBudgetStatus();
      console.log('✅ Updated consolidated budget status');
      
      this.updateFinancialIntelligence();
      console.log('✅ Updated financial intelligence');
      
      this.setupIntelligenceTabs();
      console.log('✅ Setup intelligence tabs');
      
      
      this.updateCategoryAccordion();
      console.log('✅ Updated category accordion');
      
      this.updateMonthSelector(targetMonth);
      console.log('✅ Updated month selector');
      
      console.log('✅ Dashboard loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showErrorState(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async loadBudgetData(month) {
    try {
      if (!window.auth?.currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('📊 Loading budget data for month:', month);
      
      // Debug: Firebase reference check
      console.log('🔍 DEBUG - Firebase References:', {
        FirebaseUtils: !!window.FirebaseUtils,
        getUserBudgetsRef: typeof window.FirebaseUtils.getUserBudgetsRef,
        userUID: window.auth.currentUser.uid
      });
      
      const budgetRef = window.FirebaseUtils.getUserBudgetsRef().doc(month);
      console.log('🔍 DEBUG - Budget reference created:', !!budgetRef);
      
      const budgetDoc = await budgetRef.get();
      console.log('🔍 DEBUG - Budget document result:', {
        exists: budgetDoc.exists,
        hasData: !!budgetDoc.data()
      });
      
      if (budgetDoc.exists) {
        this.budgetData = budgetDoc.data();
        console.log('✅ Budget data loaded:', this.budgetData);
      } else {
        // No budget data for this month
        this.budgetData = {
          month,
          totalBudget: 0,
          categories: {},
          updatedAt: null
        };
        console.log('ℹ️ No budget data found for month:', month);
      }
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      throw error;
    }
  }


  updateBudgetOverview() {
    if (!this.budgetData) return;

    // Calculate totals
    const totals = this.calculateBudgetTotals();
    
    // Update budget amounts with Indonesian formatting
    const totalBudgetEl = document.getElementById('totalBudget');
    const totalSpentEl = document.getElementById('totalSpent');
    const totalRemainingEl = document.getElementById('totalRemaining');
    const budgetProgressEl = document.getElementById('budgetProgress');

    if (totalBudgetEl) {
      totalBudgetEl.textContent = this.formatRupiah(totals.totalBudget);
    }

    if (totalSpentEl) {
      totalSpentEl.textContent = this.formatRupiah(totals.totalSpent);
      // Add color class based on spending
      totalSpentEl.className = 'budget-amount spent';
      if (totals.spentPercentage > 90) {
        totalSpentEl.classList.add('danger');
      }
    }

    if (totalRemainingEl) {
      const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
      totalRemainingEl.textContent = this.formatRupiah(remaining);
      totalRemainingEl.className = 'budget-amount remaining';
      if (remaining < 0) {
        totalRemainingEl.classList.add('over-budget');
      }
    }

    if (budgetProgressEl) {
      const progressPercentage = Math.min(100, totals.spentPercentage);
      
      // Restore proper class and styling (remove skeleton)
      budgetProgressEl.className = 'progress-fill';
      budgetProgressEl.style.width = `${progressPercentage}%`;
      
      // Add progress bar color classes based on percentage
      if (progressPercentage > 90) {
        budgetProgressEl.classList.add('danger');
      } else if (progressPercentage > 75) {
        budgetProgressEl.classList.add('warning');
      }
    }
  }

  calculateBudgetTotals() {
    if (!this.budgetData || !this.budgetData.categories) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        spentPercentage: 0
      };
    }

    const categories = this.budgetData.categories;
    let totalBudget = 0;
    let totalSpent = 0;

    // Sum up all categories
    Object.values(categories).forEach(category => {
      totalBudget += category.budget || 0;
      totalSpent += category.spent || 0;
    });

    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      spentPercentage
    };
  }

  updateSpendingSummaryCards() {
    if (!this.budgetData) return;

    const totals = this.calculateBudgetTotals();
    const currentDate = new Date();
    const currentMonth = this.currentMonth;
    
    // Calculate days in current month and days left
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = currentDate.getDate();
    const daysLeft = Math.max(0, daysInMonth - currentDay);
    
    // Calculate weekly average spending (more meaningful than daily)
    const daysElapsed = Math.max(1, currentDay); // Avoid division by zero
    const weeksElapsed = Math.max(0.1, daysElapsed / 7); // At least 0.1 week to avoid zero division
    const weeklyAverage = totals.totalSpent / weeksElapsed;
    
    // Calculate improved monthly projection
    const weeksInMonth = daysInMonth / 7;
    const projectedFromWeekly = weeklyAverage * weeksInMonth;
    
    // Alternative projection: blend weekly projection with daily rate
    const dailyRate = totals.totalSpent / daysElapsed;
    const projectedFromDaily = dailyRate * daysInMonth;
    
    // Use weighted average: 70% weekly pattern + 30% daily pattern for better accuracy
    const monthlyProjection = (projectedFromWeekly * 0.7) + (projectedFromDaily * 0.3);
    
    // Update weekly average (renamed from daily)
    const weeklyAverageEl = document.getElementById('dailyAverageAmount'); // Keep same ID for compatibility
    const weeklyTrendEl = document.getElementById('dailyAverageTrend');
    
    if (weeklyAverageEl) {
      weeklyAverageEl.textContent = this.formatRupiah(weeklyAverage);
    }
    
    if (weeklyTrendEl) {
      // Show trend based on budget efficiency (weekly basis)
      const budgetWeeklyTarget = totals.totalBudget / weeksInMonth;
      const trendPercentage = budgetWeeklyTarget > 0 ? ((weeklyAverage - budgetWeeklyTarget) / budgetWeeklyTarget) * 100 : 0;
      
      if (Math.abs(trendPercentage) < 10) {
        weeklyTrendEl.textContent = 'Sesuai target';
        weeklyTrendEl.className = 'card-trend neutral';
      } else if (trendPercentage < 0) {
        weeklyTrendEl.textContent = `${Math.abs(trendPercentage).toFixed(0)}% di bawah target`;
        weeklyTrendEl.className = 'card-trend positive';
      } else {
        weeklyTrendEl.textContent = `${trendPercentage.toFixed(0)}% di atas target`;
        weeklyTrendEl.className = 'card-trend negative';
      }
    }
    
    // Update days left
    const daysLeftEl = document.getElementById('daysLeftCount');
    if (daysLeftEl) {
      daysLeftEl.textContent = `${daysLeft} hari`;
    }
    
    // Update monthly projection with improved calculation
    const projectionEl = document.getElementById('monthlyProjectionAmount');
    if (projectionEl) {
      projectionEl.textContent = this.formatRupiah(monthlyProjection);
      
      // Enhanced warning logic with better thresholds
      projectionEl.className = 'projection-amount';
      if (totals.totalBudget > 0) {
        const projectionRatio = monthlyProjection / totals.totalBudget;
        if (projectionRatio > 1.2) {
          projectionEl.classList.add('danger');
        } else if (projectionRatio > 1.05) {
          projectionEl.classList.add('warning');
        } else {
          projectionEl.classList.add('safe');
        }
      }
    }
  }

  updateSmartInsights() {
    const insightsList = document.getElementById('insightsList');
    
    if (!insightsList) return;
    
    if (!this.budgetData || !this.budgetData.categories) {
      insightsList.innerHTML = `
        <div class="insights-empty">
          <div class="empty-icon">🧠</div>
          <p>Belum ada data untuk dianalisis</p>
          <p>Tambahkan budget dan expense untuk mendapatkan insights</p>
        </div>
      `;
      return;
    }

    const insights = this.generateSmartInsights();
    
    if (insights.length === 0) {
      insightsList.innerHTML = `
        <div class="insights-empty">
          <div class="empty-icon">✨</div>
          <p>Semua terlihat baik!</p>
          <p>Tidak ada insights khusus untuk ditampilkan saat ini</p>
        </div>
      `;
      return;
    }

    insightsList.innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-description">${insight.description}</div>
          ${insight.action ? `<a href="#" class="insight-action">${insight.action}</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  generateSmartInsights() {
    const insights = [];
    const totals = this.calculateBudgetTotals();
    const categories = this.budgetData.categories || {};
    
    // Analyze spending patterns
    const currentDate = new Date();
    const [year, month] = this.currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysElapsed = currentDate.getDate();
    
    // Budget efficiency insight
    if (totals.totalBudget > 0 && totals.spentPercentage > 0) {
      const efficiency = (daysElapsed / daysInMonth) * 100;
      const spentPercentage = totals.spentPercentage;
      
      if (spentPercentage > efficiency + 15) {
        insights.push({
          type: 'danger',
          icon: '⚠️',
          title: 'Spending terlalu cepat!',
          description: `Anda sudah menggunakan ${spentPercentage.toFixed(0)}% budget di ${efficiency.toFixed(0)}% bulan ini. Pertimbangkan untuk mengurangi pengeluaran.`,
          action: 'Lihat detail kategori'
        });
      } else if (spentPercentage < efficiency - 15) {
        insights.push({
          type: 'success',
          icon: '🎉',
          title: 'Budget management sangat baik!',
          description: `Anda masih hemat! Hanya menggunakan ${spentPercentage.toFixed(0)}% budget di ${efficiency.toFixed(0)}% bulan ini.`,
          action: 'Lihat peluang saving'
        });
      }
    }
    
    // Category-specific insights
    Object.entries(categories).forEach(([categoryKey, categoryData]) => {
      const spent = categoryData.spent || 0;
      const budget = categoryData.budget || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const categoryName = this.formatCategoryName(categoryKey);
      
      if (percentage > 90 && budget > 0) {
        insights.push({
          type: 'warning',
          icon: '💸',
          title: `Budget ${categoryName} hampir habis`,
          description: `Sudah menggunakan ${percentage.toFixed(0)}% dari budget ${categoryName} (${this.formatRupiah(spent)} / ${this.formatRupiah(budget)}).`,
          action: 'Atur ulang budget'
        });
      } else if (percentage > 100) {
        insights.push({
          type: 'danger',
          icon: '🚨',
          title: `Budget ${categoryName} sudah melebihi!`,
          description: `Pengeluaran ${categoryName} sudah ${percentage.toFixed(0)}% dari budget yang ditetapkan.`,
          action: 'Review pengeluaran'
        });
      }
    });
    
    // Note: Spending frequency insights would require expense data - can be added later if needed
    
    // Monthly projection insight with improved calculation
    const weeksElapsed = Math.max(0.1, daysElapsed / 7);
    const weeklyAverage = totals.totalSpent / weeksElapsed;
    const weeksInMonth = daysInMonth / 7;
    const projectedFromWeekly = weeklyAverage * weeksInMonth;
    const dailyRate = totals.totalSpent / Math.max(1, daysElapsed);
    const monthlyProjection = (projectedFromWeekly * 0.7) + (dailyRate * daysInMonth * 0.3);
    
    if (monthlyProjection > totals.totalBudget * 1.2 && totals.totalBudget > 0) {
      insights.push({
        type: 'warning',
        icon: '🔮',
        title: 'Proyeksi melebihi budget',
        description: `Berdasarkan pola spending saat ini, proyeksi total bulan ini ${this.formatRupiah(monthlyProjection)} akan melebihi budget ${this.formatRupiah(totals.totalBudget)}.`,
        action: 'Lihat rekomendasi'
      });
    }
    
    // Day of month insights
    const daysLeft = daysInMonth - daysElapsed;
    if (daysLeft <= 7 && totals.totalBudget > 0) {
      const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
      const dailyAllowance = remaining / Math.max(1, daysLeft);
      
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'Mendekati akhir bulan',
        description: `Tersisa ${daysLeft} hari dengan budget ${this.formatRupiah(remaining)}. Alokasi harian: ${this.formatRupiah(dailyAllowance)}.`,
        action: 'Planning pengeluaran'
      });
    }
    
    return insights.slice(0, 4); // Limit to top 4 insights
  }

  updateQuickStats() {
    if (!this.budgetData) return;

    // Remove loading states
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
      item.classList.remove('loading');
    });

    const totals = this.calculateBudgetTotals();
    const currentDate = new Date();
    const [year, month] = this.currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysElapsed = currentDate.getDate();
    
    // Calculate Budget Efficiency
    this.updateBudgetEfficiencyStat(totals, daysElapsed, daysInMonth);
    
    // Calculate Savings Potential
    this.updateSavingsPotentialStat(totals, daysElapsed, daysInMonth);
    
    // Calculate Spending Trend
    this.updateSpendingTrendStat(totals, daysElapsed, daysInMonth);
    
    // Calculate Goal Progress
    this.updateGoalProgressStat(totals);
  }
  
  updateBudgetEfficiencyStat(totals, daysElapsed, daysInMonth) {
    const efficiencyEl = document.getElementById('budgetEfficiency');
    const descriptionEl = document.getElementById('efficiencyDescription');
    
    if (!efficiencyEl || !descriptionEl) return;
    
    if (totals.totalBudget === 0) {
      efficiencyEl.textContent = 'N/A';
      efficiencyEl.className = 'stat-value';
      descriptionEl.textContent = 'Set up budget first';
      return;
    }
    
    const timeProgress = (daysElapsed / daysInMonth) * 100;
    const spentProgress = totals.spentPercentage;
    const efficiency = Math.max(0, 100 - Math.abs(spentProgress - timeProgress));
    
    efficiencyEl.textContent = `${efficiency.toFixed(0)}%`;
    
    if (efficiency >= 80) {
      efficiencyEl.className = 'stat-value positive';
      descriptionEl.textContent = 'Excellent budget management!';
    } else if (efficiency >= 60) {
      efficiencyEl.className = 'stat-value';
      descriptionEl.textContent = 'Good budget control';
    } else {
      efficiencyEl.className = 'stat-value warning';
      descriptionEl.textContent = 'Room for improvement';
    }
  }
  
  updateSavingsPotentialStat(totals, daysElapsed, daysInMonth) {
    const savingsEl = document.getElementById('savingsPotential');
    const descriptionEl = document.getElementById('savingsDescription');
    
    if (!savingsEl || !descriptionEl) return;
    
    if (totals.totalBudget === 0) {
      savingsEl.textContent = 'Rp 0';
      savingsEl.className = 'stat-value';
      descriptionEl.textContent = 'Set up budget first';
      return;
    }
    
    const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
    const daysLeft = Math.max(1, daysInMonth - daysElapsed);
    const currentDailyRate = daysElapsed > 0 ? totals.totalSpent / daysElapsed : 0;
    const optimalDailyRate = totals.totalBudget / daysInMonth;
    const potentialSavings = Math.max(0, remaining - (optimalDailyRate * daysLeft));
    
    savingsEl.textContent = this.formatRupiah(potentialSavings);
    
    if (potentialSavings > totals.totalBudget * 0.1) {
      savingsEl.className = 'stat-value positive';
      descriptionEl.textContent = 'Great saving opportunity!';
    } else if (potentialSavings > 0) {
      savingsEl.className = 'stat-value';
      descriptionEl.textContent = 'Moderate savings possible';
    } else {
      savingsEl.className = 'stat-value negative';
      descriptionEl.textContent = 'Consider reducing expenses';
    }
  }
  
  updateSpendingTrendStat(totals, daysElapsed, daysInMonth) {
    const trendEl = document.getElementById('spendingTrend');
    const descriptionEl = document.getElementById('trendDescription');
    
    if (!trendEl || !descriptionEl) return;
    
    // For spending trend, we'll use budget efficiency as proxy
    const dailyBudgetTarget = totals.totalBudget / daysInMonth;
    const currentDailySpend = daysElapsed > 0 ? totals.totalSpent / daysElapsed : 0;
    
    if (currentDailySpend > dailyBudgetTarget * 1.2) {
      trendEl.textContent = 'Increasing';
      trendEl.className = 'stat-value negative';
      descriptionEl.textContent = 'Spending above target';
    } else if (currentDailySpend < dailyBudgetTarget * 0.8) {
      trendEl.textContent = 'Decreasing';
      trendEl.className = 'stat-value positive';
      descriptionEl.textContent = 'Spending below target';
    } else {
      trendEl.textContent = 'Stable';
      trendEl.className = 'stat-value';
      descriptionEl.textContent = 'Spending on target';
    }
  }
  
  updateGoalProgressStat(totals) {
    const goalEl = document.getElementById('goalProgress');
    const descriptionEl = document.getElementById('goalDescription');
    
    if (!goalEl || !descriptionEl) return;
    
    if (totals.totalBudget === 0) {
      goalEl.textContent = '0%';
      goalEl.className = 'stat-value';
      descriptionEl.textContent = 'Set budget goals first';
      return;
    }
    
    // Goal is to stay within budget
    const goalProgress = Math.min(100, 100 - totals.spentPercentage);
    
    goalEl.textContent = `${Math.max(0, goalProgress).toFixed(0)}%`;
    
    if (goalProgress >= 80) {
      goalEl.className = 'stat-value positive';
      descriptionEl.textContent = 'Excellent progress towards goal!';
    } else if (goalProgress >= 60) {
      goalEl.className = 'stat-value';
      descriptionEl.textContent = 'Good progress, keep it up';
    } else if (goalProgress >= 30) {
      goalEl.className = 'stat-value warning';
      descriptionEl.textContent = 'Need to be more careful';
    } else {
      goalEl.className = 'stat-value negative';
      descriptionEl.textContent = 'Over budget, take action';
    }
  }


  updateCategoryAccordion() {
    const accordionContainer = document.getElementById('categoryAccordion');
    if (!accordionContainer) return;

    if (!this.budgetData || !this.budgetData.categories || Object.keys(this.budgetData.categories).length === 0) {
      // Show empty state for accordion
      accordionContainer.innerHTML = `
        <div class="chart-empty-state">
          <div class="chart-empty-icon">📊</div>
          <p>Belum ada data kategori</p>
          <p class="chart-empty-subtitle">Tambahkan expense untuk melihat breakdown kategori</p>
        </div>
      `;
      return;
    }

    const categories = this.budgetData.categories;
    
    // Sort categories: overbudget risk first, then by percentage
    const sortedCategories = Object.entries(categories)
      .filter(([_, data]) => data.spent > 0 || data.budget > 0)
      .sort((a, b) => {
        const percentageA = a[1].budget > 0 ? (a[1].spent / a[1].budget) * 100 : 0;
        const percentageB = b[1].budget > 0 ? (b[1].spent / b[1].budget) * 100 : 0;
        
        // Overbudget categories first
        if (percentageA >= 100 && percentageB < 100) return -1;
        if (percentageA < 100 && percentageB >= 100) return 1;
        
        // Then by highest percentage
        return percentageB - percentageA;
      });

    const categoryItems = sortedCategories
      .map(([category, data]) => {
        const percentage = data.budget > 0 ? Math.min(100, (data.spent / data.budget) * 100) : 0;
        const healthStatus = this.getCategoryHealthStatus(percentage);
        return `
          <div class="category-accordion-item" data-category="${category}">
            <div class="category-header" onclick="window.DashboardManager.toggleCategoryAccordion('${category}')">
              <div class="category-info">
                <span class="category-icon">${this.getCategoryIcon(category)}</span>
                <span class="category-name">${this.formatCategoryName(category)}</span>
                <span class="category-health-indicator ${healthStatus.class}">${healthStatus.indicator}</span>
              </div>
              <div class="category-amounts">
                <span class="category-spent">${this.formatRupiah(data.spent)}</span>
                <span class="category-budget">/ ${this.formatRupiah(data.budget)}</span>
              </div>
              <div class="category-percentage ${healthStatus.class}">${percentage.toFixed(0)}%</div>
              <span class="accordion-arrow">▼</span>
            </div>
            <div class="category-content" id="content-${category}">
              <div class="category-expenses">
                <!-- Expenses will be loaded here -->
              </div>
            </div>
          </div>
        `;
      }).join('');

    if (sortedCategories.length === 0) {
      accordionContainer.innerHTML = `
        <div class="chart-empty-state">
          <div class="chart-empty-icon">💰</div>
          <p>Belum ada pengeluaran bulan ini</p>
          <p class="chart-empty-subtitle">Mulai tracking expense untuk melihat breakdown</p>
        </div>
      `;
    } else {
      accordionContainer.innerHTML = `
        <div class="category-accordion-list">
          ${categoryItems}
        </div>
      `;
    }
  }

  async toggleCategoryAccordion(category) {
    const item = document.querySelector(`[data-category="${category}"]`);
    const content = document.getElementById(`content-${category}`);
    const arrow = item.querySelector('.accordion-arrow');
    
    if (!item || !content) return;

    // Check if this category is currently expanded
    const isExpanded = content.classList.contains('expanded');
    
    // Collapse all other categories first (auto-collapse behavior)
    document.querySelectorAll('.category-content.expanded').forEach(el => {
      el.classList.remove('expanded');
      el.style.maxHeight = '0';
    });
    
    document.querySelectorAll('.category-accordion-item.active').forEach(el => {
      el.classList.remove('active');
    });
    
    document.querySelectorAll('.accordion-arrow').forEach(el => {
      el.textContent = '▼';
    });
    
    // If this category was not expanded, expand it
    if (!isExpanded) {
      item.classList.add('active');
      content.classList.add('expanded');
      arrow.textContent = '▲';
      
      // Load expenses for this category
      await this.loadCategoryExpenses(category, content);
      
      // Animate expansion
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  async loadCategoryExpenses(category, contentElement) {
    const expensesContainer = contentElement.querySelector('.category-expenses');
    
    if (!expensesContainer) {
      console.error('❌ expensesContainer not found');
      return;
    }
    
    // Show skeleton loading state
    expensesContainer.innerHTML = `
      <div class="category-skeleton">
        <div class="expense-skeleton">
          <div class="expense-skeleton-left">
            <div class="expense-skeleton-icon"></div>
            <div class="expense-skeleton-info">
              <div class="expense-skeleton-title"></div>
              <div class="expense-skeleton-date"></div>
            </div>
          </div>
          <div class="expense-skeleton-amount"></div>
        </div>
        <div class="expense-skeleton">
          <div class="expense-skeleton-left">
            <div class="expense-skeleton-icon"></div>
            <div class="expense-skeleton-info">
              <div class="expense-skeleton-title"></div>
              <div class="expense-skeleton-date"></div>
            </div>
          </div>
          <div class="expense-skeleton-amount"></div>
        </div>
        <div class="expense-skeleton">
          <div class="expense-skeleton-left">
            <div class="expense-skeleton-icon"></div>
            <div class="expense-skeleton-info">
              <div class="expense-skeleton-title"></div>
              <div class="expense-skeleton-date"></div>
            </div>
          </div>
          <div class="expense-skeleton-amount"></div>
        </div>
      </div>
    `;
    
    try {
      if (!window.auth?.currentUser) {
        expensesContainer.innerHTML = `
          <div class="no-expenses">
            <p>Harap login terlebih dahulu</p>
          </div>
        `;
        return;
      }
      
      const expensesRef = window.FirebaseUtils.getUserExpensesRef();
      const snapshot = await expensesRef
        .where('month', '==', this.currentMonth)
        .where('category', '==', category.toUpperCase())
        .get();
      
      const expenses = [];
      snapshot.forEach(doc => {
        expenses.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort expenses by date (newest first)
      expenses.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      
      if (expenses.length === 0) {
        expensesContainer.innerHTML = `
          <div class="no-expenses">
            <p>Belum ada pengeluaran di kategori ini</p>
          </div>
        `;
        return;
      }
      
      const expenseItems = expenses.map(expense => {
        const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
        const formattedDate = this.formatSmartDate(expenseDate);
        
        return `
          <div class="expense-detail-item">
            <div class="expense-detail-info">
              <span class="expense-detail-name">${expense.description || 'Pengeluaran'}</span>
              <span class="expense-detail-date">${formattedDate}</span>
            </div>
            <div class="expense-detail-amount">${this.formatRupiah(expense.amount)}</div>
          </div>
        `;
      }).join('');
      
      expensesContainer.innerHTML = `
        <div class="expenses-list">
          ${expenseItems}
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading category expenses:', error);
      expensesContainer.innerHTML = `
        <div class="error-expenses">
          <p>Gagal memuat data pengeluaran</p>
        </div>
      `;
    }
  }

  formatSmartDate(date) {
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
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  }

  updateMonthSelector(selectedMonth) {
    const monthSelector = document.getElementById('monthSelector');
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
  }

  generateMonthOptions() {
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
        value: monthStr,
        display: displayName
      });
    }

    return months;
  }

  showLoadingStates() {
    // Show skeleton loading for budget overview
    const totalBudget = document.getElementById('totalBudget');
    const totalSpent = document.getElementById('totalSpent');
    const totalRemaining = document.getElementById('totalRemaining');
    const budgetProgress = document.getElementById('budgetProgress');

    // Replace budget amounts with skeleton
    [totalBudget, totalSpent, totalRemaining].forEach(el => {
      if (el) {
        el.innerHTML = '<div class="skeleton skeleton-budget-item"></div>';
      }
    });

    // Show skeleton for progress bar
    if (budgetProgress) {
      budgetProgress.className = 'skeleton skeleton-progress-bar';
      budgetProgress.style.width = '100%';
    }


    // Show skeleton for category chart
    const categoryChart = document.getElementById('categoryChart');
    if (categoryChart) {
      categoryChart.innerHTML = '<div class="skeleton skeleton-chart"></div>';
    }

    // Show skeleton loading for spending summary cards
    const spendingCards = document.querySelectorAll('.spending-card .card-value');
    spendingCards.forEach(card => {
      card.innerHTML = '<div class="skeleton skeleton-budget-item"></div>';
    });

    // Show skeleton loading for smart insights
    const insightsList = document.getElementById('insightsList');
    if (insightsList) {
      insightsList.innerHTML = '<div class="skeleton skeleton-chart"></div>';
    }

    // Show skeleton loading for quick stats
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
      item.classList.add('loading');
    });
  }

  showErrorState(message) {
    // Error states now handled by individual components
    console.error('Dashboard error:', message);
  }

  // Helper methods
  formatRupiah(amount) {
    if (amount === null || amount === undefined) return 'Rp 0';
    
    // Use Indonesian number formatting
    const formatted = Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }

  formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  getCategoryIcon(category) {
    const icons = {
      'FOOD': '🍽️',
      'SNACK': '🍿',
      'HOUSEHOLD': '🏠',
      'FRUIT': '🍎',
      'TRANSPORT': '🚗',
      'ENTERTAINMENT': '🎮',
      'HEALTH': '🏥',
      'EDUCATION': '📚',
      'SHOPPING': '🛒',
      'BILLS': '📄',
      'OTHER': '💰'
    };
    return icons[category?.toUpperCase()] || '💰';
  }

  formatCategoryName(category) {
    const names = {
      'FOOD': 'Makanan',
      'SNACK': 'Jajan',
      'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan',
      'TRANSPORT': 'Transportasi',
      'ENTERTAINMENT': 'Hiburan',
      'HIBURAN': 'Hiburan', // Added mapping for existing data
      'HEALTH': 'Kesehatan',
      'EDUCATION': 'Pendidikan',
      'SHOPPING': 'Belanja',
      'BILLS': 'Tagihan',
      'OTHER': 'Lainnya'
    };
    return names[category?.toUpperCase()] || category || 'Lainnya';
  }

  getCategoryHealthStatus(percentage) {
    if (percentage <= 70) {
      return {
        class: 'budget-safe',
        indicator: '🟢',
        text: 'Masih aman'
      };
    } else if (percentage <= 90) {
      return {
        class: 'budget-warning',
        indicator: '🟡',
        text: 'Perlu hati-hati'
      };
    } else {
      return {
        class: 'budget-danger',
        indicator: '🔴',
        text: 'Budget hampir habis'
      };
    }
  }

  // ===== CONSOLIDATED DASHBOARD METHODS =====
  
  updateConsolidatedBudgetStatus() {
    console.log('🔍 DEBUG - updateConsolidatedBudgetStatus called');
    console.log('🔍 Budget data exists:', !!this.budgetData);
    
    // Original budget status card styling (no enhancements)
    
    if (!this.budgetData) {
      console.warn('⚠️ No budget data available, using default values');
      // Use default empty data
      const emptyTotals = {
        totalBudget: 0,
        totalSpent: 0,
        spentPercentage: 0
      };
      this.updateHorizontalProgress(emptyTotals);
      this.updateBudgetHealthIndicator(0);
      this.updateConsolidatedQuickStats(emptyTotals);
      return;
    }

    const totals = this.calculateBudgetTotals();
    console.log('🔍 Calculated totals:', totals);
    
    // Update horizontal progress bar
    this.updateHorizontalProgress(totals);
    
    // Update budget health indicator
    this.updateBudgetHealthIndicator(totals.spentPercentage);
    
    // Update quick stats in consolidated card
    this.updateConsolidatedQuickStats(totals);
  }
  
  updateHorizontalProgress(totals) {
    const progressBarFill = document.getElementById('progressBarFill');
    const spentEl = document.getElementById('totalSpent');
    const budgetLabelEl = document.getElementById('totalBudgetLabel');
    const percentageEl = document.getElementById('budgetPercentage');
    const statusTextEl = document.getElementById('budgetStatusText');
    
    console.log('🔍 DEBUG - updateHorizontalProgress elements:', {
      progressBarFill: !!progressBarFill,
      spentEl: !!spentEl,
      budgetLabelEl: !!budgetLabelEl,
      percentageEl: !!percentageEl,
      statusTextEl: !!statusTextEl
    });
    
    if (!progressBarFill) {
      console.warn('⚠️ progressBarFill element not found, skipping bar progress update');
      return;
    }
    
    const percentage = Math.min(100, totals.spentPercentage);
    
    // Animate progress bar width
    progressBarFill.style.width = `${percentage}%`;
    
    // Update colors and classes based on budget health
    let barClasses = 'progress-bar-fill';
    let statusText = 'Masih aman';
    
    if (percentage >= 90) {
      barClasses += ' danger';
      statusText = 'Budget hampir habis';
    } else if (percentage >= 70) {
      barClasses += ' warning';
      statusText = 'Perlu hati-hati';
    } else {
      barClasses += ' safe';
      statusText = 'Masih aman';
    }
    
    progressBarFill.className = barClasses;
    
    // Update info elements
    if (spentEl) spentEl.textContent = this.formatRupiah(totals.totalSpent);
    if (budgetLabelEl) budgetLabelEl.textContent = `/ ${this.formatRupiah(totals.totalBudget)}`;
    if (percentageEl) percentageEl.textContent = `${percentage.toFixed(0)}%`;
    if (statusTextEl) statusTextEl.textContent = statusText;
  }
  
  updateBudgetHealthIndicator(spentPercentage) {
    const indicatorEl = document.getElementById('budgetHealthIndicator');
    if (!indicatorEl) return;
    
    // Original health indicator styling
    
    if (spentPercentage >= 90) {
      indicatorEl.textContent = '🔴';
      indicatorEl.title = 'Budget hampir habis';
    } else if (spentPercentage >= 70) {
      indicatorEl.textContent = '🟡';
      indicatorEl.title = 'Perlu hati-hati';
    } else {
      indicatorEl.textContent = '🟢';
      indicatorEl.title = 'Masih aman';
    }
  }
  
  updateConsolidatedQuickStats(totals) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const daysLeft = Math.max(0, daysInMonth - daysElapsed);
    
    // Use consistent weekly calculation logic
    const weeksElapsed = Math.max(0.1, daysElapsed / 7);
    const weeklyAverage = totals.totalSpent / weeksElapsed;
    const weeksInMonth = daysInMonth / 7;
    
    // Improved projection calculation
    const projectedFromWeekly = weeklyAverage * weeksInMonth;
    const dailyRate = totals.totalSpent / daysElapsed;
    const projectedFromDaily = dailyRate * daysInMonth;
    const monthlyProjection = (projectedFromWeekly * 0.7) + (projectedFromDaily * 0.3);
    
    const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
    
    // Original quick stats styling
    
    // Update consolidated quick stats
    const weeklyAvgEl = document.getElementById('dailyAverageAmount');
    const projectionEl = document.getElementById('monthlyProjectionAmount'); 
    const daysLeftEl = document.getElementById('daysLeftCount');
    const remainingEl = document.getElementById('totalRemaining');
    
    if (weeklyAvgEl) weeklyAvgEl.textContent = this.formatRupiah(weeklyAverage);
    if (projectionEl) {
      projectionEl.textContent = this.formatRupiah(monthlyProjection);
      projectionEl.className = 'stat-value';
      
      // Enhanced projection status
      if (totals.totalBudget > 0) {
        const ratio = monthlyProjection / totals.totalBudget;
        if (ratio > 1.2) {
          projectionEl.classList.add('danger');
        } else if (ratio > 1.05) {
          projectionEl.classList.add('warning');
        } else {
          projectionEl.classList.add('safe');
        }
      }
    }
    if (daysLeftEl) daysLeftEl.textContent = `${daysLeft} hari`;
    if (remainingEl) {
      remainingEl.textContent = this.formatRupiah(remaining);
      remainingEl.className = 'stat-value';
      if (remaining <= 0) {
        remainingEl.classList.add('danger');
      }
    }
  }
  
  updateFinancialIntelligence() {
    // Original financial intelligence panel styling
    
    // Update both insights and metrics in the tabbed interface
    this.updateSmartInsights();
    this.updateConsolidatedMetrics();
  }
  
  updateConsolidatedMetrics() {
    if (!this.budgetData) return;
    
    const totals = this.calculateBudgetTotals();
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    
    // Original metrics grid styling
    
    // Budget Efficiency
    const timeProgress = (daysElapsed / daysInMonth) * 100;
    const spentProgress = totals.spentPercentage;
    const efficiency = Math.max(0, 100 - Math.abs(spentProgress - timeProgress));
    
    // Savings Potential  
    const remaining = Math.max(0, totals.totalBudget - totals.totalSpent);
    const daysLeft = daysInMonth - daysElapsed;
    const savingsPotential = daysLeft > 0 ? remaining / daysLeft : 0;
    
    // Spending Trend
    const dailyAverage = daysElapsed > 0 ? totals.totalSpent / daysElapsed : 0;
    const expectedDaily = totals.totalBudget / daysInMonth;
    let trend = 'Stable';
    if (dailyAverage > expectedDaily * 1.1) trend = 'Increasing';
    else if (dailyAverage < expectedDaily * 0.9) trend = 'Decreasing';
    
    // Goal Progress
    const goalProgress = Math.min(100, (timeProgress - spentProgress + 100) / 2);
    
    // Update UI elements
    const efficiencyEl = document.getElementById('budgetEfficiency');
    const savingsEl = document.getElementById('savingsPotential');
    const trendEl = document.getElementById('spendingTrend');
    const goalEl = document.getElementById('goalProgress');
    
    if (efficiencyEl) {
      efficiencyEl.textContent = `${efficiency.toFixed(0)}%`;
      efficiencyEl.className = 'metric-value';
      if (efficiency >= 80) efficiencyEl.classList.add('success');
      else if (efficiency < 60) efficiencyEl.classList.add('warning');
    }
    
    if (savingsEl) {
      savingsEl.textContent = this.formatRupiah(savingsPotential * 7); // Weekly potential
      savingsEl.className = 'metric-value';
      if (savingsPotential > 50000) savingsEl.classList.add('success');
    }
    
    if (trendEl) {
      trendEl.textContent = trend;
      trendEl.className = 'metric-value';
      if (trend === 'Decreasing') trendEl.classList.add('success');
      else if (trend === 'Increasing') trendEl.classList.add('warning');
    }
    
    if (goalEl) {
      goalEl.textContent = `${goalProgress.toFixed(0)}%`;
      goalEl.className = 'metric-value';
      if (goalProgress >= 80) goalEl.classList.add('success');
      else if (goalProgress < 50) goalEl.classList.add('warning');
    }
  }
  
  setupIntelligenceTabs() {
    const insightsTab = document.getElementById('insightsTab');
    const metricsTab = document.getElementById('metricsTab');
    const insightsContent = document.getElementById('insights-content');
    const metricsContent = document.getElementById('metrics-content');
    
    if (!insightsTab || !metricsTab) return;
    
    // Original tabs styling
    
    // Remove existing listeners to prevent duplicates
    insightsTab.replaceWith(insightsTab.cloneNode(true));
    metricsTab.replaceWith(metricsTab.cloneNode(true));
    
    // Get fresh references and apply enhanced classes
    const newInsightsTab = document.getElementById('insightsTab');
    const newMetricsTab = document.getElementById('metricsTab');
    
    // Original tab buttons styling
    
    newInsightsTab.addEventListener('click', () => {
      newInsightsTab.classList.add('active');
      newMetricsTab.classList.remove('active');
      if (insightsContent) insightsContent.classList.add('active');
      if (metricsContent) metricsContent.classList.remove('active');
    });
    
    newMetricsTab.addEventListener('click', () => {
      newMetricsTab.classList.add('active');  
      newInsightsTab.classList.remove('active');
      if (metricsContent) metricsContent.classList.add('active');
      if (insightsContent) insightsContent.classList.remove('active');
    });
  }

  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Public method to refresh dashboard
  async refresh() {
    await this.loadDashboard();
  }
}

// Initialize DashboardManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DOM LOADED - Checking critical elements...');
  
  // Check for critical elements
  const criticalElements = [
    'progressBarFill',
    'totalSpent', 
    'totalBudgetLabel',
    'budgetPercentage',
    'budgetStatusText',
    'insightsTab',
    'metricsTab'
  ];
  
  criticalElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`✅ ${id}: FOUND`);
    } else {
      console.error(`❌ ${id}: MISSING - This will cause errors!`);
    }
  });
  
  console.log('🎯 Creating DashboardManager instance...');
  window.DashboardManager = new DashboardManager();
});

// Auto-load dashboard when user is authenticated
document.addEventListener('userAuthenticated', () => {
  console.log('🔍 DEBUG - userAuthenticated event triggered');
  console.log('🔍 DashboardManager available:', !!window.DashboardManager);
  
  if (window.DashboardManager) {
    console.log('🚀 Calling loadDashboard from userAuthenticated event');
    window.DashboardManager.loadDashboard();
  } else {
    console.error('❌ DashboardManager not available when userAuthenticated fired');
  }
});

console.log('📊 Dashboard module loaded - Consolidated Design v1.0');