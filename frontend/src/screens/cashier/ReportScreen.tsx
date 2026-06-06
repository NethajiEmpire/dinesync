import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import { getSalesHistory } from '../../services/api';
import Loading from '../../components/Loading';

export default function ReportScreen() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesHistory().then(res => setSales(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading />;
  }

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.completed_at || s.created_at).toDateString() === today);
  const totalRevenue = todaySales.reduce((s, o) => s + (o.total || 0), 0);
  const totalTax = todaySales.reduce((s, o) => s + ((o.cgst || 0) + (o.sgst || 0)), 0);
  const dineIn = todaySales.filter(o => o.order_type === 'Dine In').length;
  const takeAway = todaySales.filter(o => o.order_type === 'Take Away').length;

  const cards = [
    { label: "Today's Revenue", value: `₹${totalRevenue.toFixed(2)}`, icon: '💰', color: GREEN },
    { label: "Today's Orders", value: todaySales.length, icon: '📋', color: PRIMARY },
    { label: "Dine-In Orders", value: dineIn, icon: '🍴', color: ORANGE },
    { label: "Take-Away Orders", value: takeAway, icon: '🛒', color: PURPLE },
    { label: "Total Tax Collected", value: `₹${totalTax.toFixed(2)}`, icon: '🏛️', color: '#6b7280' },
    { label: "Avg Order Value", value: todaySales.length > 0 ? `₹${(totalRevenue / todaySales.length).toFixed(2)}` : '₹0', icon: '📊', color: '#2563eb' },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📄 Daily Report — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
      <div style={styles.grid}>
        {cards.map(c => (
          <div key={c.label} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: c.color }}>
              <span style={styles.cardIcon}>{c.icon}</span>
              <span style={styles.cardLabel}>{c.label}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ ...styles.cardValue, color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={styles.sectionTitle}>Today's Sales</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              {['#', 'Table', 'Order Type', 'Payment', 'Tax', 'Total', 'Time'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {todaySales.map(row => (
              <tr key={row.id} style={styles.tr}>
                <td style={styles.tdId}>#{row.id}</td>
                <td style={styles.td}>{row.table_name}</td>
                <td style={styles.td}>{row.order_type}</td>
                <td style={styles.td}>{row.payment_method}</td>
                <td style={styles.td}>₹{((row.cgst || 0) + (row.sgst || 0)).toFixed(2)}</td>
                <td style={styles.tdAmount}>₹{row.total?.toFixed(2)}</td>
                <td style={styles.tdTime}>{new Date(row.completed_at || row.created_at).toLocaleTimeString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {todaySales.length === 0 && <p style={styles.emptyState}>No sales today yet</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  cardHeader: { color: '#fff', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' },
  cardIcon: { fontSize: 20 },
  cardLabel: { fontSize: 12, fontWeight: 700 },
  cardBody: { padding: '14px 16px', textAlign: 'right' },
  cardValue: { fontSize: 26, fontWeight: 800 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '8px 12px', color: PRIMARY, fontWeight: 600 },
  td: { padding: '8px 12px' },
  tdAmount: { padding: '8px 12px', fontWeight: 700, color: GREEN },
  tdTime: { padding: '8px 12px', color: '#888', fontSize: 12 },
  emptyState: { textAlign: 'center', color: '#888', padding: 40 }
};
