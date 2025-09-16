/* ========================================
   DuitTrack - Category Service
   Unified category icon mapping system
======================================== */

/**
 * CategoryService - Centralized category icon management
 * Provides consistent category icon mapping across all pages
 */
class CategoryService {
  constructor() {
    // Enhanced category mappings based on user's actual budget data
    this.emojiMap = {
      // Food categories - most used in user's data
      'makan': '🍽️', 'food': '🍽️', 'makanan': '🍽️', 'restoran': '🍽️', 'masak': '🍳',
      
      // Transportation & Fuel - high budget item in user data  
      'bensin': '⛽', 'gas': '⛽', 'bbm': '⛽', 'fuel': '⛽', 'isi bensin': '⛽',
      'transport': '🚗', 'transportasi': '🚗', 'ojek': '🏍️', 'grab': '📱',
      
      // Utilities
      'listrik': '⚡', 'electricity': '⚡', 'pln': '⚡',
      
      // Shopping
      'belanja': '🛒', 'shopping': '🛒', 'groceries': '🛒', 'beli': '🛍️',
      
      // Snacks - significant category in user data
      'jajan': '🍿', 'snack': '🍿', 'snacks': '🍿', 'cemilan': '🥨', 'kopi': '☕',
      
      // Fruits - specific category from user spreadsheet
      'buah': '🍎', 'fruit': '🍎', 'semangka': '🍉', 'melon': '🍈', 
      'jeruk': '🍊', 'pisang': '🍌', 'apel': '🍎', 'kelapa': '🥥', 'mangga': '🥭',
      
      // Household - major category in user data
      'rumah': '🏠', 'household': '🏠', 'rumah tangga': '🏠', 'hous': '🏠', 'house': '🏠', 'sewa': '🏠',
      
      // Entertainment
      'hiburan': '🎮', 'entertainment': '🎮', 'cinema': '🎬',
      
      // Health & Education
      'kesehatan': '💊', 'health': '💊', 'dokter': '👨‍⚕️',
      'pendidikan': '🎓', 'education': '🎓', 'sekolah': '🏫',
      
      // Clothing
      'pakaian': '👕', 'clothes': '👕', 'fashion': '👗',
      
      // Family expenses (from user data: Nafkah Farah)
      'nafkah': '👨‍👩‍👧‍👦', 'family': '👨‍👩‍👧‍👦', 'farah': '👩', 'anak': '👶'
    };
  }

  /**
   * Get category icon based on category name
   * Uses fuzzy matching to find appropriate emoji
   * @param {string} categoryName - The category name to get icon for
   * @returns {string} - The emoji icon for the category
   */
  getCategoryIcon(categoryName) {
    if (!categoryName) return '💰';
    
    const lowercaseName = categoryName.toLowerCase();
    
    // Exact match or fuzzy matching - check if category name contains any mapped key
    for (const [key, emoji] of Object.entries(this.emojiMap)) {
      if (lowercaseName.includes(key)) {
        return emoji;
      }
    }

    // Default fallback
    return '💰';
  }

  /**
   * Get all available category mappings
   * @returns {Object} - Complete emoji mapping object
   */
  getAllMappings() {
    return { ...this.emojiMap };
  }

  /**
   * Add custom category mapping
   * @param {string} categoryKey - Category key to map
   * @param {string} emoji - Emoji to associate with category
   */
  addCustomMapping(categoryKey, emoji) {
    this.emojiMap[categoryKey.toLowerCase()] = emoji;
  }

  /**
   * Get category groups for display/organization purposes
   * @returns {Object} - Categories organized by groups
   */
  getCategoryGroups() {
    return {
      'food': {
        name: 'Makanan & Minuman',
        icon: '🍽️',
        categories: ['makan', 'food', 'makanan', 'restoran', 'masak', 'jajan', 'snack', 'cemilan', 'kopi']
      },
      'transport': {
        name: 'Transportasi',
        icon: '⛽',
        categories: ['bensin', 'gas', 'bbm', 'transport', 'transportasi', 'ojek', 'grab']
      },
      'household': {
        name: 'Rumah Tangga',
        icon: '🏠',
        categories: ['rumah', 'household', 'listrik', 'belanja', 'groceries']
      },
      'fruits': {
        name: 'Buah-buahan',
        icon: '🍎',
        categories: ['buah', 'fruit', 'semangka', 'melon', 'jeruk', 'pisang', 'apel', 'mangga']
      },
      'entertainment': {
        name: 'Hiburan',
        icon: '🎮',
        categories: ['hiburan', 'entertainment', 'cinema']
      },
      'personal': {
        name: 'Kebutuhan Pribadi',
        icon: '💊',
        categories: ['kesehatan', 'health', 'pendidikan', 'education', 'pakaian', 'clothes']
      },
      'family': {
        name: 'Keluarga',
        icon: '👨‍👩‍👧‍👦',
        categories: ['nafkah', 'family', 'farah', 'anak']
      }
    };
  }
}

// Create singleton instance
const categoryService = new CategoryService();

// Export for use in other modules
window.CategoryService = CategoryService;
window.categoryService = categoryService;