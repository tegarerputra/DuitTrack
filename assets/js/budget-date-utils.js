// ========================================
// Budget Date Utilities
// Handles custom budget reset dates and period calculations
// ========================================

class BudgetDateUtils {
  constructor() {
    this.defaultResetDate = 1; // Default to 1st of month (standard monthly)
  }

  /**
   * Get current budget period ID based on reset date
   * @param {number} resetDate - Day of month to reset budget (1-31)
   * @returns {string} - Budget period ID in YYYY-MM-DD format
   */
  getCurrentPeriodId(resetDate = this.defaultResetDate) {
    const today = new Date();
    const currentDay = today.getDate();

    // If we haven't reached reset date yet, we're still in previous period
    if (currentDay < resetDate) {
      // Go to previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, resetDate);
      return this.formatPeriodId(prevMonth);
    } else {
      // We're in current period starting from reset date
      const currentPeriod = new Date(today.getFullYear(), today.getMonth(), resetDate);
      return this.formatPeriodId(currentPeriod);
    }
  }

  /**
   * Get budget period start and end dates
   * @param {string} periodId - Budget period ID (YYYY-MM-DD)
   * @returns {object} - {start: Date, end: Date, displayName: string}
   */
  getPeriodDetails(periodId) {
    if (!periodId || periodId.length === 7) {
      // Legacy format YYYY-MM, convert to standard monthly
      return this.getLegacyPeriodDetails(periodId);
    }

    const startDate = new Date(periodId);
    const resetDate = startDate.getDate();

    // End date is day before reset date in next month
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, resetDate - 1);

    const displayName = this.formatPeriodDisplay(startDate, endDate);

    return {
      start: startDate,
      end: endDate,
      displayName: displayName,
      resetDate: resetDate,
      isCustom: resetDate !== 1
    };
  }

  /**
   * Handle legacy YYYY-MM format
   */
  getLegacyPeriodDetails(periodId) {
    const year = parseInt(periodId.split('-')[0]);
    const month = parseInt(periodId.split('-')[1]) - 1; // JS months are 0-indexed

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    const displayName = startDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

    return {
      start: startDate,
      end: endDate,
      displayName: displayName,
      resetDate: 1,
      isCustom: false,
      isLegacy: true
    };
  }

  /**
   * Format date for period ID
   * @param {Date} date
   * @returns {string} YYYY-MM-DD
   */
  formatPeriodId(date) {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format period display name
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {string} "Sept 2025 (25 Sept - 24 Okt)"
   */
  formatPeriodDisplay(startDate, endDate) {
    const startMonth = startDate.toLocaleDateString('id-ID', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('id-ID', { month: 'short' });
    const year = startDate.getFullYear();

    // If same month and reset date is 1st, show simple format
    if (startDate.getDate() === 1 && endDate.getDate() >= 28) {
      return startDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    }

    // Custom period format
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    const mainMonth = startMonth;
    const periodDetails = `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

    return `${mainMonth} ${year} (${periodDetails})`;
  }

  /**
   * Get all budget periods for user (for month selector)
   * @param {number} resetDate - User's reset date
   * @param {number} monthsBack - How many months back to show
   * @returns {Array} Array of period objects
   */
  getAvailablePeriods(resetDate = this.defaultResetDate, monthsBack = 12) {
    const periods = [];
    const currentPeriodId = this.getCurrentPeriodId(resetDate);
    const currentStart = new Date(currentPeriodId);

    for (let i = 0; i < monthsBack; i++) {
      const periodStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - i, resetDate);
      const periodId = this.formatPeriodId(periodStart);
      const details = this.getPeriodDetails(periodId);

      periods.push({
        id: periodId,
        displayName: details.displayName,
        start: details.start,
        end: details.end,
        isCurrent: periodId === currentPeriodId
      });
    }

    return periods;
  }

  /**
   * Check if a date is within a budget period
   * @param {Date} date
   * @param {string} periodId
   * @returns {boolean}
   */
  isDateInPeriod(date, periodId) {
    const period = this.getPeriodDetails(periodId);
    return date >= period.start && date <= period.end;
  }

  /**
   * Get next period ID
   * @param {string} currentPeriodId
   * @returns {string}
   */
  getNextPeriodId(currentPeriodId) {
    const currentPeriod = this.getPeriodDetails(currentPeriodId);
    const resetDate = currentPeriod.resetDate;

    // Next period starts on reset date of next month
    const nextStart = new Date(currentPeriod.start.getFullYear(), currentPeriod.start.getMonth() + 1, resetDate);
    return this.formatPeriodId(nextStart);
  }

  /**
   * Get previous period ID
   * @param {string} currentPeriodId
   * @returns {string}
   */
  getPreviousPeriodId(currentPeriodId) {
    const currentPeriod = this.getPeriodDetails(currentPeriodId);
    const resetDate = currentPeriod.resetDate;

    // Previous period starts on reset date of previous month
    const prevStart = new Date(currentPeriod.start.getFullYear(), currentPeriod.start.getMonth() - 1, resetDate);
    return this.formatPeriodId(prevStart);
  }

  /**
   * Get days left in current period
   * @param {string} periodId
   * @returns {number}
   */
  getDaysLeftInPeriod(periodId) {
    const period = this.getPeriodDetails(periodId);
    const today = new Date();
    const diffTime = period.end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Validate reset date
   * @param {number} resetDate
   * @returns {boolean}
   */
  isValidResetDate(resetDate) {
    return resetDate >= 1 && resetDate <= 31 && Number.isInteger(resetDate);
  }

  /**
   * Get user-friendly reset date options
   * @returns {Array} Array of reset date options
   */
  getResetDateOptions() {
    const options = [];

    // Common dates
    const commonDates = [1, 5, 10, 15, 20, 25, 30];
    const specialDates = {
      1: 'Awal Bulan (Tanggal 1)',
      5: 'Tanggal 5',
      10: 'Tanggal 10',
      15: 'Pertengahan Bulan (Tanggal 15)',
      20: 'Tanggal 20',
      25: 'Akhir Bulan (Tanggal 25)',
      30: 'Tanggal 30'
    };

    commonDates.forEach(date => {
      options.push({
        value: date,
        label: specialDates[date] || `Tanggal ${date}`,
        isCommon: true
      });
    });

    // Add remaining dates
    for (let i = 1; i <= 31; i++) {
      if (!commonDates.includes(i)) {
        options.push({
          value: i,
          label: `Tanggal ${i}`,
          isCommon: false
        });
      }
    }

    return options.sort((a, b) => a.value - b.value);
  }
}

// Initialize global utility
window.budgetDateUtils = new BudgetDateUtils();
console.log('📅 Budget Date Utils loaded');