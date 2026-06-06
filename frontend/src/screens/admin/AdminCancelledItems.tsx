import { useState, useEffect } from 'react';
import { PRIMARY, GREEN } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getSalesHistory } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminCancelledItems() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesHistory().then(res => setSales(res.data.filter(s => s.status === 'cancelled'))).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.headerTitle}>Cancelled Orders ({sales.length})</span>
        <Btn color={GREEN} small>⊞ Export</Btn>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.thRow}>
            {['Bill ID', 'Table', 'Order Type', 'Total', 'Cancelled At'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sales.map(row => (
              <tr key={row.id} style={styles.tr}>
                <td style={styles.tdId}>#{row.id}</td>
                <td style={styles.td}>{row.table_name}</td>
                <td style={styles.td}>{row.order_type}</td>
                <td style={styles.tdTotal}>₹{row.total?.toFixed(2)}</td>
                <td style={styles.tdDate}>{new Date(row.created_at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p style={styles.noRecords}>No cancelled orders 🎉</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontWeight: 700 },
  tableContainer: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '10px 14px', color: '#ef4444', fontWeight: 600 },
  td: { padding: '10px 14px' },
  tdTotal: { padding: '10px 14px', color: '#ef4444', fontWeight: 700 },
  tdDate: { padding: '10px 14px', color: '#888', fontSize: 12 },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 }
};
