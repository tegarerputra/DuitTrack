# 🧪 Testing Scenarios - DuitTrack

## Overview
Dokumentasi ini menyediakan berbagai scenario testing dengan cara mengadjust dummy data untuk menguji berbagai kondisi edge case dan behavior aplikasi.

---

## 🎯 Quick Setup

### Lokasi File untuk Adjust Dummy Data
- **Main File**: [`src/lib/utils/dummyData.ts`](src/lib/utils/dummyData.ts)
- **Categories**: Line 38-47 (DUMMY_CATEGORIES)
- **Expense Generation**: Line 61-100 (generateDummyExpenses)
- **Period-Specific**: Line 159-203 (generateDummyExpensesForPeriod)

### Clear Cache untuk Testing
```typescript
// Di browser console atau test file
import { clearPeriodCache } from '$lib/utils/dummyData';
clearPeriodCache(); // Clear semua cache
// Atau
clearPeriodCache('2025-10-19'); // Clear specific period
```

---

## 📊 Scenario Testing

### Scenario 1: **Over Budget - Single Category**
**Tujuan**: Test tampilan kategori yang melebihi budget

**Steps to Adjust**:
1. Edit `dummyData.ts` line 38-47, ubah budget FOOD menjadi kecil:
```typescript
{ id: 'FOOD', name: 'Makanan', emoji: '🍽️', budget: 100000 }, // Dari 2000000 ke 100000
```

2. Atau adjust expenses, tambahkan lebih banyak expenses kategori FOOD:
```typescript
// Di generateDummyExpensesForPeriod, line 173-175
// Temporary force FOOD category
const category = DUMMY_CATEGORIES[0]; // FOOD always
```

**Expected Results**:
- ✅ Dashboard "Categories Need Attention" menampilkan FOOD dengan red badge
- ✅ Budget page menampilkan FOOD bar merah (>100%)
- ✅ Hero card percentage >100%
- ✅ Total spent > total budget warning

