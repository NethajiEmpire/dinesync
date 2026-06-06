import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE, TEAL } from '../../constants/colors';
import { getDashboard } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading />;
  }

  const running = data?.running || {};
  const today = data?.today || {};

  const runningCards = [
    { label: 'RUNNING DINE-IN', count: running.dine_in || 0, amount: `₹${(running.dine_in_amount || 0).toFixed(2)}`, bg: '#ef4444', icon: '🍴' },
    { label: 'RUNNING PARCEL', count: running.parcel || 0, amount: `₹${(running.parcel_amount || 0).toFixed(2)}`, bg: ORANGE, icon: '🛒' },
    { label: 'RUNNING DELIVERY', count: running.delivery || 0, amount: `₹${(running.delivery_amount || 0).toFixed(2)}`, bg: TEAL, icon: '🚲' },
    { label: 'RUNNING OVERALL', count: running.total || 0, amount: `₹${(running.total_amount || 0).toFixed(2)}`, bg: PURPLE, icon: '⊞' },
  ];

  const completedCards = [
    { label: 'DINE-IN TODAY', count: today.dine_in || 0, amount: `₹${(today.dine_in_amount || 0).toFixed(2)}`, bg: GREEN, icon: '🍴' },
    { label: 'PARCEL TODAY', count: today.parcel || 0, amount: `₹${(today.parcel_amount || 0).toFixed(2)}`, bg: ORANGE, icon: '🛒' },
    { label: 'DELIVERY TODAY', count: today.delivery || 0, amount: `₹${(today.delivery_amount || 0).toFixed(2)}`, bg: TEAL, icon: '🚲' },
    { label: 'TODAY OVERALL', count: today.total || 0, amount: `₹${(today.total_amount || 0).toFixed(2)}`, bg: PURPLE, icon: '⊞' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.welcomeCard}>
        <h2 style={styles.welcomeTitle}>Welcome to Admin Panel!</h2>
        <p style={styles.welcomeSubtitle}>Real-time restaurant operations dashboard</p>
        <div style={styles.statsRow}>
          {[
            { label: "Today's Revenue", value: `₹${(today.total_amount || 0).toFixed(2)}`, color: '#4ade80' },
            { label: 'Total Orders', value: today.total || 0, color: '#60a5fa' },
            { label: 'Running Now', value: running.total || 0, color: '#fb923c' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={styles.sectionTitle}>🔴 Live Running Orders</h3>
      <div style={styles.grid}>
        {runningCards.map(c => (
          <div key={c.label} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: c.bg }}>
              <span style={styles.cardIcon}>{c.icon}</span>
              <span style={styles.cardLabel}>{c.label}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ ...styles.cardCount, color: c.bg }}>{c.count}</div>
              <div style={styles.cardAmount}>{c.amount}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={styles.sectionTitle}>✅ Today's Completed Orders</h3>
      <div style={styles.grid}>
        {completedCards.map(c => (
          <div key={c.label} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: c.bg }}>
              <span style={styles.cardIcon}>{c.icon}</span>
              <span style={styles.cardLabel}>{c.label}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ ...styles.cardCount, color: c.bg }}>{c.count}</div>
              <div style={styles.cardAmount}>{c.amount}</div>
            </div>
          </div>
        ))}
      </div>

      {data?.recent_sales?.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>📋 Recent Transactions</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead><tr style={styles.thRow}>
                {['Bill ID', 'Table', 'Order Type', 'Payment', 'Total', 'Time'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.recent_sales.slice(0, 10).map(s => (
                  <tr key={s.id} style={styles.tr}>
                    <td style={styles.tdId}>#{s.id}</td>
                    <td style={styles.td}>{s.table_name}</td>
                    <td style={styles.td}>{s.order_type}</td>
                    <td style={styles.td}>{s.payment_method}</td>
                    <td style={styles.tdTotal}>₹{s.total?.toFixed(2)}</td>
                    <td style={styles.tdDate}>{new Date(s.completed_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 24 },
  welcomeCard: { background: 'linear-gradient(135deg, #4a1b6e, #2d1b4e)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, color: '#fff' },
  welcomeTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
  welcomeSubtitle: { margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  statsRow: { display: 'flex', gap: 20, marginTop: 16 },
  statValue: { fontSize: 22, fontWeight: 800 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  cardHeader: { color: '#fff', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { fontSize: 18 },
  cardLabel: { fontSize: 10, fontWeight: 700, textAlign: 'right' },
  cardBody: { padding: '12px 16px', textAlign: 'right', background: '#fff' },
  cardCount: { fontSize: 32, fontWeight: 800 },
  cardAmount: { fontSize: 14, color: GREEN, fontWeight: 600 },
  tableContainer: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '10px 14px', color: PRIMARY, fontWeight: 600 },
  td: { padding: '10px 14px' },
  tdTotal: { padding: '10px 14px', fontWeight: 700, color: GREEN },
  tdDate: { padding: '10px 14px', color: '#888', fontSize: 12 }
};
