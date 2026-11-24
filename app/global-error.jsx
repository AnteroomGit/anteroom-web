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
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', color: '#362B4A', background: '#EFE9F4' }}>
        <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>Something went wrong on our side</h1>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.5rem', color: '#6B5F7A' }}>
            Please try again. If it keeps happening, email {CONTACT_EMAIL} and tell us what you were doing.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: '#392061', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
