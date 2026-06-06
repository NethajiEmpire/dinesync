import { useState, useEffect } from 'react';
import { PRIMARY, PURPLE, GREEN, ORANGE } from '../../constants/colors';
import { Badge } from '../../components/Badge';
import { getOrders } from '../../services/api';
import Loading from '../../components/Loading';

export default function RecentsScreen({ onEditOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(res => {
      setOrders(res.data.filter(o => o.status === 'running'));
    }).finally(() => setLoading(false));
  }, []);

  const takeAway = orders.filter(o => o.order_type === 'Take Away');
  const delivery = orders.filter(o => o.order_type === 'Home Delivery');

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {[
          { label: 'Take Away', icon: '🛒', data: takeAway, color: PURPLE },
          { label: 'Home Delivery', icon: '🚲', data: delivery, color: ORANGE }
        ].map(({ label, icon, data, color }) => (
          <div key={label} style={styles.card}>
            <div style={styles.cardHeader}>
              {icon} {label} <Badge color={color}>{data.length}</Badge>
            </div>
            <div style={styles.innerGrid}>
              <div style={styles.leftPanel}>
                <div style={styles.panelHeader}>
                  <span style={styles.panelTitle}>KOT Records</span>
                  <Badge color={PURPLE}>KOT</Badge>
                </div>
                {data.length === 0
                  ? <p style={styles.emptyText}>No KOT records</p>
                  : data.map(o => (
                    <div 
                      key={o.id} 
                      style={{ ...styles.kotItem, cursor: 'pointer' }}
                      onClick={() => onEditOrder && onEditOrder(o)}
                      title="Click to Edit Order"
                    >
                      <span style={styles.kotIcon}>📋</span>
                      <Badge color={PRIMARY}>#{o.id}</Badge>
                      <span style={styles.kotAmount}>₹{o.total?.toFixed(0)}</span>
                    </div>
                  ))
                }
              </div>
              <div style={styles.rightPanel}>
                <div style={styles.panelHeader}>
                  <span style={styles.panelTitle}>Invoice Records</span>
                  <Badge color={GREEN}>INV</Badge>
                </div>
                <p style={styles.emptyText}>No invoice records</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  cardHeader: { padding: '12px 16px', background: '#f9fafb', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
  innerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  leftPanel: { borderRight: '1px solid #e5e7eb', padding: 12 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  panelTitle: { fontWeight: 600, fontSize: 13 },
  emptyText: { color: '#bbb', fontSize: 12 },
  kotItem: { background: '#f3f4f6', padding: '8px 12px', borderRadius: 8, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' },
  kotIcon: { fontSize: 12 },
  kotAmount: { fontSize: 12 },
  rightPanel: { padding: 12 }
};
