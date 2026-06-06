import { PRIMARY } from '../constants/colors';

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 10px',
      cursor: 'pointer',
      position: 'relative',
      background: active ? PRIMARY : 'transparent',
      color: active ? '#fff' : '#555',
      borderRadius: 8,
      minWidth: 60,
      transition: 'all 0.15s',
      userSelect: 'none'
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = '#f3f4f6';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span style={{ fontSize: 10, marginTop: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    {badge > 0 && (
      <span style={{
        position: 'absolute', top: 4, right: 6,
        background: '#ef4444', color: '#fff',
        fontSize: 10, borderRadius: 10, padding: '0 5px', fontWeight: 700,
        minWidth: 16, textAlign: 'center'
      }}>{badge}</span>
    )}
  </div>
);

export default NavItem;
