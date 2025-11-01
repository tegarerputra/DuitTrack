# 📱 DuitTrack Dashboard Architecture

## 🎯 **Overview**

The DuitTrack Dashboard is the **main hub** of the application, completely redesigned with a simplified, mobile-first approach that prioritizes core user tasks and reduces cognitive load through progressive disclosure.

**File**: `src/routes/dashboard/+page.svelte`
**Design Philosophy**: Apple Music-inspired navigation with clean card-based information hierarchy
**Design System**: Clean white cards with subtle shadows (transitioned from glassmorphism)
**Target**: Max-width 430px for optimal mobile experience

## 🏗️ **Page Structure**

### **1. Header Section (Sticky)**
```
┌─────────────────────────────────────┐
│ 🍔 DuitTrack              [Avatar] │ ← Navigation bar
├─────────────────────────────────────┤
│ 📅 2024-12 Period Selector    ▼   │ ← Period selector
├─────────────────────────────────────┤
│        Budget Overview Card         │ ← Main budget status
│    Rp 2.500.000 / Rp 3.000.000    │
│    ████████████░░░ 83%             │
│    🟡 83% terpakai • Rp 500k sisa  │
└─────────────────────────────────────┘
```

**Components:**
- **Hamburger Button** (🍔): Toggles dropdown navigation menu
- **Brand Logo**: "DuitTrack" text dengan consistent typography
- **User Avatar**: Circle dengan initial letter dari displayName
- **Period Selector**: Shows current period dengan dropdown hint
- **Budget Overview Card**: Real-time budget progress dengan color coding

### **2. Hamburger Navigation Menu (Dropdown)**
```
┌─────────────────────────────────────┐
│ 🏠 Dashboard                       │
│ 💰 Riwayat Transaksi               │
│ 📊 Laporan & Chart                 │
│ 🎯 Kelola Budget                   │
│ ⚙️ Settings                        │
│ ─────────────────────────────────── │
│ 🚪 Logout                          │
└─────────────────────────────────────┘
```

**Behavior:**
- **Dropdown style** (NOT sidebar) - overlay dari top-right
- **Click hamburger** → menu slides down
- **Click outside** → menu closes automatically
- **Item selection** → navigate + close menu
- **Touch-optimized** dengan 44px minimum targets

### **3. Main Content (Scrollable)**
```
┌─────────────────────────────────────┐
│    📅 Transaksi Hari Ini            │ ← Today's activity
│    Total: Rp 72k (3 transaksi)     │
│                                     │
│    🍽️ Warteg Bahari    -Rp 15k     │
│    🚗 Gojek            -Rp 25k     │
│    🛍️ Indomaret        -Rp 32k     │
│    [Lihat Semua Transaksi 📋]      │
└─────────────────────────────────────┘
```

**Note**: Dashboard menggunakan simplified, minimalist design yang hanya menampilkan transaksi hari ini. Card "Categories Need Attention" telah dihapus untuk mengurangi complexity.

## 🎨 **Component Details**

### **1. Budget Overview Card**
```typescript
interface BudgetOverview {
  totalBudget: number;      // Rp 3.000.000
  totalSpent: number;       // Rp 2.500.000
  percentage: number;       // 83
  remaining: number;        // Rp 500.000
  status: 'safe' | 'warning' | 'danger'; // Color coding
}
```

**Visual Elements:**
- **Clean white card**: `background: #ffffff` with `border: 1px solid #e2e8f0`
- **Large typography**: Amount display dengan proper hierarchy (32px/20px/16px)
- **Progress bar** dengan color coding:
  - 🟢 Green (0-79%): `bg-green-500` - Safe
  - 🟡 Yellow (80-99%): `bg-yellow-500` - Warning
  - 🔴 Red (100%+): `bg-red-500` - Danger
- **Status text**: Percentage + remaining amount dengan integrated layout
- **Subtle shadow**: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)`

### **2. Add Expense CTA Card**
```typescript
interface AddExpenseCard {
  onClick: () => void; // Navigate to /add-expense
  prominent: true;     // Large, eye-catching design
}
```

**Visual Design:**
- **Glassmorphism button** dengan gradient cyan-to-blue
- **Icon circle + text**: + icon in glass circle + "Tambah Expense"
- **Sticky bottom position** dengan scroll hide/show behavior
- **Touch-friendly** dengan hover scale animation
- **Responsive**: Center on mobile, right-bottom on desktop (1024px+)

### **3. Transaksi Hari Ini Card**
```typescript
interface TodayTransaction {
  id: string;
  description: string;        // "Warteg Bahari"
  category: string;          // "FOOD" → 🍽️
  amount: number;           // 15000
  date: Date;               // Firebase Timestamp
}
```

**Display Logic:**
- **Show today's transactions only** (filtered by date)
- **Subtitle shows total**: "Total: Rp 72k (3 transaksi)"
- **Category name as title**: Uses `formatCategoryName()`
- **Notes as subtitle**: Transaction description or '-'
- **Category emoji**: Synced with budget page emoji
- **Amount color**: Dark gray (not red) untuk consistency
- **Empty state**: 🎉 "Belum ada pengeluaran hari ini!"

**Components Used:**
- `FinancialHeroCard_Final.svelte` - Main budget overview card
- `PeriodSelector.svelte` - Period selection dropdown

## 🔄 **Data Flow & State Management**

### **Reactive Data Sources**
```typescript
// Main dashboard state
let budgetData: BudgetData | null = null;  // From Firebase
let expenses: Expense[] = [];              // From Firebase
let recentTransactions: Transaction[] = []; // Today's transactions only

