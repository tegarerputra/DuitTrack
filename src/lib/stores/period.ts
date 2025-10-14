/**
 * Shared Period Store with localStorage persistence
 *
 * This store manages the currently selected tracking period across all pages.
 * The selected period is persisted in localStorage so it remains consistent
 * when navigating between Dashboard, Budget, and Expense pages.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'duittrack_selected_period';

// Get initial period from localStorage or default to empty string
function getInitialPeriod(): string {
  if (!browser) return '';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || '';
  } catch (error) {
    console.error('Error reading period from localStorage:', error);
    return '';
  }
}

// Create the store
function createSelectedPeriodStore() {
  const { subscribe, set, update } = writable<string>(getInitialPeriod());

  return {
    subscribe,
    set: (value: string) => {
      set(value);
      // Persist to localStorage
      if (browser) {
        try {
          localStorage.setItem(STORAGE_KEY, value);
          console.log('📅 Period saved to localStorage:', value);
        } catch (error) {
          console.error('Error saving period to localStorage:', error);
        }
      }
    },
    update,
    clear: () => {
      set('');
      if (browser) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error('Error clearing period from localStorage:', error);
        }
      }
    }
  };
}

// Export the store
export const selectedPeriodStore = createSelectedPeriodStore();

// Helper to check if a period ID is currently selected
export function isCurrentPeriodSelected(): boolean {
  if (!browser) return false;

  const stored = localStorage.getItem(STORAGE_KEY);
  return !stored || stored === '';
}
