'use client';

import { useEffect } from 'react';
import { CONTACT_EMAIL } from '../lib/site';

// The last line of defence: this replaces the whole page, including the
// layout, when the layout itself fails. Because the stylesheet may be part
// of what failed, it styles itself inline and uses nothing from the app.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Site error:', error);
  }, [error]);

  return (
    <html lang="en-AU">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', color: '#172120', background: '#F3F5F4' }}>
        <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: '0 0 0.75rem' }}>Something went wrong on our side</h1>
          <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, margin: '0 0 1.5rem', color: '#4A5654' }}>
            Please try again. If it keeps happening, email {CONTACT_EMAIL} and tell us what you were doing.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: '#0E4A4D', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.7rem 1.4rem', fontSize: 'var(--text-base)', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
