import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getSettings, updateSettings, getOrders } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRunningOrders, setHasRunningOrders] = useState(false);
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem('adminSettingsTab');
    return ['TAX & CHARGES', 'RECEIPT', 'PERMISSIONS', 'SYSTEM'].includes(saved) ? saved : 'TAX & CHARGES';
  });

  useEffect(() => {
    localStorage.setItem('adminSettingsTab', tab);
  }, [tab]);

  useEffect(() => {
    getSettings().then(res => setSettings(res.data)).finally(() => setLoading(false));
    getOrders().then(res => setHasRunningOrders(res.data.some(o => o.status === 'running' || o.status === 'invoiced'))).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await updateSettings(settings); toast.success('Settings saved successfully!'); }
    catch (e) { toast.error('Error saving settings'); }
    finally { setSaving(false); }
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

  const tabs = ['TAX & CHARGES', 'RECEIPT', 'PERMISSIONS', 'SYSTEM'];

  const renderToggle = (key) => (
    <button onClick={() => toggleSetting(key)} style={{ width: 44, height: 24, borderRadius: 12, background: settings[key] === 'true' ? GREEN : '#e5e7eb', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: settings[key] === 'true' ? 22 : 2, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );

  return (
    <div style={styles.container}>
        <div style={styles.tabContainer}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...styles.tabButton,
              background: t === tab ? '#fff' : 'transparent', color: t === tab ? PRIMARY : '#64748b', boxShadow: t === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}>{t}</button>
          ))}
        </div>

      {tab === 'TAX & CHARGES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={styles.cardSmall}>
            <h3 style={styles.cardTitle}>🏛️ Tax Rates</h3>
            <div style={styles.gridContainer}>
              {[['CGST %', 'cgst_percent'], ['SGST %', 'sgst_percent']].map(([label, key]) => (
                <div key={key} style={styles.inputGroup}>
                  <label style={styles.label}>{label}</label>
                  <input type="number" step="0.01" value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} style={styles.input} />
                </div>
              ))}
              <div style={styles.inputGroup}>
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
            </div>
            <Btn color={GREEN} onClick={handleSaveRates} disabled={saving}>{saving ? 'Saving...' : 'Save Rates'}</Btn>
          </div>

          <div style={styles.cardLarge}>
            <h3 style={styles.cardTitle}>💰 Custom Charges Toggles</h3>
            <div style={styles.gridContainer}>
              
              <div style={styles.toggleBox}>
                <div style={styles.toggleHeader}>
                  <span style={styles.toggleTitle}>Enable Packing Charge</span>
                  {renderToggle('enable_packing_charge')}
                </div>
                {settings.enable_packing_charge === 'true' && (
                  <div style={{ marginTop: 12 }}><label style={styles.label}>Default Packing Charge (₹)</label><input type="number" value={settings.packing_charge || ''} onChange={e => setSettings(s => ({ ...s, packing_charge: e.target.value }))} style={styles.input} /></div>
                )}
              </div>

              <div style={styles.toggleBox}>
                <div style={styles.toggleHeader}>
                  <span style={styles.toggleTitle}>Enable Delivery Charge</span>
                  {renderToggle('enable_delivery_charge')}
                </div>
                {settings.enable_delivery_charge === 'true' && (
                  <div style={{ marginTop: 12 }}><label style={styles.label}>Default Delivery Charge (₹)</label><input type="number" value={settings.delivery_charge || ''} onChange={e => setSettings(s => ({ ...s, delivery_charge: e.target.value }))} style={styles.input} /></div>
                )}
              </div>

              <div style={styles.toggleBox}>
                <div style={styles.toggleHeader}>
                  <span style={styles.toggleTitle}>Enable Custom Extra Fee (Cashier Input)</span>
                  {renderToggle('enable_additional_charge')}
                </div>
                {settings.enable_additional_charge === 'true' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}><label style={styles.label}>Fee Name</label><input value={settings.custom_additional_charge_name || ''} onChange={e => setSettings(s => ({ ...s, custom_additional_charge_name: e.target.value }))} placeholder="e.g. Service Fee" style={styles.input} /></div>
                    <div style={{ flex: 1 }}><label style={styles.label}>Max Limit</label><input type="number" value={settings.custom_fee_max_limit || ''} onChange={e => setSettings(s => ({ ...s, custom_fee_max_limit: e.target.value }))} placeholder="Max value cashier can enter" style={styles.input} /></div>
                  </div>
                )}
              </div>

              <div style={styles.toggleBox}>
                <div style={styles.toggleHeader}>
                  <span style={styles.toggleTitle}>Enable Item-wise Charges</span>
                  {renderToggle('enable_item_wise_charges')}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>If enabled, you can define specific packing or processing fees for individual menu items.</p>
              </div>

            </div>
            <div style={{ marginTop: 24 }}><Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Toggles & Amounts'}</Btn></div>
          </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', display: 'block', marginBottom: 16 }}>Cashier Table Tab Permissions</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Show Fine Dine Tab</span>
                {renderToggle('cashier_show_finedine')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Show Custom Areas Tab</span>
                {renderToggle('cashier_show_custom')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Show Takeaway / Parcel Tab</span>
                {renderToggle('cashier_show_takeaway')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Show Home Delivery Tab</span>
                {renderToggle('cashier_show_homedelivery')}
              </div>
            </div>
        </div>
      )}

      {tab === 'RECEIPT' && (
        <div style={styles.cardSmall}>
          <h3 style={styles.cardTitle}>🧾 Receipt Settings</h3>
          {[['Receipt Header Text', 'receipt_header'], ['Receipt Footer Text', 'receipt_footer'], ['Thank You Message', 'thank_you_message']].map(([label, key]) => (
            <div key={key} style={styles.inputGroup}>
              <label style={styles.label}>{label}</label>
              <textarea value={settings[key] || ''} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} rows={2}
                style={styles.textarea} />
            </div>
          ))}
          <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Btn>
        </div>
      )}

      {tab === 'PERMISSIONS' && (
        <div style={styles.cardLarge}>
          <h3 style={styles.cardTitle}>🔒 Settings & Permissions</h3>
          <div style={styles.permissionToggleBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Allow Cashiers to Create/Edit Tables</span>
                <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#888' }}>If disabled, cashiers will only be able to view the tables but cannot add or delete them from their settings screen.</p>
              </div>
              <button
                onClick={async () => {
                  const newVal = settings.allow_cashier_table_edit !== 'false' ? 'false' : 'true';
                  setSettings(s => ({ ...s, allow_cashier_table_edit: newVal }));
                  try {
                    await updateSettings({ allow_cashier_table_edit: newVal });
                    toast.success('Permission updated successfully!');
                  } catch (e) {
                    toast.error('Error saving permission');
                    setSettings(s => ({ ...s, allow_cashier_table_edit: newVal === 'true' ? 'false' : 'true' }));
                  }
                }}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: settings.allow_cashier_table_edit !== 'false' ? GREEN : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.3s',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: settings.allow_cashier_table_edit !== 'false' ? 22 : 2,
                  transition: 'left 0.3s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          <div style={styles.permissionToggleBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Show Orders Tab to Cashiers</span>
                <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#888' }}>If disabled, cashiers will not have access to the active/running Orders screen.</p>
              </div>
              {renderToggle('cashier_show_orders')}
            </div>
          </div>
        </div>
      )}

      {tab === 'SYSTEM' && (
        <div style={styles.cardSmall}>
          <h3 style={styles.cardTitle}>⚙️ System</h3>
          <div style={styles.systemAlert}>
            <p style={styles.alertTitle}>✅ System is running on SQLite (Offline Mode)</p>
            <p style={styles.alertDesc}>All data is stored locally. No internet connection required.</p>
          </div>
          <div style={styles.systemInfo}>
            <p>Database: <strong>SQLite (pos.db)</strong></p>
            <p>Backend: <strong>Node.js + Express</strong></p>
            <p>Frontend: <strong>React + Vite</strong></p>
            <p>Version: <strong>1.0.0</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px', maxWidth: 1000 },
  tabContainer: { display: 'inline-flex', gap: 4, marginBottom: 32, background: '#f1f5f9', padding: 6, borderRadius: 12 },
  tabButton: { padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', border: 'none' },
  cardLarge: { maxWidth: 860, background: '#fff', border: 'none', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
  cardSmall: { maxWidth: 500, background: '#fff', border: 'none', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
  cardTitle: { margin: '0 0 24px', fontSize: 18, fontWeight: 800, color: '#1e293b' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  label: { fontSize: 13, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', transition: 'border-color 0.2s', outline: 'none' },
  textarea: { width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  btnContainer: { marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' },
  inputGroup: { marginBottom: 4 },
  toggleBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 },
  toggleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  systemAlert: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 20 },
  alertTitle: { fontSize: 14, margin: 0, color: '#166534', fontWeight: 600 },
  alertDesc: { fontSize: 13, margin: '4px 0 0', color: '#15803d' },
  systemInfo: { fontSize: 14, color: '#475569', background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 },
  permissionToggleBox: { background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  permissionLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#1e293b' },
  checkbox: { marginRight: 10, width: 18, height: 18, cursor: 'pointer' },
  permissionDesc: { margin: '8px 0 0 28px', fontSize: 13, color: '#64748b' }
};
