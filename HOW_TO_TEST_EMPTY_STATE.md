# 🚀 Cara Testing Empty State - Panduan Praktis

## 📌 3 Cara Testing yang Bisa Kamu Lakukan

---

## **CARA 1: Testing di Budget Page** ⭐ (PALING MUDAH)

### Step 1: Buka File Budget Component
```
File: src/lib/components/budget/Budget.svelte
```

### Step 2: Cari Function `loadDummyData()`
Scroll ke line **836-885** atau cari dengan Ctrl+F: `async function loadDummyData()`

### Step 3: **BACKUP** Code Original
Copy seluruh function `loadDummyData()` dan simpan di notepad untuk restore nanti.

### Step 4: Replace dengan Code Testing

**Replace function `loadDummyData()` (line 836-885) dengan code ini:**

```typescript
async function loadDummyData() {
  try {
    // Set loading to true at the start
    isLoading = true;

    // 🧪 TESTING MODE: EMPTY BUDGET (No Categories)
    const { getEmptyBudgetDataForPeriod } = await import('$lib/utils/dummyData');

    // Load EMPTY budget data
    const emptyBudgetData = getEmptyBudgetDataForPeriod(currentPeriodId);

    // Set categories to EMPTY array
    categories = [];

    budgetData.set({
      categories: {},
      totalBudget: 0,
      totalSpent: 0
    });

    console.log('🧪 TESTING: Empty budget loaded', emptyBudgetData);
    console.log('📊 Categories:', categories.length); // Should be 0
  } catch (error) {
    console.error('❌ Error loading dummy data:', error);
  } finally {
    isLoading = false;
  }
}
```

### Step 5: Save & Test
1. **Save file** (Ctrl+S)
2. **Refresh browser** (F5)
3. **Buka Budget page** → Kamu akan lihat **empty state UI**

### ✅ Yang Harus Kamu Lihat:
- ✅ Icon 📊 dengan animasi float
- ✅ Title: "Mulai Kelola Budget Kamu"
- ✅ Description text
- ✅ Button: "Buat Budget Pertama" 💰
- ✅ **TIDAK ADA** list categories

### 📸 Screenshot Expected:
```
┌──────────────────────────────────────────┐
│                                          │
│            📊 (animated)                 │
│                                          │
│     Mulai Kelola Budget Kamu            │
│                                          │
│  Buat budget untuk setiap kategori dan   │
│  pantau pengeluaran kamu agar tetap      │
│  terkontrol. Dengan budget yang jelas,   │
│  kamu bisa lebih mudah mencapai tujuan   │
│  finansialmu.                            │
│                                          │
│  [💰 Buat Budget Pertama]                │
│                                          │
└──────────────────────────────────────────┘
```

### 🔄 Restore ke Normal
Replace kembali dengan code original yang sudah kamu backup.

---

## **CARA 2: Testing dengan Uncategorized Expenses** 💡

Ini untuk test kondisi: **User punya expenses tapi belum setup budget**

### Step 1-3: Sama seperti Cara 1

### Step 4: Replace dengan Code Ini

```typescript
async function loadDummyData() {
  try {
    isLoading = true;

    // 🧪 TESTING MODE: Empty Budget + Uncategorized Expenses
    const {
      getEmptyBudgetDataForPeriod,
      generateUncategorizedExpenses
    } = await import('$lib/utils/dummyData');

    // Load EMPTY budget
    const emptyBudgetData = getEmptyBudgetDataForPeriod(currentPeriodId);

    // BUT generate 10 uncategorized expenses
    const uncategorizedExpenses = generateUncategorizedExpenses(currentPeriodId, 10);

    // Set empty categories
    categories = [];

    // Calculate total spent from uncategorized expenses
    const totalSpent = uncategorizedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    budgetData.set({
      categories: {},
      totalBudget: 0,
      totalSpent: totalSpent  // User has spending but no budget!
    });

    console.log('🧪 TESTING: Empty budget with uncategorized expenses');
    console.log('📊 Total Spent:', totalSpent);
    console.log('💰 Total Budget:', 0);
    console.log('⚠️ Expenses:', uncategorizedExpenses.length);
  } catch (error) {
    console.error('❌ Error loading dummy data:', error);
  } finally {
    isLoading = false;
  }
}
```

