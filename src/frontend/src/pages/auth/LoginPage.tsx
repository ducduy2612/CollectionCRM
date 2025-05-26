import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
  onLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string>('');

  const handleLogin = async (data: { username: string; password: string; rememberMe?: boolean }) => {
    try {
      setError('');
      await login(data.username, data.password, data.rememberMe);
      onLogin?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoginForm 
      onSubmit={handleLogin} 
      error={error}
    />
  );
};

export default LoginPage;