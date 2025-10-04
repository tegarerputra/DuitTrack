// ========================================
// DuitTrack - Migration Testing Utility
// Test and validate data migration functionality
// ========================================

import { DataMigrationService } from './dataMigration';
import { DataService } from '../services/dataService';
import { collection, getDocs, doc, getDoc, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

interface MigrationTestResult {
  success: boolean;
  testResults: {
    legacyDataCheck: {
      hasExpenses: boolean;
      expenseCount: number;
      hasBudgets: boolean;
      budgetCount: number;
      hasUserProfile: boolean;
    };
    migrationExecution: {
      success: boolean;
      migrated: {
        transactions: number;
        categories: number;
        periods: number;
        userProfile: boolean;
      };
      errors: string[];
      duration: number;
    };
    dataValidation: {
      transactionIntegrity: boolean;
      categoryMapping: boolean;
      periodConsistency: boolean;
      dataCompletion: number; // percentage
    };
  };
  recommendations: string[];
  logs: string[];
}

export class MigrationTester {
  private userId: string;
  private migrationService: DataMigrationService;
  private dataService: DataService;
  private testLogs: string[] = [];

  constructor(userId: string) {
    this.userId = userId;
    this.migrationService = new DataMigrationService(userId);
    this.dataService = new DataService(userId);
  }

  /**
   * Run comprehensive migration test
   */
  async runMigrationTest(): Promise<MigrationTestResult> {
    this.testLogs = [];
    this.log('🧪 Starting migration test for user: ' + this.userId);

    const result: MigrationTestResult = {
      success: false,
      testResults: {
        legacyDataCheck: {
          hasExpenses: false,
          expenseCount: 0,
          hasBudgets: false,
          budgetCount: 0,
          hasUserProfile: false
        },
        migrationExecution: {
          success: false,
          migrated: {
            transactions: 0,
            categories: 0,
            periods: 0,
            userProfile: false
          },
          errors: [],
          duration: 0
        },
        dataValidation: {
          transactionIntegrity: false,
          categoryMapping: false,
          periodConsistency: false,
          dataCompletion: 0
        }
      },
      recommendations: [],
      logs: []
    };

    try {
      // Step 1: Check legacy data
      this.log('📊 Step 1: Checking legacy data...');
      result.testResults.legacyDataCheck = await this.checkLegacyData();

      // Step 2: Check if migration is needed
      const needsMigration = await this.migrationService.needsMigration();
      this.log(`🔍 Migration needed: ${needsMigration}`);

      if (!needsMigration) {
        this.log('✅ No migration needed - data already migrated');
        result.success = true;
        result.recommendations.push('Data already migrated. Consider running validation tests.');
        result.logs = this.testLogs;
        return result;
      }

      // Step 3: Execute migration
      this.log('🚀 Step 2: Executing migration...');
      const startTime = Date.now();

      const migrationResult = await this.migrationService.runMigration();

      const endTime = Date.now();
      result.testResults.migrationExecution = {
        ...migrationResult,
        duration: endTime - startTime
      };

      // Step 4: Validate migrated data
      this.log('✅ Step 3: Validating migration results...');
      result.testResults.dataValidation = await this.validateMigrationResults();

      // Step 5: Generate recommendations
      result.recommendations = this.generateRecommendations(result.testResults);

      // Determine overall success
      result.success =
        migrationResult.success &&
        result.testResults.dataValidation.dataCompletion >= 80;

      this.log(`🎯 Migration test completed. Success: ${result.success}`);

    } catch (error) {
      this.log(`❌ Migration test failed: ${error}`);
      result.testResults.migrationExecution.errors.push(`Test failed: ${error}`);
    }

    result.logs = this.testLogs;
    return result;
  }

  /**
   * Check existing legacy data
   */
  private async checkLegacyData(): Promise<MigrationTestResult['testResults']['legacyDataCheck']> {
    const result = {
      hasExpenses: false,
      expenseCount: 0,
      hasBudgets: false,
      budgetCount: 0,
      hasUserProfile: false
    };

    try {
      // Check expenses
      const expensesSnapshot = await getDocs(
        query(collection(db, 'users', this.userId, 'expenses'), limit(1))
      );
      result.hasExpenses = !expensesSnapshot.empty;

      if (result.hasExpenses) {
        const allExpensesSnapshot = await getDocs(collection(db, 'users', this.userId, 'expenses'));
        result.expenseCount = allExpensesSnapshot.size;
      }

      // Check budgets
      const budgetsSnapshot = await getDocs(
        query(collection(db, 'users', this.userId, 'budgets'), limit(1))
      );
      result.hasBudgets = !budgetsSnapshot.empty;

      if (result.hasBudgets) {
        const allBudgetsSnapshot = await getDocs(collection(db, 'users', this.userId, 'budgets'));
        result.budgetCount = allBudgetsSnapshot.size;
      }

      // Check user profile
      const userDoc = await getDoc(doc(db, 'users', this.userId));
      result.hasUserProfile = userDoc.exists();

      this.log(`📊 Legacy data check:
        - Expenses: ${result.expenseCount} records
        - Budgets: ${result.budgetCount} records
        - User profile: ${result.hasUserProfile ? 'exists' : 'missing'}`);

    } catch (error) {
      this.log(`❌ Error checking legacy data: ${error}`);
    }

    return result;
  }

  /**
   * Validate migration results
   */
  private async validateMigrationResults(): Promise<MigrationTestResult['testResults']['dataValidation']> {
    const result = {
      transactionIntegrity: false,
      categoryMapping: false,
      periodConsistency: false,
      dataCompletion: 0
    };

    try {
      let validationScore = 0;
      const totalChecks = 4;

      // Check transaction integrity
      const transactions = await this.dataService.getTransactions({}, { limit: 1000 });
      const validTransactions = transactions.filter(t =>
        t.amount > 0 &&
        t.categoryId &&
        t.periodId &&
        t.date
      );

      result.transactionIntegrity = validTransactions.length === transactions.length;
      if (result.transactionIntegrity) validationScore++;

      this.log(`💳 Transaction integrity: ${validTransactions.length}/${transactions.length} valid`);

      // Check category mapping
      const categories = await this.dataService.getCategories();
      const categoriesWithNames = categories.filter(c => c.name && c.displayName);

      result.categoryMapping = categoriesWithNames.length === categories.length;
      if (result.categoryMapping) validationScore++;

      this.log(`📂 Category mapping: ${categoriesWithNames.length}/${categories.length} valid`);

      // Check period consistency
      const periods = await this.dataService.getPeriods();
      const validPeriods = periods.filter(p =>
        p.startDate &&
        p.endDate &&
        p.name
      );

      result.periodConsistency = validPeriods.length === periods.length;
      if (result.periodConsistency) validationScore++;

      this.log(`📅 Period consistency: ${validPeriods.length}/${periods.length} valid`);

      // Check data completeness
      const expectedDataPoints = [
        transactions.length > 0,
        categories.length > 0,
        periods.length > 0
      ];

      const completedDataPoints = expectedDataPoints.filter(Boolean).length;
      if (completedDataPoints === expectedDataPoints.length) validationScore++;

      result.dataCompletion = Math.round((validationScore / totalChecks) * 100);

      this.log(`📊 Data validation score: ${validationScore}/${totalChecks} (${result.dataCompletion}%)`);

    } catch (error) {
      this.log(`❌ Error validating migration results: ${error}`);
    }

    return result;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(testResults: MigrationTestResult['testResults']): string[] {
    const recommendations: string[] = [];

    const { legacyDataCheck, migrationExecution, dataValidation } = testResults;

    // Legacy data recommendations
    if (!legacyDataCheck.hasExpenses && !legacyDataCheck.hasBudgets) {
      recommendations.push('No legacy data found. Consider setting up fresh data structure.');
    }

    if (legacyDataCheck.expenseCount > 1000) {
      recommendations.push('Large dataset detected. Consider running migration in batches.');
    }

    // Migration execution recommendations
    if (migrationExecution.errors.length > 0) {
      recommendations.push('Migration completed with errors. Review error logs and consider re-running specific components.');
    }

    if (migrationExecution.duration > 30000) { // 30 seconds
      recommendations.push('Migration took longer than expected. Consider optimizing for production deployment.');
    }

    // Data validation recommendations
    if (!dataValidation.transactionIntegrity) {
      recommendations.push('Transaction data integrity issues detected. Verify amount and category mappings.');
    }

    if (!dataValidation.categoryMapping) {
      recommendations.push('Category mapping issues detected. Check category name standardization.');
    }

    if (!dataValidation.periodConsistency) {
      recommendations.push('Period consistency issues detected. Verify date range calculations.');
    }

    if (dataValidation.dataCompletion < 80) {
      recommendations.push('Data completion below 80%. Consider investigating missing data and re-running migration.');
    }

    if (dataValidation.dataCompletion >= 95) {
      recommendations.push('Excellent migration results! Ready to proceed with component migration.');
    }

    return recommendations;
  }

  /**
   * Generate detailed migration report
   */
  async generateMigrationReport(): Promise<string> {
    const testResult = await this.runMigrationTest();

    const report = `
# DuitTrack Migration Test Report
**User ID:** ${this.userId}
**Test Date:** ${new Date().toLocaleDateString('id-ID')}
**Overall Status:** ${testResult.success ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}

## Legacy Data Analysis
- **Expenses:** ${testResult.testResults.legacyDataCheck.expenseCount} records
- **Budgets:** ${testResult.testResults.legacyDataCheck.budgetCount} records
- **User Profile:** ${testResult.testResults.legacyDataCheck.hasUserProfile ? 'Found' : 'Missing'}

## Migration Execution
- **Duration:** ${testResult.testResults.migrationExecution.duration}ms
- **Transactions Created:** ${testResult.testResults.migrationExecution.migrated.transactions}
- **Categories Created:** ${testResult.testResults.migrationExecution.migrated.categories}
- **Periods Created:** ${testResult.testResults.migrationExecution.migrated.periods}
- **Errors:** ${testResult.testResults.migrationExecution.errors.length}

## Data Validation
- **Transaction Integrity:** ${testResult.testResults.dataValidation.transactionIntegrity ? '✅' : '❌'}
- **Category Mapping:** ${testResult.testResults.dataValidation.categoryMapping ? '✅' : '❌'}
- **Period Consistency:** ${testResult.testResults.dataValidation.periodConsistency ? '✅' : '❌'}
- **Data Completion:** ${testResult.testResults.dataValidation.dataCompletion}%

## Recommendations
${testResult.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Logs
${testResult.logs.map(log => `${log}`).join('\n')}
`;

    return report;
  }

  /**
   * Quick migration health check
   */
  async quickHealthCheck(): Promise<{
    migrationNeeded: boolean;
    dataStatus: 'healthy' | 'needs_attention' | 'critical';
    summary: string;
  }> {
    try {
      const needsMigration = await this.migrationService.needsMigration();

      if (needsMigration) {
        return {
          migrationNeeded: true,
          dataStatus: 'needs_attention',
          summary: 'Migration required. Legacy data detected but new structure missing.'
        };
      }

      // Quick validation of migrated data
      const [transactions, categories, periods] = await Promise.all([
        this.dataService.getTransactions({}, { limit: 10 }),
        this.dataService.getCategories(),
        this.dataService.getPeriods()
      ]);

      const hasData = transactions.length > 0 || categories.length > 0 || periods.length > 0;

      if (!hasData) {
        return {
          migrationNeeded: false,
          dataStatus: 'critical',
          summary: 'No data found in new or old structure. Fresh setup required.'
        };
      }

      return {
        migrationNeeded: false,
        dataStatus: 'healthy',
        summary: 'Migration completed successfully. Data available in new structure.'
      };

    } catch (error) {
      return {
        migrationNeeded: false,
        dataStatus: 'critical',
        summary: `Health check failed: ${error}`
      };
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.testLogs.push(logMessage);
    console.log(logMessage);
  }

  /**
   * Get migration logs
   */
  getMigrationLogs(): string[] {
    return [...this.migrationService.getMigrationLog(), ...this.testLogs];
  }
}

// Export utility function for easy testing
export async function testMigrationForUser(userId: string): Promise<MigrationTestResult> {
  const tester = new MigrationTester(userId);
  return await tester.runMigrationTest();
}

export async function generateMigrationReportForUser(userId: string): Promise<string> {
  const tester = new MigrationTester(userId);
  return await tester.generateMigrationReport();
}