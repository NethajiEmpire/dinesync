import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { GREEN } from '../constants/colors';
import Btn from '../components/Btn';
import { getSettings, updateSettings } from '../services/api';
import Loading from '../components/Loading';

export default function Profile({ user }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(res => {
      setSettings(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Profile saved successfully!');
    } catch (e) {
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Loading /></div>;

  return (
    <div style={styles.container}>
      <div style={styles.cardLarge}>
        <h3 style={styles.cardTitle}>🏪 Restaurant & Profile</h3>
        <div style={styles.gridContainer}>
          {[['Client Code (For Login)', 'client_code'], ['Owner Name', 'owner_name'], ['Restaurant Name', 'restaurant_name'], ['Tagline', 'tagline'], ['Phone', 'phone'], ['Alternate Phone', 'phone2'], ['Email', 'email'], ['GSTIN', 'gstin'], ['FSSAI Number', 'fssai']].map(([label, key]) => (
            <div key={key} style={{ gridColumn: ['Restaurant Name', 'GSTIN', 'Owner Name', 'Client Code (For Login)'].includes(label) ? '1/-1' : 'auto' }}>
              <label style={styles.label}>{label}</label>
              {key === 'client_code' ? (
                <input value={user?.tenantId || ''} disabled style={{ ...styles.input, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', fontWeight: 700 }} />
              ) : (
                <input
                  value={settings[key] || ''}
                  onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                  style={styles.input}
                />
              )}
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={styles.label}>Address</label>
            <textarea
              value={settings.address || ''}
              onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
              rows={2}
              style={styles.textarea}
            />
          </div>
        </div>
        <div style={styles.btnContainer}>
          <Btn color={GREEN} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px', maxWidth: 1000 },
  cardLarge: { maxWidth: 660, background: '#fff', border: 'none', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
  cardTitle: { margin: '0 0 24px', fontSize: 18, fontWeight: 800, color: '#1e293b' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  label: { fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', transition: 'border-color 0.2s', outline: 'none' },
  textarea: { width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  btnContainer: { marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' },
};