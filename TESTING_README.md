# 🧪 Quick Testing Guide - DuitTrack

## 🚀 Quick Start

### 1. Verify Data Synchronization (Most Important!)

```bash
# Start dev server
npm run dev

# Open browser at http://localhost:5173
```

**Test Cross-Page Sync**:
1. Open [Dashboard](http://localhost:5173/dashboard) → Note "Total Spent"
2. Open [Expenses](http://localhost:5173/expenses) → Verify same total
3. Open [Budget](http://localhost:5173/budget) → Verify same total

✅ **Expected**: All 3 pages show identical total spending

---

## 📊 Adjust Dummy Data for Testing

### Location
Edit file: [`src/lib/utils/dummyData.ts`](src/lib/utils/dummyData.ts)

### Quick Adjustments

#### Test Over Budget:
```typescript
// Line 39: Reduce FOOD budget
{ id: 'FOOD', name: 'Makanan', emoji: '🍽️', budget: 100000 }, // Was: 2000000
```

#### Test Zero Expenses:
```typescript
// Line 159: Change default count
export function generateDummyExpensesForPeriod(periodId: string, count: number = 0)
```

#### Test Large Amounts:
```typescript
// Line 187: Increase amount range
amount: Math.floor(Math.random() * 15000000) + 2000000, // 2M-17M
```

#### Clear Cache:
```javascript
// Browser console
localStorage.clear();
location.reload();
```

---

## 📝 Comprehensive Documentation

### Main Guides:
1. **[TESTING_SCENARIOS.md](TESTING_SCENARIOS.md)** - 13 detailed testing scenarios
2. **[SYNC_FIX_SUMMARY.md](SYNC_FIX_SUMMARY.md)** - What was fixed and why
3. **[DUMMY_DATA_GUIDE.md](DUMMY_DATA_GUIDE.md)** - Complete usage reference

---

## ✅ Critical Fix Applied (2025-01-19)

### Problem:
Data tidak sync antar Dashboard, Expenses, dan Budget pages.

### Root Cause:
- Dashboard used `.toLowerCase()` for category IDs
- Budget used `.toUpperCase()` for category IDs
- Category definitions in `DUMMY_CATEGORIES` are all UPPERCASE

### Solution:
- ✅ Standardized to `.toUpperCase()` across all pages
- ✅ Fixed Dashboard ([line 180](src/routes/dashboard/+page.svelte#L180))
- ✅ Fixed Expense Store ([line 40](src/lib/stores/expenses.ts#L40))

**Result**: All pages now show consistent data! 🎉

---

## 🎯 Top 5 Testing Scenarios

### 1. Cross-Page Sync ⭐⭐⭐
**How**: Navigate Dashboard → Expenses → Budget
**Check**: Total spending sama di semua halaman

### 2. Period Switching ⭐⭐⭐
**How**: Change period di satu page, navigate ke page lain
**Check**: Period selection tersimpan (localStorage sync)

### 3. Over Budget Warning ⭐⭐
**How**: Set budget FOOD = 100K di `dummyData.ts`
**Check**: Red warning muncul di Dashboard & Budget

### 4. Category Filter ⭐⭐
**How**: Filter by "FOOD" di Expenses page
**Check**: Hanya expenses FOOD yang muncul

### 5. Empty State ⭐
**How**: Set count = 0 di `generateDummyExpensesForPeriod`
**Check**: Empty state message muncul

---

## 🔧 Quick Console Commands

```javascript
// Check if data is synced
console.log('Expenses count:', $expensesStore.length);
console.log('Total:', $filteredExpensesTotal);

// Check category distribution
const dist = {};
$expensesStore.forEach(e => dist[e.category] = (dist[e.category] || 0) + 1);
console.table(dist);

// Verify all categories are UPPERCASE
console.log($expensesStore.map(e => e.category));
// Should all be: FOOD, TRANSPORT, SHOPPING, etc. (not lowercase)

// Check period cache
console.log('Selected Period:', localStorage.getItem('duittrack_selected_period'));
```

---

## 🎨 Advanced Testing

For detailed scenarios including:
- Rapid period switching
- Midnight edge cases
- Performance testing with 500+ expenses
- Budget adjustment during period
- Uneven category distribution

👉 See **[TESTING_SCENARIOS.md](TESTING_SCENARIOS.md)**

---

## 📚 File Structure

```
DuitTrack/
├── src/lib/utils/dummyData.ts          # ⭐ Main dummy data (edit here)
├── src/lib/stores/expenses.ts          # Expense store
├── src/lib/stores/period.ts            # Period management
├── src/routes/dashboard/+page.svelte   # Dashboard page
├── src/routes/expenses/+page.svelte    # Expenses page
├── src/lib/components/budget/Budget.svelte # Budget component
│
├── TESTING_SCENARIOS.md                # 📖 13 testing scenarios
├── SYNC_FIX_SUMMARY.md                 # 🔧 Fix documentation
├── DUMMY_DATA_GUIDE.md                 # 📚 Complete reference
└── TESTING_README.md                   # 🚀 This file (quick start)
```

---

## 💡 Tips

1. **Always clear cache** after adjusting dummy data:
   ```javascript
   localStorage.clear(); location.reload();
   ```

2. **Use browser DevTools** to inspect:
   - Network tab: Check for unnecessary requests
   - Console: Watch for errors
   - Vue/Svelte DevTools: Inspect store state

3. **Test on mobile** (responsive):
   - Open DevTools → Toggle device toolbar
   - Test iPhone SE, iPad, Desktop

4. **Check all 3 pages** after any change:
   - Dashboard → Expenses → Budget
   - Verify totals match

---

## 🐛 Found a Bug?

1. Check if it's a known issue in [SYNC_FIX_SUMMARY.md](SYNC_FIX_SUMMARY.md)
2. Verify you're using latest code (category IDs should be UPPERCASE)
3. Clear cache: `localStorage.clear(); location.reload();`
4. Document the bug with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

## ✅ Success Criteria

- [ ] Dashboard total = Expenses total = Budget total
- [ ] Period selection syncs across pages
- [ ] Category filter works on Expenses page
- [ ] Over budget warnings show correctly
- [ ] Empty state displays when no expenses
- [ ] All category IDs are UPPERCASE in console
- [ ] No console errors

---

**Happy Testing! 🎉**

For questions or issues, check the comprehensive guides linked above.
