import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useNamespacedTranslation } from '../../i18n';

interface HeaderProps {
  user?: {
    name: string;
    role: string;
    initials: string;
    avatar?: string;
  };
  onLogout?: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const { t } = useNamespacedTranslation('navigation');

  const navigation = [
    { name: t('menu.dashboard'), href: '/dashboard' },
    { name: t('menu.customers'), href: '/customers' },
    { name: t('menu.reports'), href: '/reports' },
    { name: t('menu.settings'), href: '/settings' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Header */}
      <header className="bg-primary-900 text-white">
        <div className="px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center text-xl font-bold">
            <svg
              className="w-8 h-8 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Collection CRM
          </Link>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher variant="buttons" className="hidden md:flex" />
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={user.avatar}
                    initials={user.initials}
                    size="md"
                    className="ring-2 ring-white/20"
                  />
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-primary-200">{user.role}</div>
                  </div>
                </div>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLogout().catch(console.error)}
                    className="text-white hover:bg-primary-800"
                    title={t('actions.logout')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;