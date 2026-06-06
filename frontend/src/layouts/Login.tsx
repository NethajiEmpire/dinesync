import React from 'react';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();

  return (
    <div style={{ textAlign: 'center', color: '#fff', padding: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
      <h2>RestoPOS Authentication</h2>
      <p>This is your new Login Page following the strict folder structure!</p>
    </div>
  );
}