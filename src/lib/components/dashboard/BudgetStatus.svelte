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
  let totalBudget = 0;
  let totalSpent = 0;
  let spentPercentage = 0;
  let remaining = 0;
  let daysLeft = 0;

  $: if (currentPeriodId) {
    loadBudgetStatus();
  }

  // Reactive calculations - Fixed to handle null budgetData
  $: {
    totalBudget = (budgetData && budgetData.totalBudget) ? budgetData.totalBudget : 0;
    totalSpent = calculateTotalSpent();
    remaining = Math.max(0, totalBudget - totalSpent);
    spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    daysLeft = calculateDaysLeft();
  }

  // Subscribe to stores - FIXED: budgetStore directly returns the budget object
  $: budgetStore.subscribe((data) => {
    if (data && data.month === currentPeriodId) {
      budgetData = data;
      loading = false;
    } else if (!data) {
      // Load data if not available
      budgetStore.loadBudgetData(currentPeriodId);
    }
  });

  $: expenseStore.subscribe((data) => {
    if (data && data.expenses && data.currentPeriod === currentPeriodId) {
      expenses = data.expenses;
    }
  });

  onMount(() => {
    loadBudgetStatus();
  });

  async function loadBudgetStatus() {
    try {
      loading = true;

      // Check if store methods exist before calling them
      if (budgetStore && typeof budgetStore.loadBudgetData === 'function') {
        await budgetStore.loadBudgetData(currentPeriodId);
      }

      // Note: expenseStore doesn't have loadExpenses method in current implementation
      // TODO: Implement proper expense loading when expense store is complete
    } catch (error) {
      console.error('Error loading budget status:', error);
    } finally {
      loading = false;
    }
  }

  function calculateTotalSpent(): number {
    if (!expenses.length) return 0;
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  }

  function calculateDaysLeft(): number {
    // Simple calculation - should be enhanced with proper period logic
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const diffTime = endOfMonth.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  function getBudgetStatus(percentage: number) {
    if (percentage >= 90) {
      return {
        statusText: 'Budget alert!',
        healthIcon: '🔴',
        colorClass: 'budget-status-danger',
        progressClass: 'bg-red-500'
      };
    } else if (percentage >= 70) {
      return {
        statusText: 'Watch out!',
        healthIcon: '🟡',
        colorClass: 'budget-status-warning',
        progressClass: 'bg-yellow-500'
      };
    } else {
      return {
        statusText: 'Looking good!',
        healthIcon: '🟢',
        colorClass: 'budget-status-safe',
        progressClass: 'bg-green-500'
      };
    }
  }

  $: budgetStatus = getBudgetStatus(spentPercentage);
</script>

<div class="glass-card p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-white flex items-center gap-2">
      💰 Budget Overview
    </h2>
    <div class="flex items-center gap-2">
      <span class="text-2xl">{budgetStatus.healthIcon}</span>
      <span class="text-sm font-medium text-gray-300">{budgetStatus.statusText}</span>
    </div>
  </div>

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="space-y-6">
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <div class="loading-skeleton h-6 w-24"></div>
          <div class="loading-skeleton h-6 w-16"></div>
        </div>
        <div class="loading-skeleton h-4 w-full rounded-full"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each Array(3) as _}
          <div class="loading-skeleton h-20 rounded-lg"></div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Budget Progress -->
    <div class="space-y-4 mb-6">
      <div class="flex justify-between items-baseline">
        <div class="text-white">
          <span class="text-2xl font-bold currency-display">
            {formatRupiah(totalSpent)}
          </span>
          <span class="text-gray-300 ml-2">
            / {formatRupiah(totalBudget)}
          </span>
        </div>
        <div class="text-right">
          <div class="text-xl font-bold text-white">
            {Math.min(100, spentPercentage).toFixed(0)}%
          </div>
          <div class="text-sm text-gray-300">digunakan</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="relative">
        <div class="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm">
          <div
            class="h-3 rounded-full transition-all duration-500 {budgetStatus.progressClass}"
            style="width: {Math.min(100, spentPercentage)}%"
          ></div>
        </div>
        {#if spentPercentage > 100}
          <div class="absolute right-0 top-0 h-3 bg-red-600 rounded-r-full opacity-80"
               style="width: {Math.min(50, spentPercentage - 100)}%"></div>
        {/if}
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Remaining Budget -->
      <div class="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-300">Sisa Budget</p>
            <p class="text-lg font-semibold text-white currency-display">
              {formatRupiah(remaining)}
            </p>
          </div>
          <div class="text-2xl">💎</div>
        </div>
      </div>

      <!-- Days Left -->
      <div class="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-300">Hari Tersisa</p>
            <p class="text-lg font-semibold text-white">
              {daysLeft} hari
            </p>
          </div>
          <div class="text-2xl">📅</div>
        </div>
      </div>

      <!-- Daily Average -->
      <div class="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-300">Rata-rata Harian</p>
            <p class="text-lg font-semibold text-white currency-display">
              {formatRupiah(daysLeft > 0 ? remaining / daysLeft : 0)}
            </p>
          </div>
          <div class="text-2xl">📊</div>
        </div>
      </div>
    </div>

    <!-- Budget Status Message -->
    <div class="mt-6 p-4 rounded-lg {budgetStatus.colorClass}">
      <div class="flex items-center gap-3">
        <span class="text-2xl">{budgetStatus.healthIcon}</span>
        <div>
          <h4 class="font-medium">{budgetStatus.statusText}</h4>
          <p class="text-sm opacity-90">
            {#if spentPercentage >= 100}
              Anda telah melebihi budget sebesar {formatRupiah(totalSpent - totalBudget)}
            {:else if spentPercentage >= 80}
              Berhati-hatilah dengan pengeluaran, budget hampir habis
            {:else}
              Budget Anda masih dalam kondisi yang baik
            {/if}
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>