import { useState, useEffect } from 'react';
import { PRIMARY, GREEN } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getTables, addTable, deleteTable } from '../../services/api';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { toast } from '../../utils/toast';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('adminTablesTab');
    return ['FINE DINE', 'CUSTOM AREAS', 'TAKEAWAY', 'HOME DELIVERY'].includes(saved) ? saved : 'FINE DINE';
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', section: 'Fine Dine' });
  const [fromSlot, setFromSlot] = useState('');
  const [toSlot, setToSlot] = useState('');
  const [tablePrefix, setTablePrefix] = useState('T');
  const [customSection, setCustomSection] = useState('');

  useEffect(() => {
    localStorage.setItem('adminTablesTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'FINE DINE') setTablePrefix('T');
    else if (activeTab === 'TAKEAWAY') setTablePrefix('TA');
    else if (activeTab === 'HOME DELIVERY') setTablePrefix('HD');
    else {
      setTablePrefix('');
      setCustomSection('');
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = () => {
    getTables().then(res => setTables(res.data)).finally(() => setLoading(false));
  };

  const handleAdd = async () => {
    if (!form.name || !form.section) return toast.error('Enter all details');
    try {
      await addTable(form);
      toast.success('Table added');
      fetchTables();
      setModalOpen(false);
      setForm({ name: '', section: activeTab === 'CUSTOM AREAS' ? '' : form.section });
    } catch (err) {
      toast.error('Failed to add table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table/slot?')) return;
    try {
      await deleteTable(id);
      fetchTables();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleGenerateRange = async (sectionPrefix) => {
    const from = parseInt(fromSlot, 10);
    const to = parseInt(toSlot, 10);
    const prefix = tablePrefix.trim();
    
    if (!sectionPrefix) return toast.error('Enter a section name');
    if (!prefix) return toast.error('Enter a valid table prefix');
    if (isNaN(from) || isNaN(to) || from > to || from < 1) return toast.error('Enter valid From and To numbers');

    const allTableNames = tables.map(t => t.name.toLowerCase());
    const tablesToCreate = [];

    for (let i = from; i <= to; i++) {
      const tName = `${prefix}${i}`;
      if (!allTableNames.includes(tName.toLowerCase())) {
        tablesToCreate.push({ name: tName, section: sectionPrefix });
      }
    }
    if (tablesToCreate.length === 0) return toast.error('Tables in this range already exist');

    try {
      for (const tbl of tablesToCreate) {
        await addTable(tbl);
      }
      toast.success(`Generated tables from ${prefix}${from} to ${prefix}${to}`);
      fetchTables();
      setFromSlot('');
      setToSlot('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error generating tables');
      fetchTables();
    }
  };

  const handleDeleteRange = async (sectionPrefix) => {
    const from = parseInt(fromSlot, 10);
    const to = parseInt(toSlot, 10);
    const prefix = tablePrefix.trim();
    
    if (!sectionPrefix) return toast.error('Enter a section name');
    if (!prefix) return toast.error('Enter a valid table prefix');
    if (isNaN(from) || isNaN(to) || from > to || from < 1) return toast.error('Enter valid From and To numbers');

    const targetNames = [];
    for (let i = from; i <= to; i++) {
      targetNames.push(`${prefix}${i}`.toLowerCase());
    }

    const tablesToDelete = tables.filter(t => t.section === sectionPrefix && targetNames.includes(t.name.toLowerCase()));
    if (tablesToDelete.length === 0) return toast.error('No matching tables found in this range');

    if (!window.confirm(`Are you sure you want to delete ${tablesToDelete.length} table(s)?`)) return;

    try {
      for (const t of tablesToDelete) {
        await deleteTable(t.id);
      }
      toast.success(`Deleted ${tablesToDelete.length} tables in range ${prefix}${from} to ${prefix}${to}`);
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting tables');
      fetchTables();
    }
  };

  const handleClearSection = async (sectionPrefix) => {
    if (!sectionPrefix) return toast.error('Enter a section name to clear');
    if (!window.confirm(`Are you sure you want to delete ALL tables in ${sectionPrefix}?`)) return;
    const currentTables = tables.filter(t => t.section === sectionPrefix);
    try {
      for (const t of currentTables) {
        await deleteTable(t.id);
      }
      toast.success(`Cleared all tables in ${sectionPrefix}`);
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error clearing tables');
      fetchTables();
    }
  };

  if (loading) return <Loading />;

  const tabs = [
    { id: 'FINE DINE', label: 'Fine Dine', icon: '🍽️', defaultSection: 'Fine Dine' },
    { id: 'CUSTOM AREAS', label: 'Custom Areas', icon: '🪴', defaultSection: '' },
    { id: 'TAKEAWAY', label: 'Takeaway / Parcel', icon: '🛍️', defaultSection: 'Takeaway' },
    { id: 'HOME DELIVERY', label: 'Home Delivery', icon: '🛵', defaultSection: 'Home Delivery' },
  ];

  const currentTabDef = tabs.find(t => t.id === activeTab);

  const renderTables = (section) => {
    const filtered = tables.filter(t => t.section === section).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return (
      <div style={styles.tableGrid}>
        {filtered.map(t => (
          <div key={t.id} style={styles.tableItem}>
            <span style={styles.tableName}>{t.name}</span>
            <button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>×</button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, padding: 10 }}>No tables/slots found here.</div>}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            ...styles.tabBtn,
            background: activeTab === t.id ? PRIMARY : '#fff', color: activeTab === t.id ? '#fff' : '#64748b',
            boxShadow: activeTab === t.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.02)', border: activeTab === t.id ? 'none' : '1px solid #e2e8f0'
          }}>
            <span style={{ marginRight: 8, fontSize: 16 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={{ ...styles.cardHeader, flexWrap: 'wrap', gap: 16 }}>
          <h3 style={styles.cardTitle}>{currentTabDef.icon} {currentTabDef.label}</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={styles.slotEditor}>
              {activeTab === 'CUSTOM AREAS' && (
                <>
                  <input 
                    type="text" 
                    list="custom-sections-list"
                    placeholder="Section Name" 
                    value={customSection} 
                    onChange={e => {
                      const val = e.target.value;
                      setCustomSection(val);
                      const initials = val.split(' ').filter(w=>w).map(w => w.charAt(0)).join('').toUpperCase();
                      setTablePrefix(initials || 'C');
                    }} 
                    style={{ ...styles.slotInput, width: 130, textAlign: 'left' }} 
                  />
                  <datalist id="custom-sections-list">
                    {[...new Set(tables.filter(t => !['Fine Dine', 'Takeaway', 'Home Delivery'].includes(t.section)).map(t => t.section))].map(sec => (
                      <option key={sec} value={sec} />
                    ))}
                  </datalist>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginLeft: 4 }}>Prefix:</span>
                </>
              )}
              {activeTab !== 'CUSTOM AREAS' && <span style={styles.slotLabel}>Prefix:</span>}
              <input type="text" value={tablePrefix} onChange={e => setTablePrefix(e.target.value)} style={{ ...styles.slotInput, width: 45, textAlign: 'left' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginLeft: 4 }}>From</span>
              <input 
                type="number" 
                placeholder="1"
                value={fromSlot} 
                onChange={e => setFromSlot(e.target.value)} 
                style={styles.slotInput}
                min="1"
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>To</span>
              <input type="number" placeholder="10" value={toSlot} onChange={e => setToSlot(e.target.value)} style={styles.slotInput} min="1" />
              <button onClick={() => handleGenerateRange(activeTab === 'CUSTOM AREAS' ? customSection : currentTabDef.defaultSection)} style={styles.slotUpdateBtn}>
                Generate
              </button>
              <button onClick={() => handleDeleteRange(activeTab === 'CUSTOM AREAS' ? customSection : currentTabDef.defaultSection)} style={{ ...styles.slotUpdateBtn, background: '#f59e0b' }}>
                Delete Range
              </button>
              <button onClick={() => handleClearSection(activeTab === 'CUSTOM AREAS' ? customSection : currentTabDef.defaultSection)} style={{ ...styles.slotUpdateBtn, background: '#ef4444' }}>Clear All</button>
            </div>
            <Btn color={GREEN} onClick={() => { setForm({ name: '', section: currentTabDef.defaultSection }); setModalOpen(true); }}>+ Custom Add</Btn>
          </div>
        </div>

        <div style={styles.cardBody}>
          {activeTab === 'FINE DINE' && renderTables('Fine Dine')}
          {activeTab === 'TAKEAWAY' && renderTables('Takeaway')}
          {activeTab === 'HOME DELIVERY' && renderTables('Home Delivery')}
          {activeTab === 'CUSTOM AREAS' && (
            <div>
              {[...new Set(tables.filter(t => !['Fine Dine', 'Takeaway', 'Home Delivery'].includes(t.section)).map(t => t.section))].map(sec => (
                <div key={sec} style={{ marginBottom: 32 }}>
                  <h4 style={styles.sectionTitle}>{sec}</h4>
                  {renderTables(sec)}
                </div>
              ))}
              {tables.filter(t => !['Fine Dine', 'Takeaway', 'Home Delivery'].includes(t.section)).length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: 14 }}>No custom areas defined. Click "Custom Add" to create one (e.g. 1st Floor, VIP Room).</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add to ${currentTabDef.label}`} width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeTab === 'CUSTOM AREAS' && (
            <div><label style={styles.label}>Area / Section Name</label><input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. Garden, Rooftop" style={styles.input} /></div>
          )}
          <div><label style={styles.label}>Table / Slot Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. G1, T1" style={styles.input} /></div>
          <Btn color={GREEN} onClick={handleAdd}>Save Table</Btn>
        </div>
      </Modal>
    </div>
  );
}

const styles = { container: { padding: '24px 32px', maxWidth: 1100 }, tabContainer: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }, tabBtn: { padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center' }, card: { background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }, cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }, cardTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }, cardBody: { minHeight: 200 }, sectionTitle: { fontSize: 14, fontWeight: 800, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }, tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }, tableItem: { border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }, tableName: { fontWeight: 800, fontSize: 15, color: '#1e293b' }, deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }, actionBtn: { background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#64748b' }, label: { fontSize: 13, color: '#475569', display: 'block', marginBottom: 8, fontWeight: 600 }, input: { width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }, slotEditor: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }, slotLabel: { fontSize: 13, fontWeight: 700, color: '#475569' }, slotInput: { width: 60, padding: '6px', border: '1px solid #cbd5e1', borderRadius: 6, textAlign: 'center', outline: 'none', fontSize: 14, fontWeight: 600, color: '#1e293b' }, slotUpdateBtn: { background: PRIMARY, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' } };