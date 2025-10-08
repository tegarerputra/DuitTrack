/**
 * Smart Insights Type Definitions
 * Type definitions for the Smart Insights Widget feature
 */

export type InsightType = 'danger' | 'warning' | 'success' | 'info';
export type InsightCategory =
  | 'velocity'
  | 'category'
  | 'pattern'
  | 'achievement'
  | 'prediction'
  | 'recommendation';

/**
 * Main Insight interface
 */
export interface Insight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  priority: number;  // 0-100, higher = more important
  icon: string;      // Emoji icon
  title: string;     // Short catchy title (Very Casual Indonesian)
  message: string;   // Detailed message (Very Casual Indonesian)
  actionText: string; // CTA button text
  actionLink: string; // Navigation link
  metadata?: InsightMetadata;
}

/**
 * Metadata for additional insight information
 */
export interface InsightMetadata {
  amount?: number;
  percentage?: number;
  category?: string;
  daysAffected?: number;
  comparison?: {
    current: number;
    previous: number;
    change: number;
  };
  recommendation?: {
    fromCategory?: string;
    toCategory?: string;
    suggestedAmount?: number;
    monthlySavings?: number;
  };
}

/**
 * Insight generation context
 */
export interface InsightContext {
  totalBudget: number;
  totalSpent: number;
  categories: Record<string, { budget: number; spent: number }>;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: Date;
  }>;
  currentPeriod: string;
  previousPeriod?: {
    totalSpent: number;
    categories: Record<string, number>;
  };
}

/**
 * Spending velocity analysis result
 */
export interface VelocityAnalysis {
  timeProgress: number;      // 0-1 (percentage of month elapsed)
  spentProgress: number;      // 0-1 (percentage of budget spent)
  difference: number;         // Difference between spent and time
  status: 'too-fast' | 'on-track' | 'slow';
  daysToExhaust?: number;     // Days until budget exhausted
  dailyTarget?: number;       // Recommended daily spending
  projectedSavings?: number;  // Projected savings if trend continues
  dailyBurnRate?: number;     // Current average spending per day
  projectedTotal?: number;    // Projected total spending by end of period
}

/**
 * Category analysis result
 */
export interface CategoryAnalysis {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  status: 'over' | 'danger' | 'warning' | 'safe';
  remaining: number;
}

/**
 * Spending pattern analysis
 */
export interface PatternAnalysis {
  weekendSpending: {
    amount: number;
    percentage: number;
    isSignificant: boolean;
  };
  topSpendingDay: {
    day: string;
    amount: number;
  };
  recentActivity: {
    daysWithoutExpense: number;
    lastExpenseDate: Date | null;
  };
}

/**
 * Budget status with visual indicator
 */
export interface BudgetStatus {
  status: 'safe' | 'watch' | 'over';
  icon: string;
  label: string;
  percentage: number; // Buffer or overspend percentage
}