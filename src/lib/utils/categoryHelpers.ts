// Category helper functions for DuitTrack
// Centralized category icons and names to avoid duplication

// Store for budget categories (set from expenses/budget pages)
let budgetCategoriesCache: Array<{ id: string; name: string; emoji: string }> = [];

/**
 * Set budget categories cache for emoji lookup
 */
export function setBudgetCategories(categories: Array<{ id: string; name: string; emoji: string }>) {
  budgetCategoriesCache = categories;
}

/**
 * Get category icon emoji
 * Now checks budget categories first for custom emojis
 */
export function getCategoryIcon(category: string): string {
  if (!category) return '📦'; // Default icon for undefined/null

  // First, try to find emoji from budget categories cache
  const budgetCat = budgetCategoriesCache.find(
    c => c.id.toLowerCase() === category.toLowerCase() ||
         c.name.toLowerCase() === category.toLowerCase()
  );
  if (budgetCat?.emoji) {
    return budgetCat.emoji;
  }

  // Fallback to default icons
  const normalizedCategory = category.toUpperCase();
  const icons: Record<string, string> = {
    'FOOD': '🍽️',
    'TRANSPORT': '🚗',
    'SHOPPING': '🛍️',
    'ENTERTAINMENT': '🎬',
    'HEALTH': '💊',
    'EDUCATION': '📚',
    'UTILITIES': '⚡',
    'SAVINGS': '💰',
    'OTHER': '📦'
  };
  return icons[normalizedCategory] || '📦';
}

/**
 * Format category name to Indonesian
 */
export function formatCategoryName(category: string): string {
  if (!category) return 'Lainnya'; // Default name for undefined/null
  const normalizedCategory = category.toUpperCase();
  const names: Record<string, string> = {
    'FOOD': 'Makanan',
    'TRANSPORT': 'Transport',
    'SHOPPING': 'Belanja',
    'ENTERTAINMENT': 'Hiburan',
    'HEALTH': 'Kesehatan',
    'EDUCATION': 'Pendidikan',
    'UTILITIES': 'Tagihan',
    'SAVINGS': 'Tabungan',
    'OTHER': 'Lainnya'
  };
  return names[normalizedCategory] || category;
}

/**
 * Get all available categories with icons and labels
 */
export function getAllCategories(): Array<{ value: string; label: string; icon: string }> {
  return [
    { value: 'FOOD', label: 'Makanan', icon: '🍽️' },
    { value: 'TRANSPORT', label: 'Transport', icon: '🚗' },
    { value: 'SHOPPING', label: 'Belanja', icon: '🛍️' },
    { value: 'ENTERTAINMENT', label: 'Hiburan', icon: '🎬' },
    { value: 'HEALTH', label: 'Kesehatan', icon: '💊' },
    { value: 'EDUCATION', label: 'Pendidikan', icon: '📚' },
    { value: 'UTILITIES', label: 'Tagihan', icon: '⚡' },
    { value: 'SAVINGS', label: 'Tabungan', icon: '💰' },
    { value: 'OTHER', label: 'Lainnya', icon: '📦' }
  ];
}
