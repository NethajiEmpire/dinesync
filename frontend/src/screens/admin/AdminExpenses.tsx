import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE } from '../../constants/colors';
import Btn from '../../components/Btn';
import { getExpenses } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    getExpenses().then(res => setExpenses(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = expenses.filter(e =>
    (!search || (e.category || '').toLowerCase().includes(search.toLowerCase()) || (e.vendor || '').toLowerCase().includes(search.toLowerCase())) &&
    (!dateFilter || e.date === dateFilter)
  );

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <input placeholder="Search category / vendor..." value={search} onChange={e => setSearch(e.target.value)}
          style={styles.searchInput} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={styles.dateInput} />
        <Btn color="#6b7280" small onClick={() => { setSearch(''); setDateFilter(''); }}>Clear</Btn>
        <Btn color={GREEN} small style={styles.exportBtn}>⊞ Export</Btn>
        <span style={styles.statsText}>
          {filtered.length} records | Total: <strong style={styles.totalText}>₹{total.toLocaleString('en-IN')}</strong>
        </span>
      </div>

      {/* Category Summary */}
      <div style={styles.categorySummaryRow}>
        {[...new Set(filtered.map(e => e.category))].map(cat => {
          const catTotal = filtered.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
          return (
            <div key={cat} style={styles.categoryCard}>
              <div style={styles.categoryLabel}>{cat}</div>
              <div style={styles.categoryAmount}>₹{catTotal.toLocaleString('en-IN')}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead><tr style={styles.thRow}>
            {['ID', 'Category', 'Sub Category', 'Employee', 'Vendor', 'Payment', 'Amount', 'Date'].map(h => (
              <th key={h} style={{ ...styles.th, color: h === 'Amount' ? GREEN : '#333' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} style={styles.tr}>
                <td style={styles.td}>#{row.id}</td>
                <td style={styles.tdCategory}>{row.category}</td>
                <td style={styles.tdMuted}>{row.sub_category || '-'}</td>
                <td style={styles.td}>{row.employee || '-'}</td>
                <td style={styles.td}>{row.vendor || '-'}</td>
                <td style={styles.td}>{row.payment_type}</td>
                <td style={styles.tdAmount}>₹{Number(row.amount).toLocaleString('en-IN')}</td>
                <td style={styles.tdDate}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={styles.noRecords}>No expenses found</p>}
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
  totalText: { color: '#ef4444' },
  categorySummaryRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  categoryCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', minWidth: 140 },
  categoryLabel: { fontSize: 12, color: '#888' },
  categoryAmount: { fontSize: 18, fontWeight: 700, color: ORANGE },
  tableContainer: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thRow: { background: '#f9fafb' },
  th: { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '10px 14px' },
  tdCategory: { padding: '10px 14px', fontWeight: 600 },
  tdMuted: { padding: '10px 14px', color: '#888' },
  tdAmount: { padding: '10px 14px', color: '#ef4444', fontWeight: 700 },
  tdDate: { padding: '10px 14px', color: '#888', whiteSpace: 'nowrap' },
  noRecords: { textAlign: 'center', color: '#888', padding: 40 }
};
