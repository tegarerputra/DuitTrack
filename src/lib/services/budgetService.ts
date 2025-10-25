// Budget service for DuitTrack
import { browser } from '$app/environment';
import type { Timestamp } from 'firebase/firestore';

/**
 * Category budget interface
 */
export interface CategoryBudget {
  budget: number;
  spent: number;
}

/**
 * Budget interface matching Firebase structure
 */
export interface Budget {
  id?: string;
  periodId: string; // Format: YYYY-MM-DD (e.g., '2025-10-25')
  categories: Record<string, CategoryBudget>; // { 'FOOD': {budget: 2000000, spent: 500000}, ... }
  totalBudget: number;
  totalSpent: number;
  userId?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Budget category definition
 */
export interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  defaultBudget?: number;
}

/**
 * Default budget categories for DuitTrack
 */
export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'FOOD', name: 'Makanan', emoji: '🍽️', color: '#FF6B6B', defaultBudget: 2000000 },
  { id: 'TRANSPORT', name: 'Transport', emoji: '🚗', color: '#4ECDC4', defaultBudget: 1000000 },
  { id: 'SHOPPING', name: 'Belanja', emoji: '🛍️', color: '#45B7D1', defaultBudget: 1500000 },
  { id: 'ENTERTAINMENT', name: 'Hiburan', emoji: '🎬', color: '#F39C12', defaultBudget: 800000 },
  { id: 'HEALTH', name: 'Kesehatan', emoji: '⚕️', color: '#27AE60', defaultBudget: 700000 },
  { id: 'EDUCATION', name: 'Pendidikan', emoji: '📚', color: '#8E44AD', defaultBudget: 500000 },
  { id: 'UTILITIES', name: 'Tagihan', emoji: '💡', color: '#E67E22', defaultBudget: 600000 },
  { id: 'OTHER', name: 'Lainnya', emoji: '📦', color: '#95A5A6', defaultBudget: 400000 }
];

/**
 * Budget service that provides CRUD operations for budgets
 */
export class BudgetService {
  private static instance: BudgetService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (!browser) return null;

