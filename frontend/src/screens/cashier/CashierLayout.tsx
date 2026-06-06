import { useState } from 'react';
import { PRIMARY } from '../../constants/colors';
import NavItem from '../../components/NavItem';
import OrdersScreen from './OrdersScreen';
import FineDineScreen from './FineDineScreen';
import QSRScreen from './QSRScreen';
import RecentsScreen from './RecentsScreen';
import HistoryScreen from './HistoryScreen';
import ExpensesScreen from './ExpensesScreen';
import ReportScreen from './ReportScreen';
import InventoryScreen from './InventoryScreen';
import KitchenScreen from './KitchenScreen';
import MenuScreen from './MenuScreen';
import SettingsScreen from './SettingsScreen';

export default function CashierLayout({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('orders');
  const [runningOrders, setRunningOrders] = useState(0);
  const [editOrderData, setEditOrderData] = useState(null);

  const handleEditOrder = (order) => {
    setEditOrderData(order);
    setActiveNav('finedine');
  };

  const navItems = [
    { id: 'orders', icon: '📋', label: 'ORDERS', badge: runningOrders },
    { id: 'finedine', icon: '🖥️', label: 'FINE DINE' },
    { id: 'qsr', icon: '🍔', label: 'QSR' },
    { id: 'recents', icon: '🕐', label: 'RECENTS' },
    { id: 'history', icon: '⊞', label: 'HISTORY' },
    { id: 'report', icon: '📄', label: 'REPORT' },
    { id: 'expenses', icon: '💲', label: 'EXPENSES' },
    { id: 'inventory', icon: '🗃️', label: 'INVENTORY' },
    { id: 'kitchen', icon: '🍴', label: 'KITCHEN' },
    { id: 'menu', icon: '✂️', label: 'MENU' },
    { id: 'settings', icon: '⚙️', label: 'SETTINGS' },
  ];

  const screens = {
    orders: <OrdersScreen setRunningOrders={setRunningOrders} />,
    finedine: <FineDineScreen editOrderData={editOrderData} clearEditOrder={() => setEditOrderData(null)} />,
    qsr: <QSRScreen />,
    recents: <RecentsScreen onEditOrder={handleEditOrder} />,
    history: <HistoryScreen />,
    report: <ReportScreen />,
    expenses: <ExpensesScreen />,
    inventory: <InventoryScreen />,
    kitchen: <KitchenScreen />,
    menu: <MenuScreen />,
    settings: <SettingsScreen />,
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.layout}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>
          🍽️ DineDesk
        </div>
        <div style={styles.navScroll}>
          {navItems.map(n => (
            <NavItem key={n.id} {...n} active={activeNav === n.id} onClick={() => setActiveNav(n.id)} />
          ))}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.name || 'Cashier'}</div>
          <div style={styles.userTime}>{timeStr} IST</div>
        </div>
        <button
          onClick={onLogout}
          style={styles.logoutBtn}
        >⏏ Logout</button>
      </div>

      {/* Screen Content */}
      <div style={styles.contentArea}>
        {screens[activeNav] || (
          <div style={styles.constructionState}>
            🚧 Screen under construction
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh' },
  header: { background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 12px', position: 'sticky', top: 0, zIndex: 100, height: 90 },
  brand: { color: PRIMARY, fontWeight: 900, fontSize: 18, marginRight: 12, minWidth: 110 },
  navScroll: { display: 'flex', gap: 2, flex: 1, overflowX: 'auto' },
  userInfo: { marginLeft: 12, textAlign: 'right', fontSize: 12, minWidth: 100 },
  userName: { color: PRIMARY, fontWeight: 700 },
  userTime: { color: '#888' },
  logoutBtn: { marginLeft: 12, background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#555' },
  contentArea: { minHeight: 'calc(100vh - 56px)' },
  constructionState: { padding: 40, textAlign: 'center', color: '#888', fontSize: 16 }
};
