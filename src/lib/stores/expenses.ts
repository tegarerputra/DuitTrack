// Expense management stores for DuitTrack
import { writable, derived, type Writable } from 'svelte/store';
import type { Expense } from '../types';

// Main expense stores
export const expensesStore: Writable<Expense[]> = writable([]);

// Current month filter
export const currentMonthStore: Writable<string> = writable(getCurrentMonth());

// Loading state for expenses
export const expensesLoadingStore: Writable<boolean> = writable(false);

// Error state for expenses
export const expensesErrorStore: Writable<string | null> = writable(null);

// Selected expense for editing
export const selectedExpenseStore: Writable<Expense | null> = writable(null);

// Category filter
export const categoryFilterStore: Writable<string> = writable('all');

// Date range filter
export interface DateRange {
  start: Date;
  end: Date;
}

export const dateRangeStore: Writable<DateRange | null> = writable(null);

// Search query for expenses
export const expenseSearchStore: Writable<string> = writable('');

// Derived stores for computed values
export const filteredExpenses = derived(
  [expensesStore, categoryFilterStore, dateRangeStore, expenseSearchStore],
  ([$expenses, $categoryFilter, $dateRange, $searchQuery]) => {
    let filtered = [...$expenses];

    // Category filter
    if ($categoryFilter && $categoryFilter !== 'all') {
      filtered = filtered.filter(expense =>
        expense.category.toLowerCase() === $categoryFilter.toLowerCase()
      );
    }

    // Date range filter
    if ($dateRange) {
      filtered = filtered.filter(expense => {
        const expenseDate = expense.date instanceof Date
          ? expense.date
          : expense.date.toDate();
        return expenseDate >= $dateRange.start && expenseDate <= $dateRange.end;
      });
    }

    // Search filter
    if ($searchQuery) {
      const query = $searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate();
      const dateB = b.date instanceof Date ? b.date : b.date.toDate();
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }
);

// Monthly expenses for current month
export const currentMonthExpenses = derived(
  [expensesStore, currentMonthStore],
  ([$expenses, $currentMonth]) => {
    return $expenses.filter(expense => {
      const expenseDate = expense.date instanceof Date
        ? expense.date
        : expense.date.toDate();
      const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      return expenseMonth === $currentMonth;
    });
  }
);

// Total expenses for current month
export const currentMonthTotal = derived(
  currentMonthExpenses,
  ($currentMonthExpenses) => {
    return $currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0);
  }
);

// Expenses grouped by category for current month
export const expensesByCategory = derived(
  currentMonthExpenses,
  ($currentMonthExpenses) => {
    const grouped: Record<string, { total: number; count: number; expenses: Expense[] }> = {};

    $currentMonthExpenses.forEach(expense => {
      const category = expense.category.toLowerCase();
      if (!grouped[category]) {
        grouped[category] = { total: 0, count: 0, expenses: [] };
      }
      grouped[category].total += expense.amount;
      grouped[category].count += 1;
      grouped[category].expenses.push(expense);
    });

    return grouped;
  }
);

// Top spending categories
export const topCategories = derived(
  expensesByCategory,
  ($expensesByCategory) => {
    return Object.entries($expensesByCategory)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: 0 // Will be calculated when total is known
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }
);

// Daily expenses for charts
export const dailyExpenses = derived(
  currentMonthExpenses,
  ($currentMonthExpenses) => {
    const daily: Record<string, number> = {};

    $currentMonthExpenses.forEach(expense => {
      const expenseDate = expense.date instanceof Date
        ? expense.date
        : expense.date.toDate();
      const dateKey = expenseDate.toISOString().split('T')[0]; // YYYY-MM-DD
      daily[dateKey] = (daily[dateKey] || 0) + expense.amount;
    });

    return Object.entries(daily)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
);

// Weekly spending trend
export const weeklyTrend = derived(
  expensesStore,
  ($expenses) => {
    const now = new Date();
    const weeks: Array<{ week: string; total: number; count: number }> = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekExpenses = $expenses.filter(expense => {
        const expenseDate = expense.date instanceof Date
          ? expense.date
          : expense.date.toDate();
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });

      const total = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;

      weeks.push({
        week: weekLabel,
        total,
        count: weekExpenses.length
      });
    }

    return weeks;
  }
);

// Helper function to get current month
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Store actions
export const expenseActions = {
  // Set loading state
  setLoading: (loading: boolean) => {
    expensesLoadingStore.set(loading);
  },

  // Set error state
  setError: (error: string | null) => {
    expensesErrorStore.set(error);
  },

  // Update expenses list
  setExpenses: (expenses: Expense[]) => {
    expensesStore.set(expenses);
  },

  // Add new expense
  addExpense: (expense: Expense) => {
    expensesStore.update(expenses => [expense, ...expenses]);
  },

  // Update existing expense
  updateExpense: (updatedExpense: Expense) => {
    expensesStore.update(expenses =>
      expenses.map(expense =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
  },

  // Remove expense
  removeExpense: (expenseId: string) => {
    expensesStore.update(expenses =>
      expenses.filter(expense => expense.id !== expenseId)
    );
  },

  // Select expense for editing
  selectExpense: (expense: Expense | null) => {
    selectedExpenseStore.set(expense);
  },

  // Change month filter
  setCurrentMonth: (month: string) => {
    currentMonthStore.set(month);
  },

  // Set category filter
  setCategoryFilter: (category: string) => {
    categoryFilterStore.set(category);
  },

  // Set date range filter
  setDateRange: (range: DateRange | null) => {
    dateRangeStore.set(range);
  },

  // Set search query
  setSearchQuery: (query: string) => {
    expenseSearchStore.set(query);
  },

  // Clear all filters
  clearFilters: () => {
    categoryFilterStore.set('all');
    dateRangeStore.set(null);
    expenseSearchStore.set('');
  },

  // Load expenses for a specific period
  loadExpenses: async (periodId: string) => {
    expensesLoadingStore.set(true);
    expensesErrorStore.set(null);

    // Simulate loading with mock data
    setTimeout(() => {
      const mockExpenses: Expense[] = [
        {
          id: '1',
          amount: 50000,
          category: 'FOOD',
          description: 'Lunch at restaurant',
          date: new Date(),
          userId: 'current_user'
        },
        {
          id: '2',
          amount: 25000,
          category: 'TRANSPORT',
          description: 'Grab ride',
          date: new Date(),
          userId: 'current_user'
        }
      ];

      expensesStore.set(mockExpenses);
      expensesLoadingStore.set(false);
    }, 800);
  }
};

// Compatibility alias for components expecting expenseStore
export const expenseStore = {
  subscribe: expensesStore.subscribe,
  loadExpenses: (periodId: string) => {
    // Mock implementation - should integrate with real data service
    console.log('Loading expenses for period:', periodId);
    return Promise.resolve([]);
  }
};
