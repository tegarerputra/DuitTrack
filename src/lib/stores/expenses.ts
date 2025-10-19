// Expense management stores for DuitTrack
import { writable, derived, type Writable } from 'svelte/store';
import type { Expense } from '../types';

// Main expense stores
export const expensesStore: Writable<Expense[]> = writable([]);

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
        expense.category.toUpperCase() === $categoryFilter.toUpperCase()
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

// Expenses grouped by category (from filtered expenses)
export const expensesByCategory = derived(
  filteredExpenses,
  ($filteredExpenses) => {
    const grouped: Record<string, { total: number; count: number; expenses: Expense[] }> = {};

    $filteredExpenses.forEach(expense => {
      const category = expense.category.toUpperCase();
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

// Top spending categories (top 5)
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

// Daily expenses for charts (from filtered expenses)
export const dailyExpenses = derived(
  filteredExpenses,
  ($filteredExpenses) => {
    const daily: Record<string, number> = {};

    $filteredExpenses.forEach(expense => {
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

// Grouped expenses by date for list display
export const groupedExpensesByDate = derived(
  filteredExpenses,
  ($filteredExpenses) => {
    const grouped: Record<string, Expense[]> = {};

    $filteredExpenses.forEach(expense => {
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
);

// Total of filtered expenses
export const filteredExpensesTotal = derived(
  filteredExpenses,
  ($filteredExpenses) => {
    return $filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  }
);

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

  // Change expense category
  changeExpenseCategory: (expenseId: string, newCategory: string) => {
    expensesStore.update(expenses =>
      expenses.map(expense =>
        expense.id === expenseId
          ? { ...expense, category: newCategory.toUpperCase() }
          : expense
      )
    );
  },

  // Delete expense (alias for removeExpense)
  deleteExpense: (expenseId: string) => {
    expensesStore.update(expenses =>
      expenses.filter(expense => expense.id !== expenseId)
    );
  }
};

// Compatibility export for dashboard and other pages that use expenseStore
// This maintains backward compatibility while the new structure is being adopted
export const expenseStore = {
  subscribe: expensesStore.subscribe
};
