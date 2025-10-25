/**
 * 🎯 CENTRALIZED DUMMY DATA MODULE
 *
 * This module provides a single source of truth for all dummy/test data
 * across Dashboard, Expenses, Budget, and other pages.
 *
 * ⚠️ IMPORTANT CONVENTIONS:
 * - All category IDs MUST be UPPERCASE (e.g., 'FOOD', 'TRANSPORT')
 * - Period format: 'YYYY-MM-DD' (e.g., '2025-10-25') - includes reset date
 * - Total Budget: 7,500,000 IDR (sum of all category budgets)
 * - ALWAYS use generateDummyExpensesForPeriod() for period-aware data
 *
 * 📊 RECOMMENDED USAGE (Period-Aware):
 * ```typescript
 * import { generateDummyExpensesForPeriod, getDummyBudgetDataForPeriod } from '$lib/utils/dummyData';
 *
 * // Generate expenses for specific period (RECOMMENDED)
 * const periodExpenses = generateDummyExpensesForPeriod('2025-10-25', 25);
 *
 * // Get budget data with spending for period
 * const budgetData = getDummyBudgetDataForPeriod('2025-10-25', periodExpenses);
 * ```
 *
 * 📝 LEGACY USAGE (Deprecated - use period-aware functions instead):
 * ```typescript
 * // ⚠️ DEPRECATED: Only use for backward compatibility
 * const expenses = generateDummyExpenses(25);
 * const budgetData = getDummyBudgetData();
 * ```
 *
 * 🔄 CACHE STRATEGY:
 * - Period-specific cache: periodExpensesCache (keyed by periodId)
 * - Cache persists during session until clearPeriodCache() is called
 * - Each period has independent cached data
 */
import { expenseActions } from '$lib/stores/expenses';

// 🎯 SINGLE CACHE: Period-specific expenses only
// This ensures each period has independent, cached data
const periodExpensesCache: Record<string, any[]> = {};

// 🎯 UNCATEGORIZED CACHE: Cache for uncategorized expenses per period
const uncategorizedExpensesCache: Record<string, any[]> = {};

// ⚠️ IMPORTANT: Use UPPERCASE for category IDs to match Firebase and store conventions
export const DUMMY_CATEGORIES = [
  { id: 'FOOD', name: 'Makanan', emoji: '🍽️', budget: 2000000 },
  { id: 'TRANSPORT', name: 'Transport', emoji: '🚗', budget: 1000000 },
  { id: 'SHOPPING', name: 'Belanja', emoji: '🛍️', budget: 1500000 },
  { id: 'ENTERTAINMENT', name: 'Hiburan', emoji: '🎬', budget: 800000 },
  { id: 'HEALTH', name: 'Kesehatan', emoji: '⚕️', budget: 700000 },
  { id: 'EDUCATION', name: 'Pendidikan', emoji: '📚', budget: 500000 },
  { id: 'UTILITIES', name: 'Tagihan', emoji: '💡', budget: 600000 },
  { id: 'OTHER', name: 'Lainnya', emoji: '📦', budget: 400000 }
];

// Map descriptions using UPPERCASE keys to match category IDs
export const DUMMY_EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  'FOOD': ['Lunch di warung', 'Coffee shop', 'Belanja groceries', 'Makan malam'],
  'TRANSPORT': ['Grab ride', 'Isi bensin', 'Parkir', 'Tol'],
  'SHOPPING': ['Beli baju', 'Elektronik', 'Beli buku', 'Peralatan rumah'],
  'ENTERTAINMENT': ['Nonton bioskop', 'Konser', 'Game', 'Netflix'],
  'HEALTH': ['Dokter', 'Beli obat', 'Gym membership', 'Vitamin'],
  'EDUCATION': ['Kursus online', 'Beli buku pelajaran', 'Workshop', 'Seminar'],
  'UTILITIES': ['Listrik', 'Air', 'Internet', 'Pulsa'],
  'OTHER': ['Lain-lain', 'Misc expenses', 'Donation', 'Gift']
};

/**
 * ⚠️ DEPRECATED: Use generateDummyExpensesForPeriod() instead
 *
 * Legacy function for backward compatibility only.
 * Generates dummy expenses without period awareness.
 *
 * @deprecated Use generateDummyExpensesForPeriod() for period-aware data
 * @param count Number of expenses to generate
 * @returns Array of expenses
 */
