/**
 * Insight Calculator Utilities
 * Core calculation functions for Smart Insights generation
 */

import type {
  VelocityAnalysis,
  CategoryAnalysis,
  PatternAnalysis,
  InsightContext,
  BudgetStatus
} from '$lib/types/insights.types';

/**
 * Calculate spending velocity and determine if user is on track
 */
export function calculateSpendingVelocity(
  totalBudget: number,
  totalSpent: number
): VelocityAnalysis {
  const daysElapsed = calculateDaysElapsed();
  const totalDays = calculateDaysInMonth();

  const timeProgress = daysElapsed / totalDays;
  const spentProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const difference = spentProgress - timeProgress;

  // Determine status
  let status: 'too-fast' | 'on-track' | 'slow' = 'on-track';
  if (difference > 0.15) {
    status = 'too-fast';
  } else if (difference < -0.15) {
    status = 'slow';
  }

  // Calculate days to exhaust budget
  const dailyRate = totalSpent / daysElapsed;
  const daysToExhaust = dailyRate > 0 ? totalBudget / dailyRate : totalDays;

  // Calculate recommended daily target
  const daysRemaining = totalDays - daysElapsed;
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);
  const dailyTarget = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Calculate projected savings (if spending slower than planned)
  let projectedSavings = 0;
  if (status === 'slow' && timeProgress > 0) {
    const projectedTotal = totalSpent / timeProgress;
    projectedSavings = Math.max(0, totalBudget - projectedTotal);
  }

  // Calculate daily burn rate
  const dailyBurnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

  // Calculate projected total by end of period
  const projectedTotal = timeProgress > 0 ? totalSpent / timeProgress : totalSpent;

  return {
    timeProgress,
    spentProgress,
    difference,
    status,
    daysToExhaust: Math.floor(daysToExhaust),
    dailyTarget: Math.floor(dailyTarget),
    projectedSavings: Math.floor(projectedSavings),
    dailyBurnRate: Math.floor(dailyBurnRate),
    projectedTotal: Math.floor(projectedTotal)
  };
}

/**
 * Analyze individual category spending
 */
export function analyzeCategorySpending(
  category: string,
  budget: number,
  spent: number
): CategoryAnalysis {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  let status: 'over' | 'danger' | 'warning' | 'safe' = 'safe';
  if (percentage >= 100) {
    status = 'over';
  } else if (percentage >= 90) {
    status = 'danger';
  } else if (percentage >= 75) {
    status = 'warning';
  }

  return {
    category,
    budget,
    spent,
    percentage,
    status,
    remaining
  };
}

/**
 * Analyze spending patterns (weekend, weekday, etc.)
 */
export function analyzeSpendingPatterns(
  expenses: Array<{ amount: number; date: Date }>
): PatternAnalysis {
  if (expenses.length === 0) {
    return {
      weekendSpending: { amount: 0, percentage: 0, isSignificant: false },
      topSpendingDay: { day: 'N/A', amount: 0 },
      recentActivity: { daysWithoutExpense: 0, lastExpenseDate: null }
    };
  }

  // Calculate weekend spending
  const weekendExpenses = expenses.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });

  const weekendTotal = weekendExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const weekendPercentage = totalSpent > 0 ? (weekendTotal / totalSpent) * 100 : 0;

  // Calculate spending by day of week
  const spendingByDay: Record<number, number> = {};
  expenses.forEach(e => {
    const day = new Date(e.date).getDay();
    spendingByDay[day] = (spendingByDay[day] || 0) + e.amount;
  });

  const topDay = Object.entries(spendingByDay).reduce(
    (max, [day, amount]) => (amount > max.amount ? { day: Number(day), amount } : max),
    { day: 0, amount: 0 }
  );

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Calculate recent activity
  const sortedExpenses = [...expenses].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastExpenseDate = sortedExpenses.length > 0
    ? new Date(sortedExpenses[0].date)
    : null;

  const daysWithoutExpense = lastExpenseDate
    ? Math.floor((Date.now() - lastExpenseDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    weekendSpending: {
      amount: weekendTotal,
      percentage: weekendPercentage,
      isSignificant: weekendPercentage > 50
    },
    topSpendingDay: {
      day: dayNames[topDay.day],
      amount: topDay.amount
    },
    recentActivity: {
      daysWithoutExpense,
      lastExpenseDate
    }
  };
}

/**
 * Compare current period with previous period
 */
export function comparePeriods(
  currentSpent: number,
  previousSpent: number
): {
  change: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  const change = currentSpent - previousSpent;
  const percentage = previousSpent > 0
    ? (change / previousSpent) * 100
    : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentage > 10) {
    trend = 'increasing';
  } else if (percentage < -10) {
    trend = 'decreasing';
  }

  return { change, percentage, trend };
}

/**
 * Calculate category comparison with previous period
 */
export function compareCategorySpending(
  category: string,
  currentSpent: number,
  previousSpent: number
): {
  category: string;
  change: number;
  percentage: number;
  isSignificant: boolean;
} {
  const change = currentSpent - previousSpent;
  const percentage = previousSpent > 0
    ? (change / previousSpent) * 100
    : (currentSpent > 0 ? 100 : 0);

  return {
    category,
    change,
    percentage,
    isSignificant: Math.abs(percentage) > 20
  };
}

/**
 * Helper: Calculate days elapsed in current month
 */
function calculateDaysElapsed(): number {
  return Math.max(1, new Date().getDate());
}

/**
 * Helper: Calculate total days in current month
 */
function calculateDaysInMonth(): number {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
}

/**
 * Calculate budget status with visual indicator
 */
export function calculateBudgetStatus(
  totalBudget: number,
  totalSpent: number
): BudgetStatus {
  const daysElapsed = calculateDaysElapsed();
  const totalDays = calculateDaysInMonth();

  const timeProgress = daysElapsed / totalDays;
  const spentProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const difference = spentProgress - timeProgress;

  // Calculate percentage for display (buffer or overspend)
  const percentageDiff = Math.abs(difference * 100);

  if (difference <= 0) {
    // Spending at or below pace
    return {
      status: 'safe',
      icon: '✅',
      label: `${percentageDiff.toFixed(0)}% Safe`,
      percentage: percentageDiff
    };
  } else if (difference <= 0.15) {
    // Slightly ahead but manageable
    return {
      status: 'watch',
      icon: '⚠️',
      label: `${percentageDiff.toFixed(0)}% Watch`,
      percentage: percentageDiff
    };
  } else {
    // Significantly over pace
    return {
      status: 'over',
      icon: '🚨',
      label: `${percentageDiff.toFixed(0)}% Over`,
      percentage: percentageDiff
    };
  }
}

/**
 * Helper: Format rupiah for display
 */
export function formatRupiah(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const numAmount = Math.abs(Math.floor(amount));
  const formatted = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted;
}
