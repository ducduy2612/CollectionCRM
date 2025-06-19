import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 3, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block mb-2 text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          className={cn(
            'block w-full px-3 py-2 text-sm text-neutral-800 bg-white',
            'border border-neutral-300 rounded-md',
            'focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-25',
            'transition-colors duration-200',
            'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
            'resize-vertical',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger-600" id={`${textareaId}-error`}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-neutral-500" id={`${textareaId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };