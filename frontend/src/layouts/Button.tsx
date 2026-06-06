import React from 'react';
import './Button.css';

export default function Button({ children, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <button
      type={type}
      className={`custom-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}