export function generateDummyExpenses(count: number = 25) {
  console.warn('⚠️ DEPRECATED: generateDummyExpenses() is deprecated. Use generateDummyExpensesForPeriod() instead.');

  const today = new Date();
  const expenses: any[] = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = Math.floor(Math.random() * DUMMY_CATEGORIES.length);
    const category = DUMMY_CATEGORIES[categoryIndex];
    if (!category) continue; // Safety check

    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const categoryDescriptions = DUMMY_EXPENSE_DESCRIPTIONS[category.id] || ['Pengeluaran'];
    const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];

    expenses.push({
      id: `dummy_legacy_${i}`,
      amount: Math.floor(Math.random() * 150000) + 20000,
      category: category.id,
      description,
      date,
      userId: 'dummy_user'
    });
  }

  const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Store in expense store for backward compatibility
  expenseActions.setExpenses(sortedExpenses);

  console.log('📦 Generated legacy dummy expenses:', sortedExpenses.length);
  return sortedExpenses;
}

export function getDummyBudgetData() {
  const totalBudget = DUMMY_CATEGORIES.reduce((sum, cat) => sum + cat.budget, 0);

  return {
    categories: Object.fromEntries(
      DUMMY_CATEGORIES.map(cat => [cat.id, { budget: cat.budget, spent: 0 }])
    ),
    totalBudget,
    totalSpent: 0  // Will be calculated from actual expenses
  };
}

/**
 * 🧪 TESTING: Get empty budget data (no categories set)
 *
 * Use this for testing UI empty states, onboarding, and first-time user scenarios.
 * This simulates a user who hasn't set up their budget categories yet.
 *
 * @returns Empty budget data structure
 *
 * @example
 * ```typescript
 * // Testing empty state on Budget page
 * const emptyBudget = getEmptyBudgetData();
 * // { categories: {}, totalBudget: 0, totalSpent: 0 }
 * ```
 */
export function getEmptyBudgetData() {
  return {
    categories: {},
    totalBudget: 0,
    totalSpent: 0
  };
}

/**
 * 🧪 TESTING: Get empty budget data for a specific period
 *
 * Use this for testing period-aware empty states.
 *
 * @param periodId Period ID in format 'YYYY-MM-DD'
 * @returns Empty budget data with period ID
 *
 * @example
 * ```typescript
 * // Testing empty state with period awareness
 * const emptyBudget = getEmptyBudgetDataForPeriod('2025-10-25');
 * ```
 */
export function getEmptyBudgetDataForPeriod(periodId: string) {
  return {
    categories: {},
    totalBudget: 0,
    totalSpent: 0,
    periodId
  };
}

export function getDummyCategories() {
  return DUMMY_CATEGORIES;
}

/**
 * Get total budget from all categories
 * @returns Total budget in IDR
 */
export function getTotalBudget(): number {
  return DUMMY_CATEGORIES.reduce((sum, cat) => sum + cat.budget, 0);
}

/**
 * Calculate category spending from expenses
 * @param expenses Array of expenses
 * @returns Object mapping category ID to total spent
 */
export function calculateCategorySpending(expenses: any[]): Record<string, number> {
  const spending: Record<string, number> = {};

  expenses.forEach((expense: any) => {
    const categoryId = expense.category.toUpperCase(); // Ensure uppercase
    spending[categoryId] = (spending[categoryId] || 0) + expense.amount;
  });

  return spending;
}

/**
 * Get dummy period ID for current month
 * @returns Period ID in format 'YYYY-MM'
 */
