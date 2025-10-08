/**
 * Smart Insight Generator
 * Main logic for generating personalized financial insights
 */

import type { Insight, InsightContext } from '$lib/types/insights.types';
import {
  calculateSpendingVelocity,
  analyzeCategorySpending,
  analyzeSpendingPatterns,
  compareCategorySpending,
  formatRupiah
} from './insightCalculators';
import { formatCategoryName } from './formatters';

/**
 * Generate top 3 insights based on current financial data
 */
export function generateInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];

  // 1. Check spending velocity (CRITICAL)
  const velocityInsights = generateVelocityInsights(context);
  insights.push(...velocityInsights);

  // 2. Check category overspending (HIGH PRIORITY)
  const categoryInsights = generateCategoryInsights(context);
  insights.push(...categoryInsights);

  // 3. Check spending patterns (MEDIUM)
  const patternInsights = generatePatternInsights(context);
  insights.push(...patternInsights);

  // 4. Check achievements and positive trends (LOW)
  const achievementInsights = generateAchievementInsights(context);
  insights.push(...achievementInsights);

  // 5. Comparison with previous period
  if (context.previousPeriod) {
    const comparisonInsights = generateComparisonInsights(context);
    insights.push(...comparisonInsights);
  }

  // 6. Contextual recommendations (MEDIUM-HIGH)
  const recommendationInsights = generateRecommendationInsights(context);
  insights.push(...recommendationInsights);

  // Sort by priority (highest first) and return top 3
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

/**
 * Generate spending velocity insights
 */
function generateVelocityInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];
  const velocity = calculateSpendingVelocity(context.totalBudget, context.totalSpent);

  // TOO FAST - Critical warning
  if (velocity.status === 'too-fast') {
    const daysAhead = Math.floor(velocity.difference * 30);

    insights.push({
      id: 'velocity-danger',
      type: 'danger',
      category: 'velocity',
      priority: 100,
      icon: '🔥',
      title: 'Waduh kebut-kebutan nih! 😰',
      message: `Budget bakal habis ${daysAhead} hari lebih cepat! Kurangin jadi max Rp ${formatRupiah(velocity.dailyTarget || 0)}/hari biar aman ya!`,
      actionText: 'Lihat Detail Budget',
      actionLink: '/budget',
      metadata: {
        daysAffected: daysAhead,
        amount: velocity.dailyTarget
      }
    });
  }
  // ON TRACK - Positive reinforcement
  else if (velocity.status === 'on-track') {
    insights.push({
      id: 'velocity-safe',
      type: 'success',
      category: 'velocity',
      priority: 30,
      icon: '✅',
      title: 'On track! 👌',
      message: 'Spending sesuai target nih. Good job, keep it up! 💪',
      actionText: 'Lihat Progress',
      actionLink: '/dashboard',
      metadata: {
        percentage: velocity.spentProgress * 100
      }
    });
  }
  // TOO SLOW - Potential savings
  else if (velocity.status === 'slow') {
    insights.push({
      id: 'velocity-slow',
      type: 'success',
      category: 'velocity',
      priority: 50,
      icon: '🎉',
      title: 'Hemat banget nih! 😎',
      message: `Spending di bawah target! Potensi saving Rp ${formatRupiah(velocity.projectedSavings || 0)} akhir bulan lho!`,
      actionText: 'Lihat Savings',
      actionLink: '/dashboard',
      metadata: {
        amount: velocity.projectedSavings
      }
    });
  }

  return insights;
}

/**
 * Generate category-specific insights
 */
function generateCategoryInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];

  Object.entries(context.categories).forEach(([category, data]) => {
    const analysis = analyzeCategorySpending(category, data.budget, data.spent);

    // OVER BUDGET - Critical
    if (analysis.status === 'over') {
      const overAmount = Math.abs(analysis.remaining);
      insights.push({
        id: `category-over-${category}`,
        type: 'danger',
        category: 'category',
        priority: 95,
        icon: '🚨',
        title: `${formatCategoryName(category)} kebablasan! 😱`,
        message: `Udah over Rp ${formatRupiah(overAmount)}. Coba kurangin atau adjust budget ya!`,
        actionText: 'Edit Budget',
        actionLink: `/budget?category=${category}`,
        metadata: {
          category,
          amount: overAmount,
          percentage: analysis.percentage
        }
      });
    }
    // DANGER ZONE (90-99%)
    else if (analysis.status === 'danger') {
      insights.push({
        id: `category-danger-${category}`,
        type: 'danger',
        category: 'category',
        priority: 85,
        icon: '⚠️',
        title: `${formatCategoryName(category)} hampir habis!`,
        message: `Udah ${analysis.percentage.toFixed(0)}%! Tinggal Rp ${formatRupiah(analysis.remaining)} lagi nih 😅`,
        actionText: 'Lihat Transaksi',
        actionLink: `/expenses?category=${category}`,
        metadata: {
          category,
          amount: analysis.remaining,
          percentage: analysis.percentage
        }
      });
    }
    // WARNING (75-89%)
    else if (analysis.status === 'warning') {
      insights.push({
        id: `category-warning-${category}`,
        type: 'warning',
        category: 'category',
        priority: 70,
        icon: '👀',
        title: `${formatCategoryName(category)} mulai menipis`,
        message: `${analysis.percentage.toFixed(0)}% terpakai. Hati-hati ya, jangan sampai over! 🙏`,
        actionText: 'Lihat Detail',
        actionLink: `/expenses?category=${category}`,
        metadata: {
          category,
          percentage: analysis.percentage
        }
      });
    }
  });

  return insights;
}

