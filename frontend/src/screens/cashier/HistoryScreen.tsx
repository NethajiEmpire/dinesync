import { toast } from '../../utils/toast';
import { useState, useEffect } from 'react';
import { PRIMARY, PURPLE, GREEN, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { Badge, StatusBadge } from '../../components/Badge';
import { getSalesHistory, getPendingBills, payPendingBill } from '../../services/api';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';

export default function HistoryScreen() {
  const [tab, setTab] = useState('Sales History');
  const [sales, setSales] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const tabs = ['Sales History', 'Pending Bills', 'Custom Addons'];

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([getSalesHistory(), getPendingBills()]);
        setSales(sRes.data);
        setPending(pRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handlePayPending = async () => {
    if (!payModal) {
      return;
    }
    try {
      await payPendingBill(payModal.id, { payment_method: payMethod });
      const pRes = await getPendingBills();
      setPending(pRes.data);
      setPayModal(null);
    } catch (e) { toast.error('Error'); }
  };

  const filteredSales = sales.filter(s =>
    !search || String(s.id).includes(search) || (s.table_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.tabsRow}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...styles.tabBtn, border: `1.5px solid ${t === tab ? PURPLE : '#e5e7eb'}`, background: t === tab ? PURPLE : '#fff', color: t === tab ? '#fff' : '#555'
          }}>
            {t === 'Pending Bills'
              ? <>{t} <Badge color="#ef4444">{pending.length}</Badge></>
              : t}
          </button>
        ))}
      </div>

      {tab === 'Sales History' && (
        <div>
          <div style={styles.searchRow}>
            <input
              placeholder="Search by Bill ID or Table..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <Btn color={GREEN} small>⊞ Export Excel</Btn>
            <span style={styles.statsText}>{filteredSales.length} records</span>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  {['Bill ID', 'Status', 'Table', 'Cash', 'Card', 'UPI', 'Online', 'Discount', 'Tax', 'Total', 'Completed At'].map(h => (
                    <th key={h} style={{ ...styles.th, color: ['Cash','Card','UPI','Online'].includes(h) ? PRIMARY : '#333' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(row => (
                  <tr key={row.id} style={styles.tr} onMouseEnter={e => e.currentTarget.style.background='#f9fafb'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={styles.tdId}>#{row.id}</td>
                    <td style={styles.td}><StatusBadge status={row.status === 'completed' ? 'COMPLETED' : 'CANCELLED'} /></td>
                    <td style={styles.td}>{row.table_name}</td>
                    <td style={{ ...styles.td, color: PRIMARY }}>₹{row.payment_method === 'CASH' ? row.total?.toFixed(2) : '0.00'}</td>
                    <td style={{ ...styles.td, color: PRIMARY }}>₹{row.payment_method === 'CARD' ? row.total?.toFixed(2) : '0.00'}</td>
                    <td style={{ ...styles.td, color: PRIMARY }}>₹{row.payment_method === 'UPI' ? row.total?.toFixed(2) : '0.00'}</td>
                    <td style={{ ...styles.td, color: PRIMARY }}>₹{row.payment_method === 'ONLINE' ? row.total?.toFixed(2) : '0.00'}</td>
                    <td style={styles.td}>₹0.00</td>
                    <td style={styles.td}>₹{((row.cgst || 0) + (row.sgst || 0)).toFixed(2)}</td>
                    <td style={styles.tdAmount}>₹{row.total?.toFixed(2)}</td>
                    <td style={styles.tdTime}>{new Date(row.completed_at || row.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && <p style={styles.emptyState}>No records found</p>}
          </div>
        </div>
      )}

      {tab === 'Pending Bills' && (
        <div>
          <div style={styles.pendingHeader}>
            <div style={styles.pendingCount}>{pending.length}</div>
            <span style={{ fontWeight: 700 }}>Pending Bills (Credit Pay)</span>
            <Btn color={GREEN} small>↓ Export</Btn>
          </div>
          {pending.length === 0
            ? <p style={styles.emptyState}>No pending bills 🎉</p>
            : pending.map(bill => (
              <div key={bill.id} style={styles.pendingBillCard}>
                <div style={styles.billHeader}>
                  <span style={styles.billTitle}>📋 Bill #{bill.id} — Table {bill.table_name}</span>
                  <span style={styles.billAmount}>₹{bill.total?.toFixed(2)}</span>
                </div>
                <div style={styles.billBody}>
                  <div style={{ fontSize: 13 }}>
                    <div style={styles.billTime}>🕐 {new Date(bill.created_at).toLocaleString('en-IN')}</div>
                  </div>
                  <Btn color={ORANGE} small onClick={() => setPayModal(bill)}>💳 Pay Now</Btn>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'Custom Addons' && (
        <div style={styles.customAddonsState}>
          <div style={{ fontSize: 48 }}>🔧</div>
          <p>Custom addons management coming soon</p>
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Pay Pending Bill" width={380}>
        {payModal && <>
          <p>Bill #{payModal.id} — <strong style={styles.payModalBill}>₹{payModal.total?.toFixed(2)}</strong></p>
          <p style={styles.payMethodLabel}>Payment Method:</p>
          <div style={styles.payMethodGrid}>
            {['CASH', 'CARD', 'UPI'].map(m => (
              <button key={m} onClick={() => setPayMethod(m)} style={{
                ...styles.payMethodBtn, border: `1.5px solid ${payMethod === m ? ORANGE : '#ddd'}`, background: payMethod === m ? ORANGE : '#fff', color: payMethod === m ? '#fff' : '#333'
              }}>{m}</button>
            ))}
          </div>
          <Btn color={GREEN} onClick={handlePayPending}>✓ Confirm Payment</Btn>
        </>}
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  tabsRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  searchRow: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 240 },
  statsText: { fontSize: 13, color: '#888', marginLeft: 'auto' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '8px 12px', color: PRIMARY, fontWeight: 600 },
  td: { padding: '8px 12px' },
  tdAmount: { padding: '8px 12px', fontWeight: 700 },
  tdTime: { padding: '8px 12px', whiteSpace: 'nowrap', color: '#888', fontSize: 12 },
  emptyState: { textAlign: 'center', color: '#888', padding: 40 },
  pendingHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  pendingCount: { background: ORANGE, color: '#fff', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  pendingBillCard: { border: '1px solid #fde68a', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  billHeader: { background: '#fffbeb', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  billTitle: { fontWeight: 700, color: ORANGE },
  billAmount: { marginLeft: 'auto', color: '#ef4444', fontWeight: 700 },
  billBody: { padding: '10px 16px', display: 'flex', gap: 20, alignItems: 'center' },
  billTime: { color: '#888', fontSize: 11 },
  customAddonsState: { padding: 40, textAlign: 'center', color: '#888' },
  payModalBill: { color: PRIMARY },
  payMethodLabel: { fontSize: 13, margin: '12px 0 8px' },
  payMethodGrid: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  payMethodBtn: { padding: '8px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }
};
