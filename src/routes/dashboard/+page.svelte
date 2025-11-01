<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { afterNavigate } from '$app/navigation';
  import { authStore, userStore, userProfileStore } from '$stores/auth';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { selectedPeriodStore } from '$lib/stores/period';
  import { expenseService } from '$lib/services/expenseService';
  import { budgetService } from '$lib/services/budgetService';
  import { periodService } from '$lib/services/periodService';
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
  import { SCROLL_CONFIG, BUDGET_THRESHOLDS } from '$lib/config/dashboard.config';
  import { getPeriodById } from '$lib/utils/periodHelpers';
  import { fly } from 'svelte/transition';
  import type { User as FirebaseUser } from 'firebase/auth';
  import type { UserProfile } from '$stores/auth';
  import type {
    BudgetStatus,
    BudgetData,
    Expense,
    Transaction,
    DashboardMetrics
  } from '$lib/types/dashboard.types';

  // Components
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import FinancialHeroCard from '$lib/components/dashboard/FinancialHeroCard_Final.svelte';
  import PeriodSelector from '$lib/components/dashboard/PeriodSelector.svelte';

  // Skeleton Components
  import SkeletonHero from '$lib/components/skeleton/SkeletonHero.svelte';
  import SkeletonCard from '$lib/components/skeleton/SkeletonCard.svelte';
  import SkeletonList from '$lib/components/skeleton/SkeletonList.svelte';

  // Dashboard state
  let error: string | null = null;
  let user: FirebaseUser | null = null;
  let userProfile: UserProfile | null = null;
  let currentPeriodId = '';

  // Store unsubscribe functions for cleanup
  let unsubscribers: Array<() => void> = [];

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

  // Floating button scroll behavior
  let showFloatingButton = true;
  let lastScrollY = 0;
  let scrollThreshold = SCROLL_CONFIG.THRESHOLD;
  let scrollHandlerCleanup: (() => void) | null = null;

  // Debouncing for reactive data loading
  let loadDataTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentLoadingPeriod: string = '';

  $: if (currentPeriodId && userProfile) {
    // Update currentPeriod object from periodId
    const config = {
      resetDate: userProfile.budgetResetDate || 25,
      resetType: 'fixed' as const
    };
    currentPeriod = getPeriodById(config, currentPeriodId);

    // Debounce data loading to prevent race conditions
    if (loadDataTimeout) {
      clearTimeout(loadDataTimeout);
    }

    loadDataTimeout = setTimeout(() => {
      // Only load if period actually changed
      if (currentPeriodId !== currentLoadingPeriod) {
        currentLoadingPeriod = currentPeriodId;
        loadDashboardData();
      }
    }, 150); // 150ms debounce
  }


  // Removed reactive subscription - will be handled in onMount

  // Track if this is initial mount or navigation back
  let isInitialMount = true;

  // Handle navigation - reload data when navigating back to dashboard
  afterNavigate((navigation) => {
    if (!isInitialMount && currentPeriodId && userProfile) {
      console.log('🔄 Navigated back to dashboard, force reloading data...');
      loadDashboardData(true); // Force reload
    }
    isInitialMount = false;
  });

  onMount(() => {
    if (browser) {
      initializeDashboard();
      scrollHandlerCleanup = setupScrollListener();
    }
  });

  onDestroy(() => {
    // Cleanup all subscriptions
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];

    // Cleanup debounce timeout
    if (loadDataTimeout) {
      clearTimeout(loadDataTimeout);
    }

    // Cleanup scroll listener
    if (scrollHandlerCleanup) {
      scrollHandlerCleanup();
    }

    console.log('🧹 Dashboard: Cleaned up all subscriptions and listeners');
  });

  async function initializeDashboard() {
    try {
      // Import utility upfront
      const { validatePeriodResetDate } = await import('$lib/utils/periodUtils');

      // Subscribe to period store with cleanup
      const periodUnsub = selectedPeriodStore.subscribe((value) => {
        if (value && value !== currentPeriodId) {
          currentPeriodId = value;
          console.log('📅 Dashboard: Period changed from store:', value);
        }
      });
      unsubscribers.push(periodUnsub);

      // Subscribe to user profile with cleanup
      const profileUnsub = userProfileStore.subscribe((profile) => {
        if (profile) {
          userProfile = profile;

          // Check budget setup status (will be re-checked after budget data loads)
          hasBudgetSetup = checkBudgetSetup(profile, budgetData);

          // 🔥 FIX: Validate stored period against user's reset date using centralized utility
          const storedPeriod = $selectedPeriodStore;
          if (storedPeriod && profile.budgetResetDate) {
            if (!validatePeriodResetDate(storedPeriod, profile.budgetResetDate)) {
              console.log(`⚠️ Reset date changed, clearing period`);
              selectedPeriodStore.clear();
              currentPeriodId = '';
            }
          }

          console.log('📅 Dashboard: Waiting for PeriodSelector to set period');
        }
      });
      unsubscribers.push(profileUnsub);

      // Subscribe to auth store with cleanup
      const authUnsub = authStore.subscribe((isAuthenticated) => {
        if (!isAuthenticated && browser) {
          goto('/');
        }
      });
      unsubscribers.push(authUnsub);

      // Subscribe to user store with cleanup
      const userUnsub = userStore.subscribe((userData) => {
        if (userData) {
          user = userData;
        }
      });
      unsubscribers.push(userUnsub);

    } catch (err) {
      console.error('Dashboard initialization error:', err);
      error = 'Failed to initialize dashboard';
    }
  }

  // ✅ REMOVED: Unused period functions - period logic now handled by PeriodSelector component

  async function loadDashboardData(forceReload: boolean = false) {
    try {
      loading = true;

      // Force reload if requested (e.g., when returning from another page)
      if (forceReload) {
        console.log('🔄 Force reloading dashboard data...');
        periodService.clearPeriodCache(currentPeriodId);
      }

      // Load real data from Firebase
      await loadPeriodData();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      loading = false;
    }
  }

  async function loadPeriodData() {
    try {
      // 🔥 FIREBASE: Load period data from Firestore
      const periodData = await periodService.loadPeriodData(currentPeriodId);

      // Set expenses
      expenses = periodData.expenses;

      // Set budget data
      if (periodData.budget) {
        budgetData = {
          categories: periodData.budget.categories,
          totalBudget: periodData.budget.totalBudget,
          totalSpent: periodData.budget.totalSpent,
          month: currentPeriodId
        };
      } else {
        // No budget found - empty state
        budgetData = {
          categories: {},
          totalBudget: 0,
          totalSpent: periodData.totalSpent, // Show spending even without budget
          month: currentPeriodId
        };
      }

      // Re-check budget setup status
      hasBudgetSetup = checkBudgetSetup(userProfile, budgetData);

      calculateBudgetMetrics();
      calculateExpenseMetrics();
      loading = false;

      console.log('✅ Dashboard data loaded from Firebase');
      console.log(`📊 Period: ${currentPeriodId}`);
      console.log('💰 Total Budget:', budgetData.totalBudget);
      console.log('📈 Total Spent:', budgetData.totalSpent);
      console.log('💸 Total Expenses:', expenses.length);
      console.log('✅ Budget setup detected:', hasBudgetSetup);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      loading = false;
    }
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
  }

  function calculateExpenseMetrics() {
    if (!expenses.length) return;

    // Get TODAY's transactions only
    const today = new Date();
    const todayTransactions = expenses
      .filter(expense => {
        const expenseDate = timestampToDate(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      })
      .sort((a, b) => {
        const dateA = timestampToDate(a.date);
        const dateB = timestampToDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });

    recentTransactions = todayTransactions as Transaction[];

    // Calculate today's spending from today's transactions
    const todaySpending = todayTransactions.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Update metrics
    metrics = { ...metrics, todaySpending };
  }


  // Helper function to get category emoji from budget data
  function getCategoryEmoji(categoryId: string): string {
    if (!budgetData?.categories) {
      return getPlayfulCategoryIcon(categoryId);
    }

    // Try to find emoji from budget categories
    const categoryData = budgetData.categories[categoryId];
    if (categoryData?.emoji) {
      return categoryData.emoji;
    }

    // Fallback to playful icon
    return getPlayfulCategoryIcon(categoryId);
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
              {#if userProfile}
                <PeriodSelector
                  currentPeriodId={currentPeriodId}
                  userResetDate={userProfile.budgetResetDate || 25}
                  on:periodChange={handlePeriodChange}
                />
              {:else}
                <div class="period-selector-loading">
                  <div class="loading-skeleton"></div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">

          {#if loading}
            <!-- Unified Skeleton Loading -->
            <div class="hero-card-container">
              <SkeletonHero variant="dashboard" />
            </div>

            <SkeletonCard title="Transaksi Hari Ini">
              <SkeletonList count={3} variant="transaction" />
            </SkeletonCard>

            <SkeletonCard title="Kategori Need Attention">
              <SkeletonList count={2} variant="category" />
            </SkeletonCard>
          {:else}
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

            <!-- Today's Transactions -->
            <div class="transactions-card liquid-card">
              <div class="glass-card-overlay"></div>
              <div class="transactions-header">
                <h3 class="transactions-title">
                  <span class="transactions-icon">📅</span>
                  Transaksi Hari Ini
                </h3>
                <p class="transactions-subtitle">
                  Total: {formatRupiah(metrics.todaySpending)} ({recentTransactions.length} transaksi)
                </p>
              </div>

              {#if recentTransactions.length === 0}
              <div class="empty-transactions">
                <div class="empty-icon">🎉</div>
                <p class="empty-title">Belum ada pengeluaran hari ini!</p>
                <p class="empty-subtitle">Saatnya mulai hari dengan tracking! 🚀</p>
              </div>
            {:else}
              <div class="transactions-list">
                {#each recentTransactions as transaction, index}
                  {@const transactionDate = timestampToDate(transaction.date)}
                  <div class="transaction-item">
                    <div class="transaction-icon">
                      {getCategoryEmoji(transaction.category)}
                    </div>
                    <div class="transaction-details">
                      <div class="transaction-description">
                        {formatCategoryName(transaction.category)}
                      </div>
                      <div class="transaction-date">
                        {transaction.description || '-'}
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

          {/if}

        </div>

        <!-- Footer -->
        <footer class="dashboard-footer">
          <div class="footer-content">
            <p class="footer-text">
              📧 <a href="mailto:tegarerputra@outlook.com" class="footer-email-link">tegarerputra@outlook.com</a>
              <span class="footer-separator">•</span>
              © {new Date().getFullYear()} DuitTrack
            </p>
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

  /* ✅ REMOVED: All hero card CSS (~425 lines) - now in FinancialHeroCard_Final.svelte */

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

  /* ✅ REMOVED: Enhanced stats grid CSS (~136 lines) - not used in dashboard */

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
    margin-bottom: 20px;
  }

  .transactions-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .transactions-icon {
    font-size: 20px;
  }

  .transactions-subtitle {
    font-size: 13px;
    font-weight: 400;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
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
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
  }

  .view-all-button {
    width: 100%;
    padding: 12px 0;
    background: transparent;
    border: none;
    color: #0891B2;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 8px;
    text-align: left;
    letter-spacing: 0.01em;
  }

  .view-all-button:hover {
    color: #06B6D4;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .view-all-button:active {
    color: #0E7490;
  }

  /* Loading States */
  .period-selector-loading {
    width: 100%;
    max-width: 280px;
    padding: 10px 14px;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.15);
    border-radius: 12px;
  }

  .loading-skeleton {
    height: 20px;
    background: linear-gradient(90deg,
      rgba(6, 182, 212, 0.1) 0%,
      rgba(6, 182, 212, 0.2) 50%,
      rgba(6, 182, 212, 0.1) 100%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

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

  /* Simple Inline Footer Text */
  .footer-text {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .footer-email-link {
    color: #0891B2;
    text-decoration: none;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .footer-email-link:hover {
    color: #06B6D4;
    text-decoration: underline;
  }

  .footer-separator {
    color: #d1d5db;
    font-weight: 400;
    padding: 0 4px;
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

    .footer-text {
      font-size: 13px;
      gap: 6px;
    }

    .footer-email-link {
      font-size: 13px;
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

  /* Removed unused BUDGET SETUP CTA CARD CSS - not used in current dashboard layout */
</style>