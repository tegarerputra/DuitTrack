/**
 * Extended Insight Generator - Contextual & Predictive Insights
 * Additional insight generation functions for better user experience
 */

import type { Insight, InsightContext } from '$lib/types/insights.types';
import { formatRupiah } from './insightCalculators';
import { formatCategoryName } from './formatters';

/**
 * Generate contextual & predictive insights
 */
export function generateContextualInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Payday reminder (if approaching end of month)
  const daysUntilEndOfMonth = getDaysUntilEndOfMonth(now);
  if (daysUntilEndOfMonth <= 7 && daysUntilEndOfMonth > 0 && context.totalBudget > 0) {
    const remainingBudget = context.totalBudget - context.totalSpent;
    if (remainingBudget > 0) {
      insights.push({
        id: 'contextual-payday',
        type: 'info',
        category: 'prediction',
        priority: 55,
        icon: '💰',
        title: `Gajian tinggal ${daysUntilEndOfMonth} hari lagi!`,
        message: `Masih ada sisa Rp ${formatRupiah(remainingBudget)}. Coba hemat dulu ya biar ga bokek! 😅`,
        actionText: 'Lihat Budget',
        actionLink: '/budget',
        metadata: {
          daysAffected: daysUntilEndOfMonth,
          amount: remainingBudget
        }
      });
    } else {
      insights.push({
        id: 'contextual-payday-warning',
        type: 'warning',
        category: 'prediction',
        priority: 75,
        icon: '😰',
        title: `Gajian tinggal ${daysUntilEndOfMonth} hari!`,
        message: `Budget udah habis! Tahan nafsu belanja dulu ya. Almost there! 💪`,
        actionText: 'Lihat Pengeluaran',
        actionLink: '/expenses',
        metadata: {
          daysAffected: daysUntilEndOfMonth
        }
      });
    }
  }

  // 2. Day-of-week spending pattern
  if (context.expenses.length >= 7) {
    const dayOfWeekPattern = analyzeDayOfWeekPattern(context.expenses);
    if (dayOfWeekPattern.highestDay && dayOfWeekPattern.percentage > 25) {
      insights.push({
        id: 'contextual-dayofweek',
        type: 'info',
        category: 'pattern',
        priority: 45,
        icon: '📅',
        title: `${dayOfWeekPattern.highestDay} = Hari Boros! 😄`,
        message: `${dayOfWeekPattern.percentage.toFixed(0)}% pengeluaran kamu di ${dayOfWeekPattern.highestDay}. ${dayOfWeekPattern.message}`,
        actionText: 'Lihat Pola',
        actionLink: '/expenses',
        metadata: {
          percentage: dayOfWeekPattern.percentage,
          amount: dayOfWeekPattern.amount
        }
      });
    }
  }

  // 3. Time-based spending alert (afternoon cafe pattern)
  const currentHour = now.getHours();
  if (currentHour >= 14 && currentHour <= 17 && context.expenses.length >= 5) {
    const afternoonPattern = analyzeAfternoonSpending(context.expenses);
    if (afternoonPattern.isSignificant) {
      insights.push({
        id: 'contextual-afternoon',
        type: 'info',
        category: 'pattern',
        priority: 35,
        icon: '☕',
        title: 'Jam nge-cafe nih biasanya! 😋',
        message: `Sore-sore gini biasanya kamu belanja. Average Rp ${formatRupiah(afternoonPattern.avgAmount)}. Budget masih aman ga? 👀`,
        actionText: 'Cek Budget',
        actionLink: '/budget',
        metadata: {
          amount: afternoonPattern.avgAmount
        }
      });
    }
  }

  // 4. Weekend prediction (if Friday)
  if (now.getDay() === 5 && currentHour >= 15 && context.expenses.length >= 10 && context.totalBudget > 0) {
    const weekendPrediction = predictWeekendSpending(context.expenses, context.totalBudget, context.totalSpent);
    if (weekendPrediction.amount > 0) {
      insights.push({
        id: 'contextual-weekend-prediction',
        type: weekendPrediction.willExceedBudget ? 'warning' : 'info',
        category: 'prediction',
        priority: weekendPrediction.willExceedBudget ? 65 : 40,
        icon: '🎉',
        title: 'Weekend warrior mode ON! 🔥',
        message: `Prediksi spending weekend: Rp ${formatRupiah(weekendPrediction.amount)}. ${weekendPrediction.message}`,
        actionText: 'Lihat Budget',
        actionLink: '/budget',
        metadata: {
          amount: weekendPrediction.amount,
          percentage: weekendPrediction.percentage
        }
      });
    }
  }

  // 5. Streak insights (consecutive days without spending)
  const streakData = analyzeSpendingStreak(context.expenses);
  if (streakData.currentStreak >= 3) {
    insights.push({
      id: 'contextual-streak',
      type: 'success',
      category: 'achievement',
      priority: 30,
      icon: '🔥',
      title: `${streakData.currentStreak} hari no spending! 🎊`,
      message: `Streak hemat ${streakData.currentStreak} hari! ${streakData.currentStreak >= 7 ? 'Legend banget! 🏆' : 'Keep it up! 💪'}`,
      actionText: 'Lihat Progress',
      actionLink: '/dashboard',
      metadata: {
        daysAffected: streakData.currentStreak
      }
    });
  }

  // 6. First week spending prediction
  if (getDaysIntoMonth(now) <= 7 && context.expenses.length >= 5 && context.totalBudget > 0) {
    const firstWeekPrediction = predictMonthlyFromFirstWeek(context.expenses, context.totalBudget);
    if (firstWeekPrediction.willExceedBudget) {
      insights.push({
        id: 'contextual-firstweek-prediction',
        type: 'warning',
        category: 'prediction',
        priority: 80,
        icon: '🚨',
        title: 'Awal bulan udah ngebut nih! ⚡',
        message: `Kalo lanjut kayak gini, akhir bulan over Rp ${formatRupiah(firstWeekPrediction.projectedOverage)}! Slow down ya! 😅`,
        actionText: 'Adjust Budget',
        actionLink: '/budget',
        metadata: {
          amount: firstWeekPrediction.projectedOverage,
          percentage: firstWeekPrediction.projectedPercentage
        }
      });
    }
  }

  return insights;
}

