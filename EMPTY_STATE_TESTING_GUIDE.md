# 🧪 Empty State Testing Guide

## Overview
Panduan praktis untuk testing kondisi **budget category belum ada** (empty state) di DuitTrack.

**Created**: 2025-01-24

---

## 🎯 Tujuan Testing

Testing empty state penting untuk:
1. **First-time user experience** - User baru yang belum setup budget
2. **Onboarding flow** - Memastikan user tahu langkah-langkah setup
3. **Edge cases** - Kondisi di mana user punya expenses tapi belum set budget
4. **UI/UX validation** - Empty state UI harus informatif dan actionable

---

## 📋 Available Testing Functions

### 1. Empty Budget (No Categories)

```typescript
import { getEmptyBudgetData, getEmptyBudgetDataForPeriod } from '$lib/utils/dummyData';

// Legacy format (tidak ada period)
const emptyBudget = getEmptyBudgetData();
// Returns: { categories: {}, totalBudget: 0, totalSpent: 0 }

// Period-aware format (RECOMMENDED)
const emptyBudget = getEmptyBudgetDataForPeriod('2025-10-25');
// Returns: { categories: {}, totalBudget: 0, totalSpent: 0, periodId: '2025-10-25' }
```

**Expected Result**:
- `categories` = empty object `{}`
- `totalBudget` = 0
- `totalSpent` = 0

### 2. Uncategorized Expenses

```typescript
import { generateUncategorizedExpenses } from '$lib/utils/dummyData';

// Generate 10 expenses without budget categories
const expenses = generateUncategorizedExpenses('2025-10-25', 10);
```

**Expected Result**:
- Each expense has `category: 'UNCATEGORIZED'`
- Random amounts between Rp 20,000 - Rp 170,000
- Dates within the specified period
- Generic descriptions: "Pengeluaran", "Pembayaran", etc.

---

## 🔧 Practical Implementation Examples

### Example 1: Testing Budget Page Empty State

**File**: `src/lib/components/budget/Budget.svelte`

```typescript
async function loadDummyData() {
  isLoading = true;

  try {
    // Import testing function
    const { getEmptyBudgetDataForPeriod } = await import('$lib/utils/dummyData');

    // Load EMPTY budget data for testing
    const emptyBudgetData = getEmptyBudgetDataForPeriod(currentPeriodId);

    // Set categories to empty array
    categories = [];

    console.log('🧪 TESTING: Empty budget loaded', emptyBudgetData);
    isLoading = false;
  } catch (error) {
    console.error('Failed to load dummy data:', error);
    isLoading = false;
  }
}
```

**Expected UI**:
```
┌──────────────────────────────────────┐
│  📊 Budget Categories                │
├──────────────────────────────────────┤
│                                      │
│    📦 Belum Ada Kategori Budget      │
│                                      │
│  Anda belum mengatur kategori        │
│  budget. Mulai dengan menambahkan    │
│  kategori pertama Anda!              │
│                                      │
│  [+ Tambah Kategori Pertama]         │
│  [🚀 Quick Setup Packages]           │
│                                      │
└──────────────────────────────────────┘
```

---

### Example 2: Testing Dashboard with Empty Budget

**File**: `src/routes/dashboard/+page.svelte`

```typescript
async function loadData() {
  isLoading = true;

  try {
    const {
      getEmptyBudgetDataForPeriod,
      generateUncategorizedExpenses
    } = await import('$lib/utils/dummyData');

    // Load EMPTY budget
    const budgetData = getEmptyBudgetDataForPeriod(currentPeriodId);

    // BUT user has some expenses (uncategorized)
    const expenses = generateUncategorizedExpenses(currentPeriodId, 5);

    console.log('🧪 TESTING: Empty budget with uncategorized expenses', {
      budget: budgetData,
      expenses
    });

    // Calculate total spent from uncategorized expenses
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Display warning on hero card
    heroCardData = {
      totalBudget: 0,
      totalSpent: totalSpent,
      percentage: 0, // Can't calculate without budget
      status: 'warning',
      message: '⚠️ Setup budget categories terlebih dahulu'
    };

    isLoading = false;
  } catch (error) {
    console.error('Failed to load data:', error);
    isLoading = false;
  }
}
```

**Expected UI**:
```
┌──────────────────────────────────────┐
│  ⚠️ Financial Overview               │
├──────────────────────────────────────┤
│  Total Budget: Rp 0                  │
│  Total Spent: Rp 350,000             │
│                                      │
│  ⚠️ Setup Budget Categories          │
│                                      │
│  Anda memiliki pengeluaran tapi      │
│  belum mengatur budget. Klik di      │
│  bawah untuk mulai setup.            │
│                                      │
│  [→ Setup Budget Sekarang]           │
└──────────────────────────────────────┘
```

---

### Example 3: Testing Expenses with Uncategorized Items

**File**: `src/routes/expenses/+page.svelte`

