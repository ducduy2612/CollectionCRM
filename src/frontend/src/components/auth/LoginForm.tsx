import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useNamespacedTranslation, useMultipleTranslations } from '../../i18n';

// Create login schema with translations
const createLoginSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('validation.username_required')),
  password: z.string().min(6, t('validation.password_min_length')),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t: tAuth } = useNamespacedTranslation('auth');
  const { t: tForms } = useNamespacedTranslation('forms');
  const { t: tCommon } = useNamespacedTranslation('common');
  
  const loginSchema = createLoginSchema(tForms);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900">Collection CRM</h2>
          <p className="mt-2 text-sm text-neutral-600">{tAuth('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>{tAuth('login.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <Input
                {...register('username')}
                type="text"
                label={tForms('labels.username')}
                placeholder={tForms('placeholders.username')}
                error={errors.username?.message}
                autoComplete="username"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <Input
                {...register('password')}
                type="password"
                label={tForms('labels.password')}
                placeholder={tForms('placeholders.password')}
                error={errors.password?.message}
                autoComplete="current-password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-neutral-700">{tAuth('login.remember_me')}</span>
                </label>

                <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                  {tAuth('login.forgot_password')}
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
              >
                {tAuth('login.sign_in_button')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-600">
          {tCommon('messages.copyright')}
        </p>
      </div>
    </div>
  );
};