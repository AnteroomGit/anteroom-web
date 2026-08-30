'use client';

import { useState } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="ar-cookie-banner">
      <span>
        We use cookies to keep the site working properly and understand how it&apos;s used. See our{' '}
        <a href="/privacy">Privacy Policy</a> for details.
      </span>
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <button className="ar-cookie-btn ghost" onClick={() => setVisible(false)}>Essential only</button>
        <button className="ar-cookie-btn" onClick={() => setVisible(false)}>Accept all</button>
      </div>
    </div>
  );
}
