# 🗂️ State Management Guide

Complete guide untuk Svelte stores architecture dan state management patterns di DuitTrack.

---

## 📋 **Overview**

DuitTrack menggunakan **Svelte stores** untuk centralized state management dengan real-time Firebase synchronization.

### **Store Organization**
```
src/lib/stores/
├── index.ts       # Store exports & initialization
├── auth.ts        # Authentication & user state
├── budget.ts      # Budget management
├── expenses.ts    # Expense tracking
├── ui.ts          # UI state (modals, loading, etc.)
└── navigation.ts  # Navigation state & history
```

---

## 🔐 **Authentication Stores (`auth.ts`)**

### **Core Auth Stores**
```typescript
import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';

// Authentication state
export const authStore = writable<boolean>(false);
export const userStore = writable<User | null>(null);
export const authLoadingStore = writable<boolean>(true);

// Auth status
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export const authStatusStore = writable<AuthStatus>('loading');

// User profile
export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  currency: string;
  locale: string;
  budgetResetDate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const userProfileStore = writable<UserProfile | null>(null);
export const authErrorStore = writable<string | null>(null);
```

### **Derived Stores**
```typescript
// Convenient computed values
export const isAuthenticated = derived(
  authStore,
  ($authStore) => $authStore
);

export const currentUser = derived(
  userStore,
  ($userStore) => $userStore
);

export const isOnboardingComplete = derived(
  userProfileStore,
  ($userProfileStore) => $userProfileStore?.onboardingComplete ?? false
);

export const authReady = derived(
  authStatusStore,
  ($authStatus) => $authStatus !== 'loading'
);
```

### **Auth Actions**
```typescript
export const authActions = {
  // Set authentication state
  setAuthState: (isAuth: boolean, user: User | null) => {
    authStore.set(isAuth);
    userStore.set(user);
    authStatusStore.set(isAuth ? 'authenticated' : 'unauthenticated');
  },

  // Set user profile
  setUserProfile: (profile: UserProfile) => {
    userProfileStore.set(profile);
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    authLoadingStore.set(loading);
    if (loading) {
      authStatusStore.set('loading');
    }
  },

  // Set error
  setError: (error: string) => {
    authErrorStore.set(error);
    authStatusStore.set('error');
  },

  // Clear all auth state
  clearAuth: () => {
    authStore.set(false);
    userStore.set(null);
    userProfileStore.set(null);
    authStatusStore.set('unauthenticated');
    authErrorStore.set(null);
  }
};
```

### **Session Management**
```typescript
export interface SessionData {
  lastActivity: number;
  sessionStart: number;
  rememberMe: boolean;
}

export const sessionStore = writable<SessionData | null>(null);

export const sessionActions = {
  startSession: (rememberMe = false) => {
    const now = Date.now();
    const session = {
      lastActivity: now,
      sessionStart: now,
      rememberMe
    };

    sessionStore.set(session);

    if (browser) {
      localStorage.setItem('duittrack-session', JSON.stringify(session));
    }
  },

  updateActivity: () => {
    sessionStore.update(session => {
      if (session) {
        const updated = { ...session, lastActivity: Date.now() };
        if (browser) {
          localStorage.setItem('duittrack-session', JSON.stringify(updated));
        }
        return updated;
      }
      return null;
    });
  },

  endSession: () => {
    sessionStore.set(null);
    if (browser) {
      localStorage.removeItem('duittrack-session');
    }
  }
};
```

### **Usage in Components**
```svelte
<script lang="ts">
  import { isAuthenticated, currentUser, userProfileStore } from '$stores/auth';

  $: console.log('User authenticated:', $isAuthenticated);
  $: console.log('Current user:', $currentUser?.email);
  $: console.log('Profile:', $userProfileStore);
</script>

{#if $isAuthenticated}
  <p>Welcome, {$userProfileStore?.displayName}!</p>
{:else}
  <p>Please sign in</p>
{/if}
```

---

## 💰 **Budget Stores (`budget.ts`)**

