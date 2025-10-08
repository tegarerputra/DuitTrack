// Budget helper utilities for budget setup detection and management

import type { UserProfile, BudgetSummary, Period } from '$lib/types';

/**
 * Check if user has completed budget setup
 * Uses multiple methods to determine if budget is configured
 *
 * @param userProfile - User profile data
 * @param budgetData - Optional budget data to verify actual budget exists
 * @returns true if budget is set up
 */
export function checkBudgetSetup(userProfile: UserProfile | null, budgetData?: any): boolean {
  if (!userProfile) return false;

  // Method 1: Check explicit flag
  if (userProfile.hasBudgetSetup !== undefined) {
    return userProfile.hasBudgetSetup;
  }

  // Method 2: Check if budget data exists and has valid total budget
  if (budgetData && budgetData.totalBudget > 0) {
    return true;
  }

  // Default to false if no flag is set and no budget data
  return false;
}

/**
 * Check if a period has active budget
 *
 * @param periodSummary - Period summary data
 * @returns true if period has budget configured
 */
export function hasPeriodBudget(periodSummary: BudgetSummary | null): boolean {
  if (!periodSummary) return false;
  return periodSummary.totalBudget > 0;
}

/**
 * Check if user has any categories configured
 * Categories indicate budget setup intent
 *
 * @param categories - Array of budget categories
 * @returns true if user has custom categories
 */
export function hasCategories(categories: any[]): boolean {
  if (!categories || categories.length === 0) return false;

  // Check if there are non-default categories or categories with budget
  return categories.some(cat => cat.isCustom || (cat.defaultBudget && cat.defaultBudget > 0));
}

/**
 * Get budget setup status with detailed info
 *
 * @param userProfile - User profile data
 * @param periodSummary - Current period summary
 * @param categories - User categories
 * @returns Object with budget setup status and details
 */
export function getBudgetSetupStatus(
  userProfile: UserProfile | null,
  periodSummary?: BudgetSummary | null,
  categories?: any[]
): {
  isSetup: boolean;
  hasFlag: boolean;
  hasPeriodBudget: boolean;
  hasCategories: boolean;
  message: string;
} {
  const hasFlag = userProfile?.hasBudgetSetup ?? false;
  const hasBudget = periodSummary ? hasPeriodBudget(periodSummary) : false;
  const hasCats = categories ? hasCategories(categories) : false;

  const isSetup = hasFlag || hasBudget || hasCats;

  let message = '';
  if (!isSetup) {
    message = 'Budget belum diatur. Mulai setup untuk tracking lebih detail!';
  } else if (!hasFlag && (hasBudget || hasCats)) {
    message = 'Budget terdeteksi, tapi flag belum diset. Silakan update profil.';
  } else {
    message = 'Budget sudah diatur dengan baik!';
  }

  return {
    isSetup,
    hasFlag,
    hasPeriodBudget: hasBudget,
    hasCategories: hasCats,
    message
  };
}

/**
 * Calculate budget status (safe, warning, danger, over)
 *
 * @param spent - Amount spent
 * @param budget - Budget amount
 * @returns Status string
 */
export function getBudgetStatus(spent: number, budget: number): 'safe' | 'warning' | 'danger' | 'over' {
  if (budget === 0) return 'safe';

  const percentage = (spent / budget) * 100;

  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'danger';
  if (percentage >= 60) return 'warning';
  return 'safe';
}

/**
 * Get budget status color classes
 *
 * @param status - Budget status
 * @returns Tailwind CSS classes
 */
export function getBudgetStatusColor(status: 'safe' | 'warning' | 'danger' | 'over'): string {
  const colors = {
    safe: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-orange-600 bg-orange-100',
    over: 'text-red-600 bg-red-100'
  };

  return colors[status];
}

/**
 * Get budget status message in Indonesian
 *
 * @param status - Budget status
 * @returns Message string
 */
export function getBudgetStatusMessage(status: 'safe' | 'warning' | 'danger' | 'over'): string {
  const messages = {
    safe: 'Budget aman! 👍',
    warning: 'Perhatian! Budget mulai menipis ⚠️',
    danger: 'Hati-hati! Budget hampir habis 🚨',
    over: 'Budget sudah terlampaui! 💥'
  };

  return messages[status];
}

/**
 * Calculate remaining budget
 *
 * @param budget - Total budget
 * @param spent - Amount spent
 * @returns Remaining amount (can be negative)
 */
export function calculateRemaining(budget: number, spent: number): number {
  return budget - spent;
}

/**
 * Calculate budget percentage used
 *
 * @param spent - Amount spent
 * @param budget - Total budget
 * @returns Percentage (0-100+)
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round((spent / budget) * 100);
}

/**
 * Check if budget warning should be shown
 *
 * @param spent - Amount spent
 * @param budget - Total budget
 * @param warningThreshold - Percentage threshold (default: 80)
 * @returns true if warning should be shown
 */
export function shouldShowBudgetWarning(
  spent: number,
  budget: number,
  warningThreshold: number = 80
): boolean {
  if (budget === 0) return false;
  const percentage = (spent / budget) * 100;
  return percentage >= warningThreshold;
}

/**
 * Get budget warning message
 *
 * @param spent - Amount spent
 * @param budget - Total budget
 * @param categoryName - Category name (optional)
 * @returns Warning message
 */
