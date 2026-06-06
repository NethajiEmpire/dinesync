import { PRIMARY } from '../constants/colors';

const Btn = ({ children, onClick, color = PRIMARY, outline = false, small = false, style = {}, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? '#e5e7eb' : outline ? 'transparent' : color,
      color: disabled ? '#9ca3af' : outline ? color : '#fff',
      border: `1.5px solid ${disabled ? '#e5e7eb' : color}`,
      borderRadius: 6,
      padding: small ? '4px 12px' : '7px 16px',
      fontSize: small ? 12 : 13,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      ...style
    }}
  >
    {children}
  </button>
);

export default Btn;
