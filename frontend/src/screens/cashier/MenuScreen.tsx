import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../../services/api';
import Loading from '../../components/Loading';

const CATS = ['MEALS', 'MAIN COURSE', 'FRIED RICE', 'SOUPS', 'STARTERS', 'BREADS', 'DESSERTS', 'BEVERAGES', 'ICE CREAMS'];

export default function MenuScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: 'MEALS', price: '', type: 'veg', sizes: [{ name: 'Regular', price: '' }] });
  const [saving, setSaving] = useState(false);

  const fetchItems = () => getMenuItems().then(res => setItems(res.data)).finally(() => setLoading(false));
  useEffect(() => { fetchItems(); }, []);

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, price: item.price, type: item.type, sizes: item.sizes || [{ name: 'Regular', price: item.price }] });
    setModal(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', category: 'MEALS', price: '', type: 'veg', sizes: [{ name: 'Regular', price: '' }] });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      return toast.error('Fill required fields');
    }
    setSaving(true);
    try {
      const payload = { ...form, sizes: JSON.stringify(form.sizes) };
      if (editItem) {
        await updateMenuItem(editItem.id, payload);
      } else {
        await addMenuItem(payload);
      }
      await fetchItems(); setModal(false);
    } catch (e) { toast.error('Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) {
      return;
    }
    await deleteMenuItem(id); fetchItems();
  };

  const addSize = () => setForm(f => ({ ...f, sizes: [...f.sizes, { name: '', price: '' }] }));
  const removeSize = (i) => setForm(f => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));
  const updateSize = (i, key, val) => setForm(f => ({ ...f, sizes: f.sizes.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));

  const allCats = ['ALL', ...new Set(items.map(i => i.category))];
  const filtered = items.filter(i =>
    (activeCategory === 'ALL' || i.category === activeCategory) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <input
          placeholder="Search menu items..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.categoryScroll}>
          {allCats.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              ...styles.catBtn, background: activeCategory === cat ? PRIMARY : '#f3f4f6', color: activeCategory === cat ? '#fff' : '#555'
            }}>{cat}</button>
          ))}
        </div>
        <Btn color={GREEN} onClick={openNew}>+ Add Item</Btn>
      </div>

      <div style={styles.grid}>
        {filtered.map(item => (
          <div key={item.id} style={styles.card}>
            <div style={{ ...styles.cardImage, background: item.type === 'nonveg' ? '#fff1f2' : '#f0fdf4' }}>
              {item.type === 'nonveg' ? '🍗' : '🥗'}
              <span style={{ ...styles.typeBadge, background: item.type === 'nonveg' ? '#ef4444' : GREEN }}>{item.type}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.itemName}>{item.name}</div>
              <div style={styles.itemCategory}>{item.category}</div>
              <div style={styles.itemPrice}>₹{item.price}</div>
              <div style={styles.actionRow}>
                <Btn small color={PURPLE} onClick={() => openEdit(item)}>Edit</Btn>
                <Btn small color='#ef4444' onClick={() => handleDelete(item.id)}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p style={styles.noRecords}>No menu items found</p>}

      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Menu Item' : 'Add Menu Item'} width={480}>
        <div style={styles.modalBody}>
          <div>
            <label style={styles.label}>Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={styles.input} />
          </div>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={styles.select}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Base Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={styles.select}>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
              </select>
            </div>
          </div>

          <div>
            <div style={styles.sizesHeader}>
              <label style={{
                fontSize: 12,
                color: '#888'
              }}>Sizes / Variants</label>
              <Btn small color={PURPLE} onClick={addSize}>+ Add Size</Btn>
            </div>
            {
              form.sizes.map((size, i) => (
                <div key={i} style={styles.sizeRow}>
                  <input placeholder="Size name" value={size.name}
                    onChange={e =>
                      updateSize(i, 'name', e.target.value)
                    }
                    style={styles.sizeInputName} />
                  <input type="number" placeholder="Price" value={size.price}
                    onChange={e =>
                      updateSize(i, 'price', e.target.value)
                    }
                    style={styles.sizeInputPrice} />
                  {
                    form.sizes.length > 1 && (
                      <button onClick={() =>
                        removeSize(i)
                      }
                        style={styles.removeSizeBtn}>×</button>
                    )}
                </div>
              ))}
          </div>

          <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  headerRow: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' },
  searchInput: { padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 220 },
  categoryScroll: { display: 'flex', gap: 4, flex: 1, overflowX: 'auto' },
  catBtn: { padding: '5px 12px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' },
  cardImage: { height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative' },
  typeBadge: { position: 'absolute', top: 6, right: 6, fontSize: 10, color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 },
  cardBody: { padding: '10px 12px' },
  itemName: { fontWeight: 700, fontSize: 13, marginBottom: 2 },
  itemCategory: { fontSize: 12, color: '#888', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: PRIMARY, fontWeight: 700 },
  actionRow: { display: 'flex', gap: 6, marginTop: 10 },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  sizesHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  sizeRow: { display: 'flex', gap: 8, marginBottom: 6 },
  sizeInputName: { flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 },
  sizeInputPrice: { width: 80, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 },
  removeSizeBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, width: 24, height: 28, cursor: 'pointer' }
};
