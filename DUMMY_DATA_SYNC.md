# Centralized Dummy Data System

## Overview
Semua dummy data untuk testing sekarang tersentralisasi di satu file **DENGAN GLOBAL STORE** untuk memastikan konsistensi data di seluruh aplikasi.

## ✅ SOLUSI: Sinkronisasi Data Antar Pages
**Problem:** Total expenses berbeda antara Dashboard dan Expenses page
**Root Cause:** Setiap page generate dummy data BARU secara random
**Solution:** Menggunakan Svelte store + cache sebagai single source of truth

## File Location
- **Centralized Data**: [`src/lib/utils/dummyData.ts`](src/lib/utils/dummyData.ts)

## Data Structure

### Categories (6 categories)
```typescript
{
  id: 'food', name: 'Makanan', emoji: '🍽️', budget: 2000000, spent: 1450000
  id: 'transport', name: 'Transport', emoji: '🚗', budget: 1000000, spent: 650000
  id: 'shopping', name: 'Belanja', emoji: '🛍️', budget: 1500000, spent: 1890000  // Over budget
  id: 'entertainment', name: 'Hiburan', emoji: '🎬', budget: 800000, spent: 520000
  id: 'utilities', name: 'Tagihan', emoji: '💡', budget: 600000, spent: 580000
  id: 'savings', name: 'Tabungan', emoji: '💰', budget: 3000000, spent: 2500000
}
```

### Total Budget
- **Total Budget**: Rp 8.900.000
- **Total Spent**: Rp 7.590.000
- **Percentage**: ~85.3%

### Expenses
- **Count**: 25 expenses (configurable)
- **Date Range**: Last 30 days
- **Amount Range**: Rp 20.000 - Rp 170.000

## How It Works

### Flow Diagram
```
1. Dashboard loads first
   └─> generateDummyExpenses(25)
       └─> Store is empty? YES
           └─> Generate NEW data
           └─> Save to cache + expenseStore
           └─> Return expenses

2. Expenses page loads
   └─> generateDummyExpenses(25)
       └─> Store has data? YES
           └─> Return SAME data from store
           └─> NO new generation!

Result: SAME total expenses across all pages ✅
```

### Implementation

#### 1. Dashboard Page
```typescript
// src/routes/dashboard/+page.svelte
async function loadDummyData() {
  const { getDummyBudgetData, generateDummyExpenses } = await import('$lib/utils/dummyData');

  // Load expenses - uses store/cache if available
  expenses = generateDummyExpenses(25);

  // Calculate REAL total from expenses
  const realTotalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Use real calculated total
  budgetData = {
    categories: getDummyBudgetData().categories,
    totalBudget: getDummyBudgetData().totalBudget,
    totalSpent: realTotalSpent, // ✅ From actual expenses
    month: currentPeriodId
  };
}
```

#### 2. Expenses Page
```typescript
// src/routes/expenses/+page.svelte
async function loadExpensesData() {
  expenseActions.setLoading(true);

  setTimeout(async () => {
    const { generateDummyExpenses } = await import('$lib/utils/dummyData');
    // This will use cached/store data if available
    generateDummyExpenses(25); // ✅ Gets SAME data from store
    expenseActions.setLoading(false);
  }, 800);
}

// Subscribe to store
$: expenses = $filteredExpenses;
```

#### 3. Budget Page
```typescript
// src/lib/components/budget/Budget.svelte
async function loadDummyData() {
  const { getDummyCategories, getDummyBudgetData } = await import('$lib/utils/dummyData');

  categories = getDummyCategories();
  budgetData.set(getDummyBudgetData());
}
```

## Available Functions

### `getDummyCategories()`
Returns array of category objects with id, name, emoji, budget, and spent.

### `getDummyBudgetData()`
Returns budget data object with categories map, totalBudget, and totalSpent.

### `generateDummyExpenses(count: number = 25)`
Generates dummy expenses with:
- Random categories from DUMMY_CATEGORIES
- Random dates within last 30 days
- Random amounts between Rp 20.000 - Rp 170.000
- Appropriate descriptions per category

## Testing Scenarios

### Scenario: Dynamic Spending Calculation
- **Total Budget**: Rp 8.900.000 (fixed)
- **Total Spent**: Calculated from actual expense transactions
- **Expense Range**: Rp 20.000 - Rp 170.000 per transaction
- **Period**: Last 30 days (random distribution)

The system automatically calculates spending per category based on actual expense data, ensuring:
- Dashboard shows total spent from all expenses
- Expenses page shows same total (from store)
- Budget page calculates per-category spending from same expenses

## Benefits

✅ **Data Consistency**: SAME expenses across all 3 pages (Dashboard, Expenses, Budget)
✅ **Single Source of Truth**: Svelte store + cache pattern
✅ **Real-time Sync**: One generation, multiple uses
✅ **Type Safety**: TypeScript support throughout
✅ **Easy Testing**: Modify once, reflects everywhere

## Synchronization Flow

```
┌─────────────────────────────────────────────────┐
│  First Load (Dashboard)                         │
│  └─> generateDummyExpenses(25)                  │
│      └─> Generate 25 random expenses            │
│      └─> Save to expenseStore                   │
│      └─> Save to cache                          │
│      └─> Calculate totalSpent from expenses     │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  Second Load (Expenses Page)                    │
│  └─> generateDummyExpenses(25)                  │
│      └─> Check store: Has data? YES ✅          │
│      └─> Return SAME data from store            │
│      └─> Display totalSpent (same as Dashboard) │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  Third Load (Budget Page)                       │
│  └─> generateDummyExpenses(25)                  │
│      └─> Get SAME data from store               │
│      └─> Calculate spending per category        │
│      └─> Display category breakdown             │
│      └─> Total matches Dashboard & Expenses ✅  │
└─────────────────────────────────────────────────┘
```

## Key Changes Made

1. **Removed hardcoded `spent` values** from DUMMY_CATEGORIES
2. **Added cache + store pattern** in generateDummyExpenses()
3. **Dashboard**: Calculates totalSpent from expense transactions
4. **Expenses**: Uses same data from expenseStore
5. **Budget**: Groups expenses by category to calculate per-category spending

## Notes

- ✅ Data generated ONCE per session
- ✅ All pages use SAME expense transactions
- ✅ Spending calculated from actual data
- ✅ For development and testing only
- ⚠️ Replace with Firebase integration for production
