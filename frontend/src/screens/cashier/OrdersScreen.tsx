import { useState, useEffect } from 'react';
import { PRIMARY, ORANGE, GREEN, PURPLE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { Badge } from '../../components/Badge';
import { getOrders, completeOrder, cancelOrder, getSettings } from '../../services/api';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';

export default function OrdersScreen({ setRunningOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('cashierOrdersTab');
    return ['POS', 'ONLINE', 'UPCOMING'].includes(saved) ? saved : 'POS';
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [settings, setSettings] = useState({});

  useEffect(() => {
    localStorage.setItem('cashierOrdersTab', activeTab);
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      const running = res.data.filter(o => o.status === 'running' || o.status === 'invoiced');
      setOrders(running);
      setRunningOrders && setRunningOrders(running.length);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    getSettings().then(sRes => {
      let sMap = {};
      if (Array.isArray(sRes.data)) {
          sRes.data.forEach(s => sMap[s.key] = s.value);
      } else {
          sMap = sRes.data || {};
      }
      setSettings(sMap);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const handleComplete = async () => {
    if (!selectedOrder) {
      return;
    }
    setPayLoading(true);
    try {
      await completeOrder(selectedOrder.id, { payment_method: payMethod });
      setPayModal(false);
      setSelectedOrder(null);
      fetchOrders();
      // Dispatch event to automatically refresh tables in Cashier screen
      window.dispatchEvent(new Event('refreshTables'));
    } catch (e) { console.error(e); }
    finally { setPayLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order?')) {
      return;
    }
    try {
      await cancelOrder(id);
      fetchOrders();
      // Dispatch event to automatically refresh tables in Cashier screen
      window.dispatchEvent(new Event('refreshTables'));
    } catch (e) { console.error(e); }
  };

  const getElapsed = (createdAt) => {
    if (!createdAt) return '00:00:00';
    const dateStr = createdAt.includes('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
    let diff = Math.floor((now - new Date(dateStr)) / 1000);
    if (diff < 0) diff = 0; // prevent negative timer issues
    const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        {['POS', 'ONLINE', 'UPCOMING'].map(t => (
          <Btn key={t} color={t === 'POS' ? PRIMARY : '#94a3b8'} outline={t !== activeTab} onClick={() => setActiveTab(t)}>
            {t} {t === 'POS' && <Badge color={t === activeTab ? '#fff' : PRIMARY} style={{ color: t === activeTab ? PRIMARY : '#fff' }}>{orders.length}</Badge>}
          </Btn>
        ))}
        <Btn color={GREEN} small onClick={fetchOrders} style={styles.refreshBtn}>🔄 Refresh</Btn>
      </div>

      <div style={styles.legendRow}>
        {[['🔴', 'New Order'], ['🟠', 'Running'], ['', 'Invoiced'], ['🟢', 'Paid']].map(([dot, label]) => (
          <div key={label} style={styles.legendBadge}>
            <span>{dot}</span> <span>{label}</span>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p>No running orders</p>
        </div>
      ) : (
        <div style={styles.ordersGrid}>
          {orders.map(o => (
            <div
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              style={{
                ...styles.orderCard,
                background: selectedOrder?.id === o.id ? `linear-gradient(135deg, ${PRIMARY}, #be123c)` : o.status === 'invoiced' ? `linear-gradient(135deg, ${PURPLE}, #4c1d95)` : 'linear-gradient(135deg, #f97316, #c2410c)',
                transform: selectedOrder?.id === o.id ? 'translateY(-4px)' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = selectedOrder?.id === o.id ? 'translateY(-4px)' : 'translateY(0)'}
            >
              <span style={styles.orderCardType}>📋 {o.order_type}</span>
              <span style={styles.orderCardTable}>{o.table_name}</span>
              <span style={styles.orderCardTime}>{getElapsed(o.created_at)}</span>
              <span style={styles.orderCardTotal}>₹{o.total?.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Panel */}
      {selectedOrder && (
        <div style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <span style={styles.detailTitle}>Order #{selectedOrder.id} — Table {selectedOrder.table_name} ({selectedOrder.order_type})</span>
            <button onClick={() => setSelectedOrder(null)} style={styles.detailCloseBtn} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>×</button>
          </div>
          <div style={styles.detailBody}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  {['Item', 'Size', 'Qty', 'Rate', 'Amount'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items || []).map((item, i) => (
                  <tr key={i} style={styles.tr} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.size}</td>
                    <td style={styles.td}>{item.qty}</td>
                    <td style={styles.td}>₹{item.unit_price}</td>
                    <td style={styles.tdAmount}>₹{item.qty * item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={styles.detailTotals}>
              <div>Subtotal: <strong>₹{selectedOrder.subtotal?.toFixed(2)}</strong></div>
              {(selectedOrder.cgst > 0) && <div>CGST {settings.cgst_percent ? `${settings.cgst_percent}%` : ''} {settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}: <strong>₹{selectedOrder.cgst?.toFixed(2)}</strong></div>}
              {(selectedOrder.sgst > 0) && <div>SGST {settings.sgst_percent ? `${settings.sgst_percent}%` : ''} {settings.gst_type === 'inclusive' ? '(Incl.)' : '(Excl.)'}: <strong>₹{selectedOrder.sgst?.toFixed(2)}</strong></div>}
              {selectedOrder.packing_charge > 0 && (
                <div>
                  {selectedOrder.order_type === 'Take Away' ? 'Packing' : selectedOrder.order_type === 'Home Delivery' ? 'Delivery' : (settings.custom_additional_charge_name || 'Extra Charges')}: <strong>₹{selectedOrder.packing_charge?.toFixed(2)}</strong>
                </div>
              )}
              <div style={styles.detailTotalRow}>Total: ₹{selectedOrder.total?.toFixed(2)}</div>
            </div>
            <div style={styles.btnRow}>
              <Btn color={PURPLE} onClick={() => { setPayModal(true); }}>💳 Pay & Complete</Btn>
              <Btn color='#ef4444' outline onClick={() => handleCancel(selectedOrder.id)}>Cancel Order</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Complete Payment" width={400}>
        <p style={styles.payModalTotal}>
          Total: <strong style={styles.payModalTotalVal}>₹{selectedOrder?.total?.toFixed(2)}</strong>
        </p>
        <p style={styles.payMethodLabel}>Payment Method:</p>
        <div style={styles.payMethodGrid}>
          {['CASH', 'CARD', 'UPI', 'ONLINE', 'CREDIT'].map(m => (
            <button key={m} onClick={() => setPayMethod(m)} style={{ ...styles.payMethodBtn, border: `1.5px solid ${payMethod === m ? PRIMARY : '#ddd'}`, background: payMethod === m ? PRIMARY : '#fff', color: payMethod === m ? '#fff' : '#333' }}>{m}</button>
          ))}
        </div>
        <Btn color={GREEN} onClick={handleComplete} disabled={payLoading}>
          {payLoading ? 'Processing...' : '✓ Confirm Payment'}
        </Btn>
      </Modal>
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px', background: '#f8fafc', minHeight: '100%' },
  headerRow: { display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
  refreshBtn: { marginLeft: 'auto' },
  legendRow: { display: 'flex', gap: 16, marginBottom: 24, fontSize: 13, flexWrap: 'wrap', fontWeight: 600, color: '#475569' },
  legendBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' },
  emptyState: { textAlign: 'center', color: '#94a3b8', padding: 80, background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1' },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
  ordersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 },
  orderCard: { color: '#fff', borderRadius: 12, height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', border: 'none' },
  orderCardType: { fontSize: 10, opacity: 0.9, fontWeight: 600, background: 'rgba(0,0,0,0.15)', padding: '3px 8px', borderRadius: 10, marginBottom: 6 },
  orderCardTable: { fontSize: 20, fontWeight: 800, margin: '2px 0', letterSpacing: 0.5 },
  orderCardTime: { fontSize: 11, fontWeight: 500, opacity: 0.9 },
  orderCardTotal: { fontSize: 12, fontWeight: 800, marginTop: 6, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 10 },
  detailPanel: { marginTop: 32, border: 'none', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  detailHeader: { background: `linear-gradient(135deg, ${PRIMARY}, #4a1b6e)`, color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { fontWeight: 800, fontSize: 18, letterSpacing: 0.5 },
  detailCloseBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  detailBody: { padding: 32 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 },
  thRow: { background: '#f8fafc' },
  th: { padding: '16px 20px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5 },
  tr: { transition: 'background 0.15s' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontWeight: 500 },
  tdAmount: { padding: '16px 20px', fontWeight: 800, borderBottom: '1px solid #f1f5f9', color: PRIMARY },
  detailTotals: { marginTop: 24, textAlign: 'right', fontSize: 15, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  detailTotalRow: { fontSize: 24, fontWeight: 900, color: '#1e293b', marginTop: 12, paddingTop: 16, borderTop: '2px dashed #cbd5e1', minWidth: 250 },
  btnRow: { display: 'flex', gap: 16, marginTop: 32, justifyContent: 'flex-end' },
  payModalTotal: { fontSize: 16, marginBottom: 24, color: '#64748b', textAlign: 'center' },
  payModalTotalVal: { fontSize: 32, color: PRIMARY, display: 'block', marginTop: 8 },
  payMethodLabel: { fontSize: 14, marginBottom: 12, fontWeight: 700, color: '#1e293b' },
  payMethodGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 },
  payMethodBtn: { padding: '14px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }
};
