# 📊 Dummy Data Guide - DuitTrack

## Overview
Dokumentasi ini menjelaskan penggunaan data dummy yang telah disinkronkan di seluruh aplikasi DuitTrack untuk keperluan testing dan development.

**Last Updated**: 2025-01-24
**Status**: ✅ Refactored, Optimized & Production-Ready

## 🎯 Single Source of Truth
Semua data dummy berasal dari: `src/lib/utils/dummyData.ts`

### ✨ Recent Improvements (2025-01-24)
1. **Unified Cache Strategy**: Semua data menggunakan period-aware cache (`periodExpensesCache`)
2. **Centralized Utilities**: Validasi period dan reset date dipindahkan ke utility functions
3. **Removed Artificial Delays**: Loading states sekarang instant dengan proper error handling
4. **Better Documentation**: Inline JSDoc comments dan deprecation warnings

## 📋 Data Structure

### Categories (Total Budget: Rp 7,500,000)
```typescript
FOOD         - Makanan     🍽️  - Rp 2,000,000
TRANSPORT    - Transport    🚗  - Rp 1,000,000
SHOPPING     - Belanja     🛍️  - Rp 1,500,000
ENTERTAINMENT- Hiburan     🎬  - Rp   800,000
HEALTH       - Kesehatan   ⚕️  - Rp   700,000
EDUCATION    - Pendidikan  📚  - Rp   500,000
UTILITIES    - Tagihan     💡  - Rp   600,000
OTHER        - Lainnya     📦  - Rp   400,000
```

### Expenses
- **Count**: 25 transaksi default
- **Date Range**: Random dalam 30 hari terakhir
- **Amount Range**: Rp 20,000 - Rp 170,000
- **Storage**: Menggunakan Svelte store sebagai cache

## 🔧 Usage di Setiap Halaman

### ⭐ RECOMMENDED: Period-Aware Approach

**Semua halaman sekarang HARUS menggunakan period-aware functions:**

### 1. Dashboard (`src/routes/dashboard/+page.svelte`)
```typescript
// Line 177-227 - UPDATED (2025-01-24)
const { getDummyBudgetDataForPeriod, generateDummyExpensesForPeriod } = await import('$lib/utils/dummyData');

// Generate expenses for the selected period
expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);

// Calculate REAL total from expenses
const realTotalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

// Load budget data with REAL spent amount per category
const budgetDummyData = getDummyBudgetDataForPeriod(currentPeriodId, expenses);
```

**Features**:
- ✅ Period-aware data loading
- ✅ Menghitung spending REAL dari expenses
- ✅ Menampilkan recent transactions (5 terakhir)
- ✅ Categories need attention
- ✅ Hero card dengan status budget
- ✅ Centralized period validation

### 2. Expenses (`src/routes/expenses/+page.svelte`)
```typescript
// Line 126-147 - UPDATED (2025-01-24)
const { generateDummyExpensesForPeriod } = await import('$lib/utils/dummyData');

// Generate expenses for the selected period
const periodExpenses = generateDummyExpensesForPeriod(currentPeriodId, 25);

// Set expenses in store
expenseActions.setExpenses(periodExpenses);
```

**Features**:
- ✅ Period-aware expense loading
- ✅ List semua expenses dengan group by date
- ✅ Filter by category
- ✅ Search by description
- ✅ Inline category editing
- ✅ Delete expense dengan toast notification
- ✅ No artificial loading delays

### 3. Budget (`src/lib/components/budget/Budget.svelte`)
```typescript
// Should be updated to use period-aware functions
const { getDummyCategories, generateDummyExpensesForPeriod } = await import('$lib/utils/dummyData');

const expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);
const dummyCategories = getDummyCategories();
```

**Features**:
- ✅ Category budget management
- ✅ Real-time spending calculation per category
- ✅ Quick setup packages
- ✅ Add/edit/delete categories
- ⚠️ Needs update to use period-aware functions