```typescript
async function loadExpenses() {
  isLoading = true;

  try {
    const { generateUncategorizedExpenses } = await import('$lib/utils/dummyData');

    // Generate UNCATEGORIZED expenses for testing
    const uncategorizedExpenses = generateUncategorizedExpenses(currentPeriodId, 15);

    expenseActions.setExpenses(uncategorizedExpenses);

    console.log('🧪 TESTING: Uncategorized expenses', uncategorizedExpenses);
    isLoading = false;
  } catch (error) {
    console.error('Failed to load expenses:', error);
    isLoading = false;
  }
}
```

**Expected UI**:
```
Expenses List:
┌──────────────────────────────────────┐
│  📅 20 Jan 2025                      │
│  ┌────────────────────────────────┐ │
│  │ Pengeluaran           Rp 45,000│ │
│  │ ⚠️ UNCATEGORIZED      [Edit]   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Pembayaran           Rp 120,000│ │
│  │ ⚠️ UNCATEGORIZED      [Edit]   │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘

⚠️ Banner at top:
"15 expenses belum dikategorikan. Setup budget untuk mengategorikan."
[→ Setup Budget]
```

---

## 🧪 Quick Testing Scenarios

### Scenario A: Completely Empty (First-Time User)
```typescript
// No budget, no expenses
const budget = getEmptyBudgetDataForPeriod('2025-10-25');
const expenses = []; // Empty array

// Expected: Onboarding flow atau welcome screen
```

### Scenario B: Empty Budget, Has Expenses
```typescript
// No budget categories, but user has expenses
const budget = getEmptyBudgetDataForPeriod('2025-10-25');
const expenses = generateUncategorizedExpenses('2025-10-25', 10);

// Expected: Warning + CTA to setup budget
```

### Scenario C: Partial Setup
```typescript
// Has some categories, but some expenses uncategorized
const { getDummyBudgetDataForPeriod, generateDummyExpensesForPeriod } = await import('$lib/utils/dummyData');

const normalExpenses = generateDummyExpensesForPeriod('2025-10-25', 15);
const uncategorized = generateUncategorizedExpenses('2025-10-25', 5);
const allExpenses = [...normalExpenses, ...uncategorized];

const budget = getDummyBudgetDataForPeriod('2025-10-25', normalExpenses);

// Expected: Mixed UI with warnings for uncategorized items
```

---

## 🔄 Switching Between Test States

### Cara 1: Manual Import dan Replace

```typescript
// NORMAL STATE (with categories)
import { getDummyBudgetDataForPeriod, generateDummyExpensesForPeriod } from '$lib/utils/dummyData';

async function loadNormalData() {
  const expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);
  const budget = getDummyBudgetDataForPeriod(currentPeriodId, expenses);
  // ... set to UI
}

// EMPTY STATE (no categories)
import { getEmptyBudgetDataForPeriod, generateUncategorizedExpenses } from '$lib/utils/dummyData';

async function loadEmptyData() {
  const budget = getEmptyBudgetDataForPeriod(currentPeriodId);
  const expenses = generateUncategorizedExpenses(currentPeriodId, 10);
  // ... set to UI
}
```

### Cara 2: Toggle Mode (Recommended)

```typescript
let testMode: 'normal' | 'empty' | 'mixed' = 'normal';

async function loadData() {
  const {
    getDummyBudgetDataForPeriod,
    generateDummyExpensesForPeriod,
    getEmptyBudgetDataForPeriod,
    generateUncategorizedExpenses
  } = await import('$lib/utils/dummyData');

  switch (testMode) {
    case 'empty':
      // Empty budget, uncategorized expenses
      budget = getEmptyBudgetDataForPeriod(currentPeriodId);
      expenses = generateUncategorizedExpenses(currentPeriodId, 10);
      break;

    case 'mixed':
      // Some categories, some uncategorized
      const normal = generateDummyExpensesForPeriod(currentPeriodId, 15);
      const uncategorized = generateUncategorizedExpenses(currentPeriodId, 5);
      expenses = [...normal, ...uncategorized];
      budget = getDummyBudgetDataForPeriod(currentPeriodId, normal);
      break;

    case 'normal':
    default:
      // Normal state with all categories
      expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);
      budget = getDummyBudgetDataForPeriod(currentPeriodId, expenses);
      break;
  }

  console.log(`🧪 TESTING MODE: ${testMode}`, { budget, expenses });
}

// Toggle mode via console or UI button
function switchTestMode(mode: 'normal' | 'empty' | 'mixed') {
  testMode = mode;
  loadData();
}
```

---

## 🎨 UI Components to Test

### 1. Empty State Card Component