### ✅ Yang Harus Kamu Lihat:
- ✅ Empty state UI muncul
- ✅ Console log menunjukkan: "10 expenses generated"
- ✅ Total spent > 0 tapi budget = 0

---

## **CARA 3: Testing Mode Switcher** 🔧 (ADVANCED)

Ini cara paling fleksibel - bisa switch mode tanpa edit code terus-terusan!

### Step 1-3: Sama seperti sebelumnya

### Step 4: Replace dengan Code Switcher

```typescript
// 🧪 ADD THIS VARIABLE at the top of <script> section (around line 20-30)
let testMode: 'normal' | 'empty' | 'uncategorized' = 'normal';  // ← Change this to switch mode!

// Then REPLACE loadDummyData() function (line 836-885):
async function loadDummyData() {
  try {
    isLoading = true;

    // Import all functions
    const {
      getDummyCategories,
      generateDummyExpensesForPeriod,
      getEmptyBudgetDataForPeriod,
      generateUncategorizedExpenses
    } = await import('$lib/utils/dummyData');

    // 🧪 SWITCH TESTING MODE HERE
    switch (testMode) {
      case 'empty':
        // ═══════════════════════════════════
        // MODE 1: Empty Budget (No Categories)
        // ═══════════════════════════════════
        console.log('🧪 TEST MODE: EMPTY BUDGET');

        categories = [];
        budgetData.set({
          categories: {},
          totalBudget: 0,
          totalSpent: 0
        });
        break;

      case 'uncategorized':
        // ═══════════════════════════════════
        // MODE 2: Empty Budget + Uncategorized Expenses
        // ═══════════════════════════════════
        console.log('🧪 TEST MODE: UNCATEGORIZED EXPENSES');

        const uncategorizedExpenses = generateUncategorizedExpenses(currentPeriodId, 10);
        const totalSpent = uncategorizedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        categories = [];
        budgetData.set({
          categories: {},
          totalBudget: 0,
          totalSpent: totalSpent
        });
        console.log('⚠️ Uncategorized expenses:', uncategorizedExpenses.length);
        break;

      case 'normal':
      default:
        // ═══════════════════════════════════
        // MODE 3: Normal State (With Categories)
        // ═══════════════════════════════════
        console.log('✅ TEST MODE: NORMAL');

        const expenses = generateDummyExpensesForPeriod(currentPeriodId, 25);

        const categorySpending: Record<string, number> = {};
        expenses.forEach((expense: any) => {
          const categoryId = expense.category.toUpperCase();
          categorySpending[categoryId] = (categorySpending[categoryId] || 0) + expense.amount;
        });

        const dummyCategories = getDummyCategories();
        categories = dummyCategories.map(cat => ({
          ...cat,
          spent: categorySpending[cat.id] || 0
        }));

        const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpentNormal = categories.reduce((sum, cat) => sum + cat.spent, 0);

        budgetData.set({
          categories: Object.fromEntries(
            categories.map(cat => [cat.id, { budget: cat.budget, spent: cat.spent }])
          ),
          totalBudget,
          totalSpent: totalSpentNormal
        });
        break;
    }

    console.log(`📊 Budget loaded for period: ${currentPeriodId}`);
    console.log(`🔧 Current Test Mode: ${testMode}`);
  } catch (error) {
    console.error('❌ Error loading dummy data:', error);
  } finally {
    isLoading = false;
  }
}
```

### Step 5: Cara Ganti Mode

**Edit variable `testMode` di line ~20-30:**

