# Internationalization (i18n) Setup

This directory contains the complete internationalization setup for the CollectionCRM React frontend application.

## Overview

The i18n infrastructure is built using `react-i18next` and supports English (en) and Vietnamese (vi) languages with namespace-based organization for better maintainability.

## Structure

```
src/i18n/
├── config.ts                 # Main i18n configuration
├── index.ts                  # Main exports
├── types.ts                  # TypeScript type definitions
├── utils.ts                  # Utility functions
├── react-i18next.d.ts       # TypeScript module declarations
├── hooks/
│   └── useTranslation.ts     # Custom translation hooks
└── locales/
    ├── en/                   # English translations
    │   ├── common.json
    │   ├── auth.json
    │   ├── navigation.json
    │   ├── customers.json
    │   ├── dashboard.json
    │   ├── settings.json
    │   ├── forms.json
    │   ├── tables.json
    │   └── errors.json
    └── vi/                   # Vietnamese translations
        ├── common.json
        ├── auth.json
        ├── navigation.json
        ├── customers.json
        ├── dashboard.json
        ├── settings.json
        ├── forms.json
        ├── tables.json
        └── errors.json
```

## Namespaces

The translations are organized into the following namespaces:

- **common**: Buttons, actions, status messages, time formats, units
- **auth**: Login, logout, password reset, session management
- **navigation**: Menu items, breadcrumbs, tabs, tooltips
- **customers**: Customer-related content, fields, actions, validation
- **dashboard**: Dashboard widgets, metrics, charts, activities
- **settings**: System settings, user management, configuration
- **forms**: Form labels, placeholders, validation messages, file upload
- **tables**: Table headers, actions, filters, pagination, bulk operations
- **errors**: Error messages, HTTP status codes, validation errors

## Usage

### Basic Usage with Hooks

```tsx
import { useTranslation } from '@/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common:buttons.save')}</h1>
      <p>{t('auth:login.title')}</p>
    </div>
  );
}
```

### Namespace-Specific Hook

```tsx
import { useNamespacedTranslation } from '@/i18n';

function CustomerComponent() {
  const { t } = useNamespacedTranslation('customers');
  
  return (
    <div>
      <h1>{t('titles.customer_list')}</h1>
      <button>{t('actions.add_customer')}</button>
    </div>
  );
}
```

### Language Switching

```tsx
import { useLanguageSwitcher } from '@/i18n';

function LanguageSwitcher() {
  const { currentLanguage, switchLanguage, getLanguageName } = useLanguageSwitcher();
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => switchLanguage(e.target.value as LanguageCode)}
    >
      <option value="en">{getLanguageName('en')}</option>
      <option value="vi">{getLanguageName('vi')}</option>
    </select>
  );
}
```

### Using Utility Functions

```tsx
import { translate, formatCurrency, getTimeAgo } from '@/i18n';

// Outside of React components
const message = translate('common:messages.operation_successful');

// Format currency
const price = formatCurrency(1000000); // ₫1,000,000 (in Vietnamese locale)

// Time ago
const timeAgo = getTimeAgo(new Date('2023-01-01')); // "1 year ago"
```

### Interpolation and Pluralization

```tsx
// With variables
t('common:time.minutes_ago', { count: 5 }); // "5 minutes ago"

// With replacement
t('errors:messages.error_occurred', { message: 'Network timeout' });

// Pluralization (automatic based on count)
t('common:units.customers', { count: 1 }); // "1 customer"
t('common:units.customers', { count: 5 }); // "5 customers"
```

### Localization Formatting

```tsx
import { useLocalization } from '@/i18n';

function PriceDisplay({ amount }: { amount: number }) {
  const { formatCurrency, formatNumber, formatDate } = useLocalization();
  
  return (
    <div>
      <p>Price: {formatCurrency(amount)}</p>
      <p>Quantity: {formatNumber(amount)}</p>
      <p>Date: {formatDate(new Date())}</p>
    </div>
  );
}
```

## Configuration

### Language Detection

The system automatically detects the user's language preference in this order:
1. localStorage (`i18nextLng` key)
2. Browser language
3. HTML tag language attribute
4. Fallback to English

### Namespace Loading

Namespaces are loaded on-demand. You can preload specific namespaces:

```tsx
import { loadNamespaces } from '@/i18n';

// Preload multiple namespaces
await loadNamespaces(['customers', 'dashboard']);
```

## TypeScript Support

The setup includes comprehensive TypeScript support:

- Strongly typed translation keys
- Namespace-aware type checking
- Autocomplete for translation keys
- Type-safe interpolation parameters

```tsx
// TypeScript will provide autocomplete and type checking
const { t } = useTranslation('customers');
t('fields.first_name'); // ✅ Valid
t('fields.invalid_key'); // ❌ TypeScript error
```

## Adding New Translations

### 1. Add to English Files

Add your new translation keys to the appropriate English JSON file:

```json
// src/i18n/locales/en/customers.json
{
  "actions": {
    "new_action": "New Action"
  }
}
```

### 2. Add to Vietnamese Files

Add the corresponding Vietnamese translation:

```json
// src/i18n/locales/vi/customers.json
{
  "actions": {
    "new_action": "Hành động mới"
  }
}
```

### 3. Use in Components

```tsx
const { t } = useNamespacedTranslation('customers');
return <button>{t('actions.new_action')}</button>;
```

## Best Practices

1. **Use Namespaces**: Always specify the appropriate namespace for better organization
2. **Consistent Keys**: Use consistent naming patterns (snake_case for keys)
3. **Descriptive Keys**: Make translation keys self-descriptive
4. **Avoid Hardcoded Strings**: Always use translation keys instead of hardcoded text
5. **Context**: Provide context in key names when the same word might have different meanings
6. **Pluralization**: Use i18next's pluralization features for count-dependent text
7. **Interpolation**: Use interpolation for dynamic content instead of string concatenation

## Performance Considerations

- Namespaces are loaded on-demand to reduce initial bundle size
- Translations are cached in localStorage for faster subsequent loads
- Use `React.Suspense` with `useSuspense: true` for better loading states
- Preload critical namespaces for better user experience

## Debugging

Enable debug mode in development:

```tsx
// In config.ts
debug: process.env.NODE_ENV === 'development'
```

This will log missing translation keys and other i18n-related information to the console.

## Migration Guide

When migrating existing components to use i18n:

1. Identify all hardcoded strings
2. Determine the appropriate namespace
3. Add translation keys to both language files
4. Replace hardcoded strings with translation calls
5. Test in both languages
6. Update TypeScript types if needed

## Troubleshooting

### Common Issues

1. **Missing translations**: Check browser console for missing key warnings
2. **TypeScript errors**: Ensure translation keys exist in the JSON files
3. **Language not switching**: Check localStorage and browser language settings
4. **Namespace not loading**: Verify namespace is included in the configuration

### Debug Commands

```tsx
import { translationExists, getCurrentLanguage, isI18nReady } from '@/i18n';

// Check if translation exists
console.log(translationExists('common:buttons.save')); // true/false

// Get current language
console.log(getCurrentLanguage()); // 'en' or 'vi'

// Check if i18n is ready
console.log(isI18nReady()); // true/false