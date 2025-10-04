// ========================================
// DuitTrack - Data Migration Script
// Migrate from old vanilla JS structure to new Svelte structure
// ========================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  Timestamp,
  query,
  where,
  limit,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, Category, Period, UserProfile } from '../types';

interface LegacyExpense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: any; // Could be Timestamp or string
  month: string; // Old format: YYYY-MM or YYYY-MM-DD
  userId: string;
  createdAt?: any;
}

interface LegacyBudget {
  id: string;
  categories: {
    [key: string]: {
      budget: number;
      spent: number;
    };
  };
  periodId?: string;
  month?: string;
  totalBudget?: number;
  updatedAt?: any;
}

interface LegacyUserProfile {
  budgetResetDate?: number;
  currency?: string;
  onboardingComplete?: boolean;
  [key: string]: any;
}

export class DataMigrationService {
  private userId: string;
  private migrationLog: string[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Run complete data migration for a user
   */
  async runMigration(): Promise<{
    success: boolean;
    migrated: {
      transactions: number;
      categories: number;
      periods: number;
      userProfile: boolean;
    };
    errors: string[];
  }> {
    this.migrationLog = [];
    this.log('Starting data migration for user: ' + this.userId);

    try {
      const result = {
        success: true,
        migrated: {
          transactions: 0,
          categories: 0,
          periods: 0,
          userProfile: false
        },
        errors: [] as string[]
      };

      // Step 1: Migrate user profile
      try {
        const profileMigrated = await this.migrateUserProfile();
        result.migrated.userProfile = profileMigrated;
        this.log(`User profile migration: ${profileMigrated ? 'SUCCESS' : 'SKIPPED'}`);
      } catch (error) {
        result.errors.push(`User profile migration failed: ${error}`);
        this.log(`User profile migration failed: ${error}`);
      }

      // Step 2: Create categories from legacy expenses
      try {
        const categoriesCount = await this.migrateCategories();
        result.migrated.categories = categoriesCount;
        this.log(`Categories migration: ${categoriesCount} categories created`);
      } catch (error) {
        result.errors.push(`Categories migration failed: ${error}`);
        this.log(`Categories migration failed: ${error}`);
      }

      // Step 3: Create periods from legacy budgets
      try {
        const periodsCount = await this.migratePeriods();
        result.migrated.periods = periodsCount;
        this.log(`Periods migration: ${periodsCount} periods created`);
      } catch (error) {
        result.errors.push(`Periods migration failed: ${error}`);
        this.log(`Periods migration failed: ${error}`);
      }

      // Step 4: Migrate expenses to transactions
      try {
        const transactionsCount = await this.migrateTransactions();
        result.migrated.transactions = transactionsCount;
        this.log(`Transactions migration: ${transactionsCount} transactions created`);
      } catch (error) {
        result.errors.push(`Transactions migration failed: ${error}`);
        this.log(`Transactions migration failed: ${error}`);
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      this.log('Migration completed');
      return result;

    } catch (error) {
      this.log(`Migration failed with error: ${error}`);
      return {
        success: false,
        migrated: {
          transactions: 0,
          categories: 0,
          periods: 0,
          userProfile: false
        },
        errors: [`Migration failed: ${error}`]
      };
    }
  }

  /**
   * Migrate user profile from legacy format
   */
  private async migrateUserProfile(): Promise<boolean> {
    try {
      const userDocRef = doc(db, 'users', this.userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        this.log('No user profile found to migrate');
        return false;
      }

      const legacyData = userDoc.data() as LegacyUserProfile;

      // Check if already migrated
      if (legacyData.version && legacyData.version >= 2) {
        this.log('User profile already migrated');
        return false;
      }

      const migratedProfile: Partial<UserProfile> = {
        resetDate: legacyData.budgetResetDate || 1,
        currency: 'IDR',
        locale: 'id-ID',
        timezone: 'Asia/Jakarta',
        onboardingComplete: legacyData.onboardingComplete || false,
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            budgetAlerts: true,
            weeklyReports: true,
            monthlyReports: true
          },
          defaultView: 'dashboard'
        },
        version: 2,
        migratedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const batch = writeBatch(db);
      batch.update(userDocRef, migratedProfile);
      await batch.commit();

      this.log('User profile migrated successfully');
      return true;

    } catch (error) {
      this.log(`User profile migration error: ${error}`);
      throw error;
    }
  }

  /**
   * Create categories from legacy expense data
   */
  private async migrateCategories(): Promise<number> {
    try {
      // Get all unique categories from legacy expenses
      const expensesSnapshot = await getDocs(collection(db, 'users', this.userId, 'expenses'));
      const uniqueCategories = new Set<string>();

      expensesSnapshot.docs.forEach(doc => {
        const expense = doc.data() as LegacyExpense;
        if (expense.category) {
          uniqueCategories.add(expense.category.toUpperCase());
        }
      });

      if (uniqueCategories.size === 0) {
        this.log('No categories found in legacy expenses');
        return 0;
      }

      // Check if categories already exist
      const categoriesSnapshot = await getDocs(collection(db, 'users', this.userId, 'categories'));
      const existingCategories = new Set(categoriesSnapshot.docs.map(doc => doc.data().name));

      const categoriesToCreate = Array.from(uniqueCategories).filter(cat => !existingCategories.has(cat));

      if (categoriesToCreate.length === 0) {
        this.log('All categories already exist');
        return 0;
      }

      // Create category mapping
      const categoryMapping = this.getCategoryMapping();

      const batch = writeBatch(db);
      let batchCount = 0;

      for (const categoryName of categoriesToCreate) {
        const categoryData: Omit<Category, 'id'> = {
          name: categoryName,
          displayName: categoryMapping[categoryName] || categoryName,
          type: 'expense',
          icon: this.getCategoryIcon(categoryName),
          color: this.getCategoryColor(categoryName),
          parentCategoryId: null,
          isActive: true,
          userId: this.userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const categoryRef = doc(collection(db, 'users', this.userId, 'categories'));
        batch.set(categoryRef, categoryData);
        batchCount++;

        // Firestore batch limit is 500
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      this.log(`Created ${categoriesToCreate.length} categories`);
      return categoriesToCreate.length;

    } catch (error) {
      this.log(`Categories migration error: ${error}`);
      throw error;
    }
  }

  /**
   * Create periods from legacy budget data
   */
  private async migratePeriods(): Promise<number> {
    try {
      // Get all budget documents
      const budgetsSnapshot = await getDocs(collection(db, 'users', this.userId, 'budgets'));

      if (budgetsSnapshot.empty) {
        this.log('No legacy budgets found');
        return 0;
      }

      // Check if periods already exist
      const periodsSnapshot = await getDocs(collection(db, 'users', this.userId, 'periods'));
      const existingPeriods = new Set(periodsSnapshot.docs.map(doc => doc.id));

      const batch = writeBatch(db);
      let batchCount = 0;
      let createdCount = 0;

      for (const budgetDoc of budgetsSnapshot.docs) {
        const budgetData = budgetDoc.data() as LegacyBudget;
        const periodId = budgetDoc.id;

        if (existingPeriods.has(periodId)) {
          continue; // Skip existing periods
        }

        // Parse period dates from ID
        const { startDate, endDate } = this.parsePeriodId(periodId);

        const periodData: Omit<Period, 'id'> = {
          name: this.formatPeriodName(startDate, endDate),
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          status: this.isPeriodActive(startDate, endDate) ? 'active' : 'archived',
          summary: {
            totalIncome: 0,
            totalExpenses: 0,
            totalBudget: budgetData.totalBudget || 0,
            categoryBreakdown: {},
            transactionCount: 0
          },
          userId: this.userId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const periodRef = doc(db, 'users', this.userId, 'periods', periodId);
        batch.set(periodRef, periodData);
        batchCount++;
        createdCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      this.log(`Created ${createdCount} periods`);
      return createdCount;

    } catch (error) {
      this.log(`Periods migration error: ${error}`);
      throw error;
    }
  }

  /**
   * Migrate legacy expenses to new transaction structure
   */
  private async migrateTransactions(): Promise<number> {
    try {
      // Get all legacy expenses
      const expensesSnapshot = await getDocs(collection(db, 'users', this.userId, 'expenses'));

      if (expensesSnapshot.empty) {
        this.log('No legacy expenses found');
        return 0;
      }

      // Get category mapping for IDs
      const categoriesSnapshot = await getDocs(collection(db, 'users', this.userId, 'categories'));
      const categoryMap = new Map<string, string>();
      categoriesSnapshot.docs.forEach(doc => {
        categoryMap.set(doc.data().name, doc.id);
      });

      // Check if transactions already exist
      const transactionsSnapshot = await getDocs(collection(db, 'users', this.userId, 'transactions'));
      const existingTransactions = new Set(transactionsSnapshot.docs.map(doc => doc.data().legacyId));

      const batch = writeBatch(db);
      let batchCount = 0;
      let createdCount = 0;

      for (const expenseDoc of expensesSnapshot.docs) {
        const expense = expenseDoc.data() as LegacyExpense;

        if (existingTransactions.has(expenseDoc.id)) {
          continue; // Skip existing transactions
        }

        // Convert to new transaction format
        const categoryId = categoryMap.get(expense.category?.toUpperCase()) || 'unknown';
        const periodId = this.normalizePeriodId(expense.month);

        const transactionData: Omit<Transaction, 'id'> = {
          amount: expense.amount || 0,
          type: 'expense',
          categoryId,
          periodId,
          description: expense.description || '',
          date: this.normalizeDate(expense.date),
          metadata: {
            legacyId: expenseDoc.id,
            legacyCategory: expense.category,
            migrated: true
          },
          userId: this.userId,
          createdAt: expense.createdAt ? Timestamp.fromDate(new Date(expense.createdAt)) : Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, 'users', this.userId, 'transactions'));
        batch.set(transactionRef, transactionData);
        batchCount++;
        createdCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      this.log(`Created ${createdCount} transactions`);
      return createdCount;

    } catch (error) {
      this.log(`Transactions migration error: ${error}`);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private parsePeriodId(periodId: string): { startDate: Date; endDate: Date } {
    if (periodId.length === 7) {
      // YYYY-MM format
      const [year, month] = periodId.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      return { startDate, endDate };
    } else if (periodId.length === 10) {
      // YYYY-MM-DD format
      const startDate = new Date(periodId);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      return { startDate, endDate };
    } else {
      // Fallback to current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate, endDate };
    }
  }

  private normalizePeriodId(legacyMonth: string): string {
    if (!legacyMonth) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    if (legacyMonth.length === 7) {
      // YYYY-MM -> YYYY-MM-01
      return `${legacyMonth}-01`;
    }

    return legacyMonth;
  }

  private normalizeDate(date: any): Timestamp {
    if (!date) {
      return Timestamp.now();
    }

    if (date.toDate && typeof date.toDate === 'function') {
      return date; // Already a Timestamp
    }

    if (typeof date === 'string') {
      return Timestamp.fromDate(new Date(date));
    }

    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }

    return Timestamp.now();
  }

  private isPeriodActive(startDate: Date, endDate: Date): boolean {
    const now = new Date();
    return now >= startDate && now <= endDate;
  }

  private formatPeriodName(startDate: Date, endDate: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return startDate.toLocaleDateString('id-ID', options);
    } else {
      return `${startDate.toLocaleDateString('id-ID', { month: 'short' })} - ${endDate.toLocaleDateString('id-ID', options)}`;
    }
  }

  private getCategoryMapping(): { [key: string]: string } {
    return {
      'FOOD': 'Makanan',
      'SNACK': 'Jajan',
      'HOUSEHOLD': 'Rumah Tangga',
      'FRUIT': 'Buah-buahan',
      'TRANSPORT': 'Transportasi',
      'ENTERTAINMENT': 'Hiburan',
      'HEALTH': 'Kesehatan',
      'EDUCATION': 'Pendidikan',
      'SHOPPING': 'Belanja',
      'BILLS': 'Tagihan',
      'OTHER': 'Lainnya',
      'BELANJA': 'Belanja',
      'TRANS': 'Transportasi'
    };
  }

  private getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'FOOD': '🍽️',
      'SNACK': '🍿',
      'HOUSEHOLD': '🏠',
      'FRUIT': '🍎',
      'TRANSPORT': '🚗',
      'ENTERTAINMENT': '🎬',
      'HEALTH': '🏥',
      'EDUCATION': '📚',
      'SHOPPING': '🛍️',
      'BILLS': '📄',
      'OTHER': '💰',
      'BELANJA': '🛍️',
      'TRANS': '🚗'
    };
    return icons[category] || '💰';
  }

  private getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'FOOD': '#FF6B6B',
      'SNACK': '#4ECDC4',
      'HOUSEHOLD': '#45B7D1',
      'FRUIT': '#96CEB4',
      'TRANSPORT': '#FFEAA7',
      'ENTERTAINMENT': '#DDA0DD',
      'HEALTH': '#98D8C8',
      'EDUCATION': '#F7DC6F',
      'SHOPPING': '#BB8FCE',
      'BILLS': '#F8C471',
      'OTHER': '#AED6F1',
      'BELANJA': '#BB8FCE',
      'TRANS': '#FFEAA7'
    };
    return colors[category] || '#AED6F1';
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.migrationLog.push(logMessage);
    console.log(logMessage);
  }

  /**
   * Get migration log
   */
  getMigrationLog(): string[] {
    return [...this.migrationLog];
  }

  /**
   * Check if user data needs migration
   */
  async needsMigration(): Promise<boolean> {
    try {
      // Check if user has new structure (transactions collection)
      const transactionsSnapshot = await getDocs(
        query(collection(db, 'users', this.userId, 'transactions'), limit(1))
      );

      // Check if user has old structure (expenses collection)
      const expensesSnapshot = await getDocs(
        query(collection(db, 'users', this.userId, 'expenses'), limit(1))
      );

      // Needs migration if has old data but no new data
      return !transactionsSnapshot.empty === false && !expensesSnapshot.empty === true;
    } catch (error) {
      this.log(`Error checking migration status: ${error}`);
      return false;
    }
  }
}