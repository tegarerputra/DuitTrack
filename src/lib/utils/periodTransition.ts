/**
 * Period Transition Logic for Budget Reset Date Changes
 *
 * This module handles the complex logic of transitioning from one reset date to another,
 * ensuring data integrity and smooth user experience.
 */

import type { Period } from '$lib/types';
import {
	generatePeriods,
	formatPeriodDisplay,
	getDaysInMonth,
	type PeriodGeneratorConfig
} from './periodHelpers';

/**
 * Result of a reset date change operation
 */
export interface TransitionPeriodResult {
	/** The original current period before the change */
	originalPeriod: Period;
	/** The transition period (current period closed early) */
	transitionPeriod: Period;
	/** The new period starting with the new reset date */
	newPeriod: Period;
	/** IDs of all affected periods */
	affectedPeriodIds: string[];
	/** Summary message for user feedback */
	summary: string;
}

/**
 * History record of a reset date change
 */
export interface ResetDateChangeHistory {
	id?: string;
	userId: string;
	oldResetDate: number;
	newResetDate: number;
	oldResetType: 'fixed' | 'last-day-of-month';
	newResetType: 'fixed' | 'last-day-of-month';
	changedAt: Date;
	affectedPeriodIds: string[];
	reason?: string;
}

/**
 * Calculate the impact of changing reset date
 */
export function calculateResetDateImpact(
	currentResetDate: number,
	currentResetType: 'fixed' | 'last-day-of-month',
	newResetDate: number,
	newResetType: 'fixed' | 'last-day-of-month'
): {
	currentPeriod: Period;
	transitionEndDate: Date;
	newPeriodStartDate: Date;
	willCloseEarly: boolean;
	daysLost: number;
} {
	const today = new Date();

	// Generate current period with old settings
	const currentPeriods = generatePeriods(currentResetDate, currentResetType, 1);
	const currentPeriod = currentPeriods[0];

	// Calculate when to close current period (day before new reset date)
	const targetMonth = today.getMonth();
	const targetYear = today.getFullYear();

	let transitionEndDate: Date;
	let newPeriodStartDate: Date;

	if (today.getDate() < newResetDate) {
		// New reset date hasn't passed this month yet
		// Close current period on (new reset date - 1)
		transitionEndDate = new Date(targetYear, targetMonth, newResetDate - 1, 23, 59, 59);
		newPeriodStartDate = new Date(targetYear, targetMonth, newResetDate);
	} else {
		// New reset date has already passed this month
		// Close current period on next month's (new reset date - 1)
		transitionEndDate = new Date(targetYear, targetMonth + 1, newResetDate - 1, 23, 59, 59);
		newPeriodStartDate = new Date(targetYear, targetMonth + 1, newResetDate);
	}

	// Handle last day of month
	if (newResetType === 'last-day-of-month') {
		const lastDay = getDaysInMonth(new Date(targetYear, targetMonth + 1));
		transitionEndDate = new Date(targetYear, targetMonth + 1, lastDay - 1, 23, 59, 59);
		newPeriodStartDate = new Date(targetYear, targetMonth + 1, lastDay);
	}

	const willCloseEarly = transitionEndDate < currentPeriod.endDate;
	const daysLost = willCloseEarly
		? Math.ceil((currentPeriod.endDate.getTime() - transitionEndDate.getTime()) / (1000 * 60 * 60 * 24))
		: 0;

	return {
		currentPeriod,
		transitionEndDate,
		newPeriodStartDate,
		willCloseEarly,
		daysLost
	};
}

/**
 * Execute the reset date change and return the transition result
 *
 * This function:
 * 1. Closes the current period early
 * 2. Creates a transition period marker
 * 3. Generates the new period with new reset date
 * 4. Returns all affected period information
 */
export function executeResetDateChange(
	userId: string,
	currentResetDate: number,
	currentResetType: 'fixed' | 'last-day-of-month',
	newResetDate: number,
	newResetType: 'fixed' | 'last-day-of-month'
): TransitionPeriodResult {
	const impact = calculateResetDateImpact(
		currentResetDate,
		currentResetType,
		newResetDate,
		newResetType
	);

	const { currentPeriod, transitionEndDate, newPeriodStartDate } = impact;

	// Create transition period (current period closed early)
	const transitionPeriod: Period = {
		...currentPeriod,
		endDate: transitionEndDate,
		isTransition: true,
		note: `Period closed early due to reset date change from ${getResetDateDisplay(currentResetDate, currentResetType)} to ${getResetDateDisplay(newResetDate, newResetType)}`
	};

	// Generate new period with new reset date
	const newPeriods = generatePeriods(newResetDate, newResetType, 1);
	const newPeriod: Period = {
		...newPeriods[0],
		startDate: newPeriodStartDate,
		isTransition: true,
		resetDate: newResetDate,
		note: `First period with new reset date: ${getResetDateDisplay(newResetDate, newResetType)}`
	};

	// Recalculate new period end date based on actual start
	const nextResetDate = getNextResetDate(newPeriodStartDate, newResetDate, newResetType);
	newPeriod.endDate = new Date(nextResetDate);
	newPeriod.endDate.setDate(newPeriod.endDate.getDate() - 1);
	newPeriod.endDate.setHours(23, 59, 59, 999);

	const summary = impact.willCloseEarly
		? `Period saat ini akan ditutup pada ${formatDate(transitionEndDate)}. Period baru dimulai ${formatDate(newPeriodStartDate)} dengan reset date ${getResetDateDisplay(newResetDate, newResetType)}.`
		: `Period baru dimulai ${formatDate(newPeriodStartDate)} dengan reset date ${getResetDateDisplay(newResetDate, newResetType)}.`;

	return {
		originalPeriod: currentPeriod,
		transitionPeriod,
		newPeriod,
		affectedPeriodIds: [currentPeriod.id, newPeriod.id],
		summary
	};
}

