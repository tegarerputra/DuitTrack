/**
 * Formatting Utilities
 * Centralized formatting functions for consistent UI display
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Category Icons Mapping
 */
const CATEGORY_ICONS: Record<string, string> = {
  'FOOD': '🍽️',
  'SNACK': '🍿',
  'HOUSEHOLD': '🏠',
  'FRUIT': '🍎',
  'TRANSPORT': '🚗',
  'ENTERTAINMENT': '🎬',
  'HEALTH': '🏥',
  'EDUCATION': '📚',
  'SHOPPING': '🛍️',
  'BILLS': '💰',
  'OTHER': '📦',
};

/**
 * Playful Category Icons (Indonesian-focused)
 */
const PLAYFUL_CATEGORY_ICONS: Record<string, string> = {
  'FOOD': '🍜',
  'SNACK': '🧋',
  'HOUSEHOLD': '🏡',
  'FRUIT': '🥭',
  'TRANSPORT': '🏍️',
  'ENTERTAINMENT': '🎮',
  'HEALTH': '💊',
  'EDUCATION': '📖',
  'SHOPPING': '🛒',
  'BILLS': '📱',
  'OTHER': '✨',
};

/**
 * Category Name Translations (Indonesian)
 */
const CATEGORY_NAMES: Record<string, string> = {
  'FOOD': 'Makanan',
  'SNACK': 'Jajan',
  'HOUSEHOLD': 'Rumah Tangga',
  'FRUIT': 'Buah-buahan',
  'TRANSPORT': 'Transportasi',
  'ENTERTAINMENT': 'Hiburan',
  'HEALTH': 'Kesehatan',
  'EDUCATION': 'Pendidikan',
  'SHOPPING': 'Belanja',
  'BILLS': 'Tagihan',
  'OTHER': 'Lainnya',
};

/**
 * Playful Category Messages
 */
const PLAYFUL_CATEGORY_MESSAGES: Record<string, string> = {
  'FOOD': 'Makan enak dong! 😋',
  'SNACK': 'Jajan lagi nih 🤤',
  'TRANSPORT': 'Gas poll! 🏍️💨',
  'ENTERTAINMENT': 'Me time dulu 🎬',
  'SHOPPING': 'Belanja therapeutic 🛍️',
  'BILLS': 'Bayar tagihan dulu 💸',
  'OTHER': 'Ada apa nih? 🤔',
};

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category?.toUpperCase()] || '💰';
}

/**
 * Get playful category icon
 */
export function getPlayfulCategoryIcon(category: string): string {
  return PLAYFUL_CATEGORY_ICONS[category?.toUpperCase()] || '💫';
}

/**
 * Format category name to Indonesian
 */
export function formatCategoryName(category: string): string {
  return CATEGORY_NAMES[category?.toUpperCase()] || category || 'Lainnya';
}

/**
 * Get playful category message
 */
export function getPlayfulCategoryMessage(category: string): string {
  return PLAYFUL_CATEGORY_MESSAGES[category?.toUpperCase()] || 'Pengeluaran baru 💫';
}

/**
 * Format date to Indonesian format
 */
export function formatDate(date: Date | Timestamp): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateObj.toDateString() === today.toDateString()) return 'Hari ini';
  if (dateObj.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | Timestamp): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  return dateObj.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative date (e.g., "2 hari lalu")
 */
export function formatRelativeDate(date: Date | Timestamp): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  const today = new Date();
  const diffTime = today.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}

/**
 * Format period display
 */
export function formatPeriodLabel(periodId: string): string {
  const [year, month] = periodId.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Date | Timestamp | any): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Fallback: try to parse as string or return current date
  return new Date(timestamp || Date.now());
}
