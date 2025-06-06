import 'react-i18next';

// Import the resource type from our translation files
import type { CommonTranslations } from './types';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Custom namespace type
    defaultNS: 'common';
    // Custom resources type
    resources: {
      common: CommonTranslations;
      auth: any;
      navigation: any;
      customers: any;
      dashboard: any;
      settings: any;
      forms: any;
      tables: any;
      errors: any;
    };
    // Allow key separator
    keySeparator: '.';
    // Allow namespace separator
    nsSeparator: ':';
    // Return type
    returnNull: false;
    returnEmptyString: false;
    returnObjects: false;
  }
}

// Declare JSON module imports
declare module '*.json' {
  const value: any;
  export default value;
}