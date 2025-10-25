// Navigation context store for smart navigation and state preservation
import { writable, derived, type Writable } from 'svelte/store';
import { navigating } from '$app/stores';

export interface NavigationContext {
  currentPage: string;
  returnPath: string | null;
  scrollPositions: Record<string, number>;
  filters: Record<string, any>;
  breadcrumbs: Array<{ label: string; path: string }>;
  previousPage: string | null;
}

export interface PageState {
  scrollY: number;
  filters: Record<string, any>;
  searchQuery: string;
  selectedCategory: string;
  formData: Record<string, any>;
  lastVisited: number;
}

// Main navigation store
export const navigationStore: Writable<NavigationContext> = writable({
  currentPage: '',
  returnPath: null,
  scrollPositions: {},
  filters: {},
  breadcrumbs: [],
  previousPage: null
});

// Page state store for preserving individual page states
export const pageStateStore: Writable<Record<string, PageState>> = writable({});

// Current page derived store
export const currentPageStore = derived(
  navigationStore,
  ($navigation) => $navigation.currentPage
);

// Return path derived store
export const returnPathStore = derived(
  navigationStore,
  ($navigation) => $navigation.returnPath
);

// Breadcrumbs derived store
export const breadcrumbsStore = derived(
  navigationStore,
  ($navigation) => $navigation.breadcrumbs
);

// Navigation history for smart back functionality
export const navigationHistoryStore: Writable<string[]> = writable([]);

// Page metadata for better navigation experience
export interface PageMetadata {
  title: string;
  icon: string;
  description?: string;
  requiresAuth: boolean;
  showInMenu: boolean;
  parentPage?: string;
}

export const pageMetadata: Record<string, PageMetadata> = {
  '/': {
    title: 'Landing',
    icon: '🏠',
    description: 'Welcome to DuitTrack',
    requiresAuth: false,
    showInMenu: false
  },
  '/onboarding': {
    title: 'Onboarding',
    icon: '🎯',
    description: 'Get started with DuitTrack',
    requiresAuth: true,
    showInMenu: false
  },
  '/dashboard': {
    title: 'Dashboard',
    icon: '📊',
    description: 'Financial overview',
    requiresAuth: true,
    showInMenu: true
  },
  '/add-expense': {
    title: 'Add Expense',
    icon: '➕',
    description: 'Record new expense',
    requiresAuth: true,
    showInMenu: false,
    parentPage: '/dashboard'
  },
  '/expenses': {
    title: 'Expense History',
    icon: '💸',
    description: 'View and manage expenses',
    requiresAuth: true,
    showInMenu: true
  },
  '/budget': {
    title: 'Budget Management',
    icon: '💰',
    description: 'Manage budget categories',
    requiresAuth: true,
    showInMenu: true
  },
  '/reports': {
    title: 'Reports & Analytics',
    icon: '📈',
    description: 'Financial insights',
    requiresAuth: true,
    showInMenu: true
  },
  '/settings': {
    title: 'Settings',
    icon: '⚙️',
    description: 'App settings',
    requiresAuth: true,
    showInMenu: true
  }
};