    try {
      const { auth } = await import('$lib/config/firebase');
      return auth.currentUser?.uid || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get budget for a specific period
   */
  async getBudgetByPeriod(periodId: string): Promise<Budget | null> {
    if (!browser) return null;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { doc, getDoc } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const budgetsRef = FirebaseUtils.getUserBudgetsRef(userId);
      const budgetRef = doc(budgetsRef, periodId);
      const docSnap = await getDoc(budgetRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          periodId: data.periodId || periodId,
          categories: data.categories || {},
          totalBudget: data.totalBudget || 0,
          totalSpent: data.totalSpent || 0,
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        };
      }

      console.log(`📊 No budget found for period ${periodId}`);
      return null;
    } catch (error) {
      console.error('Error getting budget by period:', error);
      throw error;
    }
  }

  /**
   * Create or update budget for a period
   */
  async saveBudget(budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const budgetsRef = FirebaseUtils.getUserBudgetsRef(userId);
      const budgetRef = doc(budgetsRef, budgetData.periodId);

      const budget = {
        ...budgetData,
        userId,
        updatedAt: serverTimestamp()
      };

      // Check if budget exists
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(budgetRef);

      if (!docSnap.exists()) {
        // Create new budget with createdAt
        await setDoc(budgetRef, {
          ...budget,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Budget created for period ${budgetData.periodId}`);
      } else {
        // Update existing budget
        await setDoc(budgetRef, budget, { merge: true });
        console.log(`✅ Budget updated for period ${budgetData.periodId}`);
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }

  /**
   * Update category budget
   */
  async updateCategoryBudget(periodId: string, categoryId: string, amount: number): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const budget = await this.getBudgetByPeriod(periodId);

      if (!budget) {
        // Create new budget with this category
        const newBudget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          periodId,
          categories: {
            [categoryId.toUpperCase()]: { budget: amount, spent: 0 }
          },
          totalBudget: amount,
          totalSpent: 0
        };
        await this.saveBudget(newBudget);
      } else {
        // Update existing budget
        const updatedCategories = {
          ...budget.categories,
          [categoryId.toUpperCase()]: {
            ...budget.categories[categoryId.toUpperCase()],
            budget: amount
          }
        };

        const totalBudget = Object.values(updatedCategories).reduce(
          (sum, cat) => sum + cat.budget,
          0
        );

        await this.saveBudget({
          ...budget,
          categories: updatedCategories,
          totalBudget
        });
      }

      console.log(`✅ Category budget updated: ${categoryId} = Rp ${amount.toLocaleString('id-ID')}`);
    } catch (error) {
      console.error('Error updating category budget:', error);
      throw error;
    }
  }

  /**
   * Update category spending (when expense is added/updated/deleted)
   */
  async updateCategorySpending(periodId: string, categoryId: string, amount: number, operation: 'add' | 'subtract' = 'add'): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const budget = await this.getBudgetByPeriod(periodId);

      if (!budget) {
        // Create new budget with spending
        const newBudget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          periodId,
          categories: {
            [categoryId.toUpperCase()]: {
              budget: 0,
              spent: operation === 'add' ? amount : 0
            }
          },
          totalBudget: 0,
          totalSpent: operation === 'add' ? amount : 0
        };
        await this.saveBudget(newBudget);
      } else {
        // Update existing budget spending
        const categoryKey = categoryId.toUpperCase();
        const currentCategory = budget.categories[categoryKey] || { budget: 0, spent: 0 };

        const newSpent = operation === 'add'
          ? currentCategory.spent + amount
          : Math.max(0, currentCategory.spent - amount);

        const updatedCategories = {
          ...budget.categories,
          [categoryKey]: {
            ...currentCategory,
            spent: newSpent
          }
        };

        const totalSpent = Object.values(updatedCategories).reduce(
          (sum, cat) => sum + cat.spent,
          0
        );

        await this.saveBudget({
          ...budget,
          categories: updatedCategories,
          totalSpent
        });
      }

      console.log(`✅ Category spending ${operation}: ${categoryId} ${operation === 'add' ? '+' : '-'} Rp ${amount.toLocaleString('id-ID')}`);
    } catch (error) {
      console.error('Error updating category spending:', error);
      throw error;
    }
  }

  /**
   * Recalculate all spending from expenses for a period
   * This is useful to sync budget with actual expenses
   */
  async recalculateSpending(periodId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Import expense service
      const { expenseService } = await import('./expenseService');

      // Get all expenses for this period
      const expenses = await expenseService.getExpensesByPeriod(periodId);

      // Calculate spending per category
      const categorySpending: Record<string, number> = {};
      expenses.forEach((expense) => {
        const category = expense.category.toUpperCase();
        categorySpending[category] = (categorySpending[category] || 0) + expense.amount;
      });

      // Get current budget
      const budget = await this.getBudgetByPeriod(periodId);

      if (!budget) {
        console.log(`No budget found for period ${periodId}, skipping recalculation`);
        return;
      }

      // Update spending for all categories
      const updatedCategories: Record<string, CategoryBudget> = {};
      Object.keys(budget.categories).forEach((categoryId) => {
        updatedCategories[categoryId] = {
          budget: budget.categories[categoryId].budget,
          spent: categorySpending[categoryId] || 0
        };
      });

      // Also add any categories that have spending but no budget
      Object.keys(categorySpending).forEach((categoryId) => {
        if (!updatedCategories[categoryId]) {
          updatedCategories[categoryId] = {
            budget: 0,
            spent: categorySpending[categoryId]
          };
        }
      });

      const totalSpent = Object.values(updatedCategories).reduce(
        (sum, cat) => sum + cat.spent,
        0
      );

      await this.saveBudget({
        ...budget,
        categories: updatedCategories,
        totalSpent
      });

      console.log(`✅ Spending recalculated for period ${periodId}: Rp ${totalSpent.toLocaleString('id-ID')}`);
    } catch (error) {
      console.error('Error recalculating spending:', error);
      throw error;
    }
  }

  /**
   * Add a new category to budget
   */
  async addCategory(periodId: string, categoryId: string, budgetAmount: number = 0): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const budget = await this.getBudgetByPeriod(periodId);

      if (!budget) {
        // Create new budget with this category
        const newBudget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          periodId,
          categories: {
            [categoryId.toUpperCase()]: { budget: budgetAmount, spent: 0 }
          },
          totalBudget: budgetAmount,
          totalSpent: 0
        };
        await this.saveBudget(newBudget);
      } else {
        // Add category to existing budget
        const updatedCategories = {
          ...budget.categories,
          [categoryId.toUpperCase()]: { budget: budgetAmount, spent: 0 }
        };

        const totalBudget = Object.values(updatedCategories).reduce(
          (sum, cat) => sum + cat.budget,
          0
        );

        await this.saveBudget({
          ...budget,
          categories: updatedCategories,
          totalBudget
        });
      }

      console.log(`✅ Category added: ${categoryId} with budget Rp ${budgetAmount.toLocaleString('id-ID')}`);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  /**
   * Remove a category from budget
   */
  async removeCategory(periodId: string, categoryId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const budget = await this.getBudgetByPeriod(periodId);

      if (!budget) {
        console.log('No budget found, nothing to remove');
        return;
      }

      const updatedCategories = { ...budget.categories };
      delete updatedCategories[categoryId.toUpperCase()];

      const totalBudget = Object.values(updatedCategories).reduce(
        (sum, cat) => sum + cat.budget,
        0
      );

      const totalSpent = Object.values(updatedCategories).reduce(
        (sum, cat) => sum + cat.spent,
        0
      );

      await this.saveBudget({
        ...budget,
        categories: updatedCategories,
        totalBudget,
        totalSpent
      });

      console.log(`✅ Category removed: ${categoryId}`);
    } catch (error) {
      console.error('Error removing category:', error);
      throw error;
    }
  }

  /**
   * Get default categories
   */
  getDefaultCategories(): BudgetCategory[] {
    return DEFAULT_CATEGORIES;
  }

  /**
   * Initialize budget with default categories
   */
  async initializeBudgetWithDefaults(periodId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const categories: Record<string, CategoryBudget> = {};
      let totalBudget = 0;

      DEFAULT_CATEGORIES.forEach((cat) => {
        categories[cat.id] = {
          budget: cat.defaultBudget || 0,
          spent: 0
        };
        totalBudget += cat.defaultBudget || 0;
      });

      const newBudget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        periodId,
        categories,
        totalBudget,
        totalSpent: 0
      };

      await this.saveBudget(newBudget);

      console.log(`✅ Budget initialized with default categories for period ${periodId}`);
    } catch (error) {
      console.error('Error initializing budget with defaults:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const budgetService = BudgetService.getInstance();
