// UI state management stores for DuitTrack
import { writable, type Writable } from 'svelte/store';

// Theme management
export type Theme = 'light' | 'dark' | 'system';
export const themeStore: Writable<Theme> = writable('light');

// Mobile sidebar state
export const sidebarOpenStore: Writable<boolean> = writable(false);

// Modal states
export const modalsStore = writable({
  addExpense: false,
  editExpense: false,
  addBudget: false,
  editBudget: false,
  confirmDelete: false,
  settings: false,
  onboarding: false
});

// Toast notifications
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

export const toastsStore: Writable<Toast[]> = writable([]);

// Loading states for different operations
export const loadingStatesStore = writable({
  auth: false,
  expenses: false,
  budgets: false,
  dashboard: false,
  sync: false
});

// Current page/route for navigation
export const currentPageStore: Writable<string> = writable('dashboard');

// Search and filter UI states
export const filtersOpenStore: Writable<boolean> = writable(false);

// Chart preferences
export interface ChartPreferences {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  period: 'week' | 'month' | 'quarter' | 'year';
  currency: boolean;
  animation: boolean;
}

export const chartPreferencesStore: Writable<ChartPreferences> = writable({
  type: 'bar',
  period: 'month',
  currency: true,
  animation: true
});

// Offline state
export const isOnlineStore: Writable<boolean> = writable(true);

// PWA install prompt
export const pwaInstallPromptStore: Writable<boolean> = writable(false);

// Form states
export const formStatesStore = writable({
  isDirty: false,
  isSubmitting: false,
  errors: {} as Record<string, string>
});

// UI Actions
export const uiActions = {
  // Theme actions
  setTheme: (theme: Theme) => {
    themeStore.set(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('duittrack-theme', theme);
      updateThemeClass(theme);
    }
  },

  // Sidebar actions
  toggleSidebar: () => {
    sidebarOpenStore.update(open => !open);
  },

  closeSidebar: () => {
    sidebarOpenStore.set(false);
  },

  // Modal actions
  openModal: (modalName: keyof typeof modalsStore) => {
    modalsStore.update(modals => ({ ...modals, [modalName]: true }));
  },

  closeModal: (modalName: keyof typeof modalsStore) => {
    modalsStore.update(modals => ({ ...modals, [modalName]: false }));
  },

  closeAllModals: () => {
    modalsStore.set({
      addExpense: false,
      editExpense: false,
      addBudget: false,
      editBudget: false,
      confirmDelete: false,
      settings: false,
      onboarding: false
    });
  },

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };

    toastsStore.update(toasts => [...toasts, newToast]);

    // Auto remove toast if not persistent
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        uiActions.removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    toastsStore.update(toasts => toasts.filter(toast => toast.id !== id));
  },

  clearAllToasts: () => {
    toastsStore.set([]);
  },

  // Loading state actions
  setLoading: (operation: string, loading: boolean) => {
    loadingStatesStore.update(states => ({ ...states, [operation]: loading }));
  },

  // Page navigation
  setCurrentPage: (page: string) => {
    currentPageStore.set(page);
  },

  // Filter actions
  toggleFilters: () => {
    filtersOpenStore.update(open => !open);
  },

  // Chart preferences
  updateChartPreferences: (preferences: Partial<ChartPreferences>) => {
    chartPreferencesStore.update(current => ({ ...current, ...preferences }));
  },

  // Online status
  setOnlineStatus: (online: boolean) => {
    isOnlineStore.set(online);
  },

  // PWA install
  showPWAInstallPrompt: () => {
    pwaInstallPromptStore.set(true);
  },

  hidePWAInstallPrompt: () => {
    pwaInstallPromptStore.set(false);
  },

  // Form state management
  setFormDirty: (dirty: boolean) => {
    formStatesStore.update(state => ({ ...state, isDirty: dirty }));
  },

  setFormSubmitting: (submitting: boolean) => {
    formStatesStore.update(state => ({ ...state, isSubmitting: submitting }));
  },

  setFormErrors: (errors: Record<string, string>) => {
    formStatesStore.update(state => ({ ...state, errors }));
  },

  clearFormErrors: () => {
    formStatesStore.update(state => ({ ...state, errors: {} }));
  }
};

// Theme utility function
function updateThemeClass(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

// Initialize theme from localStorage
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('duittrack-theme') as Theme || 'light';
  themeStore.set(savedTheme);
  updateThemeClass(savedTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    themeStore.update(currentTheme => {
      if (currentTheme === 'system') {
        updateThemeClass('system');
      }
      return currentTheme;
    });
  });

  // Listen for online/offline status
  window.addEventListener('online', () => uiActions.setOnlineStatus(true));
  window.addEventListener('offline', () => uiActions.setOnlineStatus(false));
  uiActions.setOnlineStatus(navigator.onLine);
}