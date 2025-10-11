// Centralized dummy data for testing across all pages
// This ensures consistency between Dashboard, Expenses, and Budget pages
import { expenseActions } from '$lib/stores/expenses';
import { get } from 'svelte/store';
import { expensesStore } from '$lib/stores/expenses';

export const DUMMY_CATEGORIES = [
  { id: 'food', name: 'Makanan', emoji: '🍽️', budget: 2000000 },
  { id: 'transport', name: 'Transport', emoji: '🚗', budget: 1000000 },
  { id: 'shopping', name: 'Belanja', emoji: '🛍️', budget: 1500000 },
  { id: 'entertainment', name: 'Hiburan', emoji: '🎬', budget: 800000 },
  { id: 'health', name: 'Kesehatan', emoji: '⚕️', budget: 700000 },
  { id: 'education', name: 'Pendidikan', emoji: '📚', budget: 500000 },
  { id: 'utilities', name: 'Tagihan', emoji: '💡', budget: 600000 },
  { id: 'other', name: 'Lainnya', emoji: '📦', budget: 400000 }
];

export const DUMMY_EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  'food': ['Lunch di warung', 'Coffee shop', 'Belanja groceries', 'Makan malam'],
  'transport': ['Grab ride', 'Isi bensin', 'Parkir', 'Tol'],
  'shopping': ['Beli baju', 'Elektronik', 'Beli buku', 'Peralatan rumah'],
  'entertainment': ['Nonton bioskop', 'Konser', 'Game', 'Netflix'],
  'health': ['Dokter', 'Beli obat', 'Gym membership', 'Vitamin'],
  'education': ['Kursus online', 'Beli buku pelajaran', 'Workshop', 'Seminar'],
  'utilities': ['Listrik', 'Air', 'Internet', 'Pulsa'],
  'other': ['Lain-lain', 'Misc expenses', 'Donation', 'Gift']
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
      category: category.id.toUpperCase(),
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

console.log('📦 Centralized dummy data module loaded');
