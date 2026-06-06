import { useState } from 'react';
import { PRIMARY, PURPLE } from '../../constants/colors';
import { loginAdmin, loginEmployee } from '../../services/api';

export default function AdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Enter username and password');
      return;
    }
    setLoading(true); setError('');
    try {
      const formattedUsername = username.replace(/\s+/g, '').toLowerCase();
      let res;
      if (formattedUsername.endsWith('@admin') || formattedUsername.startsWith('admin@')) {
        res = await loginAdmin({ username: formattedUsername, password });
      } else {
        res = await loginEmployee({ username: formattedUsername, password });
      }
      onLogin(res.data.user);
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundImage} />
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>DINESYNC</h1>
          <p style={styles.subtitle}>Unified Login Portal</p>
        </div>
        <div style={styles.formContainer}>

          <div style={styles.formBody}>
            <p style={styles.welcomeText}>Welcome Back</p>
            {error && <div style={styles.errorMessage}>{error}</div>}

            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Username</p>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="e.g. ha2@admin or ha2@cashier"
                style={styles.inputField}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div style={styles.inputGroup2}>
              <p style={styles.inputLabel}>Password</p>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={styles.inputField}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              onClick={handleLogin} disabled={loading}
              style={{ ...styles.loginButton, cursor: loading ? 'not-allowed' : 'pointer' }}
            >{loading ? 'Authenticating...' : 'SECURE LOGIN'}</button>

            <button onClick={onBack} style={styles.backButton}>← Back to Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', position: 'relative' },
  backgroundImage: { position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')", backgroundSize: 'cover', opacity: 0.1 },
  card: { position: 'relative', zIndex: 1, maxWidth: 400, width: '100%', margin: '0 20px' },
  header: { textAlign: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: 3, margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
  formContainer: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  formBody: { padding: '32px 28px' },
  welcomeText: { textAlign: 'center', color: '#333', fontWeight: 600, marginBottom: 20 },
  errorMessage: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#dc2626' },
  inputGroup: { marginBottom: 16 },
  inputGroup2: { marginBottom: 24 },
  inputLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' },
  inputField: { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' },
  loginButton: { width: '100%', background: 'linear-gradient(to right, #4a1b6e, #6b46c1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, padding: '14px 0', marginBottom: 12, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(107, 70, 193, 0.3)' },
  backButton: { width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', padding: '8px' },
};
