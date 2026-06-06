import React, { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import Loading from '../components/Loading.jsx';

// Auth Screens
import LandingScreen from '../screens/auth/LandingScreen.jsx';
import AdminLogin from '../screens/auth/AdminLogin.jsx';
import RegisterScreen from '../screens/auth/RegisterScreen.jsx';
import PartnerRegisterScreen from '../screens/auth/PartnerRegisterScreen.jsx';

// Layouts
import CashierLayout from '../screens/cashier/CashierLayout.jsx';
import AdminLayout from '../screens/admin/AdminLayout.jsx';

export default function AppRoutes() {
  const { user, role, loading, logout, login } = useAuth();
  const [mode, setMode] = useState('landing'); // landing, adminLogin, register, partnerRegister
  const [loginTab, setLoginTab] = useState('admin'); // admin, employee

  if (loading) {
    return <Loading />;
  }

  const handleLogin = (userData) => {
    login(userData, userData.role);
  };

  const handleBack = () => {
    setMode('landing');
  };

  const renderAuthScreen = () => {
    switch (mode) {
      case 'adminLogin':
        return (
          <AdminLogin
            onLogin={handleLogin}
            onBack={handleBack}
            defaultTab={loginTab}
          />
        );
      case 'register':
        return <RegisterScreen onBack={handleBack} />;
      case 'partnerRegister':
        return <PartnerRegisterScreen onBack={handleBack} />;
      default:
        return (
          <LandingScreen
            setMode={setMode}
            setLoginTab={setLoginTab}
          />
        );
    }
  };

  return (
    <>
      {!user ? (
        <AuthLayout>
          {renderAuthScreen()}
        </AuthLayout>
      ) : (
        <MainLayout>
          {role === 'admin' ? (
            <AdminLayout user={user} onLogout={logout} />
          ) : (
            <CashierLayout user={user} onLogout={logout} />
          )}
        </MainLayout>
      )}
    </>
  );
}