/**
 * Get the next reset date from a given date
 */
function getNextResetDate(
	fromDate: Date,
	resetDate: number,
	resetType: 'fixed' | 'last-day-of-month'
): Date {
	if (resetType === 'last-day-of-month') {
		const nextMonth = new Date(fromDate);
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		const lastDay = getDaysInMonth(nextMonth);
		return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), lastDay);
	}

	const next = new Date(fromDate);
	next.setMonth(next.getMonth() + 1);

	// Handle edge case where reset date > days in month
	const daysInMonth = getDaysInMonth(next);
	const actualDate = Math.min(resetDate, daysInMonth);

	return new Date(next.getFullYear(), next.getMonth(), actualDate);
}

/**
 * Create a history record of the reset date change
 */
export function createResetDateChangeHistory(
	userId: string,
	oldResetDate: number,
	newResetDate: number,
	oldResetType: 'fixed' | 'last-day-of-month',
	newResetType: 'fixed' | 'last-day-of-month',
	affectedPeriodIds: string[],
	reason?: string
): ResetDateChangeHistory {
	return {
		userId,
		oldResetDate,
		newResetDate,
		oldResetType,
		newResetType,
		changedAt: new Date(),
		affectedPeriodIds,
		reason
	};
}

/**
 * Validate reset date change
 * Returns error message if invalid, null if valid
 */
export function validateResetDateChange(
	currentResetDate: number,
	currentResetType: 'fixed' | 'last-day-of-month',
	newResetDate: number,
	newResetType: 'fixed' | 'last-day-of-month'
): string | null {
	// Check if there's actually a change
	if (currentResetDate === newResetDate && currentResetType === newResetType) {
		return 'Tidak ada perubahan reset date.';
	}

	// Validate new reset date range
	if (newResetType === 'fixed' && (newResetDate < 1 || newResetDate > 31)) {
		return 'Reset date harus antara 1-31.';
	}

	// All validations passed
	return null;
}

/**
 * Check if user has pending period transitions
 */
export function hasPendingTransitions(periods: Period[]): boolean {
	return periods.some((p) => p.isTransition === true);
}

/**
 * Get all transition periods for a user
 */
export function getTransitionPeriods(periods: Period[]): Period[] {
	return periods.filter((p) => p.isTransition === true);
}

/**
 * Format reset date for display
 */
function getResetDateDisplay(
	resetDate: number,
	resetType: 'fixed' | 'last-day-of-month'
): string {
	if (resetType === 'last-day-of-month') {
		return 'akhir bulan';
	}
	return `tanggal ${resetDate}`;
}

/**
 * Format date for Indonesian display
 */
function formatDate(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	};
	return date.toLocaleDateString('id-ID', options);
}

/**
 * Calculate budget recalculation requirements after reset date change
 */
export interface BudgetRecalculationNeeds {
	needsRecalculation: boolean;
	affectedPeriods: string[];
	reason: string;
}

export function calculateBudgetRecalculationNeeds(
	transitionResult: TransitionPeriodResult
): BudgetRecalculationNeeds {
	return {
		needsRecalculation: true,
		affectedPeriods: transitionResult.affectedPeriodIds,
		reason:
			'Budget needs to be recalculated for transition period and new period due to reset date change.'
	};
}

/**
 * Generate preview message for reset date change
 */
export function generateChangePreviewMessage(
	currentResetDate: number,
	currentResetType: 'fixed' | 'last-day-of-month',
	newResetDate: number,
	newResetType: 'fixed' | 'last-day-of-month'
): {
	title: string;
	description: string;
	warnings: string[];
	benefits: string[];
} {
	const impact = calculateResetDateImpact(
		currentResetDate,
		currentResetType,
		newResetDate,
		newResetType
	);

	const warnings: string[] = [];
	const benefits: string[] = [];

	if (impact.willCloseEarly) {
		warnings.push(`Period saat ini akan ditutup ${impact.daysLost} hari lebih awal`);
		warnings.push('Budget untuk period saat ini akan direset');
	}

	benefits.push(`Period baru akan dimulai setiap ${getResetDateDisplay(newResetDate, newResetType)}`);
	benefits.push('Semua data historis tetap aman dan tidak berubah');

	return {
		title: 'Perubahan Reset Date Budget',
		description: `Mengubah reset date dari ${getResetDateDisplay(currentResetDate, currentResetType)} ke ${getResetDateDisplay(newResetDate, newResetType)}`,
		warnings,
		benefits
	};
}

/**
 * Utility: Check if reset date change is safe (no active transactions in transition period)
 */
export function isResetDateChangeSafe(
	transactionCount: number,
	budgetAmount: number
): {
	isSafe: boolean;
	warnings: string[];
} {
	const warnings: string[] = [];

	if (transactionCount > 0) {
		warnings.push(`Ada ${transactionCount} transaksi yang akan terpengaruh`);
	}

	if (budgetAmount > 0) {
		warnings.push(`Budget senilai Rp ${budgetAmount.toLocaleString('id-ID')} akan direset`);
	}

	return {
		isSafe: transactionCount === 0 && budgetAmount === 0,
		warnings
	};
}