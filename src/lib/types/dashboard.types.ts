/**
 * Dashboard Type Definitions
 * Centralized type definitions for dashboard components
 */

import type { Timestamp } from 'firebase/firestore';

export type BudgetStatus = 'safe' | 'warning' | 'danger';
export type InsightType = 'success' | 'warning' | 'danger' | 'info';
export type SpendingTrend = 'Increasing ⬆️' | 'Decreasing ⬇️' | 'Stable ➡️';

export interface DashboardMetrics {
  totalBudget: number;
  totalSpent: number;
  percentage: number;
  remaining: number;
  budgetStatus: BudgetStatus;
  todaySpending: number;
}

export interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  budget: number;
  spent: number;
}

export interface CategoryAttention {
  category: string;
  percentage: number;
  spent: number;
  budget: number;
  status: 'warning' | 'danger';
}

export interface BudgetData {
  categories: Record<string, { budget: number; spent: number }>;
  totalBudget: number;
  totalSpent: number;
  month: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date | Timestamp;
  userId: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

export interface SmartInsight {
  type: InsightType;
  icon: string;
  title: string;
  description: string;
  priority: number;
}

export interface FinancialMetrics {
  dailyAverage: number;
  monthlyProjection: number;
  budgetEfficiency: number;
  savingsPotential: number;
  spendingTrend: SpendingTrend;
  goalProgress: number;
}

export interface PlayfulBudgetStatus {
  message: string;
  emoji: string;
  variant: 'success' | 'warning' | 'danger';
}

export interface Period {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}