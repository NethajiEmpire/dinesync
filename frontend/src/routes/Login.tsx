import React, { useState } from 'react';
import useAuth from '../hooks/useAuth.js';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy authentication logic
    if (email === 'admin@resto.com' && password === 'admin') {
      login({ name: 'Admin User', email }, 'admin');
    } else if (email === 'cashier@resto.com' && password === 'cashier') {
      login({ name: 'Cashier User', email }, 'cashier');
    } else {
      alert('Invalid credentials! Try admin@resto.com / admin OR cashier@resto.com / cashier');
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>RestoPOS</h2>
      <p style={styles.subtitle}>Sign in to your account</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input} 
            placeholder="admin@resto.com"
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input} 
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { width: '100%', maxWidth: '400px', padding: '40px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center', color: '#f8fafc' },
  title: { margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold', color: '#fff' },
  subtitle: { margin: '0 0 30px 0', fontSize: '14px', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#cbd5e1' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.5)', color: '#fff', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
  button: { marginTop: '10px', padding: '14px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }
};