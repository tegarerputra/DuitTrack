# DuitTrack Design System: Card Components

## Overview

The DuitTrack design system emphasizes a consistent, flexible, and responsive approach to card-based UI components. This documentation outlines the design principles, component hierarchy, and implementation guidelines for cards across the application.

## Card Hierarchy

### Primary Card Types

1. **Primary Card (`primary-card`)**
   - Full-width, high-emphasis card
   - Used for main dashboard sections like Budget Status and Financial Intelligence
   - Padding: `var(--card-padding)` (16px)
   - Background: Translucent dark background with subtle hover effects

2. **Secondary Card (`secondary-card`)**
   - Supporting content card
   - Used for Category Breakdown and secondary information
   - Slightly reduced emphasis compared to primary cards

3. **Tertiary Card (`tertiary-card`)**
   - Compact, information-dense card
   - Used for metric items and essential stats

## Sub-Card Components

### Unified Styling for Sub-Cards

Both Budget Status and Financial Intelligence utilize a consistent sub-card styling:

#### Stat Mini Card (`.stat-mini` and `.metric-item`)

**Shared Characteristics:**
- Flexbox layout: `display: flex`
- Alignment: `align-items: center`
- Gap between elements: `var(--spacing-sm)` (8px)
- Padding: `var(--spacing-xs) var(--spacing-sm)` (4px vertical, 8px horizontal)
- Background: `rgba(255, 255, 255, 0.03)`
- Border Radius: `var(--radius-sm)`
- Hover Effect: Background lightens to `rgba(255, 255, 255, 0.06)`

**Structure:**
```
.stat-mini / .metric-item
├── Icon (.stat-icon / .metric-icon)
└── Info Container (.stat-info / .metric-info)
    ├── Label (.stat-label / .metric-label)
    └── Value (.stat-value / .metric-value)
```

### Layout Patterns

1. **Horizontal Layout**
   - Implemented in Budget Essential Stats
   - Grid layout: `grid-template-columns: 1fr 1fr`
   - Responsive across all screen sizes
   - Gap between items: `var(--spacing-sm)` (8px)

2. **Full-Frame Display**
   - Used in Budget Main Info
   - Flexbox with `justify-content: space-between`
   - Ensures full-width utilization
   - Aligns baseline for consistent typography

## Responsive Behavior

### Mobile Optimization

- Compact padding: Reduced to `var(--card-padding-sm)` (12px)
- Consistent horizontal layouts maintained
- Tighter grid gaps: `var(--spacing-xs)` (4px)
- Typography adjustments for smaller screens

### Breakpoints

- Mobile: Up to 768px
  - Single column grid
  - Compact spacing
- Tablet/Desktop: 768px and above
  - Two-column grid
  - Standard spacing

## Implementation Guidelines

### CSS Variables

Use predefined CSS variables for consistent styling:
- `--card-padding`: 16px
- `--spacing-sm`: 8px
- `--spacing-xs`: 4px
- `--radius-sm`: Small border radius
- `--transition-fast`: Quick transition effects

### Best Practices

1. Always use flexbox or grid for layout
2. Maintain consistent padding and gaps
3. Use semantic class names
4. Implement hover and interaction states
5. Ensure responsive design across devices

## Code Example

```html
<div class="primary-card budget-status-card">
  <div class="budget-essential-stats">
    <div class="stat-mini">
      <i class="stat-icon">💰</i>
      <div class="stat-info">
        <span class="stat-label">Income</span>
        <span class="stat-value">$2,500</span>
      </div>
    </div>
    <!-- More stat-mini items -->
  </div>
</div>
```

## Visual States

- Default State: Translucent background
- Hover State: Slight background lightening
- Active/Selected State: Accent border or subtle elevation

## Performance Considerations

- Use CSS transitions for smooth interactions
- Leverage CSS variables for theming
- Minimize layout shifts with consistent sizing

## Accessibility

- Ensure sufficient color contrast
- Use semantic HTML
- Provide alternative text for icons
- Maintain keyboard navigability

## Customization

Easily customize by overriding CSS variables or extending base classes.

---

**Last Updated:** 2025-09-08
**Version:** 1.0.0