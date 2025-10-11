// Budget management stores for DuitTrack
import { writable, derived, type Writable } from 'svelte/store';
import type { Budget, BudgetCategory, CategoryBudget } from '../types';

// Main budget stores
export const budgetsStore: Writable<Budget[]> = writable([]);
export const currentBudgetStore: Writable<Budget | null> = writable(null);
export const budgetLoadingStore: Writable<boolean> = writable(false);
export const budgetErrorStore: Writable<string | null> = writable(null);

// Selected month for budget management
export const selectedMonthStore: Writable<string> = writable(getCurrentMonth());

// Budget categories configuration
export const budgetCategoriesStore: Writable<BudgetCategory[]> = writable([
  { id: 'food', name: 'Makanan & Minuman', icon: '🍽️', color: '#FF6B6B', defaultBudget: 1000000 },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4', defaultBudget: 500000 },
  { id: 'shopping', name: 'Belanja', icon: '🛍️', color: '#45B7D1', defaultBudget: 800000 },
  { id: 'entertainment', name: 'Hiburan', icon: '🎬', color: '#F39C12', defaultBudget: 300000 },
  { id: 'health', name: 'Kesehatan', icon: '⚕️', color: '#27AE60', defaultBudget: 400000 },
  { id: 'education', name: 'Pendidikan', icon: '📚', color: '#8E44AD', defaultBudget: 600000 },
  { id: 'utilities', name: 'Tagihan', icon: '💡', color: '#E67E22', defaultBudget: 700000 },
  { id: 'savings', name: 'Tabungan', icon: '💰', color: '#16A085', defaultBudget: 1500000 },
  { id: 'other', name: 'Lainnya', icon: '📦', color: '#95A5A6', defaultBudget: 200000 }
]);

// Derived stores for computed values
export const currentBudget = derived(
  [budgetsStore, selectedMonthStore],
  ([$budgets, $selectedMonth]) => {
    return $budgets.find(budget => budget.month === $selectedMonth) || null;
  }
);

// Budget vs spending analysis
export const budgetAnalysis = derived(
  currentBudget,
  ($currentBudget) => {
    if (!$currentBudget) return null;

    const analysis: Record<string, {
      category: string;
      budgeted: number;
      spent: number;
      remaining: number;
      percentage: number;
      status: 'safe' | 'warning' | 'over';
    }> = {};

    Object.entries($currentBudget.categories).forEach(([category, data]) => {
      const remaining = data.budget - data.spent;
      const percentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;

      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage >= 100) status = 'over';
      else if (percentage >= 80) status = 'warning';

      analysis[category] = {
        category,
        budgeted: data.budget,
        spent: data.spent,
        remaining,
        percentage,
        status
      };
    });

    return analysis;
  }
);

// Total budget summary
export const budgetSummary = derived(
  currentBudget,
  ($currentBudget) => {
    if (!$currentBudget) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
        categoriesCount: 0,
        overBudgetCount: 0
      };
    }

    const totalBudget = Object.values($currentBudget.categories)
      .reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = Object.values($currentBudget.categories)
      .reduce((sum, cat) => sum + cat.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const categoriesCount = Object.keys($currentBudget.categories).length;
    const overBudgetCount = Object.values($currentBudget.categories)
      .filter(cat => cat.spent > cat.budget).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      categoriesCount,
      overBudgetCount
    };
  }
);

// Categories needing attention (over 80% or over budget)
export const categoriesNeedingAttention = derived(
  budgetAnalysis,
  ($budgetAnalysis) => {
    if (!$budgetAnalysis) return [];

    return Object.values($budgetAnalysis)
      .filter(item => item.status === 'warning' || item.status === 'over')
      .sort((a, b) => b.percentage - a.percentage);
  }
);