```typescript
// 🔄 GANTI INI UNTUK SWITCH MODE:
let testMode: 'normal' | 'empty' | 'uncategorized' = 'empty';  // ← Change this!
                                                      ^^^^^^^^
// Options:
// 'normal'        → Normal state dengan 8 categories
// 'empty'         → Empty state, no categories, no expenses
// 'uncategorized' → Empty budget tapi ada 10 uncategorized expenses
```

### Step 6: Save & Test

1. **Set mode** yang mau ditest
2. **Save** (Ctrl+S)
3. **Refresh browser** (F5)
4. **Test!**

### ✅ Keuntungan Cara 3:
- ✅ Gampang switch mode (cukup ganti 1 baris)
- ✅ Tidak perlu copy-paste code berulang kali
- ✅ Bisa test semua kondisi dengan cepat
- ✅ Code tetap rapi dan organized

---

## 📊 Testing Checklist

### ✅ Budget Page Empty State
- [ ] Empty state UI muncul ketika `categories.length === 0`
- [ ] Icon 📊 ada dan animated (float)
- [ ] Title dan description text muncul
- [ ] Button "Buat Budget Pertama" ada dan kelihatan bagus
- [ ] Background glassmorphism terlihat smooth
- [ ] Hover effect pada card bekerja
- [ ] Console log menunjukkan: `🧪 TESTING: Empty budget loaded`

### ✅ Uncategorized Expenses Test
- [ ] Console log menunjukkan: `⚠️ Uncategorized expenses: 10`
- [ ] Total spent > 0 (check di console)
- [ ] Total budget = 0
- [ ] Empty state tetap muncul meski ada expenses

### ✅ Mode Switcher Test
- [ ] Switch ke `'empty'` → Empty state muncul
- [ ] Switch ke `'uncategorized'` → Empty state + console log expenses
- [ ] Switch ke `'normal'` → Kembali ke normal dengan 8 categories
- [ ] Console log menunjukkan mode yang aktif: `🔧 Current Test Mode: xxx`

---

## 🎯 Quick Tips

### Tip 1: Check Console Log
Buka **Chrome DevTools** (F12) → Tab **Console** untuk lihat log:
```
🧪 TESTING: Empty budget loaded
📊 Categories: 0
🔧 Current Test Mode: empty
```

### Tip 2: Test UI Responsiveness
- Resize browser window → Empty state harus tetap centered
- Test di mobile view (F12 → Toggle device toolbar)

### Tip 3: Test Interactions
- Hover pada empty state card → Should have smooth animation
- Click "Buat Budget Pertama" → Should open add category form

### Tip 4: Restore Original
**JANGAN LUPA** restore ke code original setelah testing!
- Copy backup code yang sudah disimpan
- Paste kembali ke function `loadDummyData()`
- Save & refresh

---

## 🆘 Troubleshooting

### Problem 1: Empty State Tidak Muncul
**Solution:**
- Check `categories.length` di console → Harus = 0
- Check line 931: `{:else if categories.length === 0}`
- Pastikan `isLoading = false` di finally block

### Problem 2: Error di Console
**Solution:**
- Check import statement → Pastikan path correct
- Check function name → Harus exact match
- Check period ID → Harus format `YYYY-MM-DD`

### Problem 3: Styling Tidak Sesuai
**Solution:**
- Check class name: `.enhanced-empty-card`
- Scroll ke CSS section (line 1270+)
- Refresh dengan hard reload: Ctrl+Shift+R

---

## 📖 Related Files

- [EMPTY_STATE_TESTING_GUIDE.md](./EMPTY_STATE_TESTING_GUIDE.md) - Detailed guide
- [DUMMY_DATA_GUIDE.md](./DUMMY_DATA_GUIDE.md) - Main documentation
- [src/lib/utils/dummyData.ts](./src/lib/utils/dummyData.ts) - Implementation

---

## 💬 Need Help?

Kalau masih bingung atau ada error:
1. Check console log untuk error messages
2. Compare code dengan backup original
3. Read [EMPTY_STATE_TESTING_GUIDE.md](./EMPTY_STATE_TESTING_GUIDE.md) untuk detail

---

**Happy Testing!** 🎉
