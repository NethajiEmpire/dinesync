import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getSettings, updateSettings, getOrders } from '../../services/api';
import Loading from '../../components/Loading';
import Profile from '../Profile';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRunningOrders, setHasRunningOrders] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('cashierSettingsTab');
    return ['PROFILE', 'TAX & CHARGES', 'PRINTER'].includes(saved) ? saved : 'PROFILE';
  });

  useEffect(() => {
    localStorage.setItem('cashierSettingsTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    getSettings()
      .then((sRes) => {
        let sMap = {};
        if (Array.isArray(sRes.data)) {
            sRes.data.forEach(s => sMap[s.key] = s.value);
        } else {
            sMap = sRes.data || {};
        }
        setSettings(sMap);
      })
      .finally(() =>
        setLoading(false)
      );
    getOrders().then(res => setHasRunningOrders(res.data.some(o => o.status === 'running' || o.status === 'invoiced'))).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings); toast.success('Settings saved!');
    }
    catch (e) {
      toast.error('Error');
    }
    finally {
      setSaving(false);
    }
  };

  const handleSaveRates = async () => {
    if (hasRunningOrders && settings.allow_tax_change_while_running !== 'true') {
      return toast.error('Cannot save Tax Rates/Type while orders are running');
    }
    await handleSave();
  };

  const toggleSetting = async (key) => {
    const newVal = settings[key] === 'true' ? 'false' : 'true';
    setSettings(s => ({ ...s, [key]: newVal }));
    await updateSettings({ [key]: newVal });
  };

  if (loading) {
    return <Loading />;
  }

  const renderToggle = (key) => (
    <button onClick={() => toggleSetting(key)} style={{ width: 44, height: 24, borderRadius: 12, background: settings[key] === 'true' ? GREEN : '#e5e7eb', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: settings[key] === 'true' ? 22 : 2, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );

  return (
    <div style={styles.container}>
      <div style={styles.tabRow}>
        {['PROFILE', 'TAX & CHARGES', 'PRINTER'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            ...styles.tabBtn, border: `1.5px solid ${t === activeTab ? PURPLE : '#e5e7eb'}`,
            background: t === activeTab ? PURPLE : '#fff', color: t === activeTab ? '#fff' : '#555'
          }}>{t}</button>
        ))}
      </div>

      {activeTab === 'PROFILE' && <div style={{ margin: '-20px' }}><Profile /></div>}

      {activeTab === 'TAX & CHARGES' && (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏛️ Tax Rates</h3>
            {[['CGST %', 'cgst_percent'], ['SGST %', 'sgst_percent']].map(([label, key]) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input type="number" step="0.01" value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} style={styles.input} />
              </div>
            ))}
            <div style={styles.formGroup}>
              <label style={styles.label}>GST Type</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="gst_type" value="exclusive" checked={settings.gst_type !== 'inclusive'} onChange={e => setSettings(s => ({ ...s, gst_type: e.target.value }))} /> Exclusive
                </label>
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="gst_type" value="inclusive" checked={settings.gst_type === 'inclusive'} onChange={e => setSettings(s => ({ ...s, gst_type: e.target.value }))} /> Inclusive
                </label>
              </div>
            </div>

            <div style={styles.toggleRow}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={styles.toggleLabel}>Allow Changes While Orders Running</span>
                <span style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>If disabled, tax rates cannot be saved during active orders.</span>
              </div>
              {renderToggle('allow_tax_change_while_running')}
            </div>
            <Btn color={GREEN} onClick={handleSaveRates} disabled={saving}>{saving ? 'Saving...' : 'Save Rates'}</Btn>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>💰 Quick Custom Charges Toggles</h3>
            
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Packing Charge Setup</span>
              {renderToggle('enable_packing_charge')}
            </div>
            {settings.enable_packing_charge === 'true' && <div style={styles.formGroup}><label style={styles.label}>Packing Charge (₹)</label><input type="number" value={settings.packing_charge || ''} onChange={e => setSettings(s => ({ ...s, packing_charge: e.target.value }))} style={styles.input} /></div>}

            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Delivery Charge Setup</span>
              {renderToggle('enable_delivery_charge')}
            </div>
            {settings.enable_delivery_charge === 'true' && <div style={styles.formGroup}><label style={styles.label}>Delivery Charge (₹)</label><input type="number" value={settings.delivery_charge || ''} onChange={e => setSettings(s => ({ ...s, delivery_charge: e.target.value }))} style={styles.input} /></div>}

            <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</Btn>
          </div>
        </div>
      )}

      {activeTab === 'PRINTER' && (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🖨️ Silent Printer Setup</h3>
            
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Enable Silent Printing (No Print Dialog)</span>
              {renderToggle('silent_print_enabled')}
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: -8 }}>
              When enabled, POS will try to send the receipt directly to a local printing service (e.g. QZ Tray, RawBT). If disabled or printing fails, standard window.print() will be shown.
            </p>

            {settings.silent_print_enabled === 'true' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Silent Printer URL / IP</label>
                <input type="text" placeholder="http://localhost:8080/print" value={settings.silent_print_url || ''} onChange={e => setSettings(s => ({ ...s, silent_print_url: e.target.value }))} style={styles.input} />
              </div>
            )}

            <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  card: { border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 20px', fontSize: 15, fontWeight: 700 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: '#334155' }
};
