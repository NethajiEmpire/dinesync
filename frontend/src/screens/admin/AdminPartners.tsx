import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getPartners, createPartner, updatePartner, deletePartner } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editPartner, setEditPartner] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', vehicle_number: '', license_number: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchPartners = () => getPartners().then(res => setPartners(res.data)).finally(() => setLoading(false));
  useEffect(() => { fetchPartners(); }, []);

  const openNew = () => {
    setEditPartner(null);
    setForm({ name: '', phone: '', email: '', vehicle_number: '', license_number: '', status: 'active' });
    setModal(true);
  };

  const openEdit = (partner) => {
    setEditPartner(partner);
    setForm({ name: partner.name, phone: partner.phone, email: partner.email || '', vehicle_number: partner.vehicle_number || '', license_number: partner.license_number || '', status: partner.status || 'active' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      return toast.error('Name and phone are required');
    }
    setSaving(true);
    try {
      if (editPartner) {
        await updatePartner(editPartner.id, form);
      } else {
        await createPartner(form);
      }
      await fetchPartners();
      setModal(false);
      toast.success(editPartner ? 'Partner updated successfully!' : 'Partner added successfully!');
    } catch (e) { toast.error(e.response?.data?.error || 'Error saving partner'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery partner?')) {
      return;
    }
    await deletePartner(id);
    fetchPartners();
    toast.success('Partner deleted');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.headerTitle}>🚴 Delivery Partners ({partners.length})</span>
        <Btn color={GREEN} onClick={openNew}>+ Add Partner</Btn>
      </div>

      <div style={styles.grid}>
        {partners.map(partner => (
          <div key={partner.id} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: partner.status === 'active' ? `linear-gradient(135deg, #10B981, #059669)` : `linear-gradient(135deg, #6b7280, #4b5563)` }}>
              <div style={styles.cardHeaderInner}>
                <div style={styles.avatar}>
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.partnerName}>{partner.name}</div>
                  <div style={styles.partnerPhone}>📞 {partner.phone}</div>
                </div>
                <div style={styles.partnerStatus}>
                  {partner.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <div style={styles.cardBody}>
              {partner.email && <div style={styles.contactInfo}>✉️ {partner.email}</div>}
              {partner.vehicle_number && <div style={styles.contactInfo}>🚗 Vehicle: {partner.vehicle_number}</div>}
              {partner.license_number && <div style={styles.contactInfo}>📋 License: {partner.license_number}</div>}
              <div style={styles.actionRow}>
                <Btn small color={PURPLE} onClick={() => openEdit(partner)}>Edit</Btn>
                <Btn small color='#ef4444' onClick={() => handleDelete(partner.id)}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {partners.length === 0 && <p style={styles.noRecords}>No delivery partners found</p>}

      <Modal open={modal} onClose={() => setModal(false)} title={editPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'} width={440}>
        <div style={styles.modalBody}>
          <div style={styles.formGrid}>
            {[['Full Name *', 'name', 'text'], ['Phone Number *', 'phone', 'tel'], ['Email', 'email', 'email'], ['Vehicle Number', 'vehicle_number', 'text'], ['License Number', 'license_number', 'text']].map(([label, key, type]) => (
              <div key={key} style={{ gridColumn: key === 'name' ? '1/-1' : 'auto' }}>
                <label style={styles.label}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={styles.input} />
              </div>
            ))}
            <div>
              <label style={styles.label}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={styles.select}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editPartner ? 'Update Partner' : 'Add Partner'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontWeight: 700, fontSize: 15 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
  cardHeader: { padding: '14px 16px', color: '#fff' },
  cardHeaderInner: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  partnerName: { fontWeight: 700, fontSize: 15 },
  partnerPhone: { fontSize: 11, opacity: 0.8 },
  partnerStatus: { marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  cardBody: { padding: 14 },
  contactInfo: { fontSize: 13, color: '#888', marginBottom: 4 },
  actionRow: { display: 'flex', gap: 8, marginTop: 10 },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }
};