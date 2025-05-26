import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-neutral-500">{leftIcon}</span>
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'block w-full px-3 py-2 text-sm text-neutral-800 bg-white',
              'border border-neutral-300 rounded-md',
              'focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-25',
              'transition-colors duration-200',
              'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-neutral-500">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-neutral-500" id={`${inputId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };