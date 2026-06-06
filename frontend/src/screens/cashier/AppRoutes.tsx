import React from 'react';
import useAuth from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

// You will eventually migrate these from 'screens' to 'pages/'
import CashierLayout from '../screens/cashier/CashierLayout';
import AdminLayout from '../screens/admin/AdminLayout';
import Loading from '../components/Loading';

export default function AppRoutes() {
  const { user, role, loading, logout } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {!user ? (
        <AuthLayout>
          <div style={{ textAlign: 'center', color: '#fff' }}>
             <h2>RestoPOS Authentication</h2>
             <p>Drop your migrated Login.jsx component here.</p>
          </div>
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