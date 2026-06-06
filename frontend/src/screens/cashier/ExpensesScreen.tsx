import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, PURPLE, GREEN, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { StatusBadge } from '../../components/Badge';
import { getExpenses, createExpense, getExpenseCategories, createExpenseCategory } from '../../services/api';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';

export default function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState('CREATE');
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [form, setForm] = useState({
    sub_category: '', vendor: '', employee: '', payment_type: 'Cash',
    amount: '', description: '', date: new Date().toISOString().slice(0, 10)
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, eRes] = await Promise.all([getExpenseCategories(), getExpenses()]);
        setCategories(cRes.data);
        setExpenses(eRes.data);
        if (cRes.data.length > 0) {
          setSelectedCategory(cRes.data[0].name);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.amount || !selectedCategory) {
      return toast.error('Fill required fields');
    }
    setSaving(true);
    try {
      await createExpense({ ...form, category: selectedCategory, type: 'Paid' });
      const eRes = await getExpenses();
      setExpenses(eRes.data);
      setForm({ sub_category: '', vendor: '', employee: '', payment_type: 'Cash', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
      toast.success('Expense created!');
    } catch (e) { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      return;
    }
    try {
      await createExpenseCategory({ name: newCatName.trim() });
      const cRes = await getExpenseCategories();
      setCategories(cRes.data);
      setNewCatModal(false); setNewCatName('');
    } catch (e) { toast.error('Error'); }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.tabsRow}>
        {[['CREATE','📋'], ['EXPENDITURE','💲'], ['DUE','✂️']].map(([t, icon]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            ...styles.tabBtn, border: `1.5px solid ${t === activeTab ? '#fff' : '#e5e7eb'}`, background: t === activeTab ? `linear-gradient(to right, ${PURPLE}, ${PRIMARY})` : '#fff', color: t === activeTab ? '#fff' : '#555'
          }}>{icon} {t}</button>
        ))}
      </div>

      {activeTab === 'CREATE' && (
        <div style={styles.createGrid}>
          {/* Category list */}
          <div style={styles.catListBlock}>
            <div style={styles.catListHeader}>
              <span style={styles.catListTitle}>Categories</span>
              <Btn small color={PRIMARY} onClick={() => setNewCatModal(true)}>+ Add</Btn>
            </div>
            <table style={styles.table}>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCategory(c.name)} style={{
                    ...styles.catTr, background: selectedCategory === c.name ? '#fff5f7' : 'transparent'
                  }}>
                    <td style={{ ...styles.catTd, borderLeft: selectedCategory === c.name ? `3px solid ${PRIMARY}` : '3px solid transparent' }}>{c.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create form */}
          <div style={styles.formBlock}>
            <h3 style={styles.formTitle}>Create Expense — <span style={{ color: PRIMARY }}>{selectedCategory}</span></h3>
            <div style={styles.formGrid}>
              {[
                ['Sub Category', 'sub_category', 'text'],
                ['Vendor', 'vendor', 'text'],
                ['Employee', 'employee', 'text'],
                ['Amount (₹)', 'amount', 'number'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={styles.input}
                  />
                </div>
              ))}
              <div>
                <label style={styles.label}>Payment Type</label>
                <select value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}
                  style={styles.select}>
                  {['Cash', 'Card', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={styles.input} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={styles.label}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} style={styles.textarea} />
              </div>
            </div>
            <Btn color={GREEN} onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : '✓ CREATE EXPENSE'}</Btn>
          </div>
        </div>
      )}

      {activeTab === 'EXPENDITURE' && (
        <div>
          <div style={styles.expenditureHeader}>
            <span style={{ fontWeight: 700 }}>All Expenditures ({expenses.length})</span>
            <Btn color={GREEN} small>↓ Export</Btn>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  {['ID', 'Type', 'Category', 'Sub Category', 'Employee', 'Vendor', 'Payment', 'Amount (₹)', 'Date'].map(h => (
                    <th key={h} style={{ ...styles.th, color: h === 'Amount (₹)' ? GREEN : '#333' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(row => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.tdId}>#{row.id}</td>
                    <td style={styles.td}><StatusBadge status={row.type} /></td>
                    <td style={styles.td}>{row.category}</td>
                    <td style={styles.td}>{row.sub_category || '-'}</td>
                    <td style={styles.td}>{row.employee || '-'}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{row.vendor || '-'}</td>
                    <td style={styles.td}>{row.payment_type}</td>
                    <td style={styles.tdAmount}>₹{Number(row.amount).toLocaleString('en-IN')}</td>
                    <td style={styles.tdMuted}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && <p style={styles.emptyState}>No expenses found</p>}
          </div>
          {expenses.length > 0 && (
            <div style={styles.totalRow}>
              Total: <span style={styles.totalAmount}>₹{expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'DUE' && (
        <div style={styles.dueState}>
          <div style={styles.dueIcon}>💰</div>
          <p>Due expenses tracking coming soon</p>
        </div>
      )}

      <Modal open={newCatModal} onClose={() => setNewCatModal(false)} title="Add Expense Category" width={360}>
        <input
          placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)}
          style={styles.modalInput}
          onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
        />
        <Btn color={GREEN} onClick={handleAddCategory}>Add Category</Btn>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  tabsRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  createGrid: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 },
  catListBlock: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  catListHeader: { padding: '10px 16px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catListTitle: { fontWeight: 700, fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  catTr: { cursor: 'pointer', borderBottom: '1px solid #f3f4f6' },
  catTd: { padding: '10px 16px' },
  formBlock: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 },
  formTitle: { fontSize: 15, marginBottom: 20 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 },
  label: { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  textarea: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' },
  expenditureHeader: { marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableWrapper: { overflowX: 'auto' },
  thRow: { background: '#f9fafb' },
  th: { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '8px 12px' },
  td: { padding: '8px 12px' },
  tdAmount: { padding: '8px 12px', color: GREEN, fontWeight: 600 },
  tdMuted: { padding: '8px 12px', whiteSpace: 'nowrap', color: '#888' },
  emptyState: { textAlign: 'center', color: '#888', padding: 40 },
  totalRow: { marginTop: 16, textAlign: 'right', fontWeight: 700, fontSize: 15 },
  totalAmount: { color: GREEN },
  dueState: { padding: 40, textAlign: 'center', color: '#888' },
  dueIcon: { fontSize: 48 },
  modalInput: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }
};
