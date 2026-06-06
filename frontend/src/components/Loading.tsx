import { PRIMARY } from '../constants/colors';

const Loading = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#888', gap: 10 }}>
    <div style={{
      width: 20, height: 20, border: `3px solid #e5e7eb`,
      borderTop: `3px solid ${PRIMARY}`, borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    {text}
  </div>
);

export default Loading;
