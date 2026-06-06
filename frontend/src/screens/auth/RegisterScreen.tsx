import { useState } from 'react';
import { registerClient } from '../../services/api';

export default function RegisterScreen({ onBack, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    restaurant_name: '',
    tagline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.email || !form.address || !form.restaurant_name) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await registerClient(form);
      onRegisterSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundImage} />
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Customer with Us</h1>
          <p style={styles.subtitle}>Create your DINESYNC restaurant account</p>
        </div>
        <div style={styles.formContainer}>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <form onSubmit={handleRegister} style={styles.formGrid}>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Restaurant Name *</p>
              <input
                name="restaurant_name"
                value={form.restaurant_name}
                onChange={handleChange}
                placeholder="e.g. HaNe Restaurant"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Tagline</p>
              <input
                name="tagline"
                value={form.tagline}
                onChange={handleChange}
                placeholder="e.g. Pure Veg & Non-Veg"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Owner Name *</p>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. R K Nethaji"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Mobile Number *</p>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Email Address *</p>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. owner@restaurant.com"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Complete Address *</p>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 123 Food Street, City, State"
                style={{ ...styles.inputField, height: 80, resize: 'none' }}
              />
            </div>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Default Admin Password</p>
              <input
                disabled
                value="admin1118"
                style={{ ...styles.inputField, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
              />
              <p style={styles.helperText}>This will be your default password for Admin Login.</p>
            </div>
            
            <div style={styles.actions}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.submitButton, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Registering...' : 'REGISTER ACCOUNT'}
              </button>
              <button type="button" onClick={onBack} style={styles.backButton}>← Cancel and Go Back</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', position: 'relative', padding: '40px 20px' },
  backgroundImage: { position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.05 },
  card: { position: 'relative', zIndex: 1, maxWidth: 600, width: '100%', background: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' },
  header: { textAlign: 'center', padding: '32px 32px 24px', background: 'linear-gradient(to right, #10B981, #059669)', color: '#fff' },
  title: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8, margin: 0 },
  formContainer: { padding: 32 },
  errorMessage: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#dc2626', fontWeight: 500 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  inputGroupFull: { display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' },
  inputLabel: { fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputField: { width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s', backgroundColor: '#fff', color: '#1e293b' },
  helperText: { fontSize: 12, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },
  actions: { gridColumn: '1 / -1', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 },
  submitButton: { width: '100%', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, padding: '16px 0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)', textTransform: 'uppercase', letterSpacing: 1 },
  backButton: { width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px', transition: 'color 0.2s' }
};