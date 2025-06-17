import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import {
  UsersIcon,
  BoltIcon,
  CpuChipIcon,
  QueueListIcon,
  ArrowUpTrayIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface SettingsStat {
  value: string;
  label: string;
}

interface SettingsCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  stats: SettingsStat[];
  actionText: string;
  actionLink: string;
  status: {
    type: 'active' | 'inactive' | 'warning';
    label: string;
  };
  disabled?: boolean;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'bi-people': UsersIcon,
    'bi-lightning': BoltIcon,
    'bi-robot': CpuChipIcon,
    'bi-list-task': QueueListIcon,
    'bi-upload': ArrowUpTrayIcon,
    'bi-gear-wide-connected': CogIcon,
  };
  
  return iconMap[iconName] || CogIcon;
};

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon,
  stats,
  actionText,
  actionLink,
  status,
  disabled = false
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!disabled) {
      navigate(actionLink);
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'active':
        return 'bg-success-500';
      case 'warning':
        return 'bg-warning-500';
      case 'inactive':
        return 'bg-neutral-400';
      default:
        return 'bg-neutral-400';
    }
  };

  return (
    <Card
      className={`transition-all duration-200 border border-neutral-200 p-8 ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-lg'
      }`}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mr-4">
          {React.createElement(getIconComponent(icon), { className: 'w-6 h-6' })}
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 m-0">{title}</h3>
      </div>

      {/* Description */}
      <p className="text-neutral-600 text-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* Stats */}
      <div className="flex justify-between items-center pt-4 border-t border-neutral-200 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-lg font-semibold text-neutral-800 mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Action and Status */}
      <div className="flex items-center justify-between">
        <a
          href={disabled ? '#' : actionLink}
          className={`font-medium text-sm flex items-center gap-2 transition-colors ${
            disabled
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-primary-600 hover:text-primary-700'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              handleCardClick();
            } else {
              e.preventDefault();
            }
          }}
        >
          {actionText}
          <ArrowRightIcon className="w-4 h-4" />
        </a>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(disabled ? 'inactive' : status.type)}`}></span>
          <span className="text-neutral-600">{disabled ? 'No Access' : status.label}</span>
        </div>
      </div>
    </Card>
  );
};

export default SettingsCard;