/**
 * Generate fallback insights when no budget or expenses
 */
export function generateFallbackInsights(context: InsightContext): Insight[] {
  const insights: Insight[] = [];
  const hasExpenses = context.expenses.length > 0;
  const hasBudget = context.totalBudget > 0;

  // No budget, no expenses - Onboarding mode
  if (!hasBudget && !hasExpenses) {
    insights.push({
      id: 'fallback-welcome',
      type: 'info',
      category: 'recommendation',
      priority: 90,
      icon: '👋',
      title: 'Welcome to DuitTrack! 🎉',
      message: 'Yuk mulai track keuangan kamu! Setup budget dulu biar tau spending limit tiap kategori. Gampang kok! 😊',
      actionText: 'Setup Budget Sekarang',
      actionLink: '/budget'
    });

    insights.push({
      id: 'fallback-first-expense',
      type: 'info',
      category: 'recommendation',
      priority: 85,
      icon: '📝',
      title: 'Catat expense pertama yuk!',
      message: 'Mulai dari yang kecil. Catat jajan kopi atau makan siang hari ini. Nanti bakal keliatan pola spending-mu! ☕',
      actionText: 'Tambah Expense',
      actionLink: '/add-expense'
    });

    insights.push({
      id: 'fallback-why-track',
      type: 'success',
      category: 'recommendation',
      priority: 80,
      icon: '💡',
      title: 'Kenapa harus track expense?',
      message: 'Biar tau kemana aja duit habis! Rata-rata orang kaget pas liat spending report pertama kali lho. Penasaran ga? 🤔',
      actionText: 'Pelajari Lebih Lanjut',
      actionLink: '/dashboard'
    });

    return insights;
  }

  // Has expenses but no budget - Simple mode
  if (!hasBudget && hasExpenses) {
    const totalSpent = context.totalSpent;
    const expenseCount = context.expenses.length;
    const avgPerExpense = totalSpent / expenseCount;

    insights.push({
      id: 'fallback-setup-budget',
      type: 'warning',
      category: 'recommendation',
      priority: 95,
      icon: '💰',
      title: 'Udah tracking, belum budgeting nih!',
      message: `Kamu udah catat ${expenseCount} expenses (Total: Rp ${formatRupiah(totalSpent)}). Setup budget yuk biar bisa kontrol spending! 🎯`,
      actionText: 'Setup Budget',
      actionLink: '/budget',
      metadata: {
        amount: totalSpent
      }
    });

    insights.push({
      id: 'fallback-spending-summary',
      type: 'info',
      category: 'pattern',
      priority: 70,
      icon: '📊',
      title: 'Total spending sejauh ini',
      message: `Udah spend Rp ${formatRupiah(totalSpent)} dari ${expenseCount} transaksi. Average Rp ${formatRupiah(avgPerExpense)} per transaksi. 💸`,
      actionText: 'Lihat Detail',
      actionLink: '/expenses',
      metadata: {
        amount: totalSpent
      }
    });

    // Find most expensive category
    const categoryTotals = getCategoryTotals(context.expenses);
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        id: 'fallback-top-category',
        type: 'info',
        category: 'pattern',
        priority: 65,
        icon: '🏆',
        title: `${formatCategoryName(topCategory[0])} paling banyak!`,
        message: `Kategori ${formatCategoryName(topCategory[0])} udah Rp ${formatRupiah(topCategory[1])}. Set budget buat kategori ini yuk! 🎯`,
        actionText: 'Setup Budget',
        actionLink: '/budget',
        metadata: {
          category: topCategory[0],
          amount: topCategory[1]
        }
      });
    }

    return insights;
  }

  // Has budget but no expenses - Motivational mode
  if (hasBudget && !hasExpenses) {
    insights.push({
      id: 'fallback-start-tracking',
      type: 'info',
      category: 'recommendation',
      priority: 90,
      icon: '🚀',
      title: 'Budget ready, let\'s go! 🎉',
      message: `Budget udah diset (Total: Rp ${formatRupiah(context.totalBudget)}). Sekarang waktunya catat expenses! Mulai dari yang kecil aja dulu. 😊`,
      actionText: 'Tambah Expense',
      actionLink: '/add-expense',
      metadata: {
        amount: context.totalBudget
      }
    });

    insights.push({
      id: 'fallback-budget-tips',
      type: 'success',
      category: 'recommendation',
      priority: 75,
      icon: '💡',
      title: 'Tips: Catat setiap hari!',
      message: 'Biasain catat expense tiap abis belanja. Jangan ditunda! Nanti lupa lho. Set reminder di HP kalo perlu! ⏰',
      actionText: 'OK, Siap!',
      actionLink: '/dashboard'
    });

    insights.push({
      id: 'fallback-categories',
      type: 'info',
      category: 'recommendation',
      priority: 60,
      icon: '📋',
      title: 'Budget breakdown kamu:',
      message: `Udah set budget ${Object.keys(context.categories).length} kategori. Tinggal tracking aja sekarang! Let's make it happen! 💪`,
      actionText: 'Lihat Budget',
      actionLink: '/budget'
    });

    return insights;
  }

  // Very few expenses (< 3) - Encouragement mode
  if (hasExpenses && context.expenses.length < 3) {
    insights.push({
      id: 'fallback-keep-going',
      type: 'success',
      category: 'achievement',
      priority: 80,
      icon: '🎯',
      title: 'Good start! Keep it up! 🌟',
      message: `Udah ${context.expenses.length} expenses tercatat. Makin sering dicatat, makin keliatan pola spending-mu! Lanjutkan! 💪`,
      actionText: 'Tambah Lagi',
      actionLink: '/add-expense'
    });
  }

  return insights;
}

