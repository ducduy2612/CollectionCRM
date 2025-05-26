import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  'inline-block border-2 border-neutral-300 rounded-full border-t-primary-500 animate-spin',
  {
    variants: {
      size: {
        sm: 'w-3 h-3 border',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8 border-4',
      },
      color: {
        primary: 'border-t-primary-500',
        secondary: 'border-t-secondary-500',
        success: 'border-t-success-500',
        warning: 'border-t-warning-500',
        danger: 'border-t-danger-500',
        white: 'border-neutral-400 border-t-white',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white';
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label || 'Loading'}
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        <div className={spinnerVariants({ size, color })} />
        {label && (
          <span className="ml-2 text-sm text-neutral-600">{label}</span>
        )}
        <span className="sr-only">{label || 'Loading'}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

// Loading overlay component
interface LoadingOverlayProps {
  show: boolean;
  label?: string;
  fullScreen?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, label, fullScreen = false }) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-white/80 backdrop-blur-sm z-50',
        fullScreen ? 'fixed inset-0' : 'absolute inset-0 rounded-lg'
      )}
    >
      <div className="flex flex-col items-center">
        <Spinner size="lg" />
        {label && (
          <p className="mt-4 text-sm text-neutral-600">{label}</p>
        )}
      </div>
    </div>
  );
};

// Skeleton loader components
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-neutral-200 rounded animate-pulse', className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

const SkeletonText = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('h-4 bg-neutral-200 rounded animate-pulse', className)}
        {...props}
      />
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

const SkeletonTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('h-6 bg-neutral-200 rounded animate-pulse', className)}
        {...props}
      />
    );
  }
);
SkeletonTitle.displayName = 'SkeletonTitle';

export { 
  Spinner, 
  spinnerVariants, 
  LoadingOverlay,
  Skeleton,
  SkeletonText,
  SkeletonTitle
};