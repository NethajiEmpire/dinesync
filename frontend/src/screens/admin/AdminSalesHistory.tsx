// AdminSalesHistory.jsx
import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { StatusBadge } from '../../components/Badge';
import { getSalesHistory } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminSalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    getSalesHistory().then(res => setSales(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter(s =>
    (!search || String(s.id).includes(search) || (s.table_name || '').toLowerCase().includes(search.toLowerCase())) &&
    (!dateFilter || new Date(s.completed_at || s.created_at).toLocaleDateString('en-CA') === dateFilter)
  );

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <input placeholder="Search Bill ID / Table..." value={search} onChange={e => setSearch(e.target.value)}
          style={styles.searchInput} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={styles.dateInput} />
        <Btn color="#6b7280" small onClick={() => { setSearch(''); setDateFilter(''); }}>Clear</Btn>
        <Btn color={GREEN} small style={styles.exportBtn}>⊞ Export Excel</Btn>
        <span style={styles.statsText}>{filtered.length} records | Total: <strong style={styles.totalRevenue}>₹{totalRevenue.toFixed(2)}</strong></span>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.thRow}>
            {['Bill ID', 'Status', 'Table', 'Order Type', 'Payment', 'Tax', 'Total', 'Completed At'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} style={styles.tr}>
                <td style={styles.tdId}>#{row.id}</td>
                <td style={styles.td}><StatusBadge status={row.status === 'completed' ? 'COMPLETED' : 'CANCELLED'} /></td>
                <td style={styles.td}>{row.table_name}</td>
                <td style={styles.td}>{row.order_type}</td>
                <td style={styles.td}>{row.payment_method}</td>
                <td style={styles.td}>₹{((row.cgst || 0) + (row.sgst || 0)).toFixed(2)}</td>
                <td style={styles.tdTotal}>₹{row.total?.toFixed(2)}</td>
                <td style={styles.tdDate}>{new Date(row.completed_at || row.created_at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={styles.noRecords}>No records</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  headerRow: { display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, width: 220 },
  dateInput: { padding: '7px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  exportBtn: { marginLeft: 'auto' },
  statsText: { fontSize: 13, color: '#888' },
  totalRevenue: { color: GREEN },
  tableContainer: { overflowX: 'auto', background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  tdId: { padding: '10px 14px', color: PRIMARY, fontWeight: 600 },
  td: { padding: '10px 14px' },
  tdTotal: { padding: '10px 14px', fontWeight: 700, color: GREEN },
  tdDate: { padding: '10px 14px', whiteSpace: 'nowrap', color: '#888', fontSize: 12 },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 }
};
