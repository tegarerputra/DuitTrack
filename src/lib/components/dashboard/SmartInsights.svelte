<script lang="ts">
  import { onMount } from 'svelte';
  import { budgetStore } from '$stores/budget';
  import { expenseStore } from '$stores/expenses';
  import { formatRupiah } from '$utils/index';

  export let currentPeriodId: string;

  let loading = true;
  let budgetData: any = null;
  let expenses: any[] = [];
  let insights: any[] = [];

  $: if (currentPeriodId) {
    generateInsights();
  }

  // Subscribe to stores - Fixed to handle the new store structure
  $: budgetStore.subscribe((data) => {
    if (data && data.month === currentPeriodId) {
      budgetData = data;
      loading = false;
      generateInsights();
    } else if (!data) {
      // Load data if not available
      budgetStore.loadBudgetData(currentPeriodId);
    }
  });

  $: expenseStore.subscribe((data) => {
    if (data && data.expenses && data.currentPeriod === currentPeriodId) {
      expenses = data.expenses;
      generateInsights();
    }
  });

  onMount(() => {
    generateInsights();
  });

  function generateInsights() {
    if (!budgetData || !expenses.length) {
      insights = getDefaultInsights();
      return;
    }

    const newInsights = [];
    const today = new Date();
    const daysElapsed = Math.max(1, today.getDate());
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const timeProgress = (daysElapsed / daysInMonth) * 100;

    const totalBudget = budgetData.totalBudget || 0;
    const totalSpent = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Budget efficiency insight
    if (totalBudget > 0 && spentPercentage > 0) {
      if (spentPercentage > timeProgress + 15) {
        newInsights.push({
          type: 'danger',
          icon: '⚠️',
          title: 'Spending too fast!',
          description: `You've used ${spentPercentage.toFixed(0)}% of your budget in just ${timeProgress.toFixed(0)}% of the month.`,
          priority: 1
        });
      } else if (spentPercentage < timeProgress - 15) {
        newInsights.push({
          type: 'success',
          icon: '🎉',
          title: 'Excellent budget control!',
          description: `Only used ${spentPercentage.toFixed(0)}% of budget in ${timeProgress.toFixed(0)}% of the month.`,
          priority: 2
        });
      }
    }

    // Category-specific insights
    if (budgetData.categories) {
      Object.entries(budgetData.categories).forEach(([categoryKey, categoryData]: [string, any]) => {
        const categoryExpenses = expenses.filter(exp =>
          exp.category?.toUpperCase() === categoryKey.toUpperCase()
        );
        const categorySpent = categoryExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const categoryBudget = categoryData.budget || 0;
        const categoryPercentage = categoryBudget > 0 ? (categorySpent / categoryBudget) * 100 : 0;

        if (categoryPercentage > 90 && categoryBudget > 0) {
          const categoryName = formatCategoryName(categoryKey);
          newInsights.push({
            type: categoryPercentage > 100 ? 'danger' : 'warning',
            icon: categoryPercentage > 100 ? '🚨' : '💸',
            title: `${categoryName} ${categoryPercentage > 100 ? 'exceeded!' : 'running low!'}`,
            description: `${categoryPercentage.toFixed(0)}% of ${categoryName} budget used (${formatRupiah(categorySpent)} / ${formatRupiah(categoryBudget)})`,
            priority: categoryPercentage > 100 ? 1 : 3
          });
        }
      });
    }

    // Spending pattern insights
    const recentExpenses = expenses
      .filter(exp => {
        const expenseDate = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
        const daysDiff = (today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });

    if (recentExpenses.length >= 3) {
      const recentTotal = recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const dailyAverage = recentTotal / 7;
      const monthlyProjection = dailyAverage * daysInMonth;

      if (monthlyProjection > totalBudget * 1.2) {
        newInsights.push({
          type: 'warning',
          icon: '📊',
          title: 'High spending trend detected',
          description: `Recent 7-day spending suggests monthly total of ${formatRupiah(monthlyProjection)}`,
          priority: 2
        });
      }
    }

    // Savings opportunity
    const remaining = Math.max(0, totalBudget - totalSpent);
    const daysLeft = daysInMonth - daysElapsed;
    if (remaining > 0 && daysLeft > 0) {
      const dailyBudgetLeft = remaining / daysLeft;
      const currentDailySpend = totalSpent / daysElapsed;

      if (currentDailySpend < dailyBudgetLeft * 0.8) {
        newInsights.push({
          type: 'success',
          icon: '💰',
          title: 'Great saving opportunity!',
          description: `You can save up to ${formatRupiah(remaining - (currentDailySpend * daysLeft))} this month`,
          priority: 3
        });
      }
    }

    // Sort by priority and limit to top 3
    insights = newInsights
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);

    if (insights.length === 0) {
      insights = getDefaultInsights();
    }
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

  function getDefaultInsights() {
    return [
      {
        type: 'info',
        icon: '🧠',
        title: 'AI Financial Assistant Ready',
        description: 'Add some expenses and budget data to get personalized insights',
        priority: 1
      },
      {
        type: 'info',
        icon: '📊',
        title: 'Track Your Progress',
        description: 'Set up category budgets to get smart spending recommendations',
        priority: 2
      },
      {
        type: 'info',
        icon: '💡',
        title: 'Smart Recommendations',
        description: 'I\'ll analyze your spending patterns and suggest optimizations',
        priority: 3
      }
    ];
  }

  function getInsightTypeClass(type: string): string {
    const classes = {
      success: 'bg-green-900/20 border-green-500/40 text-green-300',
      warning: 'bg-yellow-900/20 border-yellow-500/40 text-yellow-300',
      danger: 'bg-red-900/20 border-red-500/40 text-red-300',
      info: 'bg-blue-900/20 border-blue-500/40 text-blue-300'
    };
    return classes[type as keyof typeof classes] || classes.info;
  }
</script>

<div class="glass-card p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-white flex items-center gap-2">
      🧠 Smart Insights
    </h2>
    <div class="text-sm text-gray-300">
      AI-powered analysis
    </div>
  </div>

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="space-y-4">
      {#each Array(3) as _}
        <div class="loading-skeleton h-20 rounded-lg"></div>
      {/each}
    </div>
  {:else if insights.length === 0}
    <!-- Empty State -->
    <div class="text-center py-8">
      <div class="text-6xl mb-4">🧠</div>
      <h3 class="text-lg font-medium text-white mb-2">No Insights Yet</h3>
      <p class="text-gray-300 max-w-md mx-auto">
        Add some budget and expense data to get personalized financial insights and recommendations.
      </p>
    </div>
  {:else}
    <!-- Insights List -->
    <div class="space-y-4">
      {#each insights as insight, index}
        <div class="border rounded-lg p-4 backdrop-blur-sm {getInsightTypeClass(insight.type)} transition-all duration-200 hover:scale-[1.02]">
          <div class="flex items-start gap-3">
            <div class="text-2xl mt-1 flex-shrink-0">
              {insight.icon}
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-white mb-1 {index === 0 ? 'text-lg' : 'text-base'}">
                {insight.title}
              </h4>
              <p class="text-sm opacity-90">
                {insight.description}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- AI Assistant Footer -->
    <div class="mt-6 p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span class="text-sm">🤖</span>
        </div>
        <div>
          <h4 class="text-sm font-medium text-white">DuitTrack AI Assistant</h4>
          <p class="text-xs text-gray-300">
            Insights update automatically based on your spending patterns
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>