import { PRIMARY, GREEN, ORANGE } from '../constants/colors';

export const Badge = ({ children, color = PRIMARY, style = {} }) => (
  <span style={{
    background: color,
    color: '#fff',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 600,
    display: 'inline-block',
    ...style
  }}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED: GREEN, CANCELLED: '#ef4444', Paid: GREEN,
    Suspense: ORANGE, Due: '#ef4444',
    Running: ORANGE, Available: '#16a34a', pending: ORANGE,
    active: GREEN, inactive: '#6b7280'
  };
  return <Badge color={map[status] || '#6b7280'}>{status}</Badge>;
};
