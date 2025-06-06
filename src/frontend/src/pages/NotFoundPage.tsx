import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useTranslation } from '../i18n/hooks/useTranslation';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation(['errors', 'common']);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-4">{t('errors:not_found.page_not_found_title')}</h2>
        <p className="text-neutral-600 mb-8">{t('errors:not_found.page_not_found_description')}</p>
        <Link to="/dashboard">
          <Button variant="primary">{t('errors:actions.go_to_dashboard')}</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;