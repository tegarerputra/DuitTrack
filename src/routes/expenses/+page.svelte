<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { slide } from 'svelte/transition';
  import toast from 'svelte-french-toast';
  import {
    expensesStore,
    filteredExpenses,
    dailyExpenses,
    expenseActions,
    categoryFilterStore,
    expenseSearchStore,
    expensesLoadingStore
  } from '../../lib/stores/expenses';
  import { budgetStore, budgetCategoriesStore } from '../../lib/stores/budget';
  import InlineCategorySelector from '../../lib/components/expense/InlineCategorySelector.svelte';

  // Navigation context
  let returnPath = '';
  let selectedCategory = '';
  let searchQuery = '';
  let expenses: any[] = [];
  let categories: any[] = [];
  let isLoading = false;
  let showChart = true;
  let currentPeriodId = '';

  // Chart data
  let chartData: any[] = [];

  // Track which expense has open category selector
  let activeExpenseId: string | null = null;

  // Undo functionality
  let undoStack: Array<{ expenseId: string; oldCategory: string; newCategory: string }> = [];

  onMount(() => {
    // Get URL parameters
    selectedCategory = $page.url.searchParams.get('category') || '';
    returnPath = $page.url.searchParams.get('return') || 'dashboard';

    // Initialize current period
    updateCurrentPeriod();

    // Initialize filters
    if (selectedCategory) {
      expenseActions.setCategoryFilter(selectedCategory);
    }

    // Load data
    loadExpensesData();
    loadCategories();

    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside expense items
      if (!target.closest('.expense-item-enhanced')) {
        activeExpenseId = null;
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function updateCurrentPeriod() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    currentPeriodId = `${year}-${String(month).padStart(2, '0')}`;
  }

  // Subscribe to stores
  $: expenses = $filteredExpenses;
  $: isLoading = $expensesLoadingStore;
  $: chartData = $dailyExpenses;

  async function loadExpensesData() {
    expenseActions.setLoading(true);

    // TEMPORARY: Load dummy data for development
    setTimeout(async () => {
      const { generateDummyExpenses } = await import('$lib/utils/dummyData');
      // This will use cached/store data if available
      generateDummyExpenses(25);
      expenseActions.setLoading(false);

      console.log('📊 Dummy expenses loaded for Expenses page (using shared store)');
    }, 800);
  }

  async function loadCategories() {
    // Get categories from budgetCategoriesStore
    budgetCategoriesStore.subscribe(budgetCategories => {
      if (budgetCategories && budgetCategories.length > 0) {
        categories = budgetCategories.map(cat => ({
          value: cat.id.toUpperCase(),
          label: cat.name,
          icon: cat.icon
        }));
        console.log('📋 Categories loaded:', categories);
      }
    });
  }

  function handleCategoryFilter(category: string) {
    if (category === selectedCategory) {
      // Unselect if clicking same category
      selectedCategory = '';
      expenseActions.setCategoryFilter('all');
    } else {
      selectedCategory = category;
      expenseActions.setCategoryFilter(category);
    }
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    expenseActions.setSearchQuery(searchQuery);
  }

  function clearFilters() {
    selectedCategory = '';
    searchQuery = '';
    expenseActions.clearFilters();
  }

  function handleAddExpense() {
    goto(`/add-expense?return=expenses`);
  }

  function handleExpenseClick(expense: any) {
    // Toggle category selector
    if (activeExpenseId === expense.id) {
      activeExpenseId = null;
    } else {
      activeExpenseId = expense.id;
    }
  }

  function handleCategoryChange(expense: any, event: CustomEvent) {
    const { newCategory } = event.detail;
    const oldCategory = expense.category;

    // Save to undo stack
    undoStack.push({
      expenseId: expense.id,
      oldCategory,
      newCategory
    });

    // Update the category
    expenseActions.changeExpenseCategory(expense.id, newCategory);

    // Close the selector
    activeExpenseId = null;

    // Show success toast with undo
    const toastId = toast.success(
      (t) => {
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span>✓ Kategori diubah ke ${formatCategoryName(newCategory)}</span>
            <button
              onclick="window.undoLastCategoryChange()"
              style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 4px 12px; color: white; cursor: pointer; font-weight: 600;"
            >
              Undo
            </button>
          </div>
        `;
      },
      {
        duration: 5000,
        style: 'background: linear-gradient(135deg, rgba(0, 191, 255, 0.9), rgba(30, 144, 255, 0.95)); color: white; padding: 12px 16px; border-radius: 12px;'
      }
    );
  }

  function handleDeleteExpense(expense: any, event: Event) {
    event.stopPropagation();

    // Store expense info for confirmation
    const expenseInfo = {
      id: expense.id,
      category: formatCategoryName(expense.category),
      amount: formatCurrency(expense.amount)
    };

    // Show simple confirmation message
    const confirmed = confirm(`🗑️ Hapus expense ini?\n\n${expenseInfo.category} - ${expenseInfo.amount}\n\nKlik OK untuk menghapus atau Cancel untuk membatalkan.`);

    if (confirmed) {
      // Delete the expense
      expenseActions.deleteExpense(expense.id);

      // Close active state
      activeExpenseId = null;

      // Show success toast
      toast.success('✓ Expense berhasil dihapus', {
        duration: 3000,
        style: 'background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.95)); color: white; padding: 12px 16px; border-radius: 12px;'
      });
    }
  }

  // Setup global functions for toast interactions
  $: if (typeof window !== 'undefined') {
    (window as any).undoLastCategoryChange = () => {
      const lastChange = undoStack.pop();
      if (lastChange) {
        expenseActions.changeExpenseCategory(lastChange.expenseId, lastChange.oldCategory);
        toast.success('✓ Perubahan dibatalkan', {
          duration: 2000,
          style: 'background: rgba(107, 114, 128, 0.95); color: white;'
        });
      }
    };
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(date: Date | any): string {
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
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

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'FOOD': '🍽️',
      'TRANSPORT': '🚗',
      'SHOPPING': '🛍️',
      'ENTERTAINMENT': '🎬',
      'HEALTH': '💊',
      'EDUCATION': '📚',
      'UTILITIES': '⚡',
      'OTHER': '📦'
    };
    return icons[category] || '📦';
  }

  function groupExpensesByDate(expenses: any[]) {
    const grouped: Record<string, any[]> = {};

    expenses.forEach(expense => {
      const date = expense.date instanceof Date ? expense.date : expense.date.toDate();
      const dateKey = date.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });

    return Object.entries(grouped)
      .map(([date, expenses]) => ({ date: new Date(date), expenses }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  function getDayTotal(expenses: any[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  $: groupedExpenses = groupExpensesByDate(expenses);
  $: totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
</script>

<div class="expenses-page">
  <!-- Header Section -->
  <div class="expenses-header">
    <div class="header-content">
      <!-- Page Title -->
      <div class="page-title-section">
        <h1 class="page-title">Expenses</h1>
      </div>

      <!-- Period Selector -->
      <div class="period-selector">
        <div class="period-label">Periode Tracking</div>
        <div class="period-card">
          <span class="period-icon">📅</span>
          <span class="period-text">{currentPeriodId || '2025-09'}</span>
          <span class="period-arrow">▼</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Grid -->
  <div class="expenses-grid">

    <!-- HERO SECTION - Following Dashboard Pattern -->
    <div class="hero-summary-container">
      <div class="hero-summary-card hero-glassmorphism liquid-card">
        <div class="hero-glass-overlay"></div>

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
            <h1 class="hero-title">💸 Total Expenses</h1>
          </div>

          <div class="hero-amount">
            <div class="amount-section-hero">
              <span class="amount-label">TOTAL SPENDING</span>
              <div class="amount-display-new">
                <span class="main-amount-large">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {#if showChart && chartData.length > 0}
            <!-- Hero Chart -->
            <div class="hero-chart-container">
              <div class="chart-title-hero">Daily Spending Pattern</div>
              <div class="enhanced-chart">
                {#each chartData as day}
                  <div class="chart-bar-enhanced" style="height: {(day.amount / Math.max(...chartData.map(d => d.amount))) * 100}%">
                    <div class="chart-tooltip-enhanced">
                      <div class="tooltip-date">{new Date(day.date).getDate()}</div>
                      <div class="tooltip-amount">{formatCurrency(day.amount)}</div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Integrated Spending Insights -->
          <div class="hero-insights">
            <div class="hero-insight-item">
              <span class="hero-insight-icon">🏆</span>
              <span class="hero-insight-text">Top: Food ({Math.round((expenses.filter(e => e.category === 'FOOD').reduce((sum, e) => sum + e.amount, 0) / totalExpenses) * 100)}%)</span>
            </div>
            <div class="hero-insight-item">
              <span class="hero-insight-icon">📈</span>
              <span class="hero-insight-text">Daily avg: {formatCurrency(totalExpenses / 30)}</span>
            </div>
            <div class="hero-insight-item">
              <span class="hero-insight-icon">📅</span>
              <span class="hero-insight-text">Active: {new Set(expenses.map(e => e.date.toDateString())).size} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Filters Section -->
    <div class="filters-section secondary-glassmorphism">
      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder="Search expenses..."
          value={searchQuery}
          on:input={handleSearchInput}
        />
        <div class="search-icon">🔍</div>
      </div>

      <div class="category-filters">
        <div class="filter-label">Categories:</div>
        <div class="category-chips">
          <button
            class="category-chip"
            class:active={!selectedCategory}
            on:click={() => handleCategoryFilter('')}
          >
            All
          </button>
          {#each categories as category}
            <button
              class="category-chip"
              class:active={selectedCategory === category.value}
              on:click={() => handleCategoryFilter(category.value)}
            >
              {getCategoryIcon(category.value)} {category.label}
            </button>
          {/each}
        </div>
      </div>

      {#if selectedCategory || searchQuery}
        <button class="clear-filters" on:click={clearFilters}>
          Clear filters
        </button>
      {/if}
    </div>

    <!-- Expenses List -->
    <div class="expenses-list">
      {#if isLoading}
        <div class="loading-container secondary-glassmorphism">
          <div class="loading-spinner"></div>
          <p>Loading expenses...</p>
        </div>
      {:else if expenses.length === 0}
        <div class="empty-state secondary-glassmorphism">
          <div class="empty-icon">📊</div>
          <h3>No expenses found</h3>
          <p>
            {#if selectedCategory || searchQuery}
              Try adjusting your filters or add a new expense.
            {:else}
              Start tracking your expenses to see them here.
            {/if}
          </p>
          <button class="btn-primary" on:click={handleAddExpense}>
            Add First Expense
          </button>
        </div>
      {:else}
        {#each groupedExpenses as { date, expenses: dayExpenses }}
          <div class="expense-group secondary-glassmorphism">
            <div class="group-header">
              <div class="group-date">{formatDate(date)}</div>
              <div class="group-total">{formatCurrency(getDayTotal(dayExpenses))}</div>
            </div>

            <div class="expense-items">
              {#each dayExpenses as expense}
                <div
                  class="expense-item-enhanced"
                  class:active={activeExpenseId === expense.id}
                  on:click={(e) => handleExpenseClick(expense)}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => e.key === 'Enter' && handleExpenseClick(expense)}
                >
                  <div class="expense-icon-enhanced">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div class="expense-details">
                    {#if activeExpenseId === expense.id}
                      <InlineCategorySelector
                        currentCategory={expense.category}
                        {categories}
                        on:categoryChange={(e) => handleCategoryChange(expense, e)}
                      />
                    {:else}
                      <div class="expense-category">{formatCategoryName(expense.category)}</div>
                    {/if}
                    <div class="expense-description">{expense.description}</div>
                  </div>
                  <div class="expense-amount">
                    {formatCurrency(expense.amount)}
                  </div>
                  {#if activeExpenseId === expense.id}
                    <button
                      class="delete-button"
                      on:click={(e) => handleDeleteExpense(expense, e)}
                      title="Hapus expense"
                      type="button"
                    >
                      🗑️
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Floating Add Button (Mobile) -->
    <button class="floating-add-button" on:click={handleAddExpense}>
      +
    </button>
  </div>
</div>

<style>
  /* ===== ENHANCED EXPENSES PAGE WITH DESIGN SYSTEM ===== */

  /* Page Background - Enhanced with Design System */
  .expenses-page {
    min-height: 100vh;
    position: relative;
    /* Enhanced glassmorphism background system */
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.02) 0%, transparent 40%),
      linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    overflow: hidden;
  }

  .expenses-page::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.03) 0%, transparent 30%),
      radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.02) 0%, transparent 30%),
      radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.025) 0%, transparent 25%);
    animation: float-accent 20s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  /* Header Section - Following Dashboard Pattern */
  .expenses-header {
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

  .period-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  .period-icon { font-size: 18px; }
  .period-text { font-weight: 600; color: #0891B2; }
  .period-arrow { margin-left: auto; color: #6b7280; }

  /* Main Grid Layout */
  .expenses-grid {
    display: grid;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }


  /* ===== HERO SECTION - FOLLOWING DASHBOARD PATTERN ===== */
  .hero-summary-card {
    position: relative;
    border-radius: 16px;
    padding: 36px;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    cursor: pointer;
    min-height: 320px;
    /* Hero glassmorphism from design system */
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 50%,
      rgba(0, 123, 255, 0.7) 100%);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      0 4px 12px rgba(0, 191, 255, 0.12),
      0 2px 6px rgba(30, 144, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .hero-summary-card:hover {
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
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .hero-summary-card:hover .hero-glass-overlay {
    opacity: 1;
  }

  /* Enhanced Hero Background Elements */
  .hero-bg-elements {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
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
    width: 140px; height: 140px;
    top: -70px; right: -70px;
  }

  .hero-circle-2 {
    width: 100px; height: 100px;
    bottom: -50px; left: -50px;
  }

  .hero-wave {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
  }

  .hero-glass-particle {
    position: absolute;
    width: 6px; height: 6px;
    background: radial-gradient(circle,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(6, 182, 212, 0.4) 50%,
      transparent 100%);
    border-radius: 50%;
    animation: particle-float 8s ease-in-out infinite;
  }

  .hero-particle-1 { top: 25%; left: 20%; animation-delay: 0s; }
  .hero-particle-2 { top: 60%; right: 25%; animation-delay: -3s; }
  .hero-particle-3 { bottom: 30%; left: 60%; animation-delay: -6s; }

  @keyframes particle-float {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
    33% { transform: translateY(-15px) scale(1.2); opacity: 1; }
    66% { transform: translateY(10px) scale(0.8); opacity: 0.4; }
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

  .hero-header { margin-bottom: 24px; }

  .hero-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
    color: white;
  }

  .hero-amount { margin-bottom: 24px; }
  .amount-section-hero { margin-bottom: 16px; }

  .amount-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.8;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

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

  .period-indicator {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
    margin-left: 8px;
  }

  /* Hero Chart */
  .hero-chart-container {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    margin-top: 20px;
  }

  .chart-title-hero {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
    opacity: 0.9;
  }

  .enhanced-chart {
    height: 120px;
    display: flex;
    align-items: end;
    justify-content: center;
    gap: 4px;
  }

  .chart-bar-enhanced {
    flex: 1;
    min-height: 12px;
    background: linear-gradient(to top,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.7));
    border-radius: 4px;
    position: relative;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
  }

  .chart-bar-enhanced:hover {
    background: linear-gradient(to top,
      rgba(255, 255, 255, 1),
      rgba(255, 255, 255, 0.8));
    transform: scaleY(1.1);
  }

  .chart-tooltip-enhanced {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    color: #1f2937;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    text-align: center;
    visibility: hidden;
    opacity: 0;
    transition: all 0.3s ease;
    white-space: nowrap;
    border: 1px solid rgba(8, 145, 178, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .chart-bar-enhanced:hover .chart-tooltip-enhanced {
    visibility: visible;
    opacity: 1;
  }

  .tooltip-date {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .tooltip-amount {
    color: #0891B2;
    font-size: 11px;
  }

  /* Hero Insights Styling */
  .hero-insights {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
  }

  .hero-insight-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 500;
  }

  .hero-insight-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }

  .hero-insight-text {
    flex: 1;
    line-height: 1.3;
  }

  /* ===== SECONDARY GLASSMORPHISM - FOR SUPPORTING CARDS ===== */
  .secondary-glassmorphism {
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
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
  }

  /* Hero summary specific spacing */
  .hero-summary-container {
    margin-bottom: 1rem;
  }

  .secondary-glassmorphism:hover {
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
    box-shadow:
      0 25px 60px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    transform: translateY(-4px);
  }

  /* Smart Insights Card */
  .insights-card {
    padding: 1.5rem;
  }

  .insights-title {
    color: #1f2937;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .insight-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .insight-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .insight-icon {
    font-size: 20px;
    width: 32px;
    text-align: center;
  }

  .insight-text {
    color: #4a5568;
    font-size: 14px;
    font-weight: 500;
  }

  /* Filters Section */
  .filters-section {
    padding: 1.5rem;
  }

  .search-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 2.5rem 0.875rem 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: #1f2937;
    font-size: 1rem;
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .search-input:focus {
    outline: none;
    border-color: #0891B2;
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
  }

  .search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    pointer-events: none;
  }

  .category-filters {
    margin-bottom: 1rem;
  }

  .filter-label {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .category-chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .category-chip {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.85rem;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .category-chip:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }

  .category-chip.active {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    color: white;
    border-color: rgba(255, 255, 255, 0.4);
  }

  .category-chip:active {
    transform: scale(0.95);
  }

  .clear-filters {
    color: #0891B2;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    text-decoration: underline;
  }

  /* Loading and Empty States */
  .loading-container, .empty-state {
    padding: 3rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(8, 145, 178, 0.3);
    border-top: 3px solid #0891B2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 191, 255, 0.3);
  }

  /* Expense Groups */
  .expense-group {
    padding: 1.5rem;
    overflow: visible;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .group-date {
    color: #1f2937;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .group-total {
    color: #0891B2;
    font-weight: 600;
  }

  .expense-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  /* ===== ENHANCED EXPENSE ITEMS ===== */
  .expense-item-enhanced {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(5px);
    min-height: 80px;
    position: relative;
  }

  .expense-item-enhanced:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px) scale(1.01);
    border-color: rgba(0, 191, 255, 0.3);
    box-shadow: 0 8px 20px rgba(0, 191, 255, 0.08);
  }

  .expense-item-enhanced:active {
    transform: translateY(-1px) scale(0.99);
    background: rgba(0, 191, 255, 0.1);
  }

  .expense-item-enhanced.active {
    background: rgba(0, 191, 255, 0.12);
    border-color: rgba(0, 191, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 191, 255, 0.15);
    min-height: auto;
    align-items: flex-start;
    padding-bottom: 16px;
    margin-bottom: 16px;
    z-index: 100;
  }

  .expense-icon-enhanced {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.2) 0%,
      rgba(6, 182, 212, 0.1) 100%);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .expense-details {
    flex: 1;
  }

  .expense-category {
    color: #1f2937;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .expense-description {
    color: #6b7280;
    font-weight: 400;
    font-size: 0.875rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .expense-amount {
    color: #1f2937;
    font-weight: 600;
    text-align: right;
    flex-shrink: 0;
  }

  /* Delete Button */
  .delete-button {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.1) 0%,
      rgba(220, 38, 38, 0.15) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    margin-left: 8px;
  }

  .delete-button:hover {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.2) 0%,
      rgba(220, 38, 38, 0.25) 100%);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }

  .delete-button:active {
    transform: scale(0.95);
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.3) 0%,
      rgba(220, 38, 38, 0.35) 100%);
  }

  /* Floating Add Button */
  .floating-add-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    color: white;
    font-size: 1.5rem;
    font-weight: 300;
    cursor: pointer;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }

  .floating-add-button:hover {
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

  /* ===== ANIMATIONS ===== */
  @keyframes spin {
    to { transform: rotate(360deg); }
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

  /* ===== RESPONSIVE DESIGN ===== */

  /* Mobile Layout */
  @media (max-width: 767px) {
    .expenses-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px;
    }

    /* Optimize filters section for mobile */
    .filters-section {
      padding: 1rem;
    }

    .search-input {
      padding: 0.7rem 2.2rem 0.7rem 0.9rem;
      font-size: 0.9rem;
    }

    .filter-label {
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .category-chips {
      gap: 0.4rem;
      padding-bottom: 0.3rem;
    }

    .category-chip {
      padding: 0.4rem 0.8rem;
      font-size: 0.75rem;
      min-height: 36px;
      border-radius: 16px;
    }

    /* Optimize expense items for mobile */
    .expense-item-enhanced {
      padding: 12px;
      min-height: 60px;
      gap: 0.75rem;
    }

    .expense-item-enhanced.active {
      min-height: auto;
      margin-bottom: 12px;
    }

    .expense-icon-enhanced {
      width: 36px;
      height: 36px;
      font-size: 16px;
      border-radius: 10px;
    }

    .expense-category {
      font-size: 0.9rem;
      margin-bottom: 0.15rem;
    }

    .expense-description {
      font-size: 0.8rem;
    }

    .expense-amount {
      font-size: 0.9rem;
    }

    .delete-button {
      width: 36px;
      height: 36px;
      font-size: 16px;
      border-radius: 8px;
      margin-left: 6px;
    }

    /* Optimize expense groups for mobile */
    .expense-group {
      padding: 1rem;
    }

    .group-header {
      margin-bottom: 0.75rem;
      padding-bottom: 0.4rem;
    }

    .group-date {
      font-size: 0.95rem;
    }

    .group-total {
      font-size: 0.9rem;
    }

    .expense-items {
      gap: 0.5rem;
    }

    /* Standardized mobile card spacing - 0.75rem for all cards */
    .hero-summary-container,
    .secondary-glassmorphism,
    .expense-group {
      margin-bottom: 0.75rem;
    }

    /* Optimize header for mobile */
    .expenses-header {
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


    /* Optimize hero card for mobile */
    .hero-summary-card {
      padding: 1.2rem;
    }

    .hero-title {
      font-size: 1.3rem;
    }

    .amount-label {
      font-size: 0.7rem;
    }

    .main-amount-large {
      font-size: 1.8rem;
    }

    .hero-amount {
      margin-bottom: 0.25rem;
    }

    .chart-title-hero {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .hero-chart-container {
      margin-top: 0.5rem;
    }

    .enhanced-chart {
      height: 70px;
    }

    /* Optimize hero insights for mobile */
    .hero-insights {
      margin-top: 0.75rem;
      padding: 12px;
      gap: 6px;
    }

    .hero-insight-item {
      font-size: 0.75rem;
      gap: 8px;
    }

    .hero-insight-icon {
      font-size: 14px;
      width: 16px;
    }
  }

  /* Enhanced Mobile Background - Following Design System */
  @media (max-width: 768px) {
    .expenses-page {
      background:
        radial-gradient(circle at 30% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 70% 80%, rgba(30, 144, 255, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 123, 255, 0.04) 0%, transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    }

    .expenses-page::before {
      background-image:
        radial-gradient(circle at 20% 30%, rgba(0, 191, 255, 0.06) 0%, transparent 25%),
        radial-gradient(circle at 80% 70%, rgba(30, 144, 255, 0.05) 0%, transparent 25%),
        radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.04) 0%, transparent 20%);
    }

    .hero-summary-card {
      padding: 24px;
      min-height: 280px;
    }

    .hero-title { font-size: 20px; }
    .main-amount-large { font-size: 28px; }

    .category-chips {
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .category-chips::-webkit-scrollbar {
      display: none;
    }

    .expense-item-enhanced {
      padding: 20px 16px;
      min-height: 80px;
    }

    .floating-add-button {
      bottom: 1.5rem;
      right: 1.5rem;
    }

  }

  /* Extra small mobile */
  @media (max-width: 430px) {
    .expenses-page {
      background:
        radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 0%, transparent 35%),
        radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.08) 0%, transparent 35%),
        linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
    }

    .expenses-page::before {
      background-image:
        radial-gradient(circle at 15% 40%, rgba(0, 191, 255, 0.08) 0%, transparent 20%),
        radial-gradient(circle at 85% 60%, rgba(30, 144, 255, 0.06) 0%, transparent 20%);
    }

    .expenses-header {
      padding: 16px 16px 12px 16px;
    }

    .page-title-section {
      margin-bottom: 12px;
    }

    .page-title {
      font-size: 24px;
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
</style>