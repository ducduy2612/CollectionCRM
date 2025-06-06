// Export the main i18n configuration
export { default as i18n } from './config';

// Export translation hooks
export {
  useTranslation,
  useNamespacedTranslation,
  useMultipleTranslations,
  useLanguageSwitcher,
  useTranslationReady,
  useLocalization,
  useI18nextTranslation
} from './hooks/useTranslation';

// Export utility functions
export {
  getCurrentLanguage,
  isSupportedLanguage,
  getLanguageDisplayName,
  getLanguageNativeName,
  switchLanguage,
  getStoredLanguage,
  detectBrowserLanguage,
  translationExists,
  translate,
  translateMultiple,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getTimeAgo,
  pluralize,
  getLanguageDirection,
  loadNamespaces,
  preloadLanguage,
  getAvailableLanguages,
  isI18nReady,
  getCurrentNamespace
} from './utils';

// Export types
export type {
  TranslationNamespace,
  LanguageCode,
  UseTranslationReturn,
  TFunction,
  TranslationOptions,
  LanguageDetectionOptions,
  I18nConfig,
  CommonTranslations,
  TranslationKey,
  NestedKeyOf,
  CommonTranslationKeys,
  CreateTranslationKeys
} from './types';

// Export constants
export {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  NAMESPACES
} from './config';

// Re-export react-i18next components for convenience
export {
  Trans,
  Translation,
  I18nextProvider,
  withTranslation,
  useTranslation as useReactI18nextTranslation
} from 'react-i18next';