// Navigation actions
export const navigationActions = {
  // Set current page
  setCurrentPage: (page: string, returnPath?: string) => {
    navigationStore.update(nav => {
      const previousPage = nav.currentPage;
      return {
        ...nav,
        previousPage: previousPage || null,
        currentPage: page,
        returnPath: returnPath || null
      };
    });

    // Update navigation history
    navigationHistoryStore.update(history => {
      const newHistory = [...history];
      if (newHistory[newHistory.length - 1] !== page) {
        newHistory.push(page);
        // Keep only last 10 pages in history
        return newHistory.slice(-10);
      }
      return history;
    });
  },

  // Set return path for smart navigation
  setReturnPath: (path: string | null) => {
    navigationStore.update(nav => ({
      ...nav,
      returnPath: path
    }));
  },

  // Update scroll position for current page
  updateScrollPosition: (page: string, position: number) => {
    navigationStore.update(nav => ({
      ...nav,
      scrollPositions: {
        ...nav.scrollPositions,
        [page]: position
      }
    }));
  },

  // Get scroll position for page
  getScrollPosition: (page: string): number => {
    let scrollPosition = 0;
    navigationStore.subscribe(nav => {
      scrollPosition = nav.scrollPositions[page] || 0;
    })();
    return scrollPosition;
  },

  // Update page filters
  updatePageFilters: (page: string, filters: Record<string, any>) => {
    navigationStore.update(nav => ({
      ...nav,
      filters: {
        ...nav.filters,
        [page]: filters
      }
    }));
  },

  // Get page filters
  getPageFilters: (page: string): Record<string, any> => {
    let filters = {};
    navigationStore.subscribe(nav => {
      filters = nav.filters[page] || {};
    })();
    return filters;
  },

  // Update breadcrumbs
  updateBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => {
    navigationStore.update(nav => ({
      ...nav,
      breadcrumbs
    }));
  },

  // Generate breadcrumbs from current page
  generateBreadcrumbs: (currentPage: string): Array<{ label: string; path: string }> => {
    const breadcrumbs = [];
    const metadata = pageMetadata[currentPage];

    if (metadata?.parentPage && pageMetadata[metadata.parentPage]) {
      const parentMetadata = pageMetadata[metadata.parentPage];
      breadcrumbs.push({
        label: parentMetadata.title,
        path: metadata.parentPage
      });
    }

    if (metadata) {
      breadcrumbs.push({
        label: metadata.title,
        path: currentPage
      });
    }

    return breadcrumbs;
  },

  // Save page state
  savePageState: (page: string, state: Partial<PageState>) => {
    pageStateStore.update(pageStates => ({
      ...pageStates,
      [page]: {
        scrollY: 0,
        filters: {},
        searchQuery: '',
        selectedCategory: '',
        formData: {},
        lastVisited: Date.now(),
        ...pageStates[page],
        ...state
      }
    }));
  },

  // Get page state
  getPageState: (page: string): PageState | null => {
    let state = null;
    pageStateStore.subscribe(pageStates => {
      state = pageStates[page] || null;
    })();
    return state;
  },

  // Clear page state
  clearPageState: (page: string) => {
    pageStateStore.update(pageStates => {
      const newStates = { ...pageStates };
      delete newStates[page];
      return newStates;
    });
  },

  // Smart back navigation
  goBack: (fallbackPath = '/dashboard'): string => {
    let backPath = fallbackPath;

    navigationStore.subscribe(nav => {
      if (nav.returnPath) {
        backPath = nav.returnPath;
      } else if (nav.previousPage && nav.previousPage !== nav.currentPage) {
        backPath = nav.previousPage;
      }
    })();

    return backPath;
  },

  // Get navigation history
  getNavigationHistory: (): string[] => {
    let history: string[] = [];
    navigationHistoryStore.subscribe(h => {
      history = [...h];
    })();
    return history;
  },

  // Clear navigation history
  clearNavigationHistory: () => {
    navigationHistoryStore.set([]);
  },

  // Check if page exists in metadata
  isValidPage: (page: string): boolean => {
    return page in pageMetadata;
  },

  // Get page metadata
  getPageMetadata: (page: string): PageMetadata | null => {
    return pageMetadata[page] || null;
  },

  // Get menu items (pages that should show in navigation menu)
  getMenuItems: (): Array<{ path: string; metadata: PageMetadata }> => {
    return Object.entries(pageMetadata)
      .filter(([_, metadata]) => metadata.showInMenu)
      .map(([path, metadata]) => ({ path, metadata }));
  },

  // Context-aware navigation with parameters
  navigateWithContext: (
    targetPage: string,
    params: Record<string, string> = {},
    preserveReturn = true
  ): string => {
    const searchParams = new URLSearchParams();

    // Add provided parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });

    // Add return path if preserveReturn is true
    if (preserveReturn) {
      navigationStore.subscribe(nav => {
        if (nav.currentPage && nav.currentPage !== targetPage) {
          searchParams.append('return', nav.currentPage);
        }
      })();
    }

    const queryString = searchParams.toString();
    return queryString ? `${targetPage}?${queryString}` : targetPage;
  },

  // Parse navigation context from URL
  parseNavigationContext: (url: URL): { returnPath?: string; filters: Record<string, any> } => {
    const returnPath = url.searchParams.get('return') || undefined;
    const filters: Record<string, any> = {};

    // Parse common filter parameters
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const period = url.searchParams.get('period');
    const onboarding = url.searchParams.get('onboarding');

    if (category) filters.category = category;
    if (search) filters.search = search;
    if (period) filters.period = period;
    if (onboarding) filters.onboarding = onboarding === 'true';

    return { returnPath, filters };
  },

  // Restore scroll position with smooth scrolling
  restoreScrollPosition: (page: string, smooth = true) => {
    const position = navigationActions.getScrollPosition(page);
    if (position > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: position,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }, 100); // Small delay to ensure DOM is ready
    }
  },

  // Save current scroll position
  saveCurrentScrollPosition: (page: string) => {
    const position = window.scrollY || document.documentElement.scrollTop;
    navigationActions.updateScrollPosition(page, position);
  }
};

