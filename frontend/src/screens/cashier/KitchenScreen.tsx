import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, ORANGE, PURPLE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getOrders } from '../../services/api';
import Loading from '../../components/Loading';

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const fetchOrders = () => {
    getOrders().then(res => setOrders(res.data.filter(o => o.status === 'running')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const getElapsed = (createdAt) => {
    if (!createdAt) return 'Just now';
    const dateStr = createdAt.includes('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
    let diff = Math.floor((now - new Date(dateStr)) / 60000);
    if (diff < 0) diff = 0;
    return diff < 1 ? 'Just now' : `${diff} min ago`;
  };

  const getUrgency = (createdAt) => {
    if (!createdAt) return { color: GREEN, label: 'OK' };
    const dateStr = createdAt.includes('Z') ? createdAt : createdAt.replace(' ', 'T') + 'Z';
    const diff = Math.floor((now - new Date(dateStr)) / 60000);
    if (diff > 15) {
      return { color: '#ef4444', label: 'URGENT' };
    }
    if (diff > 8) {
      return { color: ORANGE, label: 'HURRY' };
    }
    return { color: GREEN, label: 'OK' };
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🍴 Kitchen Display — {orders.length} Active Orders</h2>
        <Btn color={PRIMARY} small onClick={fetchOrders}>🔄 Refresh</Btn>
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🍳</div>
          <p>No active orders in kitchen</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map(order => {
            const urgency = getUrgency(order.created_at);
            return (
              <div key={order.id} style={{ ...styles.card, border: `2px solid ${urgency.color}` }}>
                <div style={{ ...styles.cardHeader, background: urgency.color }}>
                  <span style={styles.cardHeaderTitle}>Table {order.table_name} — {order.order_type}</span>
                  <span style={styles.urgencyLabel}>{urgency.label}</span>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.orderMeta}>
                    Order #{order.id} • {getElapsed(order.created_at)}
                  </div>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={styles.itemRow}>
                      <span><strong>{item.qty}x</strong> {item.name}</span>
                      <span style={styles.itemSize}>{item.size}</span>
                    </div>
                  ))}
                  <div style={styles.totalRow}>
                    Total: <strong>₹{order.total?.toFixed(0)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  emptyState: { textAlign: 'center', color: '#888', padding: 60 },
  emptyIcon: { fontSize: 48 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: { borderRadius: 10, overflow: 'hidden' },
  cardHeader: { color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderTitle: { fontWeight: 700 },
  urgencyLabel: { fontSize: 11, fontWeight: 700 },
  cardBody: { padding: '10px 14px', background: '#fff' },
  orderMeta: { fontSize: 12, color: '#888', marginBottom: 8 },
  itemRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 },
  itemSize: { color: '#888', fontSize: 12 },
  totalRow: { marginTop: 10, fontSize: 12, color: '#888' }
};
