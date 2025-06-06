// Translation namespace types
export type TranslationNamespace = 
  | 'common'
  | 'auth'
  | 'navigation'
  | 'customers'
  | 'dashboard'
  | 'settings'
  | 'forms'
  | 'tables'
  | 'errors';

// Language codes
export type LanguageCode = 'en' | 'vi';

// Common translation keys
export interface CommonTranslations {
  buttons: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    create: string;
    update: string;
    submit: string;
    reset: string;
    clear: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    refresh: string;
    reload: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    view: string;
    details: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    apply: string;
    copy: string;
    duplicate: string;
    archive: string;
    restore: string;
    activate: string;
    deactivate: string;
    enable: string;
    disable: string;
    send: string;
    receive: string;
    connect: string;
    disconnect: string;
    sync: string;
    pause: string;
    resume: string;
    stop: string;
    start: string;
  };
  actions: {
    loading: string;
    saving: string;
    deleting: string;
    updating: string;
    creating: string;
    processing: string;
    searching: string;
    filtering: string;
    exporting: string;
    importing: string;
    downloading: string;
    uploading: string;
    syncing: string;
    connecting: string;
    disconnecting: string;
  };
  status: {
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    failed: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    draft: string;
    published: string;
    archived: string;
    deleted: string;
    enabled: string;
    disabled: string;
    online: string;
    offline: string;
    connected: string;
    disconnected: string;
    synced: string;
    syncing: string;
    outdated: string;
    up_to_date: string;
  };
  messages: {
    no_data: string;
    no_results: string;
    empty_state: string;
    loading_data: string;
    operation_successful: string;
    operation_failed: string;
    changes_saved: string;
    changes_discarded: string;
    confirm_delete: string;
    confirm_action: string;
    unsaved_changes: string;
    session_expired: string;
    permission_denied: string;
    network_error: string;
    server_error: string;
    validation_error: string;
    required_field: string;
    invalid_format: string;
    duplicate_entry: string;
    item_not_found: string;
    operation_cancelled: string;
  };
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    this_week: string;
    last_week: string;
    next_week: string;
    this_month: string;
    last_month: string;
    next_month: string;
    this_year: string;
    last_year: string;
    next_year: string;
    minutes_ago: string;
    minutes_ago_plural: string;
    hours_ago: string;
    hours_ago_plural: string;
    days_ago: string;
    days_ago_plural: string;
    weeks_ago: string;
    weeks_ago_plural: string;
    months_ago: string;
    months_ago_plural: string;
    years_ago: string;
    years_ago_plural: string;
  };
  units: {
    currency: string;
    percentage: string;
    items: string;
    records: string;
    entries: string;
    users: string;
    customers: string;
    loans: string;
    payments: string;
  };
}

// Translation key helper types
export type TranslationKey<T = any> = T extends string 
  ? T 
  : T extends Record<string, any>
  ? {
      [K in keyof T]: T[K] extends string 
        ? K 
        : T[K] extends Record<string, any>
        ? `${K & string}.${TranslationKey<T[K]> & string}`
        : never;
    }[keyof T]
  : never;

// Nested key type for dot notation
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

// Translation function type with namespace support
export type TFunction = {
  <TKey extends string>(
    key: TKey,
    options?: {
      ns?: TranslationNamespace;
      defaultValue?: string;
      count?: number;
      context?: string;
      replace?: Record<string, string | number>;
      lng?: LanguageCode;
    }
  ): string;
  
  // Namespace-specific translation function
  <TNamespace extends TranslationNamespace, TKey extends string>(
    key: `${TNamespace}:${TKey}`,
    options?: {
      defaultValue?: string;
      count?: number;
      context?: string;
      replace?: Record<string, string | number>;
      lng?: LanguageCode;
    }
  ): string;
};

// Hook return type
export interface UseTranslationReturn {
  t: TFunction;
  i18n: {
    language: LanguageCode;
    languages: LanguageCode[];
    changeLanguage: (lng: LanguageCode) => Promise<TFunction>;
    exists: (key: string, options?: { ns?: TranslationNamespace }) => boolean;
    getFixedT: (lng?: LanguageCode, ns?: TranslationNamespace) => TFunction;
    hasResourceBundle: (lng: LanguageCode, ns: TranslationNamespace) => boolean;
    loadNamespaces: (ns: TranslationNamespace | TranslationNamespace[]) => Promise<void>;
    loadLanguages: (lngs: LanguageCode | LanguageCode[]) => Promise<void>;
    reloadResources: (lngs?: LanguageCode | LanguageCode[], ns?: TranslationNamespace | TranslationNamespace[]) => Promise<void>;
  };
  ready: boolean;
}

// Translation options type
export interface TranslationOptions {
  defaultValue?: string;
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;
  lng?: LanguageCode;
  ns?: TranslationNamespace;
  keySeparator?: string | false;
  nsSeparator?: string | false;
}

// Language detection options
export interface LanguageDetectionOptions {
  order: ('localStorage' | 'navigator' | 'htmlTag' | 'path' | 'subdomain')[];
  lookupLocalStorage?: string;
  lookupSessionStorage?: string;
  lookupFromPathIndex?: number;
  lookupFromSubdomainIndex?: number;
  caches?: ('localStorage' | 'sessionStorage' | 'cookie')[];
  excludeCacheFor?: string[];
  cookieMinutes?: number;
  cookieDomain?: string;
  htmlTag?: HTMLElement;
  cookieOptions?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
}

// i18n configuration type
export interface I18nConfig {
  lng?: LanguageCode;
  fallbackLng?: LanguageCode | LanguageCode[];
  defaultNS?: TranslationNamespace;
  ns?: TranslationNamespace[];
  debug?: boolean;
  resources?: Record<LanguageCode, Record<TranslationNamespace, any>>;
  keySeparator?: string | false;
  nsSeparator?: string | false;
  pluralSeparator?: string;
  contextSeparator?: string;
  interpolation?: {
    escapeValue?: boolean;
    formatSeparator?: string;
    format?: (value: any, format?: string, lng?: LanguageCode) => string;
  };
  detection?: LanguageDetectionOptions;
  backend?: {
    loadPath?: string;
    addPath?: string;
    allowMultiLoading?: boolean;
    crossDomain?: boolean;
    withCredentials?: boolean;
    requestOptions?: RequestInit;
  };
  react?: {
    useSuspense?: boolean;
    bindI18n?: string;
    bindI18nStore?: string;
    transEmptyNodeValue?: string;
    transSupportBasicHtmlNodes?: boolean;
    transKeepBasicHtmlNodesFor?: string[];
  };
  saveMissing?: boolean;
  missingKeyHandler?: (lng: LanguageCode[], ns: TranslationNamespace, key: string, fallbackValue?: string) => void;
}

// Export commonly used translation key patterns
export type CommonTranslationKeys = NestedKeyOf<CommonTranslations>;

// Utility type for creating strongly typed translation keys
export type CreateTranslationKeys<T extends Record<string, any>> = NestedKeyOf<T>;