/**
 * 🎯 PERIOD UTILITIES
 *
 * Utility functions for period validation and management.
 * These functions help maintain data consistency across pages when users
 * change their budget reset date settings.
 *
 * @module periodUtils
 */

/**
 * 🎯 UTILITY: Validate if stored period matches user's reset date
 *
 * Centralized validation to avoid duplicate logic across pages.
 * Helps detect when user changes their reset date setting.
 *
 * @param storedPeriodId Stored period ID (e.g., '2025-10-25')
 * @param userResetDate User's budget reset date (1-31)
 * @returns true if period matches reset date, false if needs regeneration
 *
 * @example
 * ```typescript
 * const storedPeriod = '2025-10-25';
 * const userResetDate = 15;
 *
 * if (!validatePeriodResetDate(storedPeriod, userResetDate)) {
 *   // Reset date changed, clear stored period
 *   selectedPeriodStore.clear();
 * }
 * ```
 */
export function validatePeriodResetDate(storedPeriodId: string | null, userResetDate: number): boolean {
  if (!storedPeriodId) return false;

  // Extract day from stored period (format: YYYY-MM-DD)
  const parts = storedPeriodId.split('-');
  const storedDay = parseInt(parts[2] || '0');

  const isValid = storedDay === userResetDate;

  if (!isValid) {
    console.log(`⚠️ Period reset date mismatch: stored=${storedDay}, user=${userResetDate}`);
  }

  return isValid;
}

/**
 * 🎯 UTILITY: Get current period ID based on reset date
 *
 * Calculates the correct period ID based on user's reset date.
 * Handles month transitions correctly.
 *
 * @param resetDate User's budget reset date (1-31)
 * @returns Period ID in format 'YYYY-MM-DD'
 *
 * @example
 * ```typescript
 * // User reset date is 25th of every month
 * const periodId = getCurrentPeriodIdForResetDate(25);
 * // Returns: '2025-10-25' if today is October 19-25
 * // Returns: '2025-09-25' if today is September 26 - October 24
 * ```
 *
 * @example
 * ```typescript
 * // User reset date is 1st of every month
 * const periodId = getCurrentPeriodIdForResetDate(1);
 * // Returns: '2025-10-01' if today is October 1-31
 * // Returns: '2025-11-01' if today is November 1-30
 * ```
 */
export function getCurrentPeriodIdForResetDate(resetDate: number): string {
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Determine which month's period we're in
  let periodMonth: number;
  let periodYear: number;

  if (dayOfMonth >= resetDate) {
    // We're in the current month's period
    periodMonth = today.getMonth();
    periodYear = today.getFullYear();
  } else {
    // We're still in the previous month's period
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    periodMonth = prevMonth.getMonth();
    periodYear = prevMonth.getFullYear();
  }

  // Format: YYYY-MM-DD (e.g., '2025-10-25')
  const month = String(periodMonth + 1).padStart(2, '0');
  const day = String(resetDate).padStart(2, '0');

  return `${periodYear}-${month}-${day}`;
}
