import { useState, useEffect } from 'react';
import { GREEN, PRIMARY } from '../constants/colors';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now() + Math.random();
      const { message, title, type = 'success' } = e.detail;
      const newToast = { id, message, title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification'), type };
      
      setToasts(prev => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000); // Auto close after 4 seconds
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#fff',
          borderLeft: `4px solid ${t.type === 'error' ? '#ef4444' : (t.type === 'info' ? PRIMARY : GREEN)}`,
          minWidth: 300,
          maxWidth: 400,
          padding: '16px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          animation: 'toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          position: 'relative'
        }}>
          {/* Icon Circle */}
          <div style={{ marginTop: 2 }}>
            {t.type === 'success' && (
              <div style={{width:26, height:26, borderRadius:'50%', background: `${GREEN}22`, color: GREEN, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 'bold'}}>✓</div>
            )}
            {t.type === 'error' && (
              <div style={{width:26, height:26, borderRadius:'50%', background: '#fef2f2', color: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 'bold'}}>✕</div>
            )}
            {t.type === 'info' && (
              <div style={{width:26, height:26, borderRadius:'50%', background: `${PRIMARY}22`, color: PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontStyle: 'italic', fontWeight: 'bold'}}>i</div>
            )}
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, paddingRight: 16 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t.title}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#4b5563', lineHeight: 1.4 }}>
              {t.message}
            </p>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              fontSize: 20, 
              color: '#9ca3af', 
              cursor: 'pointer', 
              position: 'absolute', 
              top: 12, 
              right: 12,
              lineHeight: 1,
              padding: 4
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