export function getCurrentPeriodId(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 🧪 TESTING: Generate expenses with uncategorized items (no budget category set)
 *
 * Use this to test scenarios where user has expenses but hasn't set up budget categories.
 * All expenses will have 'UNCATEGORIZED' category.
 *
 * @param periodId Period ID in format 'YYYY-MM-DD'
 * @param count Number of expenses to generate (default: 10)
 * @returns Array of uncategorized expenses
 *
 * @example
 * ```typescript
 * // Testing expenses without budget setup
 * const expenses = generateUncategorizedExpenses('2025-10-25', 10);
 * // All expenses will have category: 'UNCATEGORIZED'
 * ```
 */
export function generateUncategorizedExpenses(periodId: string, count: number = 10): any[] {
  // ✅ Check cache first - ensure consistent data across all pages
  if (uncategorizedExpensesCache[periodId]) {
    console.log(`📦 Using cached UNCATEGORIZED expenses for period ${periodId}:`, uncategorizedExpensesCache[periodId].length);
    return uncategorizedExpensesCache[periodId];
  }

  const parts = periodId.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) {
    console.error('❌ Invalid period ID format. Expected YYYY-MM-DD, got:', periodId);
    return [];
  }

  const periodStart = new Date(year, month - 1, day);
  const periodEnd = new Date(year, month, day - 1);

  const expenses: any[] = [];
  const uncategorizedDescriptions = [
    'Pengeluaran',
    'Pembayaran',
    'Belanja',
    'Transaksi',
    'Pembelian',
    'Bayar'
  ];

  for (let i = 0; i < count; i++) {
    const timeRange = periodEnd.getTime() - periodStart.getTime();
    const randomTime = Math.random() * timeRange;
    const date = new Date(periodStart.getTime() + randomTime);

    const description = uncategorizedDescriptions[Math.floor(Math.random() * uncategorizedDescriptions.length)];

    expenses.push({
      id: `dummy_uncategorized_${periodId}_${i}`,
      amount: Math.floor(Math.random() * 150000) + 20000,
      category: 'UNCATEGORIZED', // No budget category set
      description,
      date,
      userId: 'dummy_user',
      periodId
    });
  }

  const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

  // ✅ Cache the generated expenses for this period
  uncategorizedExpensesCache[periodId] = sortedExpenses;

  console.log(`📦 Generated UNCATEGORIZED expenses for period ${periodId}:`, sortedExpenses.length);
  return sortedExpenses;
}

/**
 * 🎯 RECOMMENDED: Generate dummy expenses for a specific period
 *
 * This is the primary function for generating period-aware expense data.
 * Uses intelligent caching to avoid regenerating data for the same period.
 *
 * @param periodId Period ID in format 'YYYY-MM-DD' (e.g., '2025-10-25')
 * @param count Number of expenses to generate (default: 25)
 * @returns Array of expenses for the period
 *
 * @example
 * ```typescript
 * // Generate 25 expenses for period starting Oct 25, 2025
 * const expenses = generateDummyExpensesForPeriod('2025-10-25', 25);
 * ```
 */
export function generateDummyExpensesForPeriod(periodId: string, count: number = 25): any[] {
  // ✅ Check cache first - avoid regenerating same period data
  if (periodExpensesCache[periodId]) {
    console.log(`📦 Using cached expenses for period ${periodId}:`, periodExpensesCache[periodId].length);
    return periodExpensesCache[periodId];
  }

  // Parse period ID to get start date (with validation)
  const parts = periodId.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (!year || !month || !day) {
    console.error('❌ Invalid period ID format. Expected YYYY-MM-DD, got:', periodId);
    return [];
  }

  // Period runs from reset day this month to day before reset next month
  const periodStart = new Date(year, month - 1, day);
  const periodEnd = new Date(year, month, day - 1); // Next month, day before reset

  const expenses: any[] = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = Math.floor(Math.random() * DUMMY_CATEGORIES.length);
    const category = DUMMY_CATEGORIES[categoryIndex];
    if (!category) continue; // Safety check

    // Generate random date within the period
    const timeRange = periodEnd.getTime() - periodStart.getTime();
    const randomTime = Math.random() * timeRange;
    const date = new Date(periodStart.getTime() + randomTime);

    const categoryDescriptions = DUMMY_EXPENSE_DESCRIPTIONS[category.id] || ['Pengeluaran'];
    const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];

    expenses.push({
      id: `dummy_${periodId}_${i}`,
      amount: Math.floor(Math.random() * 150000) + 20000,
      category: category.id,
      description,
      date,
      userId: 'dummy_user',
      periodId // Add period reference for tracking
    });
  }

  const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

  // ✅ Cache the expenses for this period
  periodExpensesCache[periodId] = sortedExpenses;

  console.log(`📦 Generated NEW dummy expenses for period ${periodId}:`, sortedExpenses.length);
  console.log(`📅 Period range: ${periodStart.toLocaleDateString('id-ID')} - ${periodEnd.toLocaleDateString('id-ID')}`);
  return sortedExpenses;
}

/**
 * Get dummy budget data for a specific period
 * @param periodId Period ID
 * @param expenses Expenses for the period (optional, for calculating spent)
 * @returns Budget data for the period
 */