// ========== HELPER FUNCTIONS ==========

function getDaysUntilEndOfMonth(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const diff = lastDay.getTime() - date.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysIntoMonth(date: Date): number {
  return date.getDate();
}

function analyzeDayOfWeekPattern(expenses: any[]) {
  const dayTotals: Record<string, number> = {
    'Minggu': 0, 'Senin': 0, 'Selasa': 0, 'Rabu': 0,
    'Kamis': 0, 'Jumat': 0, 'Sabtu': 0
  };
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  expenses.forEach(exp => {
    const day = dayNames[exp.date.getDay()];
    dayTotals[day] += exp.amount;
  });

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const entries = Object.entries(dayTotals);
  const highest = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max, entries[0]);

  const percentage = totalSpent > 0 ? (highest[1] / totalSpent) * 100 : 0;

  let message = '';
  if (highest[0] === 'Sabtu' || highest[0] === 'Minggu') {
    message = 'Weekend vibes nih! 🎉';
  } else if (highest[0] === 'Jumat') {
    message = 'TGIF spending! 🍻';
  } else {
    message = 'Interesting pattern! 🤔';
  }

  return {
    highestDay: highest[0],
    amount: highest[1],
    percentage,
    message
  };
}

function analyzeAfternoonSpending(expenses: any[]) {
  const afternoonExpenses = expenses.filter(exp => {
    const hour = exp.date.getHours();
    return hour >= 14 && hour <= 17;
  });

  const totalAfternoon = afternoonExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalAll = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const percentage = totalAll > 0 ? (totalAfternoon / totalAll) * 100 : 0;

  return {
    isSignificant: percentage > 20,
    avgAmount: afternoonExpenses.length > 0 ? totalAfternoon / afternoonExpenses.length : 0,
    percentage
  };
}

