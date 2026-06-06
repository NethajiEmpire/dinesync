import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import Modal from '../../components/Modal';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminEmployees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const fetchEmployees = () => getEmployees().then(res => setEmployees(res.data)).finally(() => setLoading(false));
  useEffect(() => { fetchEmployees(); }, []);

  const openNew = () => {
    setEditEmp(null);
    setForm({ name: '', username: '', password: '', role: 'cashier', phone: '', email: '' });
    setModal(true);
    setShowPwd(false);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ name: emp.name, username: emp.username, password: emp.plain_password || '', role: emp.role, phone: emp.phone || '', email: emp.email || '' });
    setModal(true);
    setShowPwd(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.username) {
      return toast.error('Name and username are required');
    }
    if (!form.password && form.role !== 'admin') {
      return toast.error('Password is required');
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.role === 'admin') {
        if (!editEmp) payload.password = payload.password || 'admin1118';
        else delete payload.password;
      }
      if (editEmp) {
        await updateEmployee(editEmp.id, payload);
      } else {
        await createEmployee(payload);
      }
      await fetchEmployees();
      setModal(false);
    } catch (e) { toast.error(e.response?.data?.error || 'Error saving employee'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) {
      return;
    }
    await deleteEmployee(id); fetchEmployees();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.headerTitle}>👁️ Employee Login Management ({employees.length})</span>
        <Btn color={GREEN} onClick={openNew}>+ Add Employee</Btn>
      </div>

      <div style={styles.grid}>
        {employees.map(emp => (
          <div key={emp.id} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: emp.role === 'admin' ? `linear-gradient(135deg, #4a1b6e, ${PURPLE})` : `linear-gradient(135deg, ${PRIMARY}, #c0143d)` }}>
              <div style={styles.cardHeaderInner}>
                <div style={styles.avatar}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.empName}>{emp.name}</div>
                  <div style={styles.empUsername}>{user?.tenantId}@{emp.username}</div>
                  {emp.role !== 'admin' && (
                    emp.plain_password ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        🔑 {emp.plain_password}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2, background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        ⚠️ Password not visible (Update once)
                      </div>
                    )
                  )}
                </div>
                <div style={styles.empRole}>
                  {emp.role.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={styles.cardBody}>
              {emp.phone && <div style={styles.contactInfo}>📞 {emp.phone}</div>}
              {emp.email && <div style={{ ...styles.contactInfo, marginBottom: 8 }}>✉️ {emp.email}</div>}
              <div style={{ ...styles.statusInfo, color: emp.status === 'active' ? GREEN : '#6b7280' }}>
                ● {emp.status || 'active'}
              </div>
              <div style={styles.actionRow}>
                <Btn small color={PURPLE} onClick={() => openEdit(emp)}>Edit</Btn>
                <Btn small color='#ef4444' onClick={() => handleDelete(emp.id)}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && <p style={styles.noRecords}>No employees found</p>}

      <Modal open={modal} onClose={() => setModal(false)} title={editEmp ? 'Edit Employee' : 'Add Employee'} width={440}>
        <div style={styles.modalBody}>
          <div style={styles.formGrid}>
            {[['Full Name *', 'name', 'text'], ['Username *', 'username', 'text'], ['Password *', 'password', showPwd ? 'text' : 'password'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email']]
              .filter(([_, key]) => !(key === 'password' && form.role === 'admin'))
              .map(([label, key, type]) => (
              <div key={key} style={{ gridColumn: key === 'name' || key === 'email' ? '1/-1' : 'auto' }}>
                <label style={styles.label}>{label}</label>
                {key === 'username' ? (
                  <div style={{ display: 'flex' }}>
                    <span style={{ padding: '8px 10px', background: '#f1f5f9', border: '1px solid #ddd', borderRight: 'none', borderRadius: '6px 0 0 6px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{user?.tenantId}@</span>
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value.replace(/\s+/g, '').toLowerCase() }))}
                      style={{ ...styles.input, borderRadius: '0 6px 6px 0' }} placeholder="e.g. cashier" />
                  </div>
                ) : key === 'password' ? (
                  <div style={{ position: 'relative' }}>
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ ...styles.input, paddingRight: 36 }} placeholder="Enter password" />
                    <span onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 10, top: 8, cursor: 'pointer', fontSize: 15, opacity: 0.7 }} title={showPwd ? 'Hide Password' : 'Show Password'}>
                      {showPwd ? '🙈' : '👁️'}
                    </span>
                  </div>
                ) : (
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={styles.input} />
                )}
              </div>
            ))}
            <div>
              <label style={styles.label}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={styles.select}>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="kitchen">Kitchen</option>
              </select>
            </div>
          </div>
          <Btn color={GREEN} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editEmp ? 'Update Employee' : 'Add Employee'}</Btn>
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
  empName: { fontWeight: 700, fontSize: 15 },
  empUsername: { fontSize: 11, opacity: 0.8 },
  empRole: { marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  cardBody: { padding: 14 },
  contactInfo: { fontSize: 13, color: '#888', marginBottom: 4 },
  statusInfo: { fontSize: 12, marginBottom: 10 },
  actionRow: { display: 'flex', gap: 8 },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }
};