/**
 * Generate spending pattern insights
 */
function generatePatternInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];
  const patterns = analyzeSpendingPatterns(context.expenses);

  // Weekend spending pattern
  if (patterns.weekendSpending.isSignificant) {
    insights.push({
      id: 'pattern-weekend',
      type: 'info',
      category: 'pattern',
      priority: 40,
      icon: '🎉',
      title: 'Weekend warrior detected! 😄',
      message: `${patterns.weekendSpending.percentage.toFixed(0)}% spending kamu di weekend. Party animal ya? 🍻`,
      actionText: 'Lihat Pola Spending',
      actionLink: '/expenses',
      metadata: {
        percentage: patterns.weekendSpending.percentage,
        amount: patterns.weekendSpending.amount
      }
    });
  }

  // Long period without expense (might be forgetting to log)
  if (patterns.recentActivity.daysWithoutExpense >= 5) {
    insights.push({
      id: 'pattern-inactive',
      type: 'info',
      category: 'pattern',
      priority: 35,
      icon: '🤔',
      title: 'Lama ga ada expense nih',
      message: `Udah ${patterns.recentActivity.daysWithoutExpense} hari ga ada transaksi. Lupa input atau emang lagi puasa belanja? 😅`,
      actionText: 'Tambah Expense',
      actionLink: '/add-expense',
      metadata: {
        daysAffected: patterns.recentActivity.daysWithoutExpense
      }
    });
  }

  return insights;
}

/**
 * Generate achievement and positive insights
 */
function generateAchievementInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];

  // Check if all categories are under control
  const allCategoriesSafe = Object.values(context.categories).every(
    cat => cat.budget > 0 && (cat.spent / cat.budget) < 0.75
  );

  if (allCategoriesSafe && context.totalBudget > 0) {
    insights.push({
      id: 'achievement-all-safe',
      type: 'success',
      category: 'achievement',
      priority: 25,
      icon: '🏆',
      title: 'Semua kategori terkendali! 🎊',
      message: 'Keren! Semua budget masih di bawah 75%. Budget master nih! 👑',
      actionText: 'Lihat Budget',
      actionLink: '/budget'
    });
  }

  return insights;
}

/**
 * Generate comparison insights with previous period
 */
function generateComparisonInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];

  if (!context.previousPeriod) return insights;

  // Overall spending comparison
  const change = context.totalSpent - context.previousPeriod.totalSpent;
  const percentage = context.previousPeriod.totalSpent > 0
    ? (change / context.previousPeriod.totalSpent) * 100
    : 0;

  // Significant decrease (good!)
  if (percentage < -15) {
    insights.push({
      id: 'comparison-decrease',
      type: 'success',
      category: 'achievement',
      priority: 60,
      icon: '📉',
      title: 'Spending turun drastis! 🎉',
      message: `Bulan ini ${Math.abs(percentage).toFixed(0)}% lebih hemat! Hemat Rp ${formatRupiah(Math.abs(change))}. Mantap! 💪`,
      actionText: 'Lihat Perbandingan',
      actionLink: '/analytics',
      metadata: {
        percentage: Math.abs(percentage),
        amount: Math.abs(change)
      }
    });
  }
  // Significant increase (warning!)
  else if (percentage > 20) {
    insights.push({
      id: 'comparison-increase',
      type: 'warning',
      category: 'pattern',
      priority: 65,
      icon: '📈',
      title: 'Spending naik nih! 👀',
      message: `Bulan ini ${percentage.toFixed(0)}% lebih boros. Naik Rp ${formatRupiah(change)}. Ada apa? 🤔`,
      actionText: 'Cek Transaksi',
      actionLink: '/expenses',
      metadata: {
        percentage,
        amount: change
      }
    });
  }

  // Category-specific comparisons
  Object.entries(context.categories).forEach(([category, data]) => {
    const previousSpent = context.previousPeriod?.categories[category] || 0;
    const comparison = compareCategorySpending(category, data.spent, previousSpent);

    if (comparison.isSignificant && comparison.percentage > 30) {
      insights.push({
        id: `comparison-category-${category}`,
        type: 'info',
        category: 'pattern',
        priority: 45,
        icon: '📊',
        title: `${formatCategoryName(category)} naik ${comparison.percentage.toFixed(0)}%`,
        message: `Spending ${formatCategoryName(category)} naik banget bulan ini. Ada kebutuhan khusus? 🤔`,
        actionText: 'Lihat Detail',
        actionLink: `/expenses?category=${category}`,
        metadata: {
          category,
          percentage: comparison.percentage,
          amount: comparison.change
        }
      });
    }
  });

  return insights;
}
