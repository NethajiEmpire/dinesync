import { useState, useEffect } from 'react';
import { getSettings } from '../../services/api';
import { PRIMARY, PURPLE } from '../../constants/colors';
import AdminDashboard from './AdminDashboard';
import AdminSalesHistory from './AdminSalesHistory';
import AdminCancelledItems from './AdminCancelledItems';
import AdminSummary from './AdminSummary';
import AdminExpenses from './AdminExpenses';
import AdminEmployees from './AdminEmployees';
import AdminPartners from './AdminPartners';
import AdminSettings from './AdminSettings';
import Profile from '../Profile';
import AdminTables from './AdminTables';

const MENU_ITEMS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'tables', label: 'Tables & Areas', icon: '🪑' },
  { id: 'saleshistory', label: 'Sales History', label2: 'SLH', group: 'SALES' },
  { id: 'cancelleditems', label: 'Cancelled Items', label2: 'CX', group: 'SALES' },
  { id: 'summary', label: 'Summary', label2: 'SUM', group: 'SALES' },
  { id: 'expenses', label: 'Expenses', icon: '$', group: 'EXPENSES' },
  { id: 'employees', label: 'Employee Login', icon: '👁️' },
  { id: 'partners', label: 'Delivery Partners', icon: '🚴' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ user, onLogout }) {
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem('adminActiveTab');
    return MENU_ITEMS.some(m => m.id === saved) ? saved : 'dashboard';
  });
  const [restaurantName, setRestaurantName] = useState('Loading...');
  const [ownerName, setOwnerName] = useState(user?.name || 'Admin');

  useEffect(() => {
    localStorage.setItem('adminActiveTab', active);
  }, [active]);

  useEffect(() => {
    getSettings().then(res => {
      setRestaurantName(res.data.restaurant_name || 'RESTAURANT NAME');
      if (res.data.owner_name) setOwnerName(res.data.owner_name);
    }).catch(err => {
      console.error(err);
      setRestaurantName('RESTAURANT NAME');
    });
  }, []);

  const screens = {
    profile: <Profile user={user} />,
    dashboard: <AdminDashboard />,
    tables: <AdminTables />,
    saleshistory: <AdminSalesHistory />,
    cancelleditems: <AdminCancelledItems />,
    summary: <AdminSummary />,
    expenses: <AdminExpenses />,
    employees: <AdminEmployees user={user} />,
    partners: <AdminPartners />,
    settings: <AdminSettings />,
  };

  const groups = { SALES: 'Sales Reports', EXPENSES: 'Expenses' };
  let lastGroup = null;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.brandContainer}>
          <div style={styles.brandTitle}>🍽️ DINESYNC</div>
          <div style={styles.brandSubtitle}>{restaurantName}</div>
        </div>

        {/* User info */}
        <div 
          onClick={() => setActive('profile')} 
          style={{ ...styles.userInfo, cursor: 'pointer' }} 
          title="Go to Profile"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={styles.userAvatar}>
            {(ownerName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.userName}>{ownerName}</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
        </div>

        {/* Nav */}
        <div style={styles.navContainer}>
          {MENU_ITEMS.map(item => {
            const showGroupHeader = item.group && item.group !== lastGroup;
            if (showGroupHeader) {
              lastGroup = item.group;
            }
            return (
              <div key={item.id}>
                {showGroupHeader && (
                  <div style={styles.groupHeader}>{groups[item.group]}</div>
                )}
                <div
                  onClick={() => setActive(item.id)}
                  style={{
                    ...styles.navItem,
                    background: active === item.id ? PRIMARY : 'transparent',
                    color: active === item.id ? '#fff' : '#94a3b8',
                    boxShadow: active === item.id ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (active !== item.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (active !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {item.label2 && <span style={styles.navLabel2}>{item.label2}</span>}
                  {item.icon && <span style={styles.navIcon}>{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.logoutContainer}>
          <button 
            onClick={onLogout} 
            style={styles.logoutBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
          >
            ⏏ Logout Account
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        <div style={styles.topbar}>
          <h2 style={styles.topbarTitle}>
            {MENU_ITEMS.find(m => m.id === active)?.label || 'Dashboard'}
          </h2>
          <div style={styles.topbarRight}>
            <span style={styles.dateText}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span style={styles.bellIcon}>🔔
              <span style={styles.badge}>3</span>
            </span>
          </div>
        </div>
        <div>
          {screens[active] || <div style={styles.comingSoon}>🚧 Coming soon</div>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' },
  sidebar: { width: 250, background: "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.96) 100%), url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center', color: '#e2e8f0', height: '100vh', overflowY: 'auto', flexShrink: 0, position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.1)' },
  brandContainer: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  brandTitle: { color: '#fff', fontWeight: 900, fontSize: 20, marginBottom: 4, letterSpacing: 1 },
  brandSubtitle: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  userInfo: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' },
  userAvatar: { width: 40, height: 40, background: PURPLE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  userName: { fontSize: 14, color: '#fff', fontWeight: 600 },
  userRole: { fontSize: 12, color: '#94a3b8' },
  navContainer: { padding: '16px 12px', flex: 1 },
  groupHeader: { fontSize: 11, fontWeight: 700, color: '#64748b', padding: '16px 12px 6px', textTransform: 'uppercase', letterSpacing: 1 },
  navItem: { padding: '12px 14px', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease' },
  navLabel2: { fontSize: 10, fontWeight: 700, minWidth: 28, opacity: 0.9, background: 'rgba(255,255,255,0.1)', padding: '3px 6px', borderRadius: 6, textAlign: 'center' },
  navIcon: { fontSize: 16 },
  logoutContainer: { padding: '20px 16px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)' },
  logoutBtn: { width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' },
  mainContent: { flex: 1, overflowY: 'auto', background: '#f8fafc', minHeight: '100vh' },
  topbar: { background: '#fff', padding: '16px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  topbarTitle: { margin: 0, fontSize: 18, color: '#1e293b', fontWeight: 800 },
  topbarRight: { display: 'flex', gap: 16, alignItems: 'center' },
  dateText: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  bellIcon: { cursor: 'pointer', position: 'relative', fontSize: 18 },
  badge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  comingSoon: { padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 15 }
};
