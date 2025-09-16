# 🏷️ DuitTrack Category Service Documentation

## Overview
The CategoryService is a centralized emoji mapping system that provides consistent category icons across the DuitTrack application. It supports fuzzy matching for Indonesian and English terms, making category identification intelligent and flexible.

## Key Features
- 🌟 Unified category icon mapping
- 🔍 Fuzzy matching for category names
- 🌐 Bilingual support (Indonesian and English)
- 🚀 Extensible architecture
- 💡 Smart fallback for unknown categories

## Installation
The CategoryService is automatically loaded in the application. It is a singleton service accessible via:
```javascript
// Global singleton instance
const categoryService = window.categoryService;

// Or create a new instance
const newCategoryService = new window.CategoryService();
```

## API Methods

### `getCategoryIcon(categoryName: string): string`
Retrieves an emoji icon for a given category name.

**Parameters**:
- `categoryName`: String representing the category name

**Returns**: 
- Emoji representing the category
- Fallback: '💰' for unrecognized categories

**Example**:
```javascript
const icon = categoryService.getCategoryIcon('bensin');  // Returns '⛽'
const icon = categoryService.getCategoryIcon('jajan');   // Returns '🍿'
const icon = categoryService.getCategoryIcon('unknown'); // Returns '💰'
```

### `getAllMappings(): Object`
Returns the complete emoji mapping object.

**Returns**:
- Object with all category-to-emoji mappings

### `addCustomMapping(categoryKey: string, emoji: string): void`
Adds a custom category-to-emoji mapping.

**Parameters**:
- `categoryKey`: New category name (case-insensitive)
- `emoji`: Emoji to associate with the category

**Example**:
```javascript
categoryService.addCustomMapping('investasi', '📈');
```

### `getCategoryGroups(): Object`
Returns category groups for organizational purposes.

**Returns**:
- Object with grouped categories, their names, and representative icons

## Supported Categories

### Food & Beverage
- 🍽️ Includes: makan, food, makanan, restoran
- 🍿 Snacks: jajan, snack, cemilan
- ☕ Beverages: kopi

### Transportation
- ⛽ Fuel: bensin, gas, bbm
- 🚗 Transport: transport, transportasi
- 🏍️ Ojek services
- 📱 Ride-hailing apps

### Utilities & Household
- 🏠 Housing: rumah, sewa
- ⚡ Electricity: listrik, PLN
- 🛒 Shopping: belanja, groceries

### Health & Personal
- 💊 Health: kesehatan
- 👨‍⚕️ Medical: dokter
- 🎓 Education: pendidikan, sekolah
- 👕 Clothing: pakaian

### Entertainment
- 🎮 Entertainment: hiburan
- 🎬 Cinema

### Fruits
- 🍎 General fruits
- 🍉 Specific fruits: semangka, melon
- 🍊 Citrus: jeruk
- 🍌 Banana
- 🥭 Mango

### Family
- 👨‍👩‍👧‍👦 Family expenses
- 👶 Children's expenses

## Fuzzy Matching
The service uses an intelligent fuzzy matching algorithm:
- Case-insensitive matching
- Partial string matching
- Supports both Indonesian and English terms

## Extensibility
- Easy to add new mappings
- Supports custom category groups
- Fallback mechanism ensures no category is left without an icon

## Performance Considerations
- O(n) time complexity for icon lookup
- Minimal memory overhead
- Singleton design for efficient resource usage

## Best Practices
1. Use `getCategoryIcon()` for dynamic icon generation
2. Leverage `addCustomMapping()` for unique categories
3. Use `getCategoryGroups()` for organizational UIs

## Future Roadmap
- Machine learning-powered category suggestions
- More granular category matching
- User-defined custom categories

## Contribution
To contribute new category mappings:
1. Update `emojiMap` in `category-service.js`
2. Add mappings to both Indonesian and English terms
3. Consider adding to appropriate category group

**Last Updated**: September 8, 2025
**Version**: 1.0.0
**Authors**: DuitTrack Development Team