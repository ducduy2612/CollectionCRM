import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ items, collapsed = false, onToggle }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: SidebarItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isItemActive = isActive(item.href) || isParentActive(item);

    return (
      <li key={item.name}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpanded(item.name)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isItemActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
                depth > 0 && 'ml-4'
              )}
            >
              <div className="flex items-center">
                <span className={cn('flex-shrink-0', collapsed ? '' : 'mr-3')}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && (
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'transform rotate-90'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
            {!collapsed && isExpanded && (
              <ul className="mt-1 space-y-1">
                {item.children?.map(child => renderSidebarItem(child, depth + 1))}
              </ul>
            )}
          </>
        ) : (
          <Link
            to={item.href}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isItemActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
              depth > 0 && 'ml-4'
            )}
          >
            <span className={cn('flex-shrink-0', collapsed ? '' : 'mr-3')}>
              {item.icon}
            </span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        )}
      </li>
    );
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-neutral-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-neutral-800">Menu</h2>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'}
                />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <ul className="space-y-1">
            {items.map(item => renderSidebarItem(item))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-500">
              Collection CRM v2.0.1
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;