```svelte
<!-- EmptyBudgetState.svelte -->
{#if categories.length === 0}
  <div class="empty-state">
    <div class="empty-icon">📦</div>
    <h3>Belum Ada Kategori Budget</h3>
    <p>Anda belum mengatur kategori budget. Mulai dengan menambahkan kategori pertama Anda!</p>

    <button on:click={handleAddFirstCategory}>
      + Tambah Kategori Pertama
    </button>

    <div class="quick-setup">
      <h4>🚀 Quick Setup Packages</h4>
      <div class="packages">
        <button on:click={() => applyPackage('basic')}>
          Basic (Rp 5,000,000)
        </button>
        <button on:click={() => applyPackage('moderate')}>
          Moderate (Rp 7,500,000)
        </button>
        <button on:click={() => applyPackage('premium')}>
          Premium (Rp 10,000,000)
        </button>
      </div>
    </div>
  </div>
{/if}
```

### 2. Uncategorized Badge Component

```svelte
<!-- UncategorizedBadge.svelte -->
{#if expense.category === 'UNCATEGORIZED'}
  <span class="badge-warning" title="Belum dikategorikan">
    ⚠️ UNCATEGORIZED
  </span>
{/if}
```

### 3. Setup Warning Banner

```svelte
<!-- SetupWarningBanner.svelte -->
{#if hasUncategorizedExpenses || budgetCategories.length === 0}
  <div class="warning-banner">
    <span class="icon">⚠️</span>
    <div class="message">
      {#if budgetCategories.length === 0}
        <strong>Setup Budget Categories</strong>
        <p>Anda belum mengatur budget. Klik di sini untuk mulai.</p>
      {:else}
        <strong>{uncategorizedCount} expenses belum dikategorikan</strong>
        <p>Setup budget untuk mengategorikan expenses Anda.</p>
      {/if}
    </div>
    <button on:click={goToSetup}>→ Setup Budget</button>
  </div>
{/if}
```

---

## ✅ Testing Checklist

### Budget Page Empty State
- [ ] Empty state UI muncul ketika `categories.length === 0`
- [ ] "Tambah Kategori Pertama" button berfungsi
- [ ] Quick Setup Packages ditampilkan dan berfungsi
- [ ] Empty state hilang setelah menambah kategori pertama
- [ ] Loading skeleton ditampilkan sebelum data loaded

### Dashboard Empty State
- [ ] Warning card ditampilkan ketika budget kosong
- [ ] Hero card menampilkan total spent dari uncategorized expenses
- [ ] Percentage calculation di-skip (0%) atau show warning
- [ ] CTA "Setup Budget Sekarang" navigate ke Budget page
- [ ] Recent transactions tetap ditampilkan (jika ada)

### Expenses Empty State
- [ ] Uncategorized expenses ditampilkan dengan warning badge
- [ ] Banner warning muncul di atas list
- [ ] Filter by category disabled atau show "Setup Budget First"
- [ ] Edit category untuk uncategorized items show warning
- [ ] Expense list tetap bisa di-view dan delete

### Cross-Page Behavior
- [ ] Period selection tetap berfungsi dengan empty state
- [ ] Navigation antar pages preserve empty state
- [ ] Adding first category reflect di semua pages
- [ ] Uncategorized expenses bisa dikategorikan setelah setup

---

## 📊 Data Structure Reference

### Normal Budget Data
```typescript
{
  categories: {
    FOOD: { budget: 2000000, spent: 450000 },
    TRANSPORT: { budget: 1000000, spent: 230000 },
    // ... more categories
  },
  totalBudget: 7500000,
  totalSpent: 2150000,
  periodId: '2025-10-25'
}
```

### Empty Budget Data
```typescript
{
  categories: {}, // ← Empty object
  totalBudget: 0,
  totalSpent: 0,
  periodId: '2025-10-25'
}
```

### Normal Expense
```typescript
{
  id: 'dummy_2025-10-25_0',
  amount: 45000,
  category: 'FOOD', // ← Has category
  description: 'Lunch di warung',
  date: Date,
  userId: 'dummy_user',
  periodId: '2025-10-25'
}
```

### Uncategorized Expense
```typescript
{
  id: 'dummy_uncategorized_2025-10-25_0',
  amount: 45000,
  category: 'UNCATEGORIZED', // ← No budget category
  description: 'Pengeluaran',
  date: Date,
  userId: 'dummy_user',
  periodId: '2025-10-25'
}
```

---

## 🔗 Related Files

- [DUMMY_DATA_GUIDE.md](./DUMMY_DATA_GUIDE.md) - Main dummy data documentation
- [src/lib/utils/dummyData.ts](./src/lib/utils/dummyData.ts) - Implementation
- [src/lib/components/budget/Budget.svelte](./src/lib/components/budget/Budget.svelte) - Budget page
- [src/routes/dashboard/+page.svelte](./src/routes/dashboard/+page.svelte) - Dashboard page
- [src/routes/expenses/+page.svelte](./src/routes/expenses/+page.svelte) - Expenses page

---

**Last Updated**: 2025-01-24
**Status**: ✅ Ready for Testing