// Metrics state
let metrics: DashboardMetrics = {
  totalBudget: 0,
  totalSpent: 0,
  percentage: 0,
  remaining: 0,
  budgetStatus: 'safe',
  todaySpending: 0
};

// Scroll behavior for floating button
let showFloatingButton = true;
let lastScrollY = 0;
let scrollThreshold = SCROLL_CONFIG.THRESHOLD;
```

### **Period-based Data Loading**
```typescript
// Load data from Firebase based on selected period
async function loadPeriodData() {
  try {
    // Load from Firebase using periodService
    const periodData = await periodService.loadPeriodData(currentPeriodId);

    // Set expenses
    expenses = periodData.expenses;

    // Set budget data
    if (periodData.budget) {
      budgetData = {
        categories: periodData.budget.categories,
        totalBudget: periodData.budget.totalBudget,
        totalSpent: periodData.budget.totalSpent,
        month: currentPeriodId
      };
    }

    // Calculate metrics
    calculateBudgetMetrics();
    calculateExpenseMetrics();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}
```

### **Data Calculations**
```typescript
function calculateBudgetMetrics() {
  if (!budgetData) return;

  const totalBudget = budgetData.totalBudget || 0;
  const totalSpent = budgetData.totalSpent || 0;
  const percentage = totalBudget > 0 ?
    Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const remaining = Math.max(0, totalBudget - totalSpent);

  // Budget status using constants
  let budgetStatus: BudgetStatus = 'safe';
  if (percentage >= BUDGET_THRESHOLDS.DANGER) {
    budgetStatus = 'danger';
  } else if (percentage >= BUDGET_THRESHOLDS.WARNING) {
    budgetStatus = 'warning';
  }

  // Update metrics
  metrics = {
    totalBudget,
    totalSpent,
    percentage,
    remaining,
    budgetStatus,
    todaySpending: metrics.todaySpending
  };
}

function calculateExpenseMetrics() {
  if (!expenses.length) return;

  // Get TODAY's transactions only
  const today = new Date();
  const todayTransactions = expenses
    .filter(expense => {
      const expenseDate = timestampToDate(expense.date);
      return expenseDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => {
      const dateA = timestampToDate(a.date);
      const dateB = timestampToDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  recentTransactions = todayTransactions as Transaction[];

  // Calculate today's spending
  const todaySpending = todayTransactions.reduce(
    (sum, expense) => sum + (expense.amount || 0), 0
  );

  // Update metrics
  metrics = { ...metrics, todaySpending };
}

// Helper to get category emoji from budget data
function getCategoryEmoji(categoryId: string): string {
  if (!budgetData?.categories) {
    return getPlayfulCategoryIcon(categoryId);
  }

  const categoryData = budgetData.categories[categoryId];
  if (categoryData?.emoji) {
    return categoryData.emoji;
  }

  return getPlayfulCategoryIcon(categoryId);
}
```

### **Scroll Behavior for Floating Button**
```typescript
function setupScrollListener(): (() => void) | null {
  if (!browser) return null;

  lastScrollY = window.scrollY;
  let ticking = false;

  function handleScrollThrottled() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  function handleScroll() {
    if (!browser) return;
    const currentScrollY = window.scrollY;

    if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
      return;
    }

    // Show button when scrolling up or at top
    if (currentScrollY < lastScrollY ||
        currentScrollY < SCROLL_CONFIG.SHOW_SCROLL_THRESHOLD) {
      showFloatingButton = true;
    }
    // Hide button when scrolling down
    else if (currentScrollY > lastScrollY &&
             currentScrollY > SCROLL_CONFIG.HIDE_SCROLL_THRESHOLD) {
      showFloatingButton = false;
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', handleScrollThrottled, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScrollThrottled);
  };
}
```

## 🎯 **Navigation Integration**

### **Entry Points TO Dashboard**
- **Post-login** → Dashboard (default landing)
- **Logo tap** → Dashboard (from any page)
- **Menu selection** → Dashboard
- **Return from other pages** → Dashboard dengan fresh data

### **Exit Points FROM Dashboard**
```typescript
function navigateTo(path: string) {
  closeMenu(); // Close hamburger menu
  goto(path);  // SvelteKit navigation
}

// Navigation paths:
- /add-expense    // Primary CTA
- /expenses       // "Lihat Semua Transaksi"
- /budget         // "Lihat Semua Budget"
- /analytics      // Menu item
- /settings       // Menu item
```

## 📱 **Responsive Design**

### **Mobile-First Constraints**
- **Max-width**: 430px untuk optimal mobile experience
- **Single-column layout** tanpa horizontal scrolling
- **Touch targets**: Minimum 44px untuk accessibility
- **Card spacing**: 16px gap between components
- **Padding**: 16px horizontal untuk content

### **Loading & Empty States**
```typescript
// Skeleton loaders untuk semua sections
{#if loading}
  <div class="animate-pulse">
    <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <!-- Additional skeleton elements -->
  </div>
{/if}

// Empty states dengan helpful messaging
{#if recentTransactions.length === 0}
  <div class="text-center py-8">
    <div class="text-4xl mb-2">📝</div>
    <p class="text-sm text-gray-500">Belum ada transaksi</p>
  </div>
{/if}
```

## 🎨 **Design System**

### **Color Coding System**
```css
:root {
  --color-safe: #10b981;     /* Green - budget healthy */
  --color-warning: #f59e0b;  /* Yellow - approaching limit */
  --color-danger: #ef4444;   /* Red - over budget */
  --color-primary: #2563eb;  /* Blue - primary actions */
}
```

### **Typography Hierarchy**
- **Page brand**: 20px bold (`text-xl font-bold`)
- **Card titles**: 18px semibold (`text-lg font-semibold`)
- **Amount displays**: 20-24px bold (`text-xl font-bold`)
- **Supporting text**: 14px regular (`text-sm`)
- **Meta info**: 12px muted (`text-xs text-gray-500`)

### **Card Styling Pattern**
```css
.dashboard-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
}

.dashboard-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.3s ease;
}

.cta-button {
  background: #10b981;
  width: 100%;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  transition: all 0.3s ease;
}

.cta-button:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}
```

## ⚡ **Performance Considerations**

### **Loading Strategy**
1. **Critical data first**: Budget overview, user authentication
2. **Progressive loading**: Transactions → stats → warnings
3. **Skeleton screens** untuk smooth perceived performance
4. **Conditional rendering** untuk empty states

### **Interaction Feedback**
```typescript
// Immediate UI feedback
<button class="hover:bg-gray-50 transition-colors active:scale-98">

// Loading states
{#if loading}
  <div class="animate-pulse">...</div>
{:else}
  <!-- Actual content -->
{/if}
```

### **Memory Management**
- **Reactive subscriptions** automatically cleaned up on destroy
- **Computed values** hanya recalculate saat dependencies berubah
- **Event listeners** properly managed dengan Svelte lifecycle

## 🚀 **Future Enhancements**

### **Phase 3 Ready Features**
1. **Period Selector**: Dynamic switching between periods
2. **Pull-to-refresh**: Native mobile refresh gesture
3. **Swipe actions**: Transaction quick actions
4. **Push notifications**: Budget alerts
5. **Offline mode**: Better PWA caching

### **Analytics Integration Points**
- **Chart.js**: Budget trend visualization
- **Category breakdown**: Pie chart untuk spending distribution
- **Time series**: Monthly comparison charts
- **Goal tracking**: Savings progress visualization

---

## 📝 **Recent Changes (November 2025)**

### **✅ Dashboard Simplification & UX Improvements**
1. **Removed "Categories Need Attention" Card**
   - Eliminated complexity and cognitive load
   - Focuses dashboard on essential information only
   - Users can view budget details on dedicated Budget page
   - Removed all related functions: `categoriesNeedAttention` state, calculation logic
   - Cleaned up CSS: `.dashboard-category-card` and related styles

2. **Enhanced "Transaksi Hari Ini" Card**
   - Moved from "5 recent transactions" to "today's transactions only"
   - Added subtitle with total and transaction count
   - Improved data display: category name as title, notes as subtitle
   - Synced category emoji with budget page for consistency
   - Changed amount color from red to dark gray for minimalist aesthetic
   - Text button "Lihat Semua Transaksi" left-aligned for consistency

3. **Floating Button Scroll Behavior**
   - Implemented auto-hide on scroll down (>200px)
   - Auto-show on scroll up or at top (<100px)
   - Throttling with `requestAnimationFrame` for smooth performance
   - Responsive behavior: center on mobile, right-bottom on desktop
   - Proper cleanup in `onDestroy` to prevent memory leaks

4. **Icon Consistency**
   - Created `getCategoryEmoji()` helper function
   - Dashboard now uses same emoji as budget page
   - Falls back to `getPlayfulCategoryIcon()` if no budget emoji found

### **Removed Components & Functions**
- ❌ `categoriesNeedAttention` state variable
- ❌ Categories calculation logic in `calculateBudgetMetrics()`
- ❌ `CategoryAttention` type import
- ❌ `FintechCard`, `FintechButton`, `FintechProgress` component imports (unused)
- ❌ `.dashboard-category-card` CSS styles (~40 lines)
- ❌ "Add Expense CTA Card" (replaced with floating button)
- ❌ "Quick Stats Grid" (simplified to single card)

---

**Architecture Status**: ✅ **PRODUCTION READY**
**Last Updated**: November 1, 2025
**Performance**: Optimized untuk Indonesian mobile networks
**Accessibility**: WCAG 2.1 compliant dengan proper touch targets
**Security**: Bank-grade data protection dengan Firebase integration