### **Core Budget Stores**
```typescript
import { writable, derived } from 'svelte/store';

// Main budget stores
export const budgetsStore = writable<Budget[]>([]);
export const currentBudgetStore = writable<Budget | null>(null);
export const budgetLoadingStore = writable<boolean>(false);
export const budgetErrorStore = writable<string | null>(null);

// Selected month (YYYY-MM format)
export const selectedMonthStore = writable<string>(getCurrentMonth());

// Budget categories configuration
export const budgetCategoriesStore = writable<BudgetCategory[]>([
  { id: 'food', name: 'Makanan & Minuman', icon: '🍽️', color: '#FF6B6B', defaultBudget: 1000000 },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4', defaultBudget: 500000 },
  { id: 'shopping', name: 'Belanja', icon: '🛍️', color: '#45B7D1', defaultBudget: 800000 },
  // ... more categories
]);
```

### **Budget Data Interfaces**
```typescript
interface Budget {
  id?: string;
  month: string;  // "YYYY-MM" format
  categories: Record<string, CategoryBudget>;
  totalBudget: number;
  totalSpent: number;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryBudget {
  budget: number;
  spent: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBudget: number;
}
```

### **Derived Budget Stores**
```typescript
// Current month's budget
export const currentBudget = derived(
  [budgetsStore, selectedMonthStore],
  ([$budgets, $selectedMonth]) => {
    return $budgets.find(b => b.month === $selectedMonth) || null;
  }
);

// Budget analysis per category
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

// Budget summary
export const budgetSummary = derived(
  currentBudget,
  ($currentBudget) => {
    if (!$currentBudget) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        percentage: 0,
        status: 'safe' as const
      };
    }

    const totalRemaining = $currentBudget.totalBudget - $currentBudget.totalSpent;
    const percentage = $currentBudget.totalBudget > 0
      ? ($currentBudget.totalSpent / $currentBudget.totalBudget) * 100
      : 0;

    let status: 'safe' | 'warning' | 'over' = 'safe';
    if (percentage >= 100) status = 'over';
    else if (percentage >= 80) status = 'warning';

    return {
      totalBudget: $currentBudget.totalBudget,
      totalSpent: $currentBudget.totalSpent,
      totalRemaining,
      percentage,
      status
    };
  }
);

// Categories needing attention (80%+ usage)
export const categoriesNeedAttention = derived(
  budgetAnalysis,
  ($analysis) => {
    if (!$analysis) return [];

    return Object.values($analysis)
      .filter(cat => cat.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }
);
```

### **Budget Actions**
```typescript
export const budgetActions = {
  // Load budgets from Firebase
  loadBudgets: async (userId: string) => {
    budgetLoadingStore.set(true);
    try {
      const budgets = await fetchBudgetsFromFirebase(userId);
      budgetsStore.set(budgets);
    } catch (error) {
      budgetErrorStore.set(error.message);
    } finally {
      budgetLoadingStore.set(false);
    }
  },

  // Update category budget
  updateCategoryBudget: async (month: string, category: string, budget: number) => {
    // Update local store
    currentBudgetStore.update(current => {
      if (!current) return null;
      return {
        ...current,
        categories: {
          ...current.categories,
          [category]: {
            ...current.categories[category],
            budget
          }
        },
        totalBudget: Object.values(current.categories).reduce(
          (sum, cat) => sum + (cat === current.categories[category] ? budget : cat.budget),
          0
        )
      };
    });

    // Sync to Firebase
    await updateBudgetInFirebase(month, category, budget);
  },

  // Change selected month
  setSelectedMonth: (month: string) => {
    selectedMonthStore.set(month);
  }
};
```

### **Usage in Components**
```svelte
<script lang="ts">
  import { budgetSummary, categoriesNeedAttention } from '$stores/budget';

  $: console.log('Budget summary:', $budgetSummary);
  $: console.log('Categories needing attention:', $categoriesNeedAttention);
</script>

<!-- Budget overview -->
<div class="budget-card">
  <h3>Budget Check! 💰</h3>
  <p>Rp {$budgetSummary.totalSpent.toLocaleString()} / Rp {$budgetSummary.totalBudget.toLocaleString()}</p>
  <div class="progress-bar" style="width: {$budgetSummary.percentage}%"></div>
  <p class="status-{$budgetSummary.status}">
    {$budgetSummary.percentage.toFixed(1)}% terpakai
  </p>
</div>

<!-- Categories needing attention -->
{#if $categoriesNeedAttention.length > 0}
  <div class="warning-card">
    <h4>⚠️ Ada yang perlu diperhatikan!</h4>
    {#each $categoriesNeedAttention as category}
      <div class="category-warning">
        <span>{category.category}: {category.percentage.toFixed(1)}%</span>
        {#if category.status === 'over'}
          <span class="badge-danger">Over Budget! 🚨</span>
        {:else}
          <span class="badge-warning">Hati-hati! 👀</span>
        {/if}
      </div>
    {/each}
  </div>
{/if}
```

