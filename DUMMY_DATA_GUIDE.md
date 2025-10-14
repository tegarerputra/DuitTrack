# 📊 Dummy Data Guide - DuitTrack

## Overview
Dokumentasi ini menjelaskan penggunaan data dummy yang telah disinkronkan di seluruh aplikasi DuitTrack untuk keperluan testing dan development.

## 🎯 Single Source of Truth
Semua data dummy berasal dari: `src/lib/utils/dummyData.ts`

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

### 1. Dashboard (`src/routes/dashboard/+page.svelte`)
```typescript
// Line 196-245
const { getDummyBudgetData, generateDummyExpenses } = await import('$lib/utils/dummyData');

// Load expenses (uses store cache)
expenses = generateDummyExpenses(25);

// Calculate REAL total from expenses
const realTotalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

// Load budget data
const budgetDummyData = getDummyBudgetData();
```

**Features**:
- ✅ Menghitung spending REAL dari expenses
- ✅ Menampilkan recent transactions (5 terakhir)
- ✅ Categories need attention
- ✅ Hero card dengan status budget

### 2. Expenses (`src/routes/expenses/+page.svelte`)
```typescript
// Line 84-96
const { generateDummyExpenses } = await import('$lib/utils/dummyData');

// Uses shared store
generateDummyExpenses(25);
```

**Features**:
- ✅ List semua expenses dengan group by date
- ✅ Filter by category
- ✅ Search by description
- ✅ Inline category editing
- ✅ Delete expense dengan toast notification

### 3. Budget (`src/lib/components/budget/Budget.svelte`)
```typescript
// Line 856-869
const { getDummyCategories, generateDummyExpenses } = await import('$lib/utils/dummyData');

const expenses = generateDummyExpenses(25);
const dummyCategories = getDummyCategories();
```

**Features**:
- ✅ Category budget management
- ✅ Real-time spending calculation per category
- ✅ Quick setup packages
- ✅ Add/edit/delete categories

### 4. Tracking Period (`src/routes/settings/tracking-period/+page.svelte`)
**Note**: Halaman ini TIDAK menggunakan dummy data karena hanya untuk settings periode tracking.

## 🔄 Data Synchronization

### Store Management
Semua expense data disimpan di `expensesStore` sebagai single source of truth:

```typescript
// src/lib/utils/dummyData.ts:31-35
const storeData = get(expensesStore);
if (storeData && storeData.length > 0) {
  console.log('📦 Using existing expenses from store:', storeData.length);
  return storeData;
}
```

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

## 🐛 Common Issues & Fixes

### Issue 1: Category ID Case Mismatch
**Problem**: Expenses tidak muncul di category filter
**Fix**: Sudah diperbaiki - semua category IDs sekarang UPPERCASE

### Issue 2: Spending tidak sync antar halaman
**Problem**: Dashboard dan Budget menampilkan spending berbeda
**Fix**: Gunakan `calculateCategorySpending()` helper function

### Issue 3: Store cache tidak ter-invalidate
**Problem**: Data lama masih muncul setelah perubahan
**Fix**: Clear store dengan reload page atau reset store

## 📝 Helper Functions

### New Helper Functions
```typescript
// Get total budget
import { getTotalBudget } from '$lib/utils/dummyData';
const total = getTotalBudget(); // 7500000

// Calculate spending per category
import { calculateCategorySpending } from '$lib/utils/dummyData';
const spending = calculateCategorySpending(expenses);
// { FOOD: 500000, TRANSPORT: 200000, ... }

// Get current period ID
import { getCurrentPeriodId } from '$lib/utils/dummyData';
const periodId = getCurrentPeriodId(); // '2025-01'
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

## 🔗 Related Files

- `src/lib/utils/dummyData.ts` - Main dummy data module
- `src/lib/stores/expenses.ts` - Expense store
- `src/lib/stores/budget.ts` - Budget store
- `src/routes/dashboard/+page.svelte` - Dashboard page
- `src/routes/expenses/+page.svelte` - Expenses page
- `src/lib/components/budget/Budget.svelte` - Budget component

---

**Last Updated**: 2025-01-13
**Status**: ✅ Synced & Documented
