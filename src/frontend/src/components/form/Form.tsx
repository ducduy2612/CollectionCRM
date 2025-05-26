import React from 'react';
import {
  useForm,
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  UseFormProps,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  children: (methods: UseFormReturn<TFieldValues>) => React.ReactNode;
  onSubmit: SubmitHandler<TFieldValues>;
  schema?: z.ZodType<TFieldValues>;
  options?: UseFormProps<TFieldValues>;
  className?: string;
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  schema,
  options,
  className,
}: FormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    ...options,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
      {children(methods)}
    </form>
  );
}

// Form Field wrapper component
interface FormFieldProps {
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required,
  children,
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-danger-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

// Controlled Input component for React Hook Form
import { Input, InputProps } from '../ui/Input';
import { Controller, Control } from 'react-hook-form';

interface ControlledInputProps extends Omit<InputProps, 'name' | 'value' | 'onChange'> {
  name: string;
  control: Control<any>;
  rules?: any;
}

export const ControlledInput: React.FC<ControlledInputProps> = ({
  name,
  control,
  rules,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          {...props}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

// Controlled Select component for React Hook Form
import { Select, SelectProps } from '../ui/Select';

interface ControlledSelectProps extends Omit<SelectProps, 'name' | 'value' | 'onChange'> {
  name: string;
  control: Control<any>;
  rules?: any;
}

export const ControlledSelect: React.FC<ControlledSelectProps> = ({
  name,
  control,
  rules,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Select
          {...field}
          {...props}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};

// Controlled Checkbox component
interface ControlledCheckboxProps {
  name: string;
  control: Control<any>;
  label: string;
  rules?: any;
}

export const ControlledCheckbox: React.FC<ControlledCheckboxProps> = ({
  name,
  control,
  label,
  rules,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            {...field}
            checked={field.value}
          />
          <span className="ml-2 text-sm text-neutral-700">{label}</span>
        </label>
      )}
    />
  );
};

// Controlled Radio Group component
interface RadioOption {
  value: string;
  label: string;
}

interface ControlledRadioGroupProps {
  name: string;
  control: Control<any>;
  options: RadioOption[];
  label?: string;
  rules?: any;
}

export const ControlledRadioGroup: React.FC<ControlledRadioGroupProps> = ({
  name,
  control,
  options,
  label,
  rules,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          {label && (
            <p className="mb-2 text-sm font-medium text-neutral-700">{label}</p>
          )}
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  className="w-4 h-4 text-primary-600 bg-white border-neutral-300 focus:ring-primary-500 focus:ring-2"
                  {...field}
                  value={option.value}
                  checked={field.value === option.value}
                />
                <span className="ml-2 text-sm text-neutral-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    />
  );
};

// Controlled Textarea component
interface ControlledTextareaProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  rows?: number;
  rules?: any;
}

export const ControlledTextarea: React.FC<ControlledTextareaProps> = ({
  name,
  control,
  label,
  placeholder,
  rows = 4,
  rules,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <div>
          {label && (
            <label htmlFor={name} className="block mb-2 text-sm font-medium text-neutral-700">
              {label}
            </label>
          )}
          <textarea
            {...field}
            id={name}
            rows={rows}
            placeholder={placeholder}
            className="block w-full px-3 py-2 text-sm text-neutral-800 bg-white border border-neutral-300 rounded-md focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-25 transition-colors duration-200"
          />
          {fieldState.error && (
            <p className="mt-1 text-xs text-danger-600">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
};