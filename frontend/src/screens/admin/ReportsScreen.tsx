import React, { useState, useEffect } from 'react';
import { PRIMARY, PURPLE, GREEN, ORANGE } from '../../constants/colors';
import { getSalesHistory } from '../../services/api';
import Loading from '../../components/Loading';
import Btn from '../../components/Btn';

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState('overall');
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSalesHistory();
        setSalesData(res.data.filter(s => s.status === 'completed'));
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderOverall = () => {
    const totalRevenue = salesData.reduce((sum, item) => sum + item.total, 0);
    const paymentBreakdown = salesData.reduce((acc, curr) => {
      acc[curr.payment_method] = (acc[curr.payment_method] || 0) + curr.total;
      return acc;
    }, {});

    return (
      <div style={styles.grid}>
        <div style={{ ...styles.card, background: GREEN }}>
          <h3 style={styles.cardLabel}>Total Revenue</h3>
          <h2 style={styles.cardValue}>₹{totalRevenue.toFixed(2)}</h2>
        </div>
        <div style={{ ...styles.card, background: PRIMARY }}>
          <h3 style={styles.cardLabel}>Total Orders</h3>
          <h2 style={styles.cardValue}>{salesData.length}</h2>
        </div>
        <div style={{ ...styles.card, background: PURPLE }}>
          <h3 style={styles.cardLabel}>Cash Received</h3>
          <h2 style={styles.cardValue}>₹{(paymentBreakdown['CASH'] || 0).toFixed(2)}</h2>
        </div>
        <div style={{ ...styles.card, background: ORANGE }}>
          <h3 style={styles.cardLabel}>UPI / Online</h3>
          <h2 style={styles.cardValue}>₹{((paymentBreakdown['UPI'] || 0) + (paymentBreakdown['ONLINE'] || 0)).toFixed(2)}</h2>
        </div>
      </div>
    );
  };

  const renderFineDine = () => {
    const getStats = (typePrefix) => {
        const subset = salesData.filter(s => s.table_name && String(s.table_name).startsWith(typePrefix));
        return { count: subset.length, total: subset.reduce((acc, curr) => acc + curr.total, 0) };
    };

    const fd = salesData.filter(s => !isNaN(parseInt(s.table_name))); // Numeric table IDs mean pure finedine usually
    const qsr = getStats('DI-');
    const ta = getStats('TA');
    const hd = getStats('HD');

    return (
      <div style={styles.grid}>
         {/* Render stats cards similarly using the grouped subsets */}
         <div style={{...styles.infoCard}}>
            <h4>Fine Dine (Standard)</h4>
            <p>Orders: {fd.length}</p>
            <h2>₹{fd.reduce((acc, c) => acc + c.total, 0).toFixed(2)}</h2>
         </div>
         <div style={{...styles.infoCard}}>
            <h4>QSR / Direct</h4>
            <p>Orders: {qsr.count}</p>
            <h2>₹{qsr.total.toFixed(2)}</h2>
         </div>
         <div style={{...styles.infoCard}}>
            <h4>Take Away (Parcel)</h4>
            <p>Orders: {ta.count}</p>
            <h2>₹{ta.total.toFixed(2)}</h2>
         </div>
         <div style={{...styles.infoCard}}>
            <h4>Home Delivery</h4>
            <p>Orders: {hd.count}</p>
            <h2>₹{hd.total.toFixed(2)}</h2>
         </div>
      </div>
    );
  };

  const renderCustom = () => {
    // Find all orders that do not strictly match pure numbers (FineDine), 'TA', 'HD', or 'DI-'
    const customOrders = salesData.filter(s => {
        const tn = String(s.table_name);
        if (!isNaN(parseInt(tn))) return false;
        if (tn.startsWith('TA') || tn.startsWith('HD') || tn.startsWith('DI-')) return false;
        return true;
    });

    const sectionMap = {};
    customOrders.forEach(o => {
        const match = String(o.table_name).match(/^[A-Za-z]+/);
        const prefix = match ? match[0] : 'Other';
        if (!sectionMap[prefix]) sectionMap[prefix] = { count: 0, total: 0 };
        sectionMap[prefix].count += 1;
        sectionMap[prefix].total += o.total;
    });

    return (
      <div style={styles.grid}>
         {Object.entries(sectionMap).map(([prefix, stats]) => (
           <div key={prefix} style={styles.infoCard}>
              <h4>{prefix} (Custom Section)</h4>
              <p>Orders: {stats.count}</p>
              <h2>₹{stats.total.toFixed(2)}</h2>
           </div>
         ))}
         {Object.keys(sectionMap).length === 0 && (
            <p style={{ color: '#888', gridColumn: '1/-1' }}>No custom floor sales data found.</p>
         )}
      </div>
    );
  };

  const renderItems = () => {
    const itemStats = {};
    
    salesData.forEach(order => {
      (order.items || []).forEach(item => {
        const key = `${item.name} ${item.size && item.size !== 'Regular' ? `(${item.size})` : ''}`.trim();
        if (!itemStats[key]) itemStats[key] = { qty: 0, revenue: 0 };
        itemStats[key].qty += item.qty;
        itemStats[key].revenue += (item.qty * item.unit_price);
      });
    });

    const sortedItems = Object.entries(itemStats).sort((a, b) => b[1].revenue - a[1].revenue);

    return (
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Item Name</th>
              <th style={styles.th}>Qty Sold</th>
              <th style={styles.th}>Total Revenue (Base Price)</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(([name, stats]) => (
              <tr key={name} style={styles.tr}>
                <td style={styles.td}>{name}</td>
                <td style={styles.td}>{stats.qty}</td>
                <td style={styles.tdAmount}>₹{stats.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {sortedItems.length === 0 && <tr><td colSpan="3" style={styles.emptyState}>No items sold yet.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <Loading />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📊 Advanced Sales Reports</h2>
      </div>
      
      <div style={styles.tabsRow}>
        {['overall', 'finedine', 'custom', 'items'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            style={{
                ...styles.tabBtn, 
                background: activeTab === tab ? PRIMARY : '#f1f5f9',
                color: activeTab === tab ? '#fff' : '#475569'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'overall' && renderOverall()}
        {activeTab === 'finedine' && renderFineDine()}
        {activeTab === 'custom' && renderCustom()}
        {activeTab === 'items' && renderItems()}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px 32px', background: '#f8fafc', minHeight: '100%' },
  header: { marginBottom: 20 },
  tabsRow: { display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 16 },
  tabBtn: { padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  content: { background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  card: { padding: 24, borderRadius: 16, color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  cardLabel: { margin: 0, fontSize: 14, opacity: 0.9, textTransform: 'uppercase' },
  cardValue: { margin: '8px 0 0', fontSize: 28, fontWeight: 900 },
  infoCard: { padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' },
  tableWrapper: { overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thRow: { background: '#f8fafc' },
  th: { padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', color: '#1e293b', fontWeight: 500 },
  tdAmount: { padding: '12px 16px', fontWeight: 700, color: '#10b981' },
  emptyState: { textAlign: 'center', padding: 40, color: '#94a3b8' }
};