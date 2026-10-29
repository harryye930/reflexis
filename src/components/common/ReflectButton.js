import React from 'react';

export default function ReflectButton({ children = 'Reflect', className = '', ...props }) {
  return (
    <button type="button" {...props} className={`reflect-trigger ${className}`}>
      {children}
    </button>
  );
}
