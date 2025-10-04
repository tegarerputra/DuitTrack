// Period helper utilities for flexible tracking periods
// Supports custom reset dates and handles edge cases

import type { Period } from '$lib/types';

export interface PeriodGeneratorConfig {
  resetDate: number; // 1-31 or -1 for last day of month
  resetType: 'fixed' | 'last-day-of-month';
}

/**
 * Generate multiple periods based on configuration
 * @param config - Period generation configuration
 * @param count - Number of periods to generate (default: 6)
 * @returns Array of periods, sorted from most recent to oldest
 */
export function generatePeriods(config: PeriodGeneratorConfig, count: number = 6): Period[] {
  const periods: Period[] = [];
  const today = new Date();

  // Generate current and past periods
  for (let i = 0; i < count; i++) {
    const period = generateSinglePeriod(today, config, -i);
    periods.push(period);
  }

  return periods;
}

/**
 * Generate a single period relative to a reference date
 * @param referenceDate - Base date for calculation
 * @param config - Period generation configuration
 * @param monthOffset - Offset in months (negative for past periods)
 */
function generateSinglePeriod(
  referenceDate: Date,
  config: PeriodGeneratorConfig,
  monthOffset: number
): Period {
  const { resetDate, resetType } = config;

  // Calculate the target month
  const targetDate = new Date(referenceDate);
  targetDate.setMonth(targetDate.getMonth() + monthOffset);

  let periodStart: Date;
  let periodEnd: Date;

  if (resetType === 'last-day-of-month') {
    // Period: Last day of month to last day of next month
    periodStart = getLastDayOfMonth(
      targetDate.getFullYear(),
      targetDate.getMonth() - 1
    );
    periodEnd = getLastDayOfMonth(
      targetDate.getFullYear(),
      targetDate.getMonth()
    );
  } else {
    // Fixed date reset
    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();

    // Handle case where resetDate exceeds days in month (e.g., 31 in February)
    const adjustedResetDate = Math.min(
      resetDate,
      getDaysInMonth(new Date(currentYear, currentMonth, 1))
    );

    periodStart = new Date(currentYear, currentMonth, adjustedResetDate);

    // Calculate end date (day before next reset date)
    const nextMonth = currentMonth + 1;
    const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const normalizedNextMonth = nextMonth > 11 ? 0 : nextMonth;

    const adjustedNextResetDate = Math.min(
      resetDate,
      getDaysInMonth(new Date(nextYear, normalizedNextMonth, 1))
    );

    periodEnd = new Date(nextYear, normalizedNextMonth, adjustedNextResetDate - 1);
  }

  // Set time to start/end of day
  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(23, 59, 59, 999);

  const id = formatPeriodId(periodStart);
  const displayName = formatPeriodDisplay(periodStart, periodEnd);
  const isCurrent = isCurrentPeriod(periodStart, periodEnd);

  return {
    id,
    startDate: periodStart,
    endDate: periodEnd,
    month: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`,
    userId: '', // Will be set by the service
    isActive: isCurrent,
    createdAt: new Date()
  };
}

/**
 * Check if a period is the current period
 */
export function isCurrentPeriod(start: Date, end: Date): boolean {
  const now = new Date();
  return now >= start && now <= end;
}

/**
 * Format period ID (YYYY-MM-DD format of start date)
 */
export function formatPeriodId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format period display name
 * Examples: "25 Jan - 24 Feb 2025", "1 Jan - 31 Jan 2025"
 */
export function formatPeriodDisplay(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();

  const startMonth = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(start);
  const endMonth = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(end);

  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    // Same month: "1 - 31 Jan 2025"
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    // Different months: "25 Jan - 24 Feb 2025"
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
}

/**
 * Format period range for display
 * Example: "25 Januari 2025 - 24 Februari 2025"
 */
export function formatPeriodRange(start: Date, end: Date): string {
  const startFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(start);

  const endFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(end);

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get last day of month as a Date object
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Handle reset date that exceeds days in target month
 * Example: Reset date 31 in February returns Feb 28/29
 */
export function handleResetDateExceedsDaysInMonth(
  resetDate: number,
  targetMonth: Date
): Date {
  const daysInMonth = getDaysInMonth(targetMonth);
  const adjustedDay = Math.min(resetDate, daysInMonth);

  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    adjustedDay
  );
}

/**
 * Get current period based on user's reset date configuration
 */
export function getCurrentPeriod(config: PeriodGeneratorConfig): Period {
  const periods = generatePeriods(config, 3); // Generate 3 periods to ensure we catch current
  const currentPeriod = periods.find(p => p.isActive);

  if (!currentPeriod) {
    // Fallback to first period if none are current (shouldn't happen)
    return periods[0];
  }

  return currentPeriod;
}

/**
 * Get period by ID from generated periods
 */
export function getPeriodById(config: PeriodGeneratorConfig, periodId: string): Period | null {
  const periods = generatePeriods(config, 12); // Search in 12 periods
  return periods.find(p => p.id === periodId) || null;
}

/**
 * Calculate days remaining in current period
 */
export function getDaysRemainingInPeriod(period: Period): number {
  const now = new Date();
  const end = new Date(period.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate total days in period
 */
export function getTotalDaysInPeriod(period: Period): number {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

/**
 * Check if a date falls within a period
 */
export function isDateInPeriod(date: Date, period: Period): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const start = new Date(period.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(period.endDate);
  end.setHours(23, 59, 59, 999);

  return checkDate >= start && checkDate <= end;
}

/**
 * Get period for a specific date
 */
export function getPeriodForDate(config: PeriodGeneratorConfig, date: Date): Period {
  // Generate periods around the target date
  const periods = generatePeriods(config, 24); // 2 years worth

  const period = periods.find(p => isDateInPeriod(date, p));

  if (!period) {
    // Fallback: generate period based on date
    return generateSinglePeriod(date, config, 0);
  }

  return period;
}

/**
 * Format short period display for mobile/compact views
 * Example: "25 Jan - 24 Feb"
 */
export function formatPeriodShort(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();

  const startMonth = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(start);
  const endMonth = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(end);

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${startMonth}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
}

/**
 * Get preset options for reset date selection
 */
export function getResetDatePresets() {
  return [
    {
      value: 1,
      label: 'Awal bulan',
      description: 'Popular untuk gaji PNS',
      popular: false
    },
    {
      value: 25,
      label: 'Tanggal 25',
      description: 'Paling populer di Indonesia',
      popular: true
    }
  ];
}