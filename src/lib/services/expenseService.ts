// Expense service for DuitTrack
import { browser } from '$app/environment';
import type { Timestamp } from 'firebase/firestore';

/**
 * Expense interface matching Firebase structure
 */
export interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  periodId: string; // Format: YYYY-MM-DD (e.g., '2025-10-25')
  userId?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Expense service that provides CRUD operations for expenses
 */
export class ExpenseService {
  private static instance: ExpenseService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService();
    }
    return ExpenseService.instance;
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
   * Get all expenses for current user
   */
  async getAllExpenses(): Promise<Expense[]> {
    if (!browser) return [];

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { getDocs, orderBy, query } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);
      const q = query(expensesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date?.toDate ? data.date.toDate() : data.date,
          periodId: data.periodId || '',
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      });

      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get expenses for a specific period
   */
  async getExpensesByPeriod(periodId: string): Promise<Expense[]> {
    if (!browser) return [];

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { getDocs, where, orderBy, query } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);
      const q = query(
        expensesRef,
        where('periodId', '==', periodId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date?.toDate ? data.date.toDate() : data.date,
          periodId: data.periodId || periodId,
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      });

      console.log(`📊 Loaded ${expenses.length} expenses for period ${periodId}`);
      return expenses;
    } catch (error) {
      console.error('Error getting expenses by period:', error);
      throw error;
    }
  }

  /**
   * Get expenses for a specific category
   */
  async getExpensesByCategory(category: string, periodId?: string): Promise<Expense[]> {
    if (!browser) return [];

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { getDocs, where, orderBy, query } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);

      let q;
      if (periodId) {
        q = query(
          expensesRef,
          where('category', '==', category.toUpperCase()),
          where('periodId', '==', periodId),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          expensesRef,
          where('category', '==', category.toUpperCase()),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);

      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date?.toDate ? data.date.toDate() : data.date,
          periodId: data.periodId || '',
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      });

      return expenses;
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      throw error;
    }
  }

  /**
   * Add new expense
   */
  async addExpense(expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);

      // Ensure category is uppercase
      const expense = {
        ...expenseData,
        category: expenseData.category.toUpperCase(),
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(expensesRef, expense);

      console.log(`✅ Expense added: ${docRef.id} - ${expenseData.description} (Rp ${expenseData.amount.toLocaleString('id-ID')})`);

      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  /**
   * Update existing expense
   */
  async updateExpense(expenseId: string, expenseData: Partial<Expense>): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);
      const expenseRef = doc(expensesRef, expenseId);

      // Ensure category is uppercase if provided
      const updateData = {
        ...expenseData,
        ...(expenseData.category && { category: expenseData.category.toUpperCase() }),
        updatedAt: serverTimestamp()
      };

      await updateDoc(expenseRef, updateData);

      console.log(`✅ Expense updated: ${expenseId}`);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    if (!browser) throw new Error('Not in browser environment');

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { doc, deleteDoc } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);
      const expenseRef = doc(expensesRef, expenseId);

      await deleteDoc(expenseRef);

      console.log(`🗑️ Expense deleted: ${expenseId}`);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  /**
   * Calculate total spending for a period
   */
  async getTotalSpendingByPeriod(periodId: string): Promise<number> {
    const expenses = await this.getExpensesByPeriod(periodId);
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Calculate spending by category for a period
   */
  async getSpendingByCategory(periodId: string): Promise<Record<string, number>> {
    const expenses = await this.getExpensesByPeriod(periodId);
    const spending: Record<string, number> = {};

    expenses.forEach((expense) => {
      const category = expense.category.toUpperCase();
      spending[category] = (spending[category] || 0) + expense.amount;
    });

    return spending;
  }

  /**
   * Get recent expenses (limit)
   */
  async getRecentExpenses(limit: number = 5): Promise<Expense[]> {
    if (!browser) return [];

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { getDocs, orderBy, limit: firestoreLimit, query } = await import('firebase/firestore');
      const { FirebaseUtils } = await import('$lib/config/firebase');

      const expensesRef = FirebaseUtils.getUserExpensesRef(userId);
      const q = query(
        expensesRef,
        orderBy('date', 'desc'),
        firestoreLimit(limit)
      );
      const querySnapshot = await getDocs(q);

      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date?.toDate ? data.date.toDate() : data.date,
          periodId: data.periodId || '',
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      });

      return expenses;
    } catch (error) {
      console.error('Error getting recent expenses:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const expenseService = ExpenseService.getInstance();
