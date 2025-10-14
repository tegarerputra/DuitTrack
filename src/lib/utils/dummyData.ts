/**
 * 🎯 CENTRALIZED DUMMY DATA MODULE
 *
 * This module provides a single source of truth for all dummy/test data
 * across Dashboard, Expenses, Budget, and other pages.
 *
 * ⚠️ IMPORTANT CONVENTIONS:
 * - All category IDs MUST be UPPERCASE (e.g., 'FOOD', 'TRANSPORT')
 * - All pages MUST use the same generateDummyExpenses() function
 * - Period format: 'YYYY-MM-DD' (e.g., '2025-10-13') - with reset date
 * - Total Budget: 7,500,000 IDR (sum of all category budgets)
 *
 * 📊 USAGE:
 * ```typescript
 * import { generateDummyExpenses, getDummyBudgetData, getDummyCategories, generateDummyExpensesForPeriod } from '$lib/utils/dummyData';
 *
 * // Generate 25 expenses (uses store cache if available)
 * const expenses = generateDummyExpenses(25);
 *
 * // Generate expenses for specific period
 * const periodExpenses = generateDummyExpensesForPeriod('2025-09-25', 20);
 *
 * // Get budget structure
 * const budgetData = getDummyBudgetData();
 *
 * // Get category definitions
 * const categories = getDummyCategories();
 * ```
 */
import { expenseActions } from '$lib/stores/expenses';
import { get } from 'svelte/store';
import { expensesStore } from '$lib/stores/expenses';

// Store for period-specific expenses
const periodExpensesCache: Record<string, any[]> = {};

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

export function generateDummyExpenses(count: number = 25) {
  // ALWAYS check store first as single source of truth
  const storeData = get(expensesStore);
  if (storeData && storeData.length > 0) {
    console.log('📦 Using existing expenses from store:', storeData.length);
    return storeData;
  }

  // Generate new data only if store is empty
  const today = new Date();
  const expenses: any[] = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = Math.floor(Math.random() * DUMMY_CATEGORIES.length);
    const category = DUMMY_CATEGORIES[categoryIndex];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const categoryDescriptions = DUMMY_EXPENSE_DESCRIPTIONS[category.id] || ['Pengeluaran'];
    const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];

    expenses.push({
      id: `dummy_${i}`,
      amount: Math.floor(Math.random() * 150000) + 20000,
      category: category.id, // Already UPPERCASE now
      description,
      date,
      userId: 'dummy_user'
    });
  }

  const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Store in global store (single source of truth)
  expenseActions.setExpenses(sortedExpenses);

  console.log('📦 Generated NEW dummy expenses:', sortedExpenses.length);
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
 * Generate dummy expenses for a specific period
 * @param periodId Period ID in format 'YYYY-MM-DD' (e.g., '2025-09-25')
 * @param count Number of expenses to generate
 * @returns Array of expenses for the period
 */
export function generateDummyExpensesForPeriod(periodId: string, count: number = 25): any[] {
  // Check cache first
  if (periodExpensesCache[periodId]) {
    console.log(`📦 Using cached expenses for period ${periodId}:`, periodExpensesCache[periodId].length);
    return periodExpensesCache[periodId];
  }

  // Parse period ID to get start date
  const [year, month, day] = periodId.split('-').map(Number);
  const periodStart = new Date(year, month - 1, day);
  const periodEnd = new Date(year, month, day - 1); // Next month, day before reset

  const expenses: any[] = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = Math.floor(Math.random() * DUMMY_CATEGORIES.length);
    const category = DUMMY_CATEGORIES[categoryIndex];

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
      periodId // Add period reference
    });
  }

  const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Cache the expenses for this period
  periodExpensesCache[periodId] = sortedExpenses;

  console.log(`📦 Generated NEW dummy expenses for period ${periodId}:`, sortedExpenses.length);
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
 * @param periodId Optional period ID to clear specific cache
 */
export function clearPeriodCache(periodId?: string) {
  if (periodId) {
    delete periodExpensesCache[periodId];
    console.log(`🗑️ Cleared cache for period ${periodId}`);
  } else {
    Object.keys(periodExpensesCache).forEach(key => delete periodExpensesCache[key]);
    console.log('🗑️ Cleared all period caches');
  }
}

console.log('📦 Centralized dummy data module loaded');
console.log(`📊 Total Budget: Rp ${getTotalBudget().toLocaleString('id-ID')}`);
