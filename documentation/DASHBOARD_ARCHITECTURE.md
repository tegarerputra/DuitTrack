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
│          💰 Add Expense             │ ← Primary CTA
│         Tambah Pengeluaran          │
├─────────────────────────────────────┤
│    🕒 Recent Transactions (3)       │ ← Latest activity
│    🍽️ Warteg Bahari    -Rp 15k     │
│    🚗 Gojek            -Rp 25k     │
│    🛍️ Indomaret        -Rp 32k     │
│    [Lihat Semua Transaksi]         │
├─────────────────────────────────────┤
│   📊 Quick Stats (2 cards)         │ ← Key metrics
│   │ Hari Ini     │ Total Periode │  │
│   │ Rp 45k       │ Rp 2.5M       │  │
├─────────────────────────────────────┤
│   ⚠️ Categories Need Attention      │ ← Budget warnings
│   🍽️ Makanan: 82% (warning)        │
│   🚗 Transport: 112% (over)         │
│   [Lihat Semua Budget]             │
└─────────────────────────────────────┘
```

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
- **Green button**: `background: #10b981` dengan clean design
- **Large icon & text**: 💰 + "Tambah Pengeluaran"
- **Full-width button** dengan rounded corners (12px)
- **Touch-friendly** dengan active scale animation dan subtle shadow
- **Hover effect**: Slightly elevated dengan enhanced shadow

### **3. Recent Transactions**
```typescript
interface RecentTransaction {
  id: string;
  description: string;        // "Warteg Bahari"
  category: string;          // "FOOD" → 🍽️
  amount: number;           // 15000
  date: Date;               // Firebase Timestamp
}
```

**Display Logic:**
- **Show maximum 5** most recent transactions
- **Category icons** mapping untuk visual recognition
- **Smart date formatting**: "Hari ini", "Kemarin", "23 Dec"
- **Amount formatting**: -{formatRupiah(amount)}
- **Empty state**: 📝 "Belum ada transaksi"

### **4. Quick Stats Grid**
```typescript
interface QuickStats {
  todaySpending: number;    // Rp 45.000
  periodSpending: number;   // Rp 2.500.000 (totalSpent)
}
```

**Layout:**
- **2-column grid** dengan equal width
- **White cards** dengan border styling
- **Center-aligned** content
- **Large amount display** untuk emphasis

### **5. Categories Need Attention**
```typescript
interface BudgetWarning {
  category: string;         // "FOOD"
  categoryName: string;     // "Makanan"
  percentage: number;       // 82
  status: 'warning' | 'danger';
  spent: number;
  budget: number;
}
```

**Display Logic:**
- **Only show categories** dengan 80%+ usage
- **Warning (80-99%)**: Yellow background + border
- **Danger (100%+)**: Red background + border
- **Empty state**: 🎉 "Semua budget terkendali!"
- **Category icons**: Consistent dengan transaction display

## 🔄 **Data Flow & State Management**

### **Reactive Data Sources**
```typescript
// Main dashboard state
let budgetData: any = null;           // From budgetStore
let expenses: any[] = [];             // From expenseStore
let recentTransactions: any[] = [];   // Computed from expenses
let categoriesNeedAttention: any[] = []; // Computed from budgetData

// Computed metrics (reactive)
$: totalBudget = budgetData?.totalBudget || 0;
$: totalSpent = budgetData?.totalSpent || 0;
$: percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
$: budgetStatus = getBudgetStatus(percentage);
```

### **Store Subscriptions**
```typescript
// Real-time Firebase listeners
$: budgetStore.subscribe((data) => {
  if (data && data.month === currentPeriodId) {
    budgetData = data;
    calculateBudgetMetrics();
  }
});

$: expenseStore.subscribe((data) => {
  if (data && data.expenses) {
    expenses = data.expenses;
    calculateExpenseMetrics();
  }
});
```

### **Data Calculations**
```typescript
function calculateBudgetMetrics() {
  // Budget status determination
  if (percentage >= 100) budgetStatus = 'danger';
  else if (percentage >= 80) budgetStatus = 'warning';
  else budgetStatus = 'safe';

  // Categories needing attention
  categoriesNeedAttention = Object.entries(budgetData.categories)
    .filter(([_, data]) => (data.spent / data.budget) * 100 >= 80)
    .sort((a, b) => b.percentage - a.percentage);
}

function calculateExpenseMetrics() {
  // Recent transactions (5 latest)
  recentTransactions = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Today's spending calculation
  const today = new Date();
  todaySpending = expenses
    .filter(expense => isSameDay(expense.date, today))
    .reduce((sum, expense) => sum + expense.amount, 0);
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

**Architecture Status**: ✅ **PRODUCTION READY**
**Performance**: Optimized untuk Indonesian mobile networks
**Accessibility**: WCAG 2.1 compliant dengan proper touch targets
**Security**: Bank-grade data protection dengan Firebase integration