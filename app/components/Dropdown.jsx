'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'transparent', border: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer',
          color: selected ? 'var(--ink)' : 'var(--ink-soft)', padding: 0,
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={15} style={{ color: 'var(--ink-soft)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 40,
            background: 'var(--paper-raised)', border: '1.5px solid var(--line)', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(33,21,48,0.12)', overflow: 'hidden', minWidth: 220,
          }}
        >
          {options.map((o) => (
            <div
              key={o.value || o.label}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '0.65rem 0.9rem', fontSize: '0.92rem', cursor: 'pointer',
                background: o.value === value ? 'var(--brand-tint)' : 'transparent',
                color: o.value === value ? 'var(--brand)' : 'var(--ink)',
              }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = 'var(--brand-tint)'; }}
              onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
