import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div style={styles.container}>
      <div style={styles.backgroundImage} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
         {children}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')",
    backgroundSize: 'cover',
    opacity: 0.1,
  }
};