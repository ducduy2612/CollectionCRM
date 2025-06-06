import React from 'react';
import { useLanguageSwitcher } from '../../i18n';
import { Select } from './Select';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'select' | 'buttons';
}

export function LanguageSwitcher({ 
  className = '', 
  variant = 'select' 
}: LanguageSwitcherProps) {
  const { currentLanguage, availableLanguages, switchLanguage, getLanguageName } = useLanguageSwitcher();

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await switchLanguage(event.target.value as 'en' | 'vi');
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => switchLanguage(lang)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currentLanguage === lang
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {getLanguageName(lang)}
          </button>
        ))}
      </div>
    );
  }

  const options = availableLanguages.map((lang) => ({
    value: lang,
    label: getLanguageName(lang)
  }));

  return (
    <Select
      value={currentLanguage}
      onChange={handleLanguageChange}
      options={options}
      className={className}
    />
  );
}