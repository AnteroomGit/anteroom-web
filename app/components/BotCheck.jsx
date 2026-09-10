'use client';

import { Turnstile } from '@marsidev/react-turnstile';

// Bot protection via Cloudflare Turnstile. onChange now receives the
// actual verification token (or null), not just a boolean, since the
// real check happens server-side against that token, not by trusting
// the browser's word that verification succeeded.
export default function BotCheck({ checked, onChange }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <p style={{ fontSize: '0.78rem', color: 'var(--clay)', marginBottom: '1.1rem' }}>
        Bot check not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable it.
      </p>
    );
  }

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={(token) => onChange(token)}
        onExpire={() => onChange(null)}
        onError={() => onChange(null)}
      />
    </div>
  );
}
