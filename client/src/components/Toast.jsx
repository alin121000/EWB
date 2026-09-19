import { useEffect, useState } from 'react';
import { emit, on } from '../lib/bus.js';

export function toast(message) {
  emit('toast', message);
}

export default function Toast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const off = on('toast', (msg) => {
      setMessage(msg);
      const t = setTimeout(() => setMessage(null), 2200);
      return () => clearTimeout(t);
    });
    return off;
  }, []);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(var(--nav-h) + 18px + env(safe-area-inset-bottom))',
        background: '#1c1c1a',
        color: 'white',
        padding: '10px 18px',
        borderRadius: 999,
        fontSize: 14,
        zIndex: 60,
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
      }}
    >
      {message}
    </div>
  );
}