### 4. Tracking Period (`src/routes/settings/tracking-period/+page.svelte`)
**Note**: Halaman ini TIDAK menggunakan dummy data karena hanya untuk settings periode tracking.

## 🔄 Data Synchronization (UPDATED 2025-01-24)

### ✨ New Cache Strategy: Period-Specific Cache

**CHANGED**: Tidak lagi menggunakan global `expensesStore` cache. Sekarang menggunakan `periodExpensesCache` yang period-aware.

```typescript
// src/lib/utils/dummyData.ts:40
const periodExpensesCache: Record<string, any[]> = {};

// Check cache first - period-specific
if (periodExpensesCache[periodId]) {
  console.log(`📦 Using cached expenses for period ${periodId}:`, periodExpensesCache[periodId].length);
  return periodExpensesCache[periodId];
}
```

**Benefits**:
- ✅ Each period has independent cached data
- ✅ No conflicts between periods
- ✅ Easy to clear specific period cache
- ✅ Better memory management

### Category ID Convention
⚠️ **IMPORTANT**: Semua category IDs HARUS UPPERCASE!

```typescript
// ✅ CORRECT
category: 'FOOD'
category: 'TRANSPORT'

// ❌ WRONG
category: 'food'
category: 'transport'
```

### Period ID Format
Format: `YYYY-MM`

```typescript
// Example
currentPeriodId = '2025-01'  // January 2025
currentPeriodId = '2025-12'  // December 2025
```

## 🧪 Testing Scenarios

### Scenario 1: Fresh Load
1. Buka Dashboard → Harus generate 25 expenses baru
2. Pindah ke Expenses → Harus gunakan expenses yang sama (dari store)
3. Pindah ke Budget → Harus gunakan expenses yang sama (dari store)

### Scenario 2: Over Budget
Test kategori yang over budget:
```typescript
// Edit category budget di Budget page
// Pastikan Dashboard menampilkan warning di "Categories Need Attention"
```

### Scenario 3: Category Filter
1. Dashboard → Klik "Lihat Semua Budget"
2. Budget page → Edit spending untuk category tertentu
3. Dashboard → Hero card harus update dengan data terbaru
4. Expenses page → Filter by category → Harus show expenses untuk category tersebut

### Scenario 4: Delete Expense
1. Expenses page → Delete 1 expense
2. Dashboard → Total spending harus berkurang
3. Budget page → Category spending harus berkurang

### Scenario 5: Change Category
1. Expenses page → Ubah category expense
2. Dashboard → Spending per category harus update
3. Budget page → Category spending harus update

### 🆕 Scenario 6: Empty Budget Categories (No Categories Set)
**Purpose**: Test kondisi first-time user atau user yang belum setup budget categories.

**Use Case**:
- Testing empty state UI di Budget page
- Testing onboarding flow
- Testing kondisi user belum set budget tapi sudah ada expenses

**Implementation**:
```typescript
// 1. Get empty budget data (no categories)
import { getEmptyBudgetData, getEmptyBudgetDataForPeriod } from '$lib/utils/dummyData';

// Option A: Legacy format (no period)
const emptyBudget = getEmptyBudgetData();
// Returns: { categories: {}, totalBudget: 0, totalSpent: 0 }

// Option B: Period-aware format (RECOMMENDED)
const emptyBudget = getEmptyBudgetDataForPeriod('2025-10-25');
// Returns: { categories: {}, totalBudget: 0, totalSpent: 0, periodId: '2025-10-25' }

// 2. Generate uncategorized expenses (expenses without budget categories)
import { generateUncategorizedExpenses } from '$lib/utils/dummyData';

const uncategorizedExpenses = generateUncategorizedExpenses('2025-10-25', 10);
// All expenses will have category: 'UNCATEGORIZED'
```

**Testing Flow**:
1. Budget page → Load empty budget data → Should show "Belum ada kategori" message
2. Dashboard → Should show warning "Setup budget kategori terlebih dahulu"
3. Add first category → Empty state should disappear
4. Test with uncategorized expenses → Should prompt user to categorize

