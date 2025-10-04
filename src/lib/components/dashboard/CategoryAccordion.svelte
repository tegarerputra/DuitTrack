<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { formatRupiah } from '$utils/index';

  export let currentPeriodId: string;

  const dispatch = createEventDispatcher();

  let loading = true;
  let budgetData: any = null;
  let expenses: any[] = [];
  let expandedCategory: string | null = null;
  let categoryExpenses: Record<string, any[]> = {};

  $: if (currentPeriodId) {
    loadCategoryData();
  }

  // Subscribe to stores - Fixed to handle the new store structure
  $: budgetStore.subscribe((data) => {
    if (data && data.month === currentPeriodId) {
      budgetData = data;
      loading = false;
      updateCategoryData();
    } else if (!data) {
      // Load data if not available
      budgetStore.loadBudgetData(currentPeriodId);
    }
  });

  $: expenseStore.subscribe((data) => {
    if (data.expenses && data.currentPeriod === currentPeriodId) {
      expenses = data.expenses;
      updateCategoryData();
    }
  });

  onMount(() => {
    loadCategoryData();
  });

  async function loadCategoryData() {
    try {
      loading = true;
      await Promise.all([
        budgetStore.loadBudgetData(currentPeriodId),
        expenseStore.loadExpenses(currentPeriodId)
      ]);
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      loading = false;
    }
  }

  function updateCategoryData() {
    if (!expenses.length) {
      categoryExpenses = {};
      return;
    }

    // Group expenses by category
    categoryExpenses = expenses.reduce((acc, expense) => {
      const category = expense.category?.toUpperCase() || 'OTHER';
      if (!acc[category]) acc[category] = [];
      acc[category].push(expense);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort expenses within each category by date (newest first)
    Object.keys(categoryExpenses).forEach(category => {
      categoryExpenses[category].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
    });
  }

  function getSortedCategories() {
    if (!budgetData?.categories) return [];

    return Object.entries(budgetData.categories)
      .filter(([_, data]: [string, any]) => (data.spent || 0) > 0 || (data.budget || 0) > 0)
      .sort((a, b) => {
        const [categoryA, dataA] = a;
        const [categoryB, dataB] = b;

        const percentageA = dataA.budget > 0 ? (dataA.spent / dataA.budget) * 100 : 0;
        const percentageB = dataB.budget > 0 ? (dataB.spent / dataB.budget) * 100 : 0;

        // Sort by percentage (overbudget first, then highest percentage)
        if (percentageA >= 100 && percentageB < 100) return -1;
        if (percentageA < 100 && percentageB >= 100) return 1;
        return percentageB - percentageA;
      });
  }

  function toggleCategory(category: string) {
    if (expandedCategory === category) {
      expandedCategory = null;
    } else {
      expandedCategory = category;
    }
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'FOOD': '🍽️',
      'SNACK': '🍿',
      'HOUSEHOLD': '🏠',
      'FRUIT': '🍎',
      'TRANSPORT': '🚗',
      'ENTERTAINMENT': '🎬',
      'HIBURAN': '🎬',
      'HEALTH': '🏥',
      'EDUCATION': '📚',
      'SHOPPING': '🛍️',
      'BILLS': '💰',
      'OTHER': '📦'
    };
    return icons[category?.toUpperCase()] || '💰';
  }

  function formatCategoryName(category: string): string {
    const names: Record<string, string> = {
      'FOOD': 'Makanan',
      'SNACK': 'Jajan',
      'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan',
      'TRANSPORT': 'Transportasi',
      'ENTERTAINMENT': 'Hiburan',
      'HIBURAN': 'Hiburan',
      'HEALTH': 'Kesehatan',
      'EDUCATION': 'Pendidikan',
      'SHOPPING': 'Belanja',
      'BILLS': 'Tagihan',
      'OTHER': 'Lainnya'
    };
    return names[category?.toUpperCase()] || category || 'Lainnya';
  }

  function getCategoryHealthStatus(percentage: number) {
    if (percentage >= 100) {
      return {
        class: 'text-red-400 bg-red-900/20',
        indicator: '🔴',
        text: 'Over Budget',
        progressClass: 'bg-red-500'
      };
    } else if (percentage >= 80) {
      return {
        class: 'text-yellow-400 bg-yellow-900/20',
        indicator: '🟡',
        text: 'Watch Out',
        progressClass: 'bg-yellow-500'
      };
    } else {
      return {
        class: 'text-green-400 bg-green-900/20',
        indicator: '🟢',
        text: 'Good',
        progressClass: 'bg-green-500'
      };
    }
  }

  function formatSmartDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  $: sortedCategories = getSortedCategories();
</script>

<div class="glass-card p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-white flex items-center gap-2">
      📊 Category Breakdown
    </h2>
    <div class="text-sm text-gray-300">
      {sortedCategories.length} categories
    </div>
  </div>

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="space-y-4">
      {#each Array(4) as _}
        <div class="loading-skeleton h-24 rounded-lg"></div>
      {/each}
    </div>
  {:else if sortedCategories.length === 0}
    <!-- Empty State -->
    <div class="text-center py-8">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-lg font-medium text-white mb-2">No Categories Yet</h3>
      <p class="text-gray-300 max-w-md mx-auto">
        Set up your budget categories and add some expenses to see the breakdown here.
      </p>
    </div>
  {:else}
    <!-- Categories List -->
    <div class="space-y-3">
      {#each sortedCategories as [category, data]}
        {@const spent = data.spent || 0}
        {@const budget = data.budget || 0}
        {@const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0}
        {@const healthStatus = getCategoryHealthStatus(percentage)}
        {@const isExpanded = expandedCategory === category}
        {@const categoryExpenseList = categoryExpenses[category] || []}

        <div class="bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-200">
          <!-- Category Header -->
          <button
            class="w-full p-4 text-left hover:bg-white/5 transition-colors duration-200"
            on:click={() => toggleCategory(category)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{getCategoryIcon(category)}</span>
                <div>
                  <h3 class="font-medium text-white">{formatCategoryName(category)}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-2 py-1 rounded-full {healthStatus.class}">
                      {healthStatus.indicator} {healthStatus.text}
                    </span>
                    <span class="text-xs text-gray-300">
                      {categoryExpenseList.length} transaction{categoryExpenseList.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-sm text-white font-medium">
                  {formatRupiah(spent)} / {formatRupiah(budget)}
                </div>
                <div class="text-xs text-gray-300">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-3">
              <div class="w-full bg-white/10 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-500 {healthStatus.progressClass}"
                  style="width: {Math.min(100, percentage)}%"
                ></div>
              </div>
            </div>

            <!-- Expand/Collapse Icon -->
            <div class="flex justify-center mt-2">
              <div class="text-gray-400 transform transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}">
                ▼
              </div>
            </div>
          </button>

          <!-- Expanded Content -->
          {#if isExpanded}
            <div class="border-t border-white/10 p-4 bg-white/5">
              {#if categoryExpenseList.length === 0}
                <div class="text-center py-4 text-gray-300">
                  No expenses in this category yet
                </div>
              {:else}
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  {#each categoryExpenseList.slice(0, 10) as expense}
                    {@const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date)}

                    <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div class="flex-1">
                        <div class="font-medium text-white text-sm">
                          {expense.description || 'Expense'}
                        </div>
                        <div class="text-xs text-gray-300">
                          {formatSmartDate(expenseDate)}
                        </div>
                      </div>
                      <div class="text-sm font-medium text-white currency-display">
                        {formatRupiah(expense.amount)}
                      </div>
                    </div>
                  {/each}

                  {#if categoryExpenseList.length > 10}
                    <div class="text-center py-2">
                      <span class="text-xs text-gray-400">
                        And {categoryExpenseList.length - 10} more transactions...
                      </span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>