// Helper function to build navigation URL with context
export function buildNavigationURL(
  targetPage: string,
  context: {
    return?: string;
    category?: string;
    search?: string;
    period?: string;
    onboarding?: boolean;
    [key: string]: any;
  } = {}
): string {
  const params = new URLSearchParams();

  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${targetPage}?${queryString}` : targetPage;
}

// Helper function to extract page name from path
export function getPageNameFromPath(path: string): string {
  // Remove leading slash and any query parameters
  const cleanPath = path.split('?')[0];
  return cleanPath === '' || cleanPath === '/' ? '/' : cleanPath;
}

// Navigation middleware for SvelteKit
export function createNavigationMiddleware() {
  return {
    // Before navigation
    beforeNavigate: (from: string, to: string) => {
      // Save current scroll position
      if (from && from !== to) {
        navigationActions.saveCurrentScrollPosition(from);
      }
    },

    // After navigation
    afterNavigate: (page: string, url: URL) => {
      // Parse context from URL
      const { returnPath, filters } = navigationActions.parseNavigationContext(url);

      // Update navigation store
      navigationActions.setCurrentPage(page, returnPath);

      // Update page filters
      if (Object.keys(filters).length > 0) {
        navigationActions.updatePageFilters(page, filters);
      }

      // Generate and update breadcrumbs
      const breadcrumbs = navigationActions.generateBreadcrumbs(page);
      navigationActions.updateBreadcrumbs(breadcrumbs);

      // Restore scroll position for back navigation
      setTimeout(() => {
        navigationActions.restoreScrollPosition(page, false);
      }, 50);
    }
  };
}

// Page-specific loading states for instant skeleton display
export const pageLoadingState = writable<{
  isNavigating: boolean;
  targetPath: string | null;
  startTime: number | null;
}>({
  isNavigating: false,
  targetPath: null,
  startTime: null
});

// Derive loading state from SvelteKit's navigating store
navigating.subscribe(nav => {
  if (nav) {
    // Navigation started - show skeleton immediately
    pageLoadingState.set({
      isNavigating: true,
      targetPath: nav.to?.url.pathname || null,
      startTime: Date.now()
    });
  } else {
    // Navigation completed - hide skeleton
    pageLoadingState.set({
      isNavigating: false,
      targetPath: null,
      startTime: null
    });
  }
});

// Helper to check if navigating to specific page
export const isNavigatingTo = derived(
  pageLoadingState,
  $state => (path: string) => {
    return $state.isNavigating && $state.targetPath === path;
  }
);

// Global loading state (for any navigation)
export const isPageNavigating = derived(
  pageLoadingState,
  $state => $state.isNavigating
);

// Stores are already exported above with their declarations