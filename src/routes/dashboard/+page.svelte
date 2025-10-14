<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore, userStore, userProfileStore } from '$stores/auth';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { selectedPeriodStore } from '$lib/stores/period';
  import { goto } from '$app/navigation';
  import { formatRupiah } from '$utils/index';
  import {
    checkBudgetSetup,
    getPlayfulBudgetStatus,
    calculateDaysLeft
  } from '$lib/utils/budgetHelpers';
  import {
    formatDate,
    formatCategoryName,
    getCategoryIcon,
    getPlayfulCategoryIcon,
    getPlayfulCategoryMessage,
    timestampToDate
  } from '$lib/utils/formatters';
  import { SCROLL_CONFIG, BUDGET_THRESHOLDS, UI_CONFIG } from '$lib/config/dashboard.config';
  import { generatePeriods, formatPeriodDisplay, type PeriodGeneratorConfig } from '$lib/utils/periodHelpers';
  import { fly } from 'svelte/transition';
  import type { User as FirebaseUser } from 'firebase/auth';
  import type { UserProfile } from '$stores/auth';
  import type {
    BudgetStatus,
    BudgetData,
    Expense,
    Transaction,
    CategoryAttention,
    DashboardMetrics
  } from '$lib/types/dashboard.types';

  // Components
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import FintechCard from '$lib/components/ui/FintechCard.svelte';
  import FintechButton from '$lib/components/ui/FintechButton.svelte';
  import FintechProgress from '$lib/components/ui/FintechProgress.svelte';
  import FinancialHeroCard from '$lib/components/dashboard/FinancialHeroCard_Final.svelte';
  import PeriodSelector from '$lib/components/dashboard/PeriodSelector.svelte';

  // Dashboard state
  let error: string | null = null;
  let user: FirebaseUser | null = null;
  let userProfile: UserProfile | null = null;
  let currentPeriodId = '';

  // Subscribe to shared period store
  selectedPeriodStore.subscribe((value) => {
    if (value && value !== currentPeriodId) {
      currentPeriodId = value;
      console.log('📅 Dashboard: Period changed from store:', value);
    }
  });

  // Dual-mode support
  let hasBudgetSetup = false;
  let currentPeriod: any = null;

  // Dashboard data
  let budgetData: BudgetData | null = null;
  let expenses: Expense[] = [];
  let recentTransactions: Transaction[] = [];
  let loading = true;

  // Computed values
  let metrics: DashboardMetrics = {
    totalBudget: 0,
    totalSpent: 0,
    percentage: 0,
    remaining: 0,
    budgetStatus: 'safe',
    todaySpending: 0
  };
  let categoriesNeedAttention: CategoryAttention[] = [];

  // Floating button scroll behavior
  let showFloatingButton = true;
  let lastScrollY = 0;
  let scrollThreshold = SCROLL_CONFIG.THRESHOLD;
  let scrollHandlerCleanup: (() => void) | null = null;

  $: if (currentPeriodId) {
    loadDashboardData();
  }

  // Subscribe to stores - DISABLED for dummy data mode
  // $: budgetStore.subscribe((data) => {
  //   if (data && data.month === currentPeriodId) {
  //     budgetData = data;
  //     calculateBudgetMetrics();
  //     loading = false;
  //   }
  // });

  $: expenseStore.subscribe((data) => {
    if (data && data.expenses && data.currentPeriod === currentPeriodId) {
      expenses = data.expenses;
      calculateExpenseMetrics();
      loading = false;
    }
  });

  onMount(() => {
    if (browser) {
      initializeDashboard();
      scrollHandlerCleanup = setupScrollListener();
    }
  });

  onDestroy(() => {
    // Proper cleanup for scroll listener
    if (scrollHandlerCleanup) {
      scrollHandlerCleanup();
    }
  });

  async function initializeDashboard() {
    try {
      userProfileStore.subscribe((profile) => {
        if (profile) {
          userProfile = profile;

          // Check budget setup status (will be re-checked after budget data loads)
          hasBudgetSetup = checkBudgetSetup(profile, budgetData);

          // DON'T set period here - let PeriodSelector handle it
          console.log('📅 Dashboard: Waiting for PeriodSelector to set period');
        }
      });

      authStore.subscribe((isAuthenticated) => {
        if (!isAuthenticated && browser) {
          goto('/');
        }
      });

      userStore.subscribe((userData) => {
        if (userData) {
          user = userData;
        }
      });

    } catch (err) {
      console.error('Dashboard initialization error:', err);
      error = 'Failed to initialize dashboard';
    }
  }

  function updateCurrentPeriodFlexible(profile: UserProfile) {
    const config: PeriodGeneratorConfig = {
      resetDate: profile.budgetResetDate || 25,
      resetType: profile.budgetResetType || 'fixed'
    };

    const periods = generatePeriods(config, 3);
    currentPeriod = periods.find(p => p.isActive) || periods[0];
    currentPeriodId = currentPeriod.id;

    // Save to shared store for cross-page persistence
    selectedPeriodStore.set(currentPeriodId);

    console.log('📅 Current period:', formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate));
  }

  function updateCurrentPeriod() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    currentPeriodId = `${year}-${String(month).padStart(2, '0')}`;

    // Generate period object using default monthly period (1st - end of month)
    const config: PeriodGeneratorConfig = {
      resetDate: 1,  // Default to 1st of month
      resetType: 'fixed'
    };
    const periods = generatePeriods(config, 3);
    currentPeriod = periods.find(p => p.isActive) || periods[0];

    // Save to shared store for cross-page persistence
    selectedPeriodStore.set(currentPeriodId);

    console.log('📅 Using default monthly period:', formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate));
  }

  async function loadDashboardData() {
    try {
      loading = true;

      // TEMPORARY: Load dummy data for development
      loadDummyData();

      // DISABLED: Using dummy data instead of budget store mock
      // if (budgetStore && typeof budgetStore.loadBudgetData === 'function') {
      //   await budgetStore.loadBudgetData(currentPeriodId);
      // }

      // Note: expenseStore loading will be implemented when needed

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async function loadDummyData() {
    // Import centralized dummy data
    const { getDummyBudgetDataForPeriod, generateDummyExpensesForPeriod } = await import('$lib/utils/dummyData');

    // Load expenses for the selected period
    expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);

    // Calculate REAL total from expenses
    const realTotalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate spending per category from actual expenses
    const categorySpending: Record<string, number> = {};
    expenses.forEach((expense: any) => {
      const categoryId = expense.category.toLowerCase();
      categorySpending[categoryId] = (categorySpending[categoryId] || 0) + expense.amount;
    });

    // Load budget data with REAL spent amount per category for this period
    const budgetDummyData = getDummyBudgetDataForPeriod(currentPeriodId, expenses);

    // Update categories with REAL spending from expenses
    const categoriesWithSpending = Object.fromEntries(
      Object.entries(budgetDummyData.categories).map(([catId, catData]: [string, any]) => [
        catId,
        {
          budget: catData.budget,
          spent: categorySpending[catId] || 0  // Use real spending from expenses
        }
      ])
    );

    budgetData = {
      categories: categoriesWithSpending,
      totalBudget: budgetDummyData.totalBudget,
      totalSpent: realTotalSpent, // Use real calculated total
      month: currentPeriodId
    };

    // Re-check budget setup status now that budgetData is loaded
    hasBudgetSetup = checkBudgetSetup(userProfile, budgetData);

    calculateBudgetMetrics();
    calculateExpenseMetrics();
    loading = false;

    console.log(`📊 Dummy data loaded for Dashboard - Period: ${currentPeriodId}`);
    console.log('💰 Real total spent:', realTotalSpent);
    console.log('📊 Category spending:', categorySpending);
    console.log('✅ Budget setup detected:', hasBudgetSetup);
  }

  // Handle period change from PeriodSelector
  function handlePeriodChange(event: CustomEvent<{ periodId: string }>) {
    const newPeriodId = event.detail.periodId;
    console.log(`🔄 Switching to period: ${newPeriodId}`);
    currentPeriodId = newPeriodId;
    selectedPeriodStore.set(currentPeriodId); // Save to shared store for cross-page persistence
    // loadDashboardData will be triggered by the reactive statement
  }

  function calculateBudgetMetrics() {
    if (!budgetData) return;

    const totalBudget = budgetData.totalBudget || 0;
    const totalSpent = budgetData.totalSpent || 0;
    const percentage = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
    const remaining = Math.max(0, totalBudget - totalSpent);

    // Determine budget status using constants
    let budgetStatus: BudgetStatus = 'safe';
    if (percentage >= BUDGET_THRESHOLDS.DANGER) {
      budgetStatus = 'danger';
    } else if (percentage >= BUDGET_THRESHOLDS.WARNING) {
      budgetStatus = 'warning';
    }

    // Update metrics object
    metrics = {
      totalBudget,
      totalSpent,
      percentage,
      remaining,
      budgetStatus,
      todaySpending: metrics.todaySpending
    };

    // Calculate categories that need attention
    categoriesNeedAttention = [];
    if (budgetData.categories) {
      Object.entries(budgetData.categories).forEach(([category, data]: [string, any]) => {
        const categoryPercentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
        if (categoryPercentage >= BUDGET_THRESHOLDS.WARNING) {
          categoriesNeedAttention.push({
            category,
            percentage: categoryPercentage,
            spent: data.spent,
            budget: data.budget,
            status: categoryPercentage >= BUDGET_THRESHOLDS.DANGER ? 'danger' : 'warning'
          });
        }
      });

      // Sort by percentage (highest first)
      categoriesNeedAttention.sort((a, b) => b.percentage - a.percentage);
    }
  }

  function calculateExpenseMetrics() {
    if (!expenses.length) return;

    // Get recent transactions (last 5) using UI config
    recentTransactions = expenses
      .slice()
      .sort((a, b) => {
        const dateA = timestampToDate(a.date);
        const dateB = timestampToDate(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, UI_CONFIG.MAX_RECENT_TRANSACTIONS) as Transaction[];

    // Calculate today's spending
    const today = new Date();
    const todaySpending = expenses
      .filter(expense => {
        const expenseDate = timestampToDate(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Update metrics
    metrics = { ...metrics, todaySpending };
  }


  // Helper functions now imported from utils/formatters.ts and utils/budgetHelpers.ts
  function getBudgetStatusColor(status: BudgetStatus): string {
    const colors = {
      safe: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500'
    };
    return colors[status];
  }

  function getBudgetStatusIcon(status: BudgetStatus): string {
    const icons = {
      safe: '🟢',
      warning: '🟡',
      danger: '🔴'
    };
    return icons[status];
  }

  // Scroll behavior for floating button - improved with proper cleanup
  function setupScrollListener(): (() => void) | null {
    if (!browser) return null;

    // Set initial scroll position
    lastScrollY = window.scrollY;

    // Add scroll event listener with throttling
    let ticking = false;

    function handleScrollThrottled() {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    function handleScroll() {
      if (!browser) return;

      const currentScrollY = window.scrollY;

      // Only hide/show if we've scrolled past threshold
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      // Show button when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < SCROLL_CONFIG.SHOW_SCROLL_THRESHOLD) {
        showFloatingButton = true;
      }
      // Hide button when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > SCROLL_CONFIG.HIDE_SCROLL_THRESHOLD) {
        showFloatingButton = false;
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', handleScrollThrottled, { passive: true });

    // Return cleanup function
    return () => {
      window.removeEventListener('scroll', handleScrollThrottled);
    };
  }
</script>

<svelte:head>
  <title>Dashboard - DuitTrack</title>
  <meta name="description" content="Dashboard keuangan pribadi - lihat budget, pengeluaran, dan insights keuangan Anda." />
</svelte:head>


<AuthGuard requireAuth={true} redirectTo="/" let:user let:isAuthenticated>
  <div class="min-h-screen bg-gray-50">
    {#if error}
      <!-- Error State -->
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p class="text-gray-600 mb-6">{error}</p>
          <button
            on:click={() => window.location.reload()}
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    {:else if user}
      <!-- Dynamic Dashboard Layout -->
      <div class="dashboard-container">

        <!-- Header Section -->
        <div class="dashboard-header">
          <div class="header-content">
            <!-- Page Title -->
            <div class="page-title-section">
              <h1 class="page-title">Dashboard</h1>
            </div>

            <!-- Period Selector -->
            <div class="header-actions">
              <PeriodSelector
                currentPeriodId={currentPeriodId}
                userResetDate={userProfile?.budgetResetDate || 25}
                on:periodChange={handlePeriodChange}
              />
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">

          <!-- NEW FINANCIAL HERO CARD -->
          <div class="hero-card-container">
            <FinancialHeroCard
              {budgetData}
              {expenses}
              {currentPeriodId}
              {currentPeriod}
              {loading}
            />
          </div>




          <!-- Recent Transactions -->
          <div class="transactions-card liquid-card">
            <div class="glass-card-overlay"></div>
            <div class="transactions-header">
              <h3 class="transactions-title">
                <span class="transactions-icon">🕐</span>
                Transaksi Terbaru
              </h3>
              <span class="transactions-count">({recentTransactions.length})</span>
            </div>

            {#if loading}
              <!-- Loading skeleton -->
              <div class="transactions-loading">
                {#each Array(3) as _}
                  <div class="transaction-loading-item">
                    <div class="loading-avatar"></div>
                    <div class="loading-content">
                      <div class="loading-title"></div>
                      <div class="loading-subtitle"></div>
                    </div>
                    <div class="loading-amount"></div>
                  </div>
                {/each}
              </div>
            {:else if recentTransactions.length === 0}
              <div class="empty-transactions">
                <div class="empty-icon">📝</div>
                <p class="empty-title">Belum ada transaksi nih</p>
                <p class="empty-subtitle">Yuk mulai catat pengeluaran! 💪</p>
              </div>
            {:else}
              <div class="transactions-list">
                {#each recentTransactions as transaction, index}
                  {@const transactionDate = timestampToDate(transaction.date)}
                  <div class="transaction-item">
                    <div class="transaction-icon">
                      {getPlayfulCategoryIcon(transaction.category)}
                    </div>
                    <div class="transaction-details">
                      <div class="transaction-description">
                        {transaction.description || getPlayfulCategoryMessage(transaction.category)}
                      </div>
                      <div class="transaction-date">
                        {formatDate(transactionDate)}
                      </div>
                    </div>
                    <div class="transaction-amount">
                      -{formatRupiah(transaction.amount)}
                    </div>
                  </div>
                {/each}

                <button
                  class="view-all-button"
                  on:click={() => goto('/expenses')}
                >
                  Lihat Semua Transaksi 📋
                </button>
              </div>
            {/if}
          </div>

          <!-- Categories Need Attention -->
          <FintechCard
            variant={categoriesNeedAttention.length > 0 ? "warning" : "success"}
            size="md"
            interactive={false}
            className="fintech-fade-in dashboard-category-card"
          >
            <h3 class="text-lg font-semibold fintech-text-primary mb-4">
              {categoriesNeedAttention.length > 0 ? '⚠️ Ada yang perlu diperhatikan nih!' : '🎉 Semua budget terkendali!'}
            </h3>

            {#if loading}
              <!-- Loading skeleton -->
              <div class="space-y-2">
                {#each Array(2) as _}
                  <div class="animate-pulse flex items-center justify-between p-3">
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 bg-gray-200 rounded"></div>
                      <div class="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div class="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                {/each}
              </div>
            {:else if categoriesNeedAttention.length === 0}
              <div class="text-center py-6">
                <div class="text-4xl mb-2">🎉</div>
                <p class="text-sm fintech-text-secondary">Semua budget terkendali!</p>
                <p class="text-xs fintech-text-tertiary mt-1">Keren banget nih! 👏</p>
              </div>
            {:else}
              <div class="space-y-2">
                {#each categoriesNeedAttention as category, index}
                  <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                       class:bg-red-50={category.status === 'danger'}
                       class:bg-yellow-50={category.status === 'warning'}>
                    <div class="flex items-center gap-3">
                      <span class="text-lg">{getPlayfulCategoryIcon(category.category)}</span>
                      <span class="font-medium fintech-text-primary">
                        {formatCategoryName(category.category)}
                      </span>
                    </div>
                    <div class="text-right">
                      <div class="font-bold fintech-text-primary fintech-amount-small">
                        {category.percentage.toFixed(0)}%
                      </div>
                      <div class="text-xs fintech-text-tertiary">
                        {category.status === 'danger' ? 'Kebablasan! 😱' : 'Hati-hati! 👀'}
                      </div>
                    </div>
                  </div>
                {/each}

                <FintechButton
                  variant="primary"
                  fullWidth={true}
                  className="mt-3"
                  on:click={() => goto('/budget')}
                >
                  Lihat Semua Budget 💰
                </FintechButton>
              </div>
            {/if}
          </FintechCard>

        </div>

        <!-- Footer -->
        <footer class="dashboard-footer">
          <div class="footer-content">
            <div class="footer-contact">
              <span class="footer-label">Contact:</span>
              <a href="mailto:tegarerputra@outlook.com" class="footer-email">
                tegarerputra@outlook.com
              </a>
            </div>
          </div>
        </footer>

        <!-- Sticky Bottom Add Expense Button -->
        <div class="sticky-bottom-button" class:button-hidden={!showFloatingButton}>
          <button
            class="add-expense-button"
            on:click={() => goto('/add-expense')}
            type="button"
            aria-label="Tambah pengeluaran baru"
            title="Tambah Expense"
          >
            <div class="button-content">
              <span class="add-icon" aria-hidden="true">+</span>
              <span class="button-text">Tambah Expense</span>
            </div>
            <div class="button-glow" aria-hidden="true"></div>
          </button>
        </div>

      </div>
    {/if}
  </div>
</AuthGuard>

<style>
  /* Dynamic Dashboard Design - Mobile First + Desktop Responsive */

  /* Base Layout Container - Clean White with Subtle Blue Accents */
  .dashboard-container {
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.02) 0%, transparent 40%),
      linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    position: relative;
    overflow: hidden;
  }

  /* Floating Background Accents */
  .dashboard-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.03) 0%, transparent 30%),
      radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.02) 0%, transparent 30%),
      radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.025) 0%, transparent 25%);
    animation: float-accent 20s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  .dashboard-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 120px,
        rgba(240, 240, 240, 0.3) 120px,
        rgba(240, 240, 240, 0.3) 121px
      );
    pointer-events: none;
    z-index: 0;
  }

  /* Responsive Grid Layout */
  .dashboard-grid {
    display: grid;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* Mobile Layout (Default) */
  @media (max-width: 767px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px 16px;
    }
  }

  /* Tablet Layout */
  @media (min-width: 768px) and (max-width: 1023px) {
    .dashboard-grid {
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .hero-card-container {
      grid-column: 1 / -1; /* Full width */
    }
  }

  /* Desktop Layout */
  @media (min-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 2fr 1fr 1fr;
      gap: 24px;
    }

    .hero-card-container {
      grid-row: 1 / 3; /* Span 2 rows */
    }
  }

  /* Header Section */
  .dashboard-header {
    padding: 20px 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(6, 182, 212, 0.1);
    position: relative;
    z-index: 2;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Page Title Section */
  .page-title-section {
    flex-shrink: 0;
  }

  .page-title {
    font-size: 28px;
    font-weight: 800;
    color: #1f2937;
    margin: 0;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1f2937 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(31, 41, 55, 0.1));
  }

  /* Header Actions */
  .header-actions {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  /* Period Selector - Removed old styles, now handled by PeriodSelector component */

  /* HERO CARD - The Star of the Show! */
  /* Hero budget card - restored working version */
  .hero-budget-card {
    position: relative;
    border-radius: 16px;
    padding: 36px;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    cursor: pointer;
    min-height: 320px;
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      0 4px 12px rgba(0, 191, 255, 0.12),
      0 2px 6px rgba(30, 144, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .hero-budget-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.12),
      0 10px 20px rgba(0, 191, 255, 0.15),
      0 4px 8px rgba(30, 144, 255, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(40px) saturate(2.2);
    -webkit-backdrop-filter: blur(40px) saturate(2.2);
  }

  .hero-glass-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .hero-budget-card:hover .hero-glass-overlay {
    opacity: 1;
  }

  /* Hero Gradient Variants - Glassmorphism Style */
  .hero-gradient-safe {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 50%,
      rgba(0, 123, 255, 0.7) 100%);
  }

  .hero-gradient-warning {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.55) 0%,
      rgba(245, 158, 11, 0.65) 50%,
      rgba(217, 119, 6, 0.7) 100%);
  }

  .hero-gradient-danger {
    background: linear-gradient(135deg,
      rgba(244, 114, 182, 0.55) 0%,
      rgba(239, 68, 68, 0.65) 50%,
      rgba(220, 38, 38, 0.7) 100%);
  }

  /* Enhanced Hero Background Elements */
  .hero-bg-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  .hero-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .hero-circle-1 {
    width: 140px;
    height: 140px;
    top: -70px;
    right: -70px;
  }

  .hero-circle-2 {
    width: 100px;
    height: 100px;
    bottom: -50px;
    left: -50px;
  }

  .hero-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
  }

  .hero-glass-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: radial-gradient(circle,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(6, 182, 212, 0.4) 50%,
      transparent 100%);
    border-radius: 50%;
    animation: particle-float 8s ease-in-out infinite;
  }

  .hero-particle-1 {
    top: 25%;
    left: 20%;
    animation-delay: 0s;
  }

  .hero-particle-2 {
    top: 60%;
    right: 25%;
    animation-delay: -3s;
  }

  .hero-particle-3 {
    bottom: 30%;
    left: 60%;
    animation-delay: -6s;
  }

  @keyframes particle-float {
    0%, 100% {
      transform: translateY(0px) scale(1);
      opacity: 0.6;
    }
    33% {
      transform: translateY(-15px) scale(1.2);
      opacity: 1;
    }
    66% {
      transform: translateY(10px) scale(0.8);
      opacity: 0.4;
    }
  }

  /* Hero Content */
  .hero-content {
    position: relative;
    z-index: 2;
    color: white;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .hero-header {
    margin-bottom: 24px;
  }

  .hero-title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .hero-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .hero-subtitle {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hero-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }

  .hero-emoji {
    font-size: 16px;
  }

  .hero-message {
    font-weight: 600;
    font-size: 14px;
  }

  /* Hero Amount Display */
  .hero-amount {
    margin-bottom: 24px;
  }

  .amount-section-hero {
    margin-bottom: 16px;
  }

  .spent-amount-hero {
    margin-bottom: 12px;
  }

  .amount-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.8;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .amount-display {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .currency-symbol {
    font-size: 20px;
    font-weight: 600;
    opacity: 0.9;
  }

  .main-amount {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  /* New improved amount display */
  .amount-display-new {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 8px;
  }

  .main-amount-large {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: white;
  }

  .amount-separator {
    font-size: 20px;
    font-weight: 300;
    opacity: 0.5;
    margin: 0 4px;
  }

  .budget-amount-small {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
  }

  .budget-total-hero {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  .budget-label {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.8;
  }

  .budget-amount {
    font-size: 14px;
    font-weight: 700;
  }

  .remaining-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .remaining-icon {
    font-size: 16px;
  }

  .remaining-text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
  }

  .remaining-text strong {
    font-weight: 700;
  }

  /* Hero Progress */
  .hero-progress {
    margin-top: auto;
  }

  .progress-container-hero {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 16px;
    backdrop-filter: blur(10px);
  }

  .progress-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill-hero {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .progress-safe {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-warning {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-danger {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }

  .progress-percentage {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: white;
  }

  .progress-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    opacity: 0.9;
  }

  /* Hero Summary - New bottom section */
  .hero-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .remaining-amount {
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  .reset-info {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
  }

  /* Sticky Bottom Add Expense Button */
  .sticky-bottom-button {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Hidden state - slide down and fade out */
  .sticky-bottom-button.button-hidden {
    transform: translateX(-50%) translateY(120px);
    opacity: 0;
    visibility: hidden;
  }

  .add-expense-button {
    position: relative;
    padding: 12px 24px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    pointer-events: all;
    overflow: hidden;
  }

  .add-expense-button:hover {
    transform: translateY(-3px) scale(1.03);
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
  }

  .add-expense-button:active {
    transform: translateY(-2px) scale(1.02);
  }

  .button-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .add-icon {
    font-size: 24px;
    font-weight: 300;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .add-expense-button:hover .add-icon {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.5);
    transform: rotate(90deg);
    backdrop-filter: blur(15px);
  }

  .button-text {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .button-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .add-expense-button:hover .button-glow {
    opacity: 1;
  }

  /* Enhanced Glass Stats Grid */
  .enhanced-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  /* Glass stat cards - light blue glassmorphism */
  .glass-stat-card {
    position: relative;
    border-radius: 12px;
    padding: 28px;
    min-height: 160px;
    overflow: hidden;
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-stat-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 25px 60px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
  }

  .glass-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      transparent 0%,
      rgba(6, 182, 212, 0.05) 50%,
      transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .glass-stat-card:hover .glass-card-overlay {
    opacity: 1;
  }

  .glass-card-content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-icon-container {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.15) 0%,
      rgba(6, 182, 212, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(6, 182, 212, 0.2);
    transition: all 0.3s ease;
  }

  .glass-stat-card:hover .stat-icon-container {
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.25) 0%,
      rgba(6, 182, 212, 0.15) 100%);
    border-color: rgba(6, 182, 212, 0.4);
    transform: scale(1.1);
  }

  .stat-icon {
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .stat-label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(75, 85, 99, 0.8);
    backdrop-filter: blur(5px);
  }

  .stat-amount {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 12px;
    line-height: 1.1;
    background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.1));
    font-family: 'Inter', monospace;
  }

  .stat-message {
    font-size: 13px;
    font-weight: 500;
    color: rgba(107, 114, 128, 0.9);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(5px);
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  /* Transactions Card */
  .transactions-card {
    position: relative;
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 24px;
    overflow: hidden;
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .transactions-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
  }

  .transactions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .transactions-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .transactions-icon {
    font-size: 20px;
  }

  .transactions-count {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  }

  /* Empty State */
  .empty-transactions {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 8px;
  }

  .empty-subtitle {
    font-size: 14px;
    color: #9ca3af;
  }

  /* Transaction Items */
  .transaction-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    transition: all 0.2s ease;
    margin-bottom: 8px;
  }

  .transaction-item:hover {
    background: rgba(6, 182, 212, 0.05);
  }

  .transaction-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(6, 182, 212, 0.1);
    border-radius: 12px;
  }

  .transaction-details {
    flex: 1;
  }

  .transaction-description {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .transaction-date {
    font-size: 12px;
    color: #6b7280;
  }

  .transaction-amount {
    font-weight: 700;
    color: #EF4444;
    font-size: 14px;
  }

  .view-all-button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: 16px;
    box-shadow: 0 4px 16px rgba(0, 191, 255, 0.12);
    backdrop-filter: blur(10px);
  }

  .view-all-button:hover {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    box-shadow: 0 8px 24px rgba(0, 191, 255, 0.18);
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.4);
  }

  /* Loading States */
  .hero-loading {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 200px;
    justify-content: center;
  }

  .loading-bar {
    height: 16px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .loading-1 { width: 60%; animation-delay: 0s; }
  .loading-2 { width: 80%; animation-delay: 0.2s; }
  .loading-3 { width: 40%; animation-delay: 0.4s; }

  /* Animations */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes float-accent {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-10px) rotate(120deg);
    }
    66% {
      transform: translateY(5px) rotate(240deg);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 430px) {
    .hero-budget-card {
      padding: 24px;
      min-height: 280px;
    }

    .hero-title {
      font-size: 20px;
    }

    .main-amount {
      font-size: 36px;
    }

    .colorful-stats-grid {
      gap: 12px;
    }

    .colorful-stat-card {
      padding: 20px;
      min-height: 120px;
    }

    /* Mobile sticky button adjustments */
    .sticky-bottom-button {
      bottom: 16px;
    }

    .sticky-bottom-button.button-hidden {
      transform: translateX(-50%) translateY(100px);
    }

    .add-expense-button {
      padding: 10px 20px;
      font-size: 13px;
    }

    .button-text {
      font-size: 13px;
    }

    .add-icon {
      width: 24px;
      height: 24px;
      font-size: 16px;
    }
  }

  /* Tablet and Desktop Responsive */
  @media (min-width: 768px) {
    .sticky-bottom-button {
      bottom: 24px;
    }

    .add-expense-button {
      padding: 14px 28px;
      font-size: 15px;
    }

    .button-text {
      font-size: 15px;
    }
  }

  /* Large Desktop */
  @media (min-width: 1024px) {
    .sticky-bottom-button {
      bottom: 30px;
      right: 30px;
      left: auto;
      transform: none;
    }

    .sticky-bottom-button.button-hidden {
      transform: translateX(120px);
      opacity: 0;
      visibility: hidden;
    }

    .add-expense-button {
      border-radius: 8px;
      padding: 16px 32px;
    }
  }

  /* Safe area for devices with notches */
  @supports (padding: max(0px)) {
    .sticky-bottom-button {
      bottom: max(20px, env(safe-area-inset-bottom, 20px));
    }
  }

  /* Dashboard Footer */
  .dashboard-footer {
    margin-top: 40px;
    padding: 24px 20px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 16px 16px 0 0;
    position: relative;
    z-index: 2;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .footer-contact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .footer-label {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
  }

  .footer-email {
    font-size: 14px;
    font-weight: 600;
    color: #0891B2;
    text-decoration: none;
    transition: all 0.2s ease;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .footer-email:hover {
    color: #06B6D4;
    background: rgba(6, 182, 212, 0.1);
    text-decoration: underline;
  }

  /* Dashboard Category Card Glassmorphism Override */
  :global(.dashboard-category-card.fintech-card) {
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%) !important;
    backdrop-filter: blur(25px) saturate(1.8) !important;
    -webkit-backdrop-filter: blur(25px) saturate(1.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.7) !important;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  }

  :global(.dashboard-category-card.fintech-card:hover) {
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%) !important;
    transform: translateY(-4px) !important;
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(0, 191, 255, 0.2) !important;
    backdrop-filter: blur(30px) saturate(2) !important;
    -webkit-backdrop-filter: blur(30px) saturate(2) !important;
  }

  /* Mobile Enhanced Background Accents */
  @media (max-width: 768px) {
    .dashboard-header {
      padding: 1rem 0 0.5rem 0;
    }

    .header-content {
      padding: 0 1rem;
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .header-actions {
      width: 100%;
    }

    .dashboard-container {
      background:
        radial-gradient(circle at 30% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 70% 80%, rgba(30, 144, 255, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 123, 255, 0.04) 0%, transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    }

    .dashboard-container::before {
      background-image:
        radial-gradient(circle at 20% 30%, rgba(0, 191, 255, 0.06) 0%, transparent 25%),
        radial-gradient(circle at 80% 70%, rgba(30, 144, 255, 0.05) 0%, transparent 25%),
        radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.04) 0%, transparent 20%);
    }
  }

  /* Desktop and Tablet Layout */
  @media (min-width: 768px) {
    .header-content {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .page-title-section {
      flex: 0 0 auto;
    }

    .header-actions {
      flex: 0 0 auto;
      align-items: flex-end;
      text-align: right;
      min-width: 200px;
      max-width: 280px;
    }
  }

  /* Mobile responsive footer */
  @media (max-width: 430px) {
    .dashboard-footer {
      margin-top: 32px;
      padding: 20px 16px;
    }

    .footer-contact {
      flex-direction: column;
      gap: 4px;
    }

    /* Mobile title styling */
    .dashboard-header {
      padding: 16px 0 12px 0;
    }

    .header-content {
      padding: 0 16px;
    }

    .page-title-section {
      margin-bottom: 12px;
    }

    .page-title {
      font-size: 24px;
    }

    /* Extra enhancement for small screens */
    .dashboard-container {
      background:
        radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 0%, transparent 35%),
        radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.08) 0%, transparent 35%),
        linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
    }

    .dashboard-container::before {
      background-image:
        radial-gradient(circle at 15% 40%, rgba(0, 191, 255, 0.08) 0%, transparent 20%),
        radial-gradient(circle at 85% 60%, rgba(30, 144, 255, 0.06) 0%, transparent 20%);
    }
  }

  /* ============================================
     BUDGET SETUP CTA CARD
     ============================================ */

  .budget-cta-card {
    padding: 20px;
    margin: 16px 20px 20px;
    background: linear-gradient(135deg,
      rgba(245, 158, 11, 0.1) 0%,
      rgba(249, 115, 22, 0.08) 100%);
    border: 2px solid rgba(245, 158, 11, 0.3);
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
    transition: all 0.3s ease;
  }

  .budget-cta-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.2);
  }

  .cta-icon {
    font-size: 40px;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .cta-content {
    flex: 1;
  }

  .cta-title {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .cta-description {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
  }

  .cta-button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: white;
    font-weight: 700;
    font-size: 14px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    transition: all 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;
    border: none;
    cursor: pointer;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
  }

  /* Mobile responsive for CTA card */
  @media (max-width: 640px) {
    .budget-cta-card {
      flex-direction: column;
      text-align: center;
      padding: 24px 16px;
      margin: 16px 12px 20px;
    }

    .cta-button {
      width: 100%;
    }
  }
</style>