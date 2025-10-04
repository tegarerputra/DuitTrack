<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore, userStore, userProfileStore } from '$stores/auth';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { goto } from '$app/navigation';
  import { formatRupiah } from '$utils/index';
  import { checkBudgetSetup } from '$lib/utils/budgetHelpers';
  import { generatePeriods, formatPeriodDisplay, type PeriodGeneratorConfig } from '$lib/utils/periodHelpers';
  import { fly } from 'svelte/transition';
  import type { User as FirebaseUser } from 'firebase/auth';
  import type { UserProfile } from '$stores/auth';

  export let params: Record<string, string> = {};

  // Components
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import FintechCard from '$lib/components/ui/FintechCard.svelte';
  import FintechButton from '$lib/components/ui/FintechButton.svelte';
  import FintechProgress from '$lib/components/ui/FintechProgress.svelte';

  // Dashboard state
  let error: string | null = null;
  let user: FirebaseUser | null = null;
  let userProfile: UserProfile | null = null;
  let currentPeriodId = '';

  // Dual-mode support
  let hasBudgetSetup = false;
  let currentPeriod: any = null;

  // Dashboard data
  let budgetData: any = null;
  let expenses: any[] = [];
  let recentTransactions: any[] = [];
  let loading = true;

  // Computed values
  let totalBudget = 0;
  let totalSpent = 0;
  let percentage = 0;
  let remaining = 0;
  let budgetStatus: 'safe' | 'warning' | 'danger' = 'safe';
  let todaySpending = 0;
  let categoriesNeedAttention: any[] = [];

  // Floating button scroll behavior
  let showFloatingButton = true;
  let lastScrollY = 0;
  let scrollThreshold = 50;

  $: if (currentPeriodId) {
    loadDashboardData();
  }

  // Subscribe to stores
  $: budgetStore.subscribe((data) => {
    if (data && data.month === currentPeriodId) {
      budgetData = data;
      calculateBudgetMetrics();
      loading = false;
    }
  });

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
      setupScrollListener();
    }

    // Cleanup function
    return () => {
      if (browser) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  });

  async function initializeDashboard() {
    try {
      userProfileStore.subscribe((profile) => {
        if (profile) {
          userProfile = profile;

          // Check budget setup status
          hasBudgetSetup = checkBudgetSetup(profile);

          // Update period based on user's reset date
          if (profile.budgetResetDate !== undefined) {
            updateCurrentPeriodFlexible(profile);
          } else {
            updateCurrentPeriod();
          }
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

    console.log('📅 Current period:', formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate));
  }

  function updateCurrentPeriod() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    currentPeriodId = `${year}-${String(month).padStart(2, '0')}`;
  }

  async function loadDashboardData() {
    try {
      loading = true;

      // TEMPORARY: Load dummy data for development
      loadDummyData();

      // Load budget and expense data
      if (budgetStore && typeof budgetStore.loadBudgetData === 'function') {
        await budgetStore.loadBudgetData(currentPeriodId);
      }

      // Note: expenseStore loading will be implemented when needed

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  function loadDummyData() {
    // Create consistent dummy data across all pages
    const dummyCategories = [
      { id: 'food', name: 'Makanan', emoji: '🍽️', budget: 2000000, spent: 1450000 },
      { id: 'transport', name: 'Transport', emoji: '🚗', budget: 1000000, spent: 650000 },
      { id: 'shopping', name: 'Belanja', emoji: '🛍️', budget: 1500000, spent: 1890000 },
      { id: 'entertainment', name: 'Hiburan', emoji: '🎬', budget: 800000, spent: 520000 },
      { id: 'utilities', name: 'Tagihan', emoji: '💡', budget: 600000, spent: 580000 },
      { id: 'savings', name: 'Tabungan', emoji: '💰', budget: 3000000, spent: 2500000 }
    ];

    // Calculate totals
    const totalBudget = dummyCategories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = dummyCategories.reduce((sum, cat) => sum + cat.spent, 0);

    // Set budget data
    budgetData = {
      categories: Object.fromEntries(
        dummyCategories.map(cat => [cat.id, { budget: cat.budget, spent: cat.spent }])
      ),
      totalBudget,
      totalSpent,
      month: currentPeriodId
    };

    // Generate dummy expenses
    const today = new Date();
    const dummyExpenses: any[] = [];

    // Generate 20-30 expenses spread over the month
    for (let i = 0; i < 25; i++) {
      const categoryIndex = Math.floor(Math.random() * dummyCategories.length);
      const category = dummyCategories[categoryIndex];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      const descriptions: Record<string, string[]> = {
        'food': ['Lunch di warung', 'Coffee shop', 'Belanja groceries', 'Makan malam'],
        'transport': ['Grab ride', 'Isi bensin', 'Parkir', 'Tol'],
        'shopping': ['Beli baju', 'Elektronik', 'Beli buku', 'Peralatan rumah'],
        'entertainment': ['Nonton bioskop', 'Konser', 'Game', 'Netflix'],
        'utilities': ['Listrik', 'Air', 'Internet', 'Pulsa'],
        'savings': ['Transfer tabungan', 'Investasi', 'Dana darurat', 'Deposito']
      };

      const categoryDescriptions = descriptions[category.id] || ['Pengeluaran'];
      const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];

      dummyExpenses.push({
        id: `dummy_${i}`,
        amount: Math.floor(Math.random() * 150000) + 20000,
        category: category.id.toUpperCase(),
        description,
        date,
        userId: 'dummy_user'
      });
    }

    expenses = dummyExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());

    calculateBudgetMetrics();
    calculateExpenseMetrics();
    loading = false;

    console.log('📊 Dummy data loaded for Dashboard');
  }

  function calculateBudgetMetrics() {
    if (!budgetData) return;

    totalBudget = budgetData.totalBudget || 0;
    totalSpent = budgetData.totalSpent || 0;
    percentage = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
    remaining = Math.max(0, totalBudget - totalSpent);

    // Determine budget status
    if (percentage >= 100) {
      budgetStatus = 'danger';
    } else if (percentage >= 80) {
      budgetStatus = 'warning';
    } else {
      budgetStatus = 'safe';
    }

    // Calculate categories that need attention
    categoriesNeedAttention = [];
    if (budgetData.categories) {
      Object.entries(budgetData.categories).forEach(([category, data]: [string, any]) => {
        const categoryPercentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
        if (categoryPercentage >= 80) {
          categoriesNeedAttention.push({
            category,
            percentage: categoryPercentage,
            spent: data.spent,
            budget: data.budget,
            status: categoryPercentage >= 100 ? 'danger' : 'warning'
          });
        }
      });

      // Sort by percentage (highest first)
      categoriesNeedAttention.sort((a, b) => b.percentage - a.percentage);
    }
  }

  function calculateExpenseMetrics() {
    if (!expenses.length) return;

    // Get recent transactions (last 5)
    recentTransactions = expenses
      .slice()
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    // Calculate today's spending
    const today = new Date();
    todaySpending = expenses
      .filter(expense => {
        const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      })
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }


  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'FOOD': '🍽️', 'SNACK': '🍿', 'HOUSEHOLD': '🏠',
      'FRUIT': '🍎', 'TRANSPORT': '🚗', 'ENTERTAINMENT': '🎬',
      'HEALTH': '🏥', 'EDUCATION': '📚', 'SHOPPING': '🛍️',
      'BILLS': '💰', 'OTHER': '📦'
    };
    return icons[category?.toUpperCase()] || '💰';
  }

  function formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      'FOOD': 'Makanan', 'SNACK': 'Jajan', 'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan', 'TRANSPORT': 'Transportasi', 'ENTERTAINMENT': 'Hiburan',
      'HEALTH': 'Kesehatan', 'EDUCATION': 'Pendidikan', 'SHOPPING': 'Belanja',
      'BILLS': 'Tagihan', 'OTHER': 'Lainnya'
    };
    return names[category?.toUpperCase()] || category || 'Lainnya';
  }

  function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hari ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function getBudgetStatusColor(): string {
    switch (budgetStatus) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  function getBudgetStatusIcon(): string {
    switch (budgetStatus) {
      case 'safe': return '🟢';
      case 'warning': return '🟡';
      case 'danger': return '🔴';
      default: return '⚪';
    }
  }

  // Playful Indonesian status messages
  function getPlayfulBudgetStatus(percentage: number): { message: string; emoji: string; variant: 'success' | 'warning' | 'danger' } {
    if (percentage >= 100) {
      return {
        message: 'Waduh, budget habis! 😅',
        emoji: '🚨',
        variant: 'danger'
      };
    } else if (percentage >= 90) {
      return {
        message: 'Udah mepet nih! 😰',
        emoji: '⚠️',
        variant: 'warning'
      };
    } else if (percentage >= 70) {
      return {
        message: 'Hati-hati ya 👀',
        emoji: '🟡',
        variant: 'warning'
      };
    } else {
      return {
        message: 'Aman terkendali 😎',
        emoji: '✅',
        variant: 'success'
      };
    }
  }

  function getPlayfulCategoryIcon(category: string): string {
    const playfulIcons: Record<string, string> = {
      'FOOD': '🍜', // More Indonesian/Asian focused
      'SNACK': '🧋', // Bubble tea - popular in Indonesia
      'HOUSEHOLD': '🏡',
      'FRUIT': '🥭', // Mango - Indonesian favorite
      'TRANSPORT': '🏍️', // Motorcycle - common in Indonesia
      'ENTERTAINMENT': '🎮',
      'HEALTH': '💊',
      'EDUCATION': '📖',
      'SHOPPING': '🛒',
      'BILLS': '📱', // Phone bills very common
      'OTHER': '✨'
    };
    return playfulIcons[category?.toUpperCase()] || '💫';
  }

  function getPlayfulCategoryMessage(category: string): string {
    const messages: Record<string, string> = {
      'FOOD': 'Makan enak dong! 😋',
      'SNACK': 'Jajan lagi nih 🤤',
      'TRANSPORT': 'Gas poll! 🏍️💨',
      'ENTERTAINMENT': 'Me time dulu 🎬',
      'SHOPPING': 'Belanja therapeutic 🛍️',
      'BILLS': 'Bayar tagihan dulu 💸',
      'OTHER': 'Ada apa nih? 🤔'
    };
    return messages[category?.toUpperCase()] || 'Pengeluaran baru 💫';
  }

  // Scroll behavior for floating button
  function setupScrollListener() {
    if (!browser) return;

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

    window.addEventListener('scroll', handleScrollThrottled, { passive: true });
  }

  function handleScroll() {
    if (!browser) return;

    const currentScrollY = window.scrollY;

    // Only hide/show if we've scrolled past threshold
    if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
      return;
    }

    // Show button when scrolling up or at top
    if (currentScrollY < lastScrollY || currentScrollY < 100) {
      showFloatingButton = true;
    }
    // Hide button when scrolling down
    else if (currentScrollY > lastScrollY && currentScrollY > 200) {
      showFloatingButton = false;
    }

    lastScrollY = currentScrollY;
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

            <!-- Period Selector & Settings -->
            <div class="header-actions">
              <div class="period-selector">
                <div class="period-label">Periode Tracking</div>
                <div class="period-card">
                  <span class="period-icon">📅</span>
                  <span class="period-text">{currentPeriodId}</span>
                  <span class="period-arrow">▼</span>
                </div>
              </div>

              <!-- Settings Quick Link -->
              <button
                on:click={() => goto('/settings')}
                class="settings-quick-link"
                title="Settings"
              >
                <span class="settings-icon">⚙️</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">

          <!-- HERO CARD - Budget Overview OR Simple Spending (Dual Mode!) -->
          <div class="hero-card-container">
            {#if !hasBudgetSetup}
              <!-- Simple Mode: No Budget Setup -->
              <div class="hero-budget-card hero-gradient-safe liquid-card">
                <div class="hero-glass-overlay"></div>
                {#if loading}
                  <div class="hero-loading">
                    <div class="loading-bar loading-1"></div>
                    <div class="loading-bar loading-2"></div>
                    <div class="loading-bar loading-3"></div>
                  </div>
                {:else}
                  <!-- Simple Mode Content -->
                  <div class="hero-bg-elements">
                    <div class="hero-circle hero-circle-1 animate-liquid-float"></div>
                    <div class="hero-circle hero-circle-2 animate-liquid-float"></div>
                  </div>

                  <div class="hero-content">
                    <div class="hero-header">
                      <h1 class="hero-title">Total Pengeluaran 💸</h1>
                      {#if currentPeriod}
                        <div class="text-white/70 text-sm mt-1">
                          {formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)}
                        </div>
                      {/if}
                    </div>

                    <div class="hero-amount">
                      <div class="amount-section-hero">
                        <div class="amount-display-new">
                          <span class="main-amount-large">{formatRupiah(totalSpent)}</span>
                        </div>
                      </div>
                    </div>

                    <div class="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div class="flex items-center gap-3 mb-3">
                        <span class="text-3xl">💡</span>
                        <div>
                          <div class="text-white font-semibold text-lg">Mau tracking lebih detail?</div>
                          <div class="text-white/70 text-sm">Setup budget untuk track per kategori!</div>
                        </div>
                      </div>
                      <button
                        on:click={() => goto('/budget')}
                        class="w-full px-4 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-all shadow-lg"
                      >
                        Setup Budget Sekarang →
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Full Mode: With Budget Setup -->
              <div class="hero-budget-card hero-gradient-{budgetStatus} liquid-card">
                <div class="hero-glass-overlay"></div>
                {#if loading}
                  <div class="hero-loading">
                    <div class="loading-bar loading-1"></div>
                    <div class="loading-bar loading-2"></div>
                    <div class="loading-bar loading-3"></div>
                  </div>
                {:else}
                  {@const status = getPlayfulBudgetStatus(percentage)}

                <!-- Enhanced Background Elements -->
                <div class="hero-bg-elements">
                  <div class="hero-circle hero-circle-1 animate-liquid-float"></div>
                  <div class="hero-circle hero-circle-2 animate-liquid-float"></div>
                  <div class="hero-wave animate-liquid-flow"></div>
                  <div class="hero-glass-particle hero-particle-1"></div>
                  <div class="hero-glass-particle hero-particle-2"></div>
                  <div class="hero-glass-particle hero-particle-3"></div>
                </div>

                <!-- Hero Content -->
                <div class="hero-content">
                  <div class="hero-header">
                    <h1 class="hero-title">Budget Check! 💰</h1>
                  </div>

                  <div class="hero-amount">
                    <div class="amount-section-hero">
                      <span class="amount-label">SUDAH TERPAKAI</span>
                      <div class="amount-display-new">
                        <span class="main-amount-large">{formatRupiah(totalSpent)}</span>
                        <span class="amount-separator">/</span>
                        <span class="budget-amount-small">{formatRupiah(totalBudget)}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Hero Progress -->
                  <div class="hero-progress">
                    <div class="progress-container-hero">
                      <div class="progress-track">
                        <div
                          class="progress-fill-hero progress-{budgetStatus}"
                          style="width: {percentage}%"
                        ></div>
                      </div>
                      <div class="progress-info">
                        <span class="progress-percentage">{percentage.toFixed(1)}%</span>
                        <div class="progress-status status-{status.variant}">
                          <span class="hero-emoji">{status.emoji}</span>
                          <span class="hero-message">{status.message}</span>
                        </div>
                      </div>
                      <div class="hero-summary">
                        <span class="remaining-amount">Tersisa {formatRupiah(remaining)}</span>
                        <span class="reset-info">Reset dalam {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} hari</span>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            {/if}
          </div>



          <!-- Enhanced Glass Stats Grid -->
          <div class="enhanced-stats-grid">
            <!-- Today's Spending -->
            <div class="glass-stat-card liquid-card liquid-interactive">
              <div class="glass-card-overlay"></div>
              <div class="glass-card-content">
                <div class="stat-header">
                  <div class="stat-icon-container">
                    <span class="stat-icon">📅</span>
                  </div>
                  <span class="stat-label">Hari Ini</span>
                </div>
                <div class="stat-amount text-vital">
                  {todaySpending > 0 ? formatRupiah(todaySpending) : 'Rp 0'}
                </div>
                <div class="stat-message">
                  {todaySpending > 0 ? 'Ada aktivitas! 💸' : 'Zero spending! 😎'}
                </div>
              </div>
            </div>

            <!-- Monthly Progress -->
            <div class="glass-stat-card liquid-card liquid-interactive">
              <div class="glass-card-overlay"></div>
              <div class="glass-card-content">
                <div class="stat-header">
                  <div class="stat-icon-container">
                    <span class="stat-icon">📊</span>
                  </div>
                  <span class="stat-label">Progress</span>
                </div>
                <div class="stat-amount text-vital">
                  {percentage.toFixed(0)}%
                </div>
                <div class="stat-message">
                  {percentage > 50 ? 'Halfway there! 🏃‍♂️' : 'Good start! 👌'}
                </div>
              </div>
            </div>
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
                  {@const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date)}
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
            aria-label="Tambah pengeluaran baru"
          >
            <div class="button-content">
              <span class="add-icon">+</span>
              <span class="button-text">Tambah Expense</span>
            </div>
            <div class="button-glow"></div>
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
      padding: 12px;
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
    padding: 20px;
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

  /* Period Selector */
  .period-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .period-label {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .period-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(6, 182, 212, 0.02));
    border-radius: 12px;
    border: 1px solid rgba(6, 182, 212, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .period-card:hover {
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
  }

  .period-icon {
    font-size: 18px;
  }

  .period-text {
    font-weight: 600;
    color: #0891B2;
  }

  .period-arrow {
    margin-left: auto;
    color: #6b7280;
  }

  /* Settings Quick Link */
  .settings-quick-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-top: 32px; /* Align with period-card */
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(240, 248, 255, 0.4) 100%);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .settings-quick-link:hover {
    border-color: rgba(6, 182, 212, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.15);
  }

  .settings-quick-link:active {
    transform: translateY(0);
  }

  .settings-icon {
    font-size: 20px;
    filter: grayscale(0.2);
    transition: all 0.3s ease;
  }

  .settings-quick-link:hover .settings-icon {
    filter: grayscale(0);
    transform: rotate(90deg);
  }

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
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    color: #0891B2;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 16px;
  }

  .view-all-button:hover {
    background: rgba(6, 182, 212, 0.2);
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
      padding: 1rem 1rem 0.5rem 1rem;
    }

    .header-content {
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .period-selector {
      margin-top: 0.5rem;
    }

    .period-label {
      font-size: 0.75rem;
      margin-bottom: 0.4rem;
    }

    .period-card {
      padding: 0.6rem 0.8rem;
      font-size: 0.8rem;
    }

    .period-icon {
      font-size: 0.9rem;
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

    .period-selector {
      flex: 0 0 auto;
      align-items: flex-end;
      text-align: right;
      min-width: 200px;
    }

    .period-label {
      text-align: right;
    }

    .period-card {
      width: auto;
      min-width: 180px;
      justify-content: center;
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
      padding: 16px 16px 12px 16px;
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