function predictWeekendSpending(expenses: any[], totalBudget: number, totalSpent: number) {
  // Calculate average weekend spending from past weekends
  const weekendExpenses = expenses.filter(exp => {
    const day = exp.date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });

  const avgWeekendSpending = weekendExpenses.length > 0
    ? weekendExpenses.reduce((sum, exp) => sum + exp.amount, 0) / Math.max(1, Math.ceil(weekendExpenses.length / 2))
    : totalSpent * 0.3; // Fallback: assume 30% of spending happens on weekends

  const remaining = totalBudget - totalSpent;
  const willExceedBudget = avgWeekendSpending > remaining;

  return {
    amount: avgWeekendSpending,
    percentage: totalBudget > 0 ? (avgWeekendSpending / totalBudget) * 100 : 0,
    willExceedBudget,
    message: willExceedBudget
      ? 'Budget bakal over nih! Coba hemat dikit ya! 😅'
      : 'Masih aman kayaknya. Enjoy weekend! 🎉'
  };
}

function analyzeSpendingStreak(expenses: any[]) {
  if (expenses.length === 0) return { currentStreak: 0 };

  const sortedDates = expenses
    .map(exp => exp.date)
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if last expense was today or yesterday
  const lastExpense = new Date(sortedDates[0]);
  lastExpense.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastExpense.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff >= 1) {
    currentStreak = daysDiff;
  }

  return { currentStreak };
}

function predictMonthlyFromFirstWeek(expenses: any[], totalBudget: number) {
  if (expenses.length === 0) return { willExceedBudget: false, projectedOverage: 0, projectedPercentage: 0 };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const now = new Date();
  const daysIntoMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Project spending to end of month
  const dailyAverage = totalSpent / daysIntoMonth;
  const projectedTotal = dailyAverage * daysInMonth;
  const projectedOverage = Math.max(0, projectedTotal - totalBudget);
  const projectedPercentage = totalBudget > 0 ? (projectedTotal / totalBudget) * 100 : 0;

  return {
    willExceedBudget: projectedTotal > totalBudget,
    projectedOverage,
    projectedPercentage,
    projectedTotal
  };
}

function getCategoryTotals(expenses: any[]): Record<string, number> {
  const totals: Record<string, number> = {};
  expenses.forEach(exp => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });
  return totals;
}
