// ========================================
// DuitTrack - Enhanced Data Service
// Unified data management with new structure
// ========================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Transaction,
  Category,
  Period,
  UserProfile,
  BudgetSummary,
  TransactionFilter,
  PaginationOptions
} from '../types';

export class DataService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ========================================
  // TRANSACTION MANAGEMENT
  // ========================================

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const transaction: Omit<Transaction, 'id'> = {
        ...transactionData,
        userId: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', this.userId, 'transactions'), transaction);

      // Update period summary after creating transaction
      await this.updatePeriodSummary(transactionData.periodId);

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(
    filter: TransactionFilter = {},
    pagination: PaginationOptions = { limit: 50 }
  ): Promise<Transaction[]> {
    try {
      let q = collection(db, 'users', this.userId, 'transactions');

      // Apply filters
      const constraints = [];

      if (filter.periodId) {
        constraints.push(where('periodId', '==', filter.periodId));
      }

      if (filter.categoryId) {
        constraints.push(where('categoryId', '==', filter.categoryId));
      }

      if (filter.type) {
        constraints.push(where('type', '==', filter.type));
      }

      if (filter.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filter.dateFrom)));
      }

      if (filter.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filter.dateTo)));
      }

      // Add ordering
      constraints.push(orderBy('date', 'desc'));

      // Add pagination
      if (pagination.limit) {
        constraints.push(limit(pagination.limit));
      }

      if (pagination.startAfter) {
        constraints.push(startAfter(pagination.startAfter));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw new Error(`Failed to get transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactionRef = doc(db, 'users', this.userId, 'transactions', transactionId);

      // Get old transaction for period summary updates
      const oldDoc = await getDoc(transactionRef);
      const oldTransaction = oldDoc.data() as Transaction;

      await updateDoc(transactionRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      // Update period summaries if period or amount changed
      if (updates.periodId && updates.periodId !== oldTransaction.periodId) {
        await this.updatePeriodSummary(oldTransaction.periodId);
        await this.updatePeriodSummary(updates.periodId);
      } else if (updates.amount || updates.type) {
        await this.updatePeriodSummary(oldTransaction.periodId);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const transactionRef = doc(db, 'users', this.userId, 'transactions', transactionId);

      // Get transaction for period summary update
      const transactionDoc = await getDoc(transactionRef);
      const transaction = transactionDoc.data() as Transaction;

      await deleteDoc(transactionRef);

      // Update period summary
      await this.updatePeriodSummary(transaction.periodId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================
  // CATEGORY MANAGEMENT
  // ========================================

  /**
   * Get all categories for user
   */
  async getCategories(): Promise<Category[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'users', this.userId, 'categories'),
          orderBy('name')
        )
      );

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error(`Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const category: Omit<Category, 'id'> = {
        ...categoryData,
        userId: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', this.userId, 'categories'), category);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add category budget to a specific period
   */
  async addCategoryBudgetToPeriod(periodId: string, categoryId: string, budget: number): Promise<void> {
    try {
      const periodRef = doc(db, 'users', this.userId, 'periods', periodId);
      const periodDoc = await getDoc(periodRef);

      if (!periodDoc.exists()) {
        throw new Error('Period not found');
      }

      const periodData = periodDoc.data() as Period;
      const summary = periodData.summary || {
        totalIncome: 0,
        totalExpenses: 0,
        totalBudget: 0,
        categoryBreakdown: {},
        transactionCount: 0
      };

      // Add or update category budget
      if (!summary.categoryBreakdown[categoryId]) {
        summary.categoryBreakdown[categoryId] = {
          spent: 0,
          budget: 0,
          transactionCount: 0
        };
      }

      summary.categoryBreakdown[categoryId].budget = budget;

      // Recalculate total budget
      summary.totalBudget = Object.values(summary.categoryBreakdown).reduce(
        (sum, cat) => sum + (cat.budget || 0),
        0
      );

      await updateDoc(periodRef, {
        summary,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding category budget to period:', error);
      throw new Error(`Failed to add category budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================
  // PERIOD MANAGEMENT
  // ========================================

  /**
   * Get periods for user
   */
  async getPeriods(activeOnly: boolean = false): Promise<Period[]> {
    try {
      let q = collection(db, 'users', this.userId, 'periods');

      const constraints = [orderBy('startDate', 'desc')];

      if (activeOnly) {
        constraints.push(where('status', '==', 'active'));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Period));
    } catch (error) {
      console.error('Error getting periods:', error);
      throw new Error(`Failed to get periods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new period
   */
  async createPeriod(periodData: Omit<Period, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const period: Omit<Period, 'id'> = {
        ...periodData,
        userId: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', this.userId, 'periods'), period);
      return docRef.id;
    } catch (error) {
      console.error('Error creating period:', error);
      throw new Error(`Failed to create period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update period summary with current transaction data
   */
  private async updatePeriodSummary(periodId: string): Promise<void> {
    try {
      // Get all transactions for this period
      const transactions = await this.getTransactions({ periodId }, { limit: 1000 });

      // Calculate totals
      const summary: BudgetSummary = {
        totalIncome: 0,
        totalExpenses: 0,
        totalBudget: 0,
        categoryBreakdown: {},
        transactionCount: transactions.length
      };

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          summary.totalIncome += transaction.amount;
        } else {
          summary.totalExpenses += transaction.amount;
        }

        // Update category breakdown
        if (!summary.categoryBreakdown[transaction.categoryId]) {
          summary.categoryBreakdown[transaction.categoryId] = {
            spent: 0,
            budget: 0,
            transactionCount: 0
          };
        }

        summary.categoryBreakdown[transaction.categoryId].spent += transaction.amount;
        summary.categoryBreakdown[transaction.categoryId].transactionCount++;
      });

      // Update period document
      const periodRef = doc(db, 'users', this.userId, 'periods', periodId);
      await updateDoc(periodRef, {
        summary,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating period summary:', error);
      // Don't throw here to avoid breaking transaction operations
    }
  }

  // ========================================
  // USER PROFILE MANAGEMENT
  // ========================================

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', this.userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', this.userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================
  // ANALYTICS & INSIGHTS
  // ========================================

  /**
   * Get spending analytics for a period
   */
  async getSpendingAnalytics(periodId: string): Promise<{
    dailySpending: { date: string; amount: number }[];
    categorySpending: { categoryId: string; amount: number; percentage: number }[];
    weeklyTrends: { week: string; amount: number }[];
  }> {
    try {
      const transactions = await this.getTransactions(
        { periodId, type: 'expense' },
        { limit: 1000 }
      );

      // Group by date
      const dailySpending = new Map<string, number>();
      const categorySpending = new Map<string, number>();
      let totalExpenses = 0;

      transactions.forEach(transaction => {
        const dateKey = transaction.date.toDate().toISOString().split('T')[0];

        // Daily spending
        dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + transaction.amount);

        // Category spending
        categorySpending.set(transaction.categoryId, (categorySpending.get(transaction.categoryId) || 0) + transaction.amount);

        totalExpenses += transaction.amount;
      });

      // Convert to arrays with proper formatting
      const dailySpendingArray = Array.from(dailySpending.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const categorySpendingArray = Array.from(categorySpending.entries())
        .map(([categoryId, amount]) => ({
          categoryId,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Weekly trends (simplified)
      const weeklyTrends = this.groupByWeek(dailySpendingArray);

      return {
        dailySpending: dailySpendingArray,
        categorySpending: categorySpendingArray,
        weeklyTrends
      };
    } catch (error) {
      console.error('Error getting spending analytics:', error);
      throw new Error(`Failed to get spending analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupByWeek(dailyData: { date: string; amount: number }[]): { week: string; amount: number }[] {
    const weeklyData = new Map<string, number>();

    dailyData.forEach(({ date, amount }) => {
      const dateObj = new Date(date);
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + amount);
    });

    return Array.from(weeklyData.entries())
      .map(([week, amount]) => ({ week, amount }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Batch create multiple transactions
   */
  async batchCreateTransactions(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const docIds: string[] = [];

      transactions.forEach(transactionData => {
        const docRef = doc(collection(db, 'users', this.userId, 'transactions'));
        docIds.push(docRef.id);

        const transaction: Omit<Transaction, 'id'> = {
          ...transactionData,
          userId: this.userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        batch.set(docRef, transaction);
      });

      await batch.commit();

      // Update period summaries for affected periods
      const uniquePeriods = [...new Set(transactions.map(t => t.periodId))];
      await Promise.all(uniquePeriods.map(periodId => this.updatePeriodSummary(periodId)));

      return docIds;
    } catch (error) {
      console.error('Error batch creating transactions:', error);
      throw new Error(`Failed to batch create transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}