export function getDummyBudgetDataForPeriod(periodId: string, expenses?: any[]) {
  const totalBudget = DUMMY_CATEGORIES.reduce((sum, cat) => sum + cat.budget, 0);

  // Calculate spending from expenses if provided
  let categorySpending: Record<string, number> = {};
  let totalSpent = 0;

  if (expenses && expenses.length > 0) {
    expenses.forEach((expense: any) => {
      const categoryId = expense.category.toUpperCase();
      categorySpending[categoryId] = (categorySpending[categoryId] || 0) + expense.amount;
    });
    totalSpent = Object.values(categorySpending).reduce((sum, spent) => sum + spent, 0);
  }

  return {
    categories: Object.fromEntries(
      DUMMY_CATEGORIES.map(cat => [cat.id, {
        budget: cat.budget,
        spent: categorySpending[cat.id] || 0
      }])
    ),
    totalBudget,
    totalSpent,
    periodId
  };
}

/**
 * Clear cache for a specific period or all periods
 *
 * @param periodId Optional period ID to clear specific cache
 *
 * @example
 * ```typescript
 * // Clear specific period
 * clearPeriodCache('2025-10-25');
 *
 * // Clear all cached periods
 * clearPeriodCache();
 * ```
 */
export function clearPeriodCache(periodId?: string) {
  if (periodId) {
    delete periodExpensesCache[periodId];
    delete uncategorizedExpensesCache[periodId];
    console.log(`🗑️ Cleared cache for period ${periodId}`);
  } else {
    Object.keys(periodExpensesCache).forEach(key => delete periodExpensesCache[key]);
    Object.keys(uncategorizedExpensesCache).forEach(key => delete uncategorizedExpensesCache[key]);
    console.log('🗑️ Cleared all period caches');
  }
}

/**
 * 🎯 UTILITY: Validate if stored period matches user's reset date
 *
 * Centralized validation to avoid duplicate logic across pages.
 * Helps detect when user changes their reset date setting.
 *
 * @param storedPeriodId Stored period ID (e.g., '2025-10-25')
 * @param userResetDate User's budget reset date (1-31)
 * @returns true if period matches reset date, false if needs regeneration
 *
 * @example
 * ```typescript
 * const storedPeriod = '2025-10-25';
 * const userResetDate = 15;
 *
 * if (!validatePeriodResetDate(storedPeriod, userResetDate)) {
 *   // Reset date changed, clear stored period
 *   selectedPeriodStore.clear();
 * }
 * ```
 */
export function validatePeriodResetDate(storedPeriodId: string | null, userResetDate: number): boolean {
  if (!storedPeriodId) return false;

  // Extract day from stored period (format: YYYY-MM-DD)
  const parts = storedPeriodId.split('-');
  const storedDay = parseInt(parts[2] || '0');

  const isValid = storedDay === userResetDate;

  if (!isValid) {
    console.log(`⚠️ Period reset date mismatch: stored=${storedDay}, user=${userResetDate}`);
  }

  return isValid;
}

/**
 * 🎯 UTILITY: Get current period ID based on reset date
 *
 * Calculates the correct period ID based on user's reset date.
 * Handles month transitions correctly.
 *
 * @param resetDate User's budget reset date (1-31)
 * @returns Period ID in format 'YYYY-MM-DD'
 *
 * @example
 * ```typescript
 * // If today is 2025-10-20 and reset date is 25
 * const periodId = getCurrentPeriodIdForResetDate(25);
 * // Returns: '2025-09-25' (previous period, still active)
 *
 * // If today is 2025-10-26 and reset date is 25
 * const periodId = getCurrentPeriodIdForResetDate(25);
 * // Returns: '2025-10-25' (current period)
 * ```
 */
export function getCurrentPeriodIdForResetDate(resetDate: number): string {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0-based
  const currentYear = today.getFullYear();

  let periodYear = currentYear;
  let periodMonth = currentMonth;

  // If we haven't reached reset date yet, use previous month's period
  if (currentDay < resetDate) {
    periodMonth = currentMonth - 1;
    if (periodMonth < 0) {
      periodMonth = 11; // December
      periodYear = currentYear - 1;
    }
  }

  // Format: YYYY-MM-DD
  const monthStr = String(periodMonth + 1).padStart(2, '0'); // Convert to 1-based
  const dayStr = String(resetDate).padStart(2, '0');

  return `${periodYear}-${monthStr}-${dayStr}`;
}

console.log('📦 Centralized dummy data module loaded');
console.log(`📊 Total Budget: Rp ${getTotalBudget().toLocaleString('id-ID')}`);
