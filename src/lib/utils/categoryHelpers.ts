// Category helper functions for DuitTrack
// Centralized category icons and names to avoid duplication

/**
 * Get category icon emoji
 */
export function getCategoryIcon(category: string): string {
  if (!category) return '📦'; // Default icon for undefined/null
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
