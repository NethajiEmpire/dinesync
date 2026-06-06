import React from 'react';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}