export function getBudgetWarningMessage(
  spent: number,
  budget: number,
  categoryName?: string
): string {
  const remaining = calculateRemaining(budget, spent);
  const percentage = calculateBudgetPercentage(spent, budget);

  if (percentage >= 100) {
    const over = Math.abs(remaining);
    const category = categoryName ? ` untuk ${categoryName}` : '';
    return `Budget${category} sudah terlampaui Rp ${formatRupiah(over)}!`;
  } else if (percentage >= 80) {
    const category = categoryName ? ` ${categoryName}` : '';
    return `Budget${category} tinggal Rp ${formatRupiah(remaining)} (${100 - percentage}%)`;
  }

  return '';
}

/**
 * Format Rupiah (duplicate from utils but needed here)
 */
function formatRupiah(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const numAmount = Math.abs(Math.floor(amount));
  const formatted = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formatted;
}

/**
 * Calculate days left in current month
 */
export function calculateDaysLeft(): number {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const diffTime = endOfMonth.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate days elapsed in current month
 */
export function calculateDaysElapsed(): number {
  return Math.max(1, new Date().getDate());
}

/**
 * Calculate total days in current month
 */
export function calculateDaysInMonth(): number {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
}

/**
 * Calculate time progress percentage in current month
 */
export function calculateTimeProgress(): number {
  return (calculateDaysElapsed() / calculateDaysInMonth()) * 100;
}

/**
 * Calculate daily spending average
 */
export function calculateDailyAverage(totalSpent: number): number {
  return totalSpent / calculateDaysElapsed();
}

/**
 * Calculate monthly projection based on current spending
 */
export function calculateMonthlyProjection(totalSpent: number): number {
  const dailyAverage = calculateDailyAverage(totalSpent);
  return dailyAverage * calculateDaysInMonth();
}

/**
 * Calculate budget efficiency score (0-100)
 */
export function calculateBudgetEfficiency(
  totalBudget: number,
  totalSpent: number
): number {
  if (totalBudget <= 0) return 0;

  const spentPercentage = (totalSpent / totalBudget) * 100;
  const timeProgress = calculateTimeProgress();

  return Math.max(0, 100 - Math.abs(spentPercentage - timeProgress));
}

/**
 * Calculate savings potential
 */
export function calculateSavingsPotential(
  totalBudget: number,
  totalSpent: number
): number {
  const remaining = Math.max(0, totalBudget - totalSpent);
  const daysLeft = calculateDaysLeft();
  const currentDailyRate = calculateDailyAverage(totalSpent);
  const optimalDailyRate = totalBudget / calculateDaysInMonth();

  if (currentDailyRate >= optimalDailyRate || remaining <= 0) {
    return 0;
  }

  return Math.max(0, remaining - (currentDailyRate * daysLeft));
}

/**
 * Get playful budget status message (Indonesian)
 */
export function getPlayfulBudgetStatus(percentage: number): {
  message: string;
  emoji: string;
  variant: 'success' | 'warning' | 'danger';
} {
  if (percentage >= 100) {
    return {
      message: 'Waduh, budget habis! 😅',
      emoji: '🚨',
      variant: 'danger',
    };
  }

  if (percentage >= 90) {
    return {
      message: 'Udah mepet nih! 😰',
      emoji: '⚠️',
      variant: 'warning',
    };
  }

  if (percentage >= 70) {
    return {
      message: 'Hati-hati ya 👀',
      emoji: '🟡',
      variant: 'warning',
    };
  }

  return {
    message: 'Aman terkendali 😎',
    emoji: '✅',
    variant: 'success',
  };
}

/**
 * Aggregate budget summary from categories
 *
 * @param categories - Array of categories with budget and spent
 * @returns Aggregated budget summary
 */
export function aggregateBudgetSummary(
  categories: Array<{ budget: number; spent: number }>
): BudgetSummary {
  const totalBudget = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = calculateBudgetPercentage(totalSpent, totalBudget);
  const overBudgetCount = categories.filter(cat => cat.spent > cat.budget).length;

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    categoriesCount: categories.length,
    overBudgetCount,
    period: '' // Will be set by caller
  };
}

/**
 * Default budget categories for Indonesian users
 */
export function getDefaultBudgetCategories() {
  return [
    {
      id: 'makanan',
      name: 'Makanan & Minuman',
      icon: '🍔',
      color: '#FF6B6B',
      defaultBudget: 1500000,
      isCustom: false
    },
    {
      id: 'transportasi',
      name: 'Transportasi',
      icon: '🚗',
      color: '#4ECDC4',
      defaultBudget: 800000,
      isCustom: false
    },
    {
      id: 'belanja',
      name: 'Belanja',
      icon: '🛒',
      color: '#FFE66D',
      defaultBudget: 1000000,
      isCustom: false
    },
    {
      id: 'hiburan',
      name: 'Hiburan',
      icon: '🎬',
      color: '#A8E6CF',
      defaultBudget: 500000,
      isCustom: false
    },
    {
      id: 'tagihan',
      name: 'Tagihan',
      icon: '💳',
      color: '#FF8B94',
      defaultBudget: 1200000,
      isCustom: false
    },
    {
      id: 'kesehatan',
      name: 'Kesehatan',
      icon: '⚕️',
      color: '#C7CEEA',
      defaultBudget: 500000,
      isCustom: false
    },
    {
      id: 'lainnya',
      name: 'Lainnya',
      icon: '📦',
      color: '#B4B4B4',
      defaultBudget: 500000,
      isCustom: false
    }
  ];
}

/**
 * Get uncategorized category for simple mode
 */
export function getUncategorizedCategory() {
  return {
    id: 'uncategorized',
    name: 'Belum Dikategorikan',
    icon: '❓',
    color: '#9CA3AF',
    defaultBudget: 0,
    isCustom: false
  };
}