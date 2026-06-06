import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getStockTransactions, addStockTransaction } from '../../services/api';
import Loading from '../../components/Loading';

export default function InventoryScreen() {
  const [tab, setTab] = useState('STOCK');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [txModal, setTxModal] = useState(null);
  const [form, setForm] = useState({ name: '', uom: 'Weight/Litre', par_stock: '', par_unit: 'g' });
  const [txForm, setTxForm] = useState({ quantity: '', price: '', type: 'Purchase', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [iRes, tRes] = await Promise.all([getInventory(), getStockTransactions()]);
      setItems(iRes.data); setTransactions(tRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    if (!form.name) {
      return toast.error('Enter ingredient name');
    }
    setSaving(true);
    try {
      await addInventoryItem(form); await fetchAll();
      setModal(false); setForm({ name: '', uom: 'Weight/Litre', par_stock: '', par_unit: 'g' });
    } catch (e) { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleAddTx = async () => {
    if (!txForm.quantity || !txModal) {
      return toast.error('Enter quantity');
    }
    setSaving(true);
    try {
      await addStockTransaction({ ...txForm, inventory_id: txModal.id }); await fetchAll();
      setTxModal(null); setTxForm({ quantity: '', price: '', type: 'Purchase', notes: '' });
    } catch (e) { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ingredient?')) {
      return;
    }
    await deleteInventoryItem(id); fetchAll();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.tabRow}>
        {[['STOCK','🗃️'], ['TRANSACTIONS','🔄'], ['AVAILABLE','📦']].map(([t, icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...styles.tabBtn, border: `1.5px solid ${t === tab ? PURPLE : '#e5e7eb'}`,
            background: t === tab ? PURPLE : '#fff', color: t === tab ? '#fff' : '#555'
          }}>{icon} {t}</button>
        ))}
        <Btn color={PRIMARY} small style={styles.addBtn} onClick={() => setModal(true)}>+ Add Ingredient</Btn>
      </div>

      {tab === 'STOCK' && (
        <table style={styles.table}>
          <thead><tr style={styles.thRow}>
            {['ID', 'Name', 'Unit', 'Par Stock', 'Actions'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.tdId}>#{item.id}</td>
                <td style={styles.tdName}>{item.name}</td>
                <td style={styles.td}>{item.uom}</td>
                <td style={styles.td}>{item.par_stock} {item.par_unit}</td>
                <td style={styles.tdActions}>
                  <Btn small color={GREEN} onClick={() => setTxModal(item)}>+ Stock In</Btn>
                  <Btn small color='#ef4444' onClick={() => handleDelete(item.id)}>Delete</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'TRANSACTIONS' && (
        <table style={styles.table}>
          <thead><tr style={styles.thRow}>
            {['ID', 'Ingredient', 'Type', 'Qty', 'Price', 'Notes', 'Date'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} style={styles.tr}>
                <td style={styles.td}>#{tx.id}</td>
                <td style={styles.tdName}>{tx.item_name}</td>
                <td style={styles.td}><span style={{ ...styles.typeBadge, background: tx.type === 'Purchase' ? '#dcfce7' : '#fee2e2', color: tx.type === 'Purchase' ? GREEN : '#ef4444' }}>{tx.type}</span></td>
                <td style={styles.td}>{tx.quantity}</td>
                <td style={styles.tdPrice}>₹{tx.price || 0}</td>
                <td style={styles.tdNotes}>{tx.notes || '-'}</td>
                <td style={styles.tdDate}>{new Date(tx.created_at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'AVAILABLE' && (
        <div style={styles.grid}>
          {items.map(item => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardTitle}>{item.name}</div>
              <div style={styles.cardUom}>{item.uom}</div>
              <div style={styles.cardStock}>Par Stock: {item.par_stock} {item.par_unit}</div>
              <div style={styles.cardAction}>
                <Btn small color={GREEN} onClick={() => setTxModal(item)}>+ Add Stock</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Ingredient" width={400}>
        <div style={styles.modalBody}>
          {[['Name', 'name', 'text'], ['Par Stock Qty', 'par_stock', 'number']].map(([label, key, type]) => (
            <div key={key}>
              <label style={styles.label}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={styles.input} />
            </div>
          ))}
          <div>
            <label style={styles.label}>Unit of Measurement</label>
            <select value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
              style={styles.select}>
              {['Weight/Litre', 'Piece', 'Pack'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={styles.label}>Par Stock Unit</label>
            <select value={form.par_unit} onChange={e => setForm(f => ({ ...f, par_unit: e.target.value }))}
              style={styles.select}>
              {['g', 'kg', 'L', 'ml', 'Pc', 'Pack'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <Btn color={GREEN} onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Ingredient'}</Btn>
        </div>
      </Modal>

      <Modal open={!!txModal} onClose={() => setTxModal(null)} title={`Stock Transaction — ${txModal?.name}`} width={400}>
        <div style={styles.modalBody}>
          <div>
            <label style={styles.label}>Type</label>
            <select value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}
              style={styles.select}>
              {['Purchase', 'Wastage', 'Usage', 'Inspection'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[['Quantity', 'quantity', 'number'], ['Price (₹)', 'price', 'number'], ['Notes', 'notes', 'text']].map(([label, key, type]) => (
            <div key={key}>
              <label style={styles.label}>{label}</label>
              <input type={type} value={txForm[key]} onChange={e => setTxForm(f => ({ ...f, [key]: e.target.value }))}
                style={styles.input} />
            </div>
          ))}
          <Btn color={GREEN} onClick={handleAddTx} disabled={saving}>{saving ? 'Saving...' : 'Add Transaction'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  addBtn: { marginLeft: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '8px 12px' },
  tdId: { padding: '8px 12px', color: '#888' },
  tdName: { padding: '8px 12px', fontWeight: 600 },
  tdActions: { padding: '8px 12px', display: 'flex', gap: 6 },
  typeBadge: { padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  tdPrice: { padding: '8px 12px', color: GREEN },
  tdNotes: { padding: '8px 12px', color: '#888' },
  tdDate: { padding: '8px 12px', color: '#888', fontSize: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 },
  cardTitle: { fontWeight: 700, marginBottom: 4 },
  cardUom: { fontSize: 13, color: '#888' },
  cardStock: { fontSize: 13, color: ORANGE, marginTop: 6 },
  cardAction: { marginTop: 10 },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }
};
