'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Shown inside the normal page frame when something on a page throws while
// it is running. It keeps the person on the site with a way forward instead
// of Next's bare error screen. It deliberately does not show the error text:
// that is for the console and the server logs, not for a director.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="ar-root">
      <div className="ar-404">
        <h1 className="ar-h1">Something went wrong on our side</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          Try again, and if it keeps happening, tell us on the{' '}
          <Link href="/contact">contact page</Link>. If you are working to a deadline on a notice,
          do not wait for us: speak to a registered liquidator or your accountant.
        </p>
        <button type="button" className="ar-btn-primary" onClick={() => reset()}>Try again</button>
        <p style={{ marginTop: '1.25rem', fontSize: 'var(--text-base)' }}><Link href="/">Back to AnteRoom</Link></p>
      </div>
    </div>
  );
}