**Expected UI Behavior**:
- ✅ Budget page shows empty state with CTA button "Tambah Kategori Pertama"
- ✅ Dashboard shows warning card "Setup budget categories"
- ✅ Expenses with 'UNCATEGORIZED' category show warning badge
- ✅ Quick setup packages should be prominent in empty state

### 🆕 Scenario 7: Mixed - Some Categories with Expenses, Some Empty
**Purpose**: Test kondisi partial budget setup.

```typescript
import { getDummyBudgetDataForPeriod, generateDummyExpensesForPeriod } from '$lib/utils/dummyData';

// Generate expenses only for FOOD and TRANSPORT
const expenses = generateDummyExpensesForPeriod('2025-10-25', 20);
const filteredExpenses = expenses.filter(e => ['FOOD', 'TRANSPORT'].includes(e.category));

// Load full budget with all 8 categories
const budgetData = getDummyBudgetDataForPeriod('2025-10-25', filteredExpenses);

// Result: FOOD and TRANSPORT will have spent > 0, others will be 0
```

**Testing Flow**:
1. Budget page → Show some categories with spending, some empty
2. Dashboard → Show accurate statistics
3. Test category suggestions based on empty categories

## 🐛 Common Issues & Fixes

### Issue 1: Category ID Case Mismatch ✅ FIXED (2025-01-19)
**Problem**: Expenses tidak muncul di category filter, spending tidak sync antar halaman
**Root Cause**: Dashboard menggunakan `.toLowerCase()` sedangkan Budget menggunakan `.toUpperCase()`
**Fix**:
- ✅ Dashboard [line 180](src/routes/dashboard/+page.svelte#L180): Changed to `.toUpperCase()`
- ✅ Expense Store [line 40](src/lib/stores/expenses.ts#L40): Changed filter to `.toUpperCase()`
- ✅ Semua category IDs sekarang consistently UPPERCASE across all pages

### Issue 2: Spending tidak sync antar halaman ✅ FIXED (2025-01-19)
**Problem**: Dashboard dan Budget menampilkan spending berbeda
**Root Cause**: Case mismatch dalam category ID (issue #1)
**Fix**: Fixed dengan standardisasi `.toUpperCase()` di semua pages
**Verification**: Dashboard total = Expenses total = Budget total

### Issue 3: Store cache tidak ter-invalidate
**Problem**: Data lama masih muncul setelah perubahan
**Fix**: Clear store dengan reload page atau `clearPeriodCache()` function

## 📝 Helper Functions (UPDATED 2025-01-24)

### ✨ New Utility Functions

```typescript
// 1. Validate period against reset date
import { validatePeriodResetDate } from '$lib/utils/dummyData';
const isValid = validatePeriodResetDate('2025-10-25', 25); // true

// 2. Get current period ID based on reset date
import { getCurrentPeriodIdForResetDate } from '$lib/utils/dummyData';
const periodId = getCurrentPeriodIdForResetDate(25); // '2025-10-25'

// 3. Clear period cache
import { clearPeriodCache } from '$lib/utils/dummyData';
clearPeriodCache('2025-10-25'); // Clear specific period
clearPeriodCache(); // Clear all periods

// 4. Get total budget
import { getTotalBudget } from '$lib/utils/dummyData';
const total = getTotalBudget(); // 7500000

// 5. Calculate spending per category
import { calculateCategorySpending } from '$lib/utils/dummyData';
const spending = calculateCategorySpending(expenses);
// { FOOD: 500000, TRANSPORT: 200000, ... }
```

### 🧪 Testing Functions (NEW)

```typescript
// 6. Get empty budget data (no categories set)
import { getEmptyBudgetData } from '$lib/utils/dummyData';
const emptyBudget = getEmptyBudgetData();
// { categories: {}, totalBudget: 0, totalSpent: 0 }

// 7. Get empty budget data for specific period
import { getEmptyBudgetDataForPeriod } from '$lib/utils/dummyData';
const emptyBudget = getEmptyBudgetDataForPeriod('2025-10-25');
// { categories: {}, totalBudget: 0, totalSpent: 0, periodId: '2025-10-25' }

// 8. Generate uncategorized expenses
import { generateUncategorizedExpenses } from '$lib/utils/dummyData';
const expenses = generateUncategorizedExpenses('2025-10-25', 10);
// All expenses will have category: 'UNCATEGORIZED'
```

### ⚠️ Deprecated Functions (Use with Caution)

```typescript
// DEPRECATED: Use generateDummyExpensesForPeriod() instead
import { generateDummyExpenses } from '$lib/utils/dummyData';
const expenses = generateDummyExpenses(25); // ⚠️ Not period-aware

// DEPRECATED: Use getCurrentPeriodIdForResetDate() instead
import { getCurrentPeriodId } from '$lib/utils/dummyData';
const periodId = getCurrentPeriodId(); // ⚠️ Returns YYYY-MM format (old)
```

## ✅ Verification Checklist

Setelah perubahan, verifikasi:

- [ ] Dashboard menampilkan total spending yang benar
- [ ] Dashboard recent transactions menampilkan 5 transaksi terakhir
- [ ] Dashboard categories need attention menampilkan kategori over budget
- [ ] Expenses page menampilkan semua 25 transaksi
- [ ] Expenses filter by category berfungsi
- [ ] Expenses search berfungsi
- [ ] Expenses inline edit category berfungsi dengan toast
- [ ] Expenses delete expense berfungsi dengan confirmation
- [ ] Budget page menampilkan spending per category yang benar
- [ ] Budget page total spent = sum dari semua category spending
- [ ] Budget hero card menampilkan percentage yang benar
- [ ] Semua halaman menggunakan period ID yang konsisten

### 🧪 Testing Empty State Checklist

- [ ] Budget page dengan empty categories menampilkan empty state UI
- [ ] Dashboard dengan empty budget menampilkan warning/prompt
- [ ] Expenses dengan UNCATEGORIZED category menampilkan badge/warning
- [ ] Quick setup packages prominent di empty state
- [ ] CTA "Tambah Kategori Pertama" berfungsi
- [ ] Onboarding flow untuk first-time user berjalan lancar

## 🔗 Related Files

- `src/lib/utils/dummyData.ts` - ⭐ Main dummy data module (REFACTORED 2025-01-24)
- `src/lib/stores/expenses.ts` - Expense store
- `src/lib/stores/budget.ts` - Budget store
- `src/lib/stores/period.ts` - Period store for cross-page persistence
- `src/routes/dashboard/+page.svelte` - Dashboard page (UPDATED 2025-01-24)
- `src/routes/expenses/+page.svelte` - Expenses page (UPDATED 2025-01-24)
- `src/lib/components/budget/Budget.svelte` - Budget component (⚠️ Needs update)
- `src/lib/components/dashboard/PeriodSelector.svelte` - Period selector component

## 🚀 Migration Guide

### Migrating from Old to New Approach

**Before (Old - Deprecated)**:
```typescript
const { generateDummyExpenses, getDummyBudgetData } = await import('$lib/utils/dummyData');
const expenses = generateDummyExpenses(25);
const budgetData = getDummyBudgetData();
```

**After (New - Recommended)**:
```typescript
const { generateDummyExpensesForPeriod, getDummyBudgetDataForPeriod } = await import('$lib/utils/dummyData');
const expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);
const budgetData = getDummyBudgetDataForPeriod(currentPeriodId, expenses);
```

### Key Changes:
1. Always pass `currentPeriodId` parameter
2. Use `ForPeriod` suffix functions
3. Pass expenses to budget data function for accurate spending calculation
4. Use centralized validation: `validatePeriodResetDate()`
5. Use centralized period ID generation: `getCurrentPeriodIdForResetDate()`

---

**Last Updated**: 2025-01-24
**Status**: ✅ Refactored, Optimized & Production-Ready
