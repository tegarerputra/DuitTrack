// TypeScript type definitions for DuitTrack fintech application

import type { Timestamp } from 'firebase/firestore';

// User related types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

export interface UserProfile {
  id?: string;
  email: string;
  displayName: string;
  nickname?: string; // Custom nickname for personalization
  onboardingComplete: boolean;
  currency: string;
  locale: string;
  preferences: UserPreferences;
  // Flexible tracking period fields
  budgetResetDate: number; // 1-31 or -1 for last day of month
  budgetResetType: 'fixed' | 'last-day-of-month';
  hasBudgetSetup: boolean; // Track if user has completed budget setup
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  budgetWarnings: boolean;
  monthlyReports: boolean;
  currency: string;
  dateFormat: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

// Financial data types
export interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  userId: string;
  tags?: string[];
  attachments?: string[];
  recurring?: RecurringConfig;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Budget {
  id?: string;
  month: string; // YYYY-MM format
  categories: Record<string, CategoryBudget>;
  totalBudget: number;
  totalSpent: number;
  userId: string;
  notes?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface CategoryBudget {
  budget: number;
  spent: number;
  carryOver?: number; // From previous month
  adjustments?: number; // Manual adjustments
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBudget: number;
  isCustom?: boolean;
}

// Recurring transaction configuration
export interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N frequency units
  endDate?: Date;
  nextOccurrence?: Date;
}

// Analytics and reporting types
export interface SpendingAnalytics {
  totalSpent: number;
  categoryBreakdown: CategorySpending[];
  monthlyTrend: MonthlySpending[];
  weeklyAverage: number;
  dailyAverage: number;
  topExpenses: Expense[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  averagePerTransaction: number;
}

export interface MonthlySpending {
  month: string;
  totalSpent: number;
  totalBudget: number;
  categoryBreakdown: Record<string, number>;
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'over';
  trend: 'increasing' | 'decreasing' | 'stable';
}

// UI and component types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface Modal {
  id: string;
  component: any;
  props?: Record<string, any>;
  options?: ModalOptions;
}

export interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  backdrop?: boolean;
  keyboard?: boolean;
  center?: boolean;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'currency' | 'date' | 'select' | 'textarea';
  value: any;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule;
  error?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Chart and visualization types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled: boolean;
      mode?: 'index' | 'dataset' | 'point' | 'nearest';
    };
  };
  scales?: {
    x?: ScaleOptions;
    y?: ScaleOptions;
  };
}

export interface ScaleOptions {
  display: boolean;
  grid?: {
    display: boolean;
  };
  ticks?: {
    callback?: (value: any) => string;
  };
}

// API and data fetching types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Filter and search types
export interface ExpenseFilters {
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
  tags?: string[];
}

export interface BudgetFilters {
  month?: string;
  status?: 'safe' | 'warning' | 'danger' | 'over';
  category?: string;
}

// Export and import types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCategories?: string[];
  includeFields?: string[];
}

export interface ImportData {
  expenses?: Expense[];
  budgets?: Budget[];
  categories?: BudgetCategory[];
}

// PWA and offline types
export interface SyncStatus {
  lastSync: Date;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'expenses' | 'budgets' | 'profile';
  data: any;
  timestamp: Date;
}

// Indonesian specific types
export interface IndonesianLocale {
  currency: {
    code: 'IDR';
    symbol: 'Rp';
    name: 'Indonesian Rupiah';
  };
  dateFormat: 'DD/MM/YYYY';
  numberFormat: {
    decimal: ',';
    thousands: '.';
  };
  months: string[];
  weekdays: string[];
}

// Financial insights and recommendations
export interface FinancialInsight {
  id: string;
  type: 'spending_pattern' | 'budget_recommendation' | 'savings_opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
  createdAt: Date;
}

export interface SpendingPattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  confidence: number;
  recommendation?: string;
}

// Goal tracking
export interface FinancialGoal {
  id?: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'savings' | 'debt_reduction' | 'investment' | 'emergency_fund';
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  userId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Additional types needed for migration and services
export interface Transaction {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  userId: string;
  type: 'income' | 'expense';
  tags?: string[];
  attachments?: string[];
  recurring?: RecurringConfig;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  userId?: string;
  createdAt?: Date | Timestamp;
}

export interface Period {
  id: string;
  startDate: Date;
  endDate: Date;
  month: string; // YYYY-MM format
  userId: string;
  isActive: boolean;
  // Metadata for flexible periods
  resetDate?: number; // Store reset date used for this period
  isTransition?: boolean; // Flag if this is a transition period (due to reset date change)
  note?: string; // Explanation if abnormal period
  createdAt?: Date | Timestamp;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  categoriesCount: number;
  overBudgetCount: number;
  period: string;
}

export interface TransactionFilter {
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
  type?: 'income' | 'expense';
}

// Migration specific types
export interface MigrationTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}