// Budget performance over time
export const budgetPerformance = derived(
  budgetsStore,
  ($budgets) => {
    return $budgets
      .slice(-6) // Last 6 months
      .map(budget => ({
        month: budget.month,
        totalBudget: budget.totalBudget,
        totalSpent: budget.totalSpent,
        percentage: budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0,
        variance: budget.totalBudget - budget.totalSpent
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
);

// Budget recommendations based on spending patterns
export const budgetRecommendations = derived(
  [budgetAnalysis, budgetPerformance],
  ([$budgetAnalysis, $budgetPerformance]) => {
    const recommendations: Array<{
      type: 'increase' | 'decrease' | 'reallocate' | 'warning';
      category?: string;
      message: string;
      suggestedAmount?: number;
    }> = [];

    if (!$budgetAnalysis) return recommendations;

    // Categories consistently over budget
    Object.values($budgetAnalysis).forEach(item => {
      if (item.status === 'over') {
        const increase = Math.ceil((item.spent - item.budgeted) * 1.1);
        recommendations.push({
          type: 'increase',
          category: item.category,
          message: `Pertimbangkan menaikkan budget ${item.category} sebesar ${formatCurrency(increase)}`,
          suggestedAmount: increase
        });
      }
    });

    // Categories with too much unused budget
    Object.values($budgetAnalysis).forEach(item => {
      if (item.percentage < 50 && item.budgeted > 100000) {
        recommendations.push({
          type: 'decrease',
          category: item.category,
          message: `Budget ${item.category} bisa dikurangi karena penggunaan rendah (${Math.round(item.percentage)}%)`,
          suggestedAmount: Math.floor(item.budgeted * 0.2)
        });
      }
    });

    // Overall spending trend warning
    if ($budgetPerformance.length >= 3) {
      const recentMonths = $budgetPerformance.slice(-3);
      const avgOverspend = recentMonths.reduce((sum, month) => sum + Math.max(0, month.totalSpent - month.totalBudget), 0) / 3;

      if (avgOverspend > 100000) {
        recommendations.push({
          type: 'warning',
          message: `Pengeluaran rata-rata melebihi budget ${formatCurrency(avgOverspend)} dalam 3 bulan terakhir`
        });
      }
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
);

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Helper function to get current month
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Store actions
export const budgetActions = {
  // Set loading state
  setLoading: (loading: boolean) => {
    budgetLoadingStore.set(loading);
  },

  // Set error state
  setError: (error: string | null) => {
    budgetErrorStore.set(error);
  },

  // Update budgets list
  setBudgets: (budgets: Budget[]) => {
    budgetsStore.set(budgets);
  },

  // Set current budget
  setCurrentBudget: (budget: Budget | null) => {
    currentBudgetStore.set(budget);
  },

  // Add new budget
  addBudget: (budget: Budget) => {
    budgetsStore.update(budgets => [budget, ...budgets]);
  },

  // Update existing budget
  updateBudget: (updatedBudget: Budget) => {
    budgetsStore.update(budgets =>
      budgets.map(budget =>
        budget.month === updatedBudget.month ? updatedBudget : budget
      )
    );
  },

  // Set selected month
  setSelectedMonth: (month: string) => {
    selectedMonthStore.set(month);
  },

  // Update category budget
  updateCategoryBudget: (category: string, amount: number) => {
    currentBudgetStore.update(budget => {
      if (!budget) return budget;

      const updatedCategories = {
        ...budget.categories,
        [category]: {
          ...budget.categories[category],
          budget: amount
        }
      };

      const totalBudget = Object.values(updatedCategories)
        .reduce((sum, cat) => sum + cat.budget, 0);

      return {
        ...budget,
        categories: updatedCategories,
        totalBudget
      };
    });
  },

  // Add new category to budget
  addCategoryToBudget: (category: string, budgetAmount: number) => {
    currentBudgetStore.update(budget => {
      if (!budget) return budget;

      const updatedCategories = {
        ...budget.categories,
        [category]: {
          budget: budgetAmount,
          spent: 0
        }
      };

      const totalBudget = Object.values(updatedCategories)
        .reduce((sum, cat) => sum + cat.budget, 0);

      return {
        ...budget,
        categories: updatedCategories,
        totalBudget
      };
    });
  },

  // Remove category from budget
  removeCategoryFromBudget: (category: string) => {
    currentBudgetStore.update(budget => {
      if (!budget) return budget;

      const updatedCategories = { ...budget.categories };
      delete updatedCategories[category];

      const totalBudget = Object.values(updatedCategories)
        .reduce((sum, cat) => sum + cat.budget, 0);

      return {
        ...budget,
        categories: updatedCategories,
        totalBudget
      };
    });
  },

  // Update category spending (add expense amount to category)
  updateCategorySpending: (category: string, amount: number) => {
    currentBudgetStore.update(budget => {
      if (!budget || !budget.categories[category]) return budget;

      const updatedCategories = {
        ...budget.categories,
        [category]: {
          ...budget.categories[category],
          spent: budget.categories[category].spent + amount
        }
      };

      const totalSpent = Object.values(updatedCategories)
        .reduce((sum, cat) => sum + cat.spent, 0);

      return {
        ...budget,
        categories: updatedCategories,
        totalSpent
      };
    });
  },

  // Load budget data (using centralized dummy data)
  loadBudgetData: async (periodId?: string) => {
    budgetLoadingStore.set(true);
    budgetErrorStore.set(null);

    // Dynamically import dummy data to ensure latest version
    const { getDummyBudgetData, generateDummyExpenses } = await import('../utils/dummyData');

    // Generate expenses to calculate spending
    const expenses = generateDummyExpenses(25);

    // Calculate spending per category from actual expenses
    const categorySpending: Record<string, number> = {};
    expenses.forEach((expense: any) => {
      const categoryId = expense.category.toLowerCase();
      categorySpending[categoryId] = (categorySpending[categoryId] || 0) + expense.amount;
    });

    // Get budget data with real spending
    const budgetDummyData = getDummyBudgetData();

    // Update categories with REAL spending from expenses
    const categoriesWithSpending: Record<string, CategoryBudget> = {};
    Object.entries(budgetDummyData.categories).forEach(([catId, catData]: [string, any]) => {
      categoriesWithSpending[catId] = {
        budget: catData.budget,
        spent: categorySpending[catId] || 0
      };
    });

    const totalSpent = Object.values(categoriesWithSpending).reduce((sum, cat) => sum + cat.spent, 0);

    // Simulate loading delay
    setTimeout(() => {
      const mockBudget: Budget = {
        id: `budget_${periodId || getCurrentMonth()}`,
        month: periodId || getCurrentMonth(),
        categories: categoriesWithSpending,
        totalBudget: budgetDummyData.totalBudget,
        totalSpent: totalSpent,
        userId: 'current_user'
      };

      currentBudgetStore.set(mockBudget);
      budgetLoadingStore.set(false);
    }, 1000);
  }
};

// Compatibility alias for components expecting budgetStore
export const budgetStore = {
  subscribe: currentBudgetStore.subscribe,
  loadBudgetData: budgetActions.loadBudgetData
};
