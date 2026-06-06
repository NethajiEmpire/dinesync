import { useState } from 'react';
import { createPartner } from '../../services/api';
import { toast } from '../../utils/toast';

export default function PartnerRegisterScreen({ onBack, onRegisterSuccess }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_number: '',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError('Name and Phone number are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await createPartner(form);
      toast.success('Registration Successful! You can now deliver orders.');
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
          <h1 style={styles.title}>🚴 Join as Delivery Partner</h1>
          <p style={styles.subtitle}>Register with DINESYNC and start delivering</p>
        </div>
        <div style={styles.formContainer}>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <form onSubmit={handleRegister} style={styles.formGrid}>
            <div style={styles.inputGroupFull}>
              <p style={styles.inputLabel}>Full Name *</p>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. HaNe"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Phone Number *</p>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Email Address</p>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. hane@email.com"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>Vehicle Number</p>
              <input
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={handleChange}
                placeholder="e.g. TN 01 AB 1234"
                style={styles.inputField}
              />
            </div>
            <div style={styles.inputGroup}>
              <p style={styles.inputLabel}>License Number</p>
              <input
                name="license_number"
                value={form.license_number}
                onChange={handleChange}
                placeholder="e.g. DL-01-1234567890"
                style={styles.inputField}
              />
            </div>

            <div style={styles.actions}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.submitButton, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Registering...' : 'REGISTER AS PARTNER'}
              </button>
              <button type="button" onClick={onBack} style={styles.backButton}>← Back to Home</button>
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
  card: { position: 'relative', zIndex: 1, maxWidth: 500, width: '100%', background: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' },
  header: { textAlign: 'center', padding: '32px 32px 24px', background: 'linear-gradient(to right, #f59e0b, #d97706)', color: '#fff' },
  title: { fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8, margin: 0 },
  formContainer: { padding: 32 },
  errorMessage: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#dc2626', fontWeight: 500 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  inputGroupFull: { display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' },
  inputLabel: { fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputField: { width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s', backgroundColor: '#fff', color: '#1e293b' },
  actions: { gridColumn: '1 / -1', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 },
  submitButton: { width: '100%', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, padding: '16px 0', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)', textTransform: 'uppercase', letterSpacing: 1 },
  backButton: { width: '100%', background: 'none', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px', transition: 'color 0.2s' }
};