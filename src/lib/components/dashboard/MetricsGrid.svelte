<script lang="ts">
  import { onMount } from 'svelte';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { formatRupiah } from '$utils/index';

  export let currentPeriodId: string;

  let loading = true;
  let budgetData: any = null;
  let expenses: any[] = [];

  // Metrics calculations
  let dailyAverage = 0;
  let monthlyProjection = 0;
  let budgetEfficiency = 0;
  let savingsPotential = 0;
  let spendingTrend = 'Stable';
  let goalProgress = 0;

  $: if (currentPeriodId) {
    calculateMetrics();
  }

  // Subscribe to stores - FIXED: budgetStore directly returns the budget object
  $: budgetStore.subscribe((data) => {
    if (data && data.month === currentPeriodId) {
      budgetData = data;
      loading = false;
      calculateMetrics();
    } else if (!data) {
      // Load data if not available
      budgetStore.loadBudgetData(currentPeriodId);
    }
  });

  $: expenseStore.subscribe((data) => {
    if (data.expenses && data.currentPeriod === currentPeriodId) {
      expenses = data.expenses;
      calculateMetrics();
    }
  });

  onMount(() => {
    calculateMetrics();
  });

  function calculateMetrics() {
    if (!budgetData || !expenses) {
      resetMetrics();
      return;
    }

    const totalBudget = budgetData.totalBudget || 0;
    const totalSpent = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate period details
    const today = new Date();
    const daysElapsed = Math.max(1, today.getDate());
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const timeProgress = (daysElapsed / daysInMonth) * 100;
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Daily Average
    dailyAverage = totalSpent / daysElapsed;

    // Monthly Projection
    monthlyProjection = dailyAverage * daysInMonth;

    // Budget Efficiency
    budgetEfficiency = totalBudget > 0 ?
      Math.max(0, 100 - Math.abs(spentPercentage - timeProgress)) : 0;

    // Savings Potential
    const remaining = Math.max(0, totalBudget - totalSpent);
    const daysLeft = daysInMonth - daysElapsed;
    const currentDailyRate = dailyAverage;
    const optimalDailyRate = totalBudget / daysInMonth;
    savingsPotential = currentDailyRate < optimalDailyRate && remaining > 0 ?
      Math.max(0, remaining - (currentDailyRate * daysLeft)) : 0;

    // Spending Trend
    if (currentDailyRate > optimalDailyRate * 1.1) {
      spendingTrend = 'Increasing ⬆️';
    } else if (currentDailyRate < optimalDailyRate * 0.9) {
      spendingTrend = 'Decreasing ⬇️';
    } else {
      spendingTrend = 'Stable ➡️';
    }

    // Goal Progress
    goalProgress = Math.min(100, (timeProgress - spentPercentage + 100) / 2);
  }

  function resetMetrics() {
    dailyAverage = 0;
    monthlyProjection = 0;
    budgetEfficiency = 0;
    savingsPotential = 0;
    spendingTrend = 'Stable';
    goalProgress = 0;
  }

  const metrics = [
    {
      icon: '📊',
      label: 'Daily Average',
      value: () => formatRupiah(dailyAverage),
      color: 'text-blue-400'
    },
    {
      icon: '📅',
      label: 'Period Forecast',
      value: () => formatRupiah(monthlyProjection),
      color: 'text-purple-400'
    },
    {
      icon: '⚡',
      label: 'Budget Efficiency',
      value: () => `${Math.round(budgetEfficiency)}%`,
      color: 'text-green-400'
    },
    {
      icon: '💎',
      label: 'Savings Potential',
      value: () => formatRupiah(savingsPotential),
      color: 'text-yellow-400'
    },
    {
      icon: '📈',
      label: 'Spending Trend',
      value: () => spendingTrend,
      color: 'text-orange-400'
    },
    {
      icon: '🏆',
      label: 'Goal Progress',
      value: () => `${Math.round(goalProgress)}%`,
      color: 'text-secondary-400'
    }
  ];
</script>

<div class="glass-card p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-white flex items-center gap-2">
      📈 Financial Intelligence
    </h2>
    <div class="text-sm text-gray-300">
      Real-time insights
    </div>
  </div>

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(6) as _}
        <div class="loading-skeleton h-24 rounded-lg"></div>
      {/each}
    </div>
  {:else}
    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each metrics as metric}
        <div class="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{metric.icon}</span>
                <span class="text-sm text-gray-300">{metric.label}</span>
              </div>
              <div class="text-lg font-semibold text-white {metric.color.includes('currency') ? 'currency-display' : ''}">
                {metric.value()}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Quick Insights -->
    <div class="mt-6 p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
      <h3 class="text-sm font-medium text-gray-300 mb-2">Quick Insights</h3>
      <div class="space-y-2 text-sm text-gray-300">
        {#if budgetEfficiency >= 80}
          <p class="flex items-center gap-2">
            <span class="text-green-400">✅</span>
            Excellent budget control! You're staying on track.
          </p>
        {:else if budgetEfficiency >= 60}
          <p class="flex items-center gap-2">
            <span class="text-yellow-400">⚠️</span>
            Budget control is moderate. Consider monitoring spending more closely.
          </p>
        {:else}
          <p class="flex items-center gap-2">
            <span class="text-red-400">🚨</span>
            Budget needs attention. Review your spending patterns.
          </p>
        {/if}

        {#if savingsPotential > 50000}
          <p class="flex items-center gap-2">
            <span class="text-blue-400">💡</span>
            Great saving potential of {formatRupiah(savingsPotential)} this period!
          </p>
        {/if}

        {#if monthlyProjection > (budgetData && budgetData.totalBudget ? budgetData.totalBudget : 0) * 1.1}
          <p class="flex items-center gap-2">
            <span class="text-orange-400">📊</span>
            Current projection exceeds budget. Consider reducing daily spending.
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>