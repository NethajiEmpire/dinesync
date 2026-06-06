import { useState, useEffect } from 'react';
import { PRIMARY, GREEN, PURPLE, ORANGE, TEAL } from '../../constants/colors';
import { getSalesHistory, getExpenses } from '../../services/api';
import Loading from '../../components/Loading';

export default function AdminSummary() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    Promise.all([getSalesHistory(), getExpenses()])
      .then(([sRes, eRes]) => { setSales(sRes.data); setExpenses(eRes.data); })
      .finally(() => setLoading(false));
  }, []);

  const filterByPeriod = (items, dateField) => {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField] || item.created_at);
      if (period === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const s = new Date(now);
        s.setDate(s.getDate() - 7);
        return d >= s;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredSales = filterByPeriod(sales.filter(s => s.status === 'completed'), 'completed_at');
  const filteredExpenses = filterByPeriod(expenses, 'date');

  const totalRevenue = filteredSales.reduce((s, o) => s + (o.total || 0), 0);
  const totalTax = filteredSales.reduce((s, o) => s + ((o.cgst || 0) + (o.sgst || 0)), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const payMethods = ['CASH', 'CARD', 'UPI', 'ONLINE', 'CREDIT'];
  const byPayment = {};
  payMethods.forEach(m => { byPayment[m] = filteredSales.filter(s => s.payment_method === m).reduce((s, o) => s + (o.total || 0), 0); });

  const byType = {};
  ['Dine In', 'Take Away', 'Home Delivery'].forEach(t => { byType[t] = filteredSales.filter(s => s.order_type === t).reduce((s, o) => s + (o.total || 0), 0); });

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.filterRow}>
        {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']].map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)} style={{
            ...styles.filterBtn, border: `1.5px solid ${val === period ? PURPLE : '#e5e7eb'}`,
            background: val === period ? PURPLE : '#fff', color: val === period ? '#fff' : '#555'
          }}>{label}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: '💰', color: GREEN },
          { label: 'Total Orders', value: filteredSales.length, icon: '📋', color: PURPLE },
          { label: 'Tax Collected', value: `₹${totalTax.toFixed(2)}`, icon: '🏛️', color: ORANGE },
          { label: 'Net Profit', value: `₹${netProfit.toFixed(2)}`, icon: '📈', color: netProfit >= 0 ? GREEN : '#ef4444' },
        ].map(c => (
          <div key={c.label} style={styles.summaryCard}>
            <div style={{ ...styles.summaryCardHeader, background: c.color }}>
              <span style={styles.cardIcon}>{c.icon}</span>
              <span style={styles.cardLabel}>{c.label}</span>
            </div>
            <div style={styles.summaryCardBody}>
              <div style={{ ...styles.cardValue, color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.detailsGrid}>
        {/* Payment breakdown */}
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>💳 Payment Breakdown</h3>
          {payMethods.map(m => (
            <div key={m} style={styles.barRow}>
              <span style={styles.barLabel}>{m}</span>
              <div style={styles.barContainer}>
                <div style={{ ...styles.barFill, background: PRIMARY, width: `${totalRevenue > 0 ? (byPayment[m] / totalRevenue * 100) : 0}%` }} />
              </div>
              <span style={{ ...styles.barValue, color: PRIMARY }}>₹{byPayment[m].toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Order type breakdown */}
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>🍴 Order Type Breakdown</h3>
          {Object.entries(byType).map(([type, amount]) => (
            <div key={type} style={styles.barRow}>
              <span style={styles.barLabel}>{type}</span>
              <div style={styles.barContainer}>
                <div style={{ ...styles.barFill, background: TEAL, width: `${totalRevenue > 0 ? (amount / totalRevenue * 100) : 0}%` }} />
              </div>
              <span style={{ ...styles.barValue, color: TEAL }}>₹{amount.toFixed(2)}</span>
            </div>
          ))}
          <div style={styles.expensesFooter}>
            <div style={styles.expensesFooterFlex}>
              <span>Total Expenses</span><span style={styles.expensesValue}>₹{totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20 },
  filterBtn: { padding: '7px 16px', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  summaryCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  summaryCardHeader: { color: '#fff', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 18 },
  cardLabel: { fontSize: 12, fontWeight: 700 },
  summaryCardBody: { padding: '12px 16px', textAlign: 'right' },
  cardValue: { fontSize: 22, fontWeight: 800 },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  detailCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 },
  detailTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16 },
  barRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  barLabel: { fontSize: 13 },
  barContainer: { flex: 1, margin: '0 12px', height: 6, background: '#f3f4f6', borderRadius: 3 },
  barFill: { height: '100%', borderRadius: 3 },
  barValue: { fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' },
  expensesFooter: { marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6' },
  expensesFooterFlex: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
  expensesValue: { color: '#ef4444', fontWeight: 600 }
};