**Pages to Check**:
- [Dashboard](http://localhost:5173/dashboard) - Hero card, Categories need attention
- [Budget](http://localhost:5173/budget) - Progress bar category FOOD
- [Expenses](http://localhost:5173/expenses) - Filter FOOD untuk verify total

---

### Scenario 2: **Zero Expenses**
**Tujuan**: Test empty state handling

**Steps to Adjust**:
```typescript
// Edit dummyData.ts line 159
export function generateDummyExpensesForPeriod(periodId: string, count: number = 0): any[] {
  // Change default count to 0
```

**Expected Results**:
- ✅ Dashboard shows "Belum ada transaksi"
- ✅ Expenses page shows empty state
- ✅ Budget page shows 0 spending for all categories
- ✅ Hero card shows 0% used

**Pages to Check**:
- [Dashboard](http://localhost:5173/dashboard)
- [Expenses](http://localhost:5173/expenses)
- [Budget](http://localhost:5173/budget)

---

### Scenario 3: **Huge Number of Expenses**
**Tujuan**: Test performance dengan banyak data

**Steps to Adjust**:
```typescript
// Call with large count
const expenses = generateDummyExpensesForPeriod(currentPeriodId, 500);
```

**Expected Results**:
- ✅ Dashboard loads within 2 seconds
- ✅ Expenses page pagination/virtualization works
- ✅ Filter & search still responsive
- ✅ No memory leaks

**Performance Metrics to Track**:
- Page load time
- Filter operation speed
- Scroll performance
- Memory usage

---

### Scenario 4: **Uneven Category Distribution**
**Tujuan**: Test kategori dengan spending sangat tidak merata

**Steps to Adjust**:
```typescript
// Edit generateDummyExpensesForPeriod line 173-175
const categoryWeights = [70, 5, 5, 5, 5, 5, 3, 2]; // FOOD dominates
const weightSum = categoryWeights.reduce((a, b) => a + b, 0);
const randomWeight = Math.random() * weightSum;
let currentWeight = 0;
let categoryIndex = 0;
for (let i = 0; i < categoryWeights.length; i++) {
  currentWeight += categoryWeights[i];
  if (randomWeight <= currentWeight) {
    categoryIndex = i;
    break;
  }
}
const category = DUMMY_CATEGORIES[categoryIndex];
```

**Expected Results**:
- ✅ Top categories in dashboard shows correct distribution
- ✅ Categories with 0 spending shown correctly
- ✅ Pie charts (jika ada) display dengan benar
- ✅ Filter by category works for all categories

---

### Scenario 5: **Budget Perfectly Matched**
**Tujuan**: Test tampilan saat spending = budget exactly

**Steps to Adjust**:
```typescript
// Adjust budget to match calculated spending
// After generating expenses, calculate total and set budget sama
const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
// Set totalBudget = totalSpent
```

**Expected Results**:
- ✅ Hero card shows exactly 100%
- ✅ Progress bar fills completely (not red, just full)
- ✅ No over budget warning
- ✅ Budget remaining = Rp 0

---

### Scenario 6: **Very Large Amounts**
**Tujuan**: Test number formatting untuk jumlah besar

**Steps to Adjust**:
```typescript
// Edit line 85 in generateDummyExpensesForPeriod
amount: Math.floor(Math.random() * 15000000) + 2000000, // 2M - 17M per expense
```

**Expected Results**:
- ✅ Currency formatting works (Rp 15.000.000 not Rp 15000000)
- ✅ No number overflow
- ✅ Charts scale properly
- ✅ Mobile view still readable

---

### Scenario 7: **Very Small Amounts**
**Tujuan**: Test precision untuk jumlah kecil

**Steps to Adjust**:
```typescript
// Edit line 85 in generateDummyExpensesForPeriod
amount: Math.floor(Math.random() * 10000) + 1000, // 1K - 11K per expense
```

**Expected Results**:
- ✅ Small amounts displayed correctly
- ✅ Percentage calculations accurate
- ✅ No rounding errors
- ✅ Charts still visible

---

### Scenario 8: **Cross-Period Consistency**
**Tujuan**: Test data consistency antar periode

**Steps to Test**:
1. Load period A (e.g., 2025-10-19)
2. Note total spending di Dashboard
3. Switch ke Expenses page → verify same total
4. Switch ke Budget page → verify same total
5. Change period to B (e.g., 2025-11-18)
6. Verify totals reset dan independent dari period A
7. Switch back to period A → verify data sama seperti step 1

**Expected Results**:
- ✅ Data konsisten dalam 1 periode
- ✅ Period switch tidak corrupt data
- ✅ Cache works correctly per period
- ✅ localStorage sync works

**Pages to Check**:
- [Dashboard](http://localhost:5173/dashboard)
- [Expenses](http://localhost:5173/expenses)
- [Budget](http://localhost:5173/budget)

---

### Scenario 9: **Category Without Expenses**
**Tujuan**: Test kategori yang ada budget tapi tidak ada spending

**Steps to Adjust**:
```typescript
// Edit generateDummyExpensesForPeriod untuk skip category tertentu
// Misalnya skip EDUCATION
const categoryIndex = Math.floor(Math.random() * (DUMMY_CATEGORIES.length - 1));
const category = DUMMY_CATEGORIES[categoryIndex === 5 ? 7 : categoryIndex]; // Skip index 5 (EDUCATION)
```

**Expected Results**:
- ✅ Budget page shows EDUCATION with 0 spending
- ✅ Progress bar shows 0%
- ✅ Dashboard tidak list di top categories
- ✅ Filter EDUCATION di Expenses shows empty

---

### Scenario 10: **Same Day Multiple Expenses**
**Tujuan**: Test grouping expenses di tanggal yang sama

**Steps to Adjust**:
```typescript
// Edit date generation untuk force same day
const date = new Date(periodStart); // All expenses on start date
```

**Expected Results**:
- ✅ Expenses page groups all under 1 date header
- ✅ Sort order correct (newest first dalam group)
- ✅ Daily chart shows single spike
- ✅ No duplicate date headers

---

## 🔧 Helper Functions untuk Testing

### Function 1: Generate Specific Amount Distribution
```typescript
// Add to dummyData.ts
export function generateExpensesWithDistribution(
  periodId: string,
  categoryAmounts: Record<string, number>
): any[] {
  const expenses: any[] = [];
  let id = 0;

  Object.entries(categoryAmounts).forEach(([categoryId, totalAmount]) => {
    const category = DUMMY_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    // Split into multiple expenses
    const numExpenses = Math.floor(Math.random() * 5) + 3; // 3-7 expenses
    for (let i = 0; i < numExpenses; i++) {
      expenses.push({
        id: `test_${periodId}_${id++}`,
        amount: Math.floor(totalAmount / numExpenses),
        category: category.id,
        description: `Test ${category.name}`,
        date: new Date(),
        userId: 'test_user',
        periodId
      });
    }
  });

  return expenses;
}
```

**Usage**:
```typescript
const testExpenses = generateExpensesWithDistribution('2025-10-19', {
  'FOOD': 2500000,      // Over budget
  'TRANSPORT': 500000,  // Under budget
  'SHOPPING': 0,        // No spending
  'HEALTH': 700000      // Exactly at budget
});
```

### Function 2: Quick Budget Reset
```typescript
// Add to dummyData.ts
export function resetToDefaultBudget() {
  clearPeriodCache();
  expenseActions.setExpenses([]);
  console.log('✅ Budget and expenses reset to default');
}
```

### Function 3: Test Data Generator
```typescript
// Add to dummyData.ts
export function generateTestScenario(scenario: string) {
  switch (scenario) {
    case 'over-budget':
      return generateExpensesWithDistribution('2025-10-19', {
        'FOOD': 3000000, // Over 2M budget
        'TRANSPORT': 1500000 // Over 1M budget
      });

    case 'under-budget':
      return generateExpensesWithDistribution('2025-10-19', {
        'FOOD': 500000,
        'TRANSPORT': 200000
      });

    case 'empty':
      return [];

    default:
      return generateDummyExpensesForPeriod('2025-10-19', 25);
  }
}
```

---

## 🎨 Advanced Testing Scenarios

### Scenario 11: **Budget Adjustment During Period**
**Tujuan**: Test saat user mengubah budget di tengah periode

**Steps**:
1. Load dengan default budget
2. Add expenses sampai 50% budget
3. **User mengurangi budget** (edit category budget)
4. Verify percentage update correctly (bisa jadi suddenly >100%)

**Expected Results**:
- ✅ Percentage recalculates instantly
- ✅ Warning muncul jika suddenly over budget
- ✅ No data loss
- ✅ History tetap intact

---

### Scenario 12: **Rapid Period Switching**
**Tujuan**: Test performance saat rapid switching antar periode

**Steps**:
1. Switch period A → B → C → A → B (quickly)
2. Verify no race conditions
3. Check cache loading/generation

**Expected Results**:
- ✅ No duplicate data generation
- ✅ Cache hit rate high
- ✅ UI doesn't freeze
- ✅ Correct data displayed

---

### Scenario 13: **Midnight Edge Case**
**Tujuan**: Test expenses created near midnight

**Steps to Adjust**:
```typescript
// Create expenses at 23:59:59
const date = new Date(periodStart);
date.setHours(23, 59, 59);
```

**Expected Results**:
- ✅ Correct date grouping
- ✅ Sort order correct
- ✅ Doesn't bleed into next day

---

## 📝 Testing Checklist

### Data Synchronization
- [ ] Dashboard total = Expenses total = Budget total
- [ ] Category spending sama across all pages
- [ ] Period selection persists in localStorage
- [ ] Period switch updates all pages correctly
- [ ] Cache per period works independently

### UI/UX
- [ ] Empty states displayed when no data
- [ ] Over budget states shown with warning colors
- [ ] Number formatting correct (currency)
- [ ] Percentages calculated correctly
- [ ] Progress bars scale properly

### Performance
- [ ] Page load < 2 seconds with 25 expenses
- [ ] Page load < 5 seconds with 500 expenses
- [ ] Filter operation < 200ms
- [ ] Search operation < 300ms
- [ ] No memory leaks after 10 period switches

### Edge Cases
- [ ] Zero expenses handled
- [ ] Zero budget handled
- [ ] Exactly 100% budget used
- [ ] Over 200% budget used
- [ ] Category with no expenses
- [ ] All expenses same day
- [ ] Very large amounts (>10M)
- [ ] Very small amounts (<1K)

---

## 🚀 Quick Test Commands

```bash
# Clear all caches and reload
localStorage.clear(); location.reload();

# Check current period cache
console.log(periodExpensesCache);

# Verify category ID consistency
console.log(expenses.map(e => e.category)); // Should all be UPPERCASE

# Calculate total manually
console.log('Total:', expenses.reduce((s, e) => s + e.amount, 0));

# Check category distribution
const dist = {};
expenses.forEach(e => dist[e.category] = (dist[e.category] || 0) + 1);
console.table(dist);
```

---

## 📚 Related Documentation

- [DUMMY_DATA_GUIDE.md](DUMMY_DATA_GUIDE.md) - Comprehensive usage guide
- [src/lib/utils/dummyData.ts](src/lib/utils/dummyData.ts) - Main dummy data module
- [src/lib/stores/expenses.ts](src/lib/stores/expenses.ts) - Expense store
- [src/lib/stores/period.ts](src/lib/stores/period.ts) - Period store

---

**Last Updated**: 2025-01-19
**Status**: ✅ Ready for Testing
