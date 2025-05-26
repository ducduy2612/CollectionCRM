import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Layout
      user={user || undefined}
      onLogout={logout}
    />
  );
};

export default MainLayout;