# Technical Architecture

## Technology Stack
- **Frontend**: Vite + Svelte + TypeScript
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Google Sign-In)
- **Hosting**: Custom domain
- **Design System**: Mobile-first, card-based UI

## Component Architecture
```
src/lib/components/
├── budget/
│   ├── CategoryCard.svelte
│   ├── ProgressBar.svelte
│   └── BudgetInsights.svelte
├── charts/
│   ├── DailySpendingChart.svelte
│   ├── ChartTooltip.svelte
│   └── ChartLegend.svelte
├── inputs/
│   ├── RupiahInput.svelte
│   ├── SearchInput.svelte
│   └── CategoryFilter.svelte
├── navigation/
│   ├── SmartNavigation.svelte
│   ├── NavigationDropdown.svelte
│   └── BreadcrumbNav.svelte
├── financial/
│   ├── TransactionCard.svelte
│   ├── SecurityIndicators.svelte
│   └── TrustBadges.svelte
└── layout/
    ├── MobileContainer.svelte
    ├── StickyHeader.svelte
    └── FloatingActions.svelte
```

## Database Schema
```javascript
users/{userId}/
├── profile: {
    name,
    email,
    photoURL,
    createdAt
}
├── budgets/
│   ├── 2025-09/: {
│       makanan: 800000,
│       transport: 400000
│   }
│   └── template/: {
│       makanan: 800000,
│       transport: 400000
│   }
└── expenses/
    └── {expenseId}: {
        amount: 25000,
        category: "makanan",
        notes: "Warteg Bahari",
        date: timestamp,
        month: "2025-09"
    }
```

## Authentication Strategy
- Single Sign-On via Google
- Secure Firebase Authentication
- User profile creation on first login
- Minimal required permissions

## Performance Considerations
- Lazy loading of components
- Optimized Svelte rendering
- Minimal bundle size
- Progressive web app (PWA) support