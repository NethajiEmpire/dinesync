const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) {
    return null;
  }
  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modalBox, width }}>
        {title && (
          <div style={styles.header}>
            <h3 style={styles.title}>{title}</h3>
            <button onClick={onClose} style={styles.closeBtn}>×</button>
          </div>
        )}
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalBox: {
     background: '#fff', borderRadius: 12, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1 },
  body: { padding: 20 }
};

export default Modal;
