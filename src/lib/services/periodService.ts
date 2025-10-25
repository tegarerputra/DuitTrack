// Period service for DuitTrack
// Manages period-specific data loading and synchronization
import { browser } from '$app/environment';
import { expenseService } from './expenseService';
import { budgetService } from './budgetService';
import type { Expense } from './expenseService';
import type { Budget } from './budgetService';

/**
 * Period data bundle containing expenses and budget
 */
export interface PeriodData {
  periodId: string;
  expenses: Expense[];
  budget: Budget | null;
  totalSpent: number;
  totalBudget: number;
}

/**
 * Period service that manages period-specific data loading
 */
export class PeriodService {
  private static instance: PeriodService;

  // Cache for period data
  private periodCache: Map<string, PeriodData> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): PeriodService {
    if (!PeriodService.instance) {
      PeriodService.instance = new PeriodService();
    }
    return PeriodService.instance;
  }

  /**
   * Load all data for a specific period (expenses + budget)
   */
  async loadPeriodData(periodId: string, useCache: boolean = true): Promise<PeriodData> {
    if (!browser) {
      return {
        periodId,
        expenses: [],
        budget: null,
        totalSpent: 0,
        totalBudget: 0
      };
    }

    try {
      // Check cache first
      if (useCache && this.periodCache.has(periodId)) {
        console.log(`📦 Using cached data for period ${periodId}`);
        return this.periodCache.get(periodId)!;
      }

      console.log(`🔄 Loading data for period ${periodId}...`);

      // Load expenses and budget in parallel
      const [expenses, budget] = await Promise.all([
        expenseService.getExpensesByPeriod(periodId),
        budgetService.getBudgetByPeriod(periodId)
      ]);

      // Calculate totals
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalBudget = budget?.totalBudget || 0;

      const periodData: PeriodData = {
        periodId,
        expenses,
        budget,
        totalSpent,
        totalBudget
      };

      // Cache the data
      this.periodCache.set(periodId, periodData);

      console.log(`✅ Period data loaded: ${expenses.length} expenses, total spent: Rp ${totalSpent.toLocaleString('id-ID')}`);

      return periodData;
    } catch (error) {
      console.error('Error loading period data:', error);
      throw error;
    }
  }

  /**
   * Reload period data (bypass cache)
   */
  async reloadPeriodData(periodId: string): Promise<PeriodData> {
    this.clearPeriodCache(periodId);
    return this.loadPeriodData(periodId, false);
  }

  /**
   * Clear cache for specific period
   */
  clearPeriodCache(periodId?: string): void {
    if (periodId) {
      this.periodCache.delete(periodId);
      console.log(`🗑️ Cache cleared for period ${periodId}`);
    } else {
      this.periodCache.clear();
      console.log('🗑️ All period cache cleared');
    }
  }

  /**
   * Get current period ID based on user's reset date
   */
  async getCurrentPeriodId(): Promise<string> {
    if (!browser) return '';

    try {
      // Import auth service
      const { authService } = await import('./authService');
      const { getCurrentPeriodIdForResetDate } = await import('$lib/utils/dummyData');

      // Get user profile to get reset date
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const profile = await authService.getUserProfile(user.uid);
      const resetDate = profile?.budgetResetDate || 25;

      // Calculate current period ID
      return getCurrentPeriodIdForResetDate(resetDate);
    } catch (error) {
      console.error('Error getting current period ID:', error);
      throw error;
    }
  }

  /**
   * Sync budget spending with actual expenses for a period
   * Call this after adding/updating/deleting expenses
   */
  async syncBudgetWithExpenses(periodId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      console.log(`🔄 Syncing budget with expenses for period ${periodId}...`);

      // Recalculate spending from expenses
      await budgetService.recalculateSpending(periodId);

      // Clear cache to force reload
      this.clearPeriodCache(periodId);

      console.log(`✅ Budget synced for period ${periodId}`);
    } catch (error) {
      console.error('Error syncing budget with expenses:', error);
      throw error;
    }
  }

  /**
   * Initialize a new period with default budget categories
   */
  async initializeNewPeriod(periodId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      console.log(`🆕 Initializing new period ${periodId}...`);

      // Check if budget already exists
      const existingBudget = await budgetService.getBudgetByPeriod(periodId);

      if (!existingBudget) {
        // Initialize with default categories
        await budgetService.initializeBudgetWithDefaults(periodId);
        console.log(`✅ New period ${periodId} initialized with default categories`);
      } else {
        console.log(`ℹ️ Period ${periodId} already has budget setup`);
      }
    } catch (error) {
      console.error('Error initializing new period:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for a period
   */
  async getPeriodSummary(periodId: string): Promise<{
    totalExpenses: number;
    totalSpent: number;
    totalBudget: number;
    remainingBudget: number;
    percentageUsed: number;
    categoriesOverBudget: string[];
  }> {
    const periodData = await this.loadPeriodData(periodId);

    const remainingBudget = periodData.totalBudget - periodData.totalSpent;
    const percentageUsed = periodData.totalBudget > 0
      ? (periodData.totalSpent / periodData.totalBudget) * 100
      : 0;

    // Find categories over budget
    const categoriesOverBudget: string[] = [];
    if (periodData.budget) {
      Object.entries(periodData.budget.categories).forEach(([categoryId, data]) => {
        if (data.spent > data.budget) {
          categoriesOverBudget.push(categoryId);
        }
      });
    }

    return {
      totalExpenses: periodData.expenses.length,
      totalSpent: periodData.totalSpent,
      totalBudget: periodData.totalBudget,
      remainingBudget,
      percentageUsed,
      categoriesOverBudget
    };
  }

  /**
   * Get spending by category for a period
   */
  async getCategorySpending(periodId: string): Promise<Record<string, {
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
  }>> {
    const periodData = await this.loadPeriodData(periodId);

    const categoryStats: Record<string, {
      spent: number;
      budget: number;
      remaining: number;
      percentage: number;
    }> = {};

    if (periodData.budget) {
      Object.entries(periodData.budget.categories).forEach(([categoryId, data]) => {
        const remaining = data.budget - data.spent;
        const percentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;

        categoryStats[categoryId] = {
          spent: data.spent,
          budget: data.budget,
          remaining,
          percentage
        };
      });
    }

    return categoryStats;
  }

  /**
   * Get top spending categories for a period
   */
  async getTopSpendingCategories(periodId: string, limit: number = 5): Promise<Array<{
    categoryId: string;
    spent: number;
    percentage: number;
  }>> {
    const periodData = await this.loadPeriodData(periodId);

    if (!periodData.budget) {
      return [];
    }

    const categorySpending = Object.entries(periodData.budget.categories)
      .map(([categoryId, data]) => ({
        categoryId,
        spent: data.spent,
        percentage: periodData.totalSpent > 0
          ? (data.spent / periodData.totalSpent) * 100
          : 0
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, limit);

    return categorySpending;
  }

  /**
   * Check if period has any data (expenses or budget)
   */
  async periodHasData(periodId: string): Promise<boolean> {
    const periodData = await this.loadPeriodData(periodId);
    return periodData.expenses.length > 0 || periodData.budget !== null;
  }
}

// Export singleton instance
export const periodService = PeriodService.getInstance();