---

## 💸 **Expense Stores (`expenses.ts`)**

### **Core Expense Stores**
```typescript
export const expensesStore = writable<Expense[]>([]);
export const expenseLoadingStore = writable<boolean>(false);
export const expenseErrorStore = writable<string | null>(null);

// Filters
export const expenseFiltersStore = writable({
  category: '',
  searchQuery: '',
  startDate: null as Date | null,
  endDate: null as Date | null
});

// Sorting
export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
export const expenseSortStore = writable<SortOption>('date-desc');
```

### **Derived Expense Stores**
```typescript
// Filtered expenses
export const filteredExpenses = derived(
  [expensesStore, expenseFiltersStore, expenseSortStore],
  ([$expenses, $filters, $sort]) => {
    let filtered = [...$expenses];

    // Filter by category
    if ($filters.category) {
      filtered = filtered.filter(e => e.category === $filters.category);
    }

    // Filter by search query
    if ($filters.searchQuery) {
      const query = $filters.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if ($filters.startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= $filters.startDate);
    }
    if ($filters.endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= $filters.endDate);
    }

    // Sort
    filtered.sort((a, b) => {
      switch ($sort) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }
);

// Expenses grouped by date
export const expensesByDate = derived(
  filteredExpenses,
  ($filtered) => {
    const grouped: Record<string, Expense[]> = {};

    $filtered.forEach(expense => {
      const dateKey = formatDate(expense.date, 'YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });

    return grouped;
  }
);

// Total expenses (current period)
export const totalExpenses = derived(
  filteredExpenses,
  ($filtered) => $filtered.reduce((sum, e) => sum + e.amount, 0)
);

// Today's expenses
export const todayExpenses = derived(
  expensesStore,
  ($expenses) => {
    const today = new Date().toDateString();
    return $expenses
      .filter(e => new Date(e.date).toDateString() === today)
      .reduce((sum, e) => sum + e.amount, 0);
  }
);

// Recent expenses (last 5)
export const recentExpenses = derived(
  expensesStore,
  ($expenses) => {
    return [...$expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }
);

// Expenses by category
export const expensesByCategory = derived(
  expensesStore,
  ($expenses) => {
    const byCategory: Record<string, {
      total: number;
      count: number;
      expenses: Expense[];
    }> = {};

    $expenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = {
          total: 0,
          count: 0,
          expenses: []
        };
      }

      byCategory[expense.category].total += expense.amount;
      byCategory[expense.category].count++;
      byCategory[expense.category].expenses.push(expense);
    });

    return byCategory;
  }
);
```

### **Expense Actions**
```typescript
export const expenseActions = {
  // Add expense
  addExpense: async (expense: Omit<Expense, 'id'>) => {
    expenseLoadingStore.set(true);
    try {
      const id = await createExpenseInFirebase(expense);

      expensesStore.update(expenses => [
        ...expenses,
        { id, ...expense }
      ]);

      return id;
    } catch (error) {
      expenseErrorStore.set(error.message);
      throw error;
    } finally {
      expenseLoadingStore.set(false);
    }
  },

  // Update expense
  updateExpense: async (id: string, updates: Partial<Expense>) => {
    await updateExpenseInFirebase(id, updates);

    expensesStore.update(expenses =>
      expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  },

  // Delete expense
  deleteExpense: async (id: string) => {
    await deleteExpenseFromFirebase(id);

    expensesStore.update(expenses =>
      expenses.filter(e => e.id !== id)
    );
  },

  // Set filters
  setFilters: (filters: Partial<ExpenseFilters>) => {
    expenseFiltersStore.update(current => ({ ...current, ...filters }));
  },

  // Clear filters
  clearFilters: () => {
    expenseFiltersStore.set({
      category: '',
      searchQuery: '',
      startDate: null,
      endDate: null
    });
  },

  // Set sort option
  setSort: (sort: SortOption) => {
    expenseSortStore.set(sort);
  }
};
```

---

## 🎨 **UI Stores (`ui.ts`)**

