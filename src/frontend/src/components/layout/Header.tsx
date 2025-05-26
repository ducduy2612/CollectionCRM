import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface HeaderProps {
  user?: {
    name: string;
    role: string;
    initials: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Customers', href: '/customers' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
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

          {user && (
            <div className="flex items-center space-x-4">
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
                  onClick={onLogout}
                  className="text-white hover:bg-primary-800"
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
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-primary-800 shadow-md">
        <div className="px-6">
          <ul className="flex space-x-8">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'inline-flex items-center px-1 py-3 text-sm font-medium border-b-3 transition-colors',
                    isActive(item.href)
                      ? 'text-white border-primary-400'
                      : 'text-primary-200 border-transparent hover:text-white hover:border-primary-300'
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;