### **Core UI Stores**
```typescript
// Modal management
export const modalStore = writable({
  isOpen: false,
  component: null as any,
  props: {} as any
});

// Toast notifications
export const toastStore = writable<Toast[]>([]);

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Loading overlay
export const loadingOverlayStore = writable(false);

// Sidebar state
export const sidebarStore = writable({
  isOpen: false,
  variant: 'menu' as 'menu' | 'filter'
});
```

### **UI Actions**
```typescript
export const uiActions = {
  // Modal actions
  openModal: (component: any, props = {}) => {
    modalStore.set({ isOpen: true, component, props });
  },

  closeModal: () => {
    modalStore.set({ isOpen: false, component: null, props: {} });
  },

  // Toast actions
  showToast: (type: Toast['type'], message: string, duration = 3000) => {
    const id = generateId();
    const toast = { id, type, message, duration };

    toastStore.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        toastStore.update(toasts => toasts.filter(t => t.id !== id));
      }, duration);
    }
  },

  removeToast: (id: string) => {
    toastStore.update(toasts => toasts.filter(t => t.id !== id));
  },

  // Loading overlay
  showLoading: () => loadingOverlayStore.set(true),
  hideLoading: () => loadingOverlayStore.set(false),

  // Sidebar
  openSidebar: (variant: 'menu' | 'filter' = 'menu') => {
    sidebarStore.set({ isOpen: true, variant });
  },

  closeSidebar: () => {
    sidebarStore.update(s => ({ ...s, isOpen: false }));
  },

  toggleSidebar: () => {
    sidebarStore.update(s => ({ ...s, isOpen: !s.isOpen }));
  }
};
```

---

## 🧭 **Navigation Stores (`navigation.ts`)**

### **Navigation State**
```typescript
export const navigationStore = writable({
  currentPage: '',
  previousPage: '',
  history: [] as string[],
  scrollPositions: {} as Record<string, number>
});

export const navigationActions = {
  // Navigate to page
  navigateTo: (page: string) => {
    navigationStore.update(nav => ({
      ...nav,
      previousPage: nav.currentPage,
      currentPage: page,
      history: [...nav.history, page]
    }));
  },

  // Go back
  goBack: () => {
    navigationStore.update(nav => {
      const history = [...nav.history];
      history.pop(); // Remove current page
      const previousPage = history[history.length - 1] || '/';

      return {
        ...nav,
        currentPage: previousPage,
        history
      };
    });
  },

  // Save scroll position
  saveScrollPosition: (page: string, position: number) => {
    navigationStore.update(nav => ({
      ...nav,
      scrollPositions: {
        ...nav.scrollPositions,
        [page]: position
      }
    }));
  },

  // Get scroll position
  getScrollPosition: (page: string): number => {
    let position = 0;
    navigationStore.subscribe(nav => {
      position = nav.scrollPositions[page] || 0;
    })();
    return position;
  }
};
```

---

## 🔄 **Real-time Firebase Sync**

### **Syncing Stores with Firebase**
```typescript
import { onSnapshot } from 'firebase/firestore';

// Budget sync
export function syncBudget(month: string) {
  const budgetRef = doc(db, 'users', auth.currentUser.uid, 'budgets', month);

  const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
    if (docSnap.exists()) {
      currentBudgetStore.set({
        id: docSnap.id,
        ...docSnap.data() as Budget
      });
    }
  });

  return unsubscribe;
}

// Expenses sync
export function syncExpenses() {
  const expensesRef = collection(db, 'users', auth.currentUser.uid, 'expenses');
  const q = query(expensesRef, orderBy('date', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    expensesStore.set(expenses);
  });

  return unsubscribe;
}
```

---

## 💡 **Best Practices**

### **✅ Do's**
1. Use derived stores for computed values
2. Keep store logic separate from component logic
3. Use actions for complex store updates
4. Unsubscribe from Firebase listeners when component unmounts
5. Use TypeScript interfaces for type safety

### **❌ Don'ts**
1. Don't mutate store values directly (always use `.set()` or `.update()`)
2. Don't create unnecessary derived stores (performance cost)
3. Don't forget to handle loading & error states
4. Don't mix business logic in UI components
5. Don't create circular dependencies between stores

---

**Last Updated**: December 30, 2025
**Svelte Version**: 4.x
**Status**: ✅ Production Implementation

---

*DuitTrack State Management - Reactive, Type-Safe, Real-Time 🗂️*