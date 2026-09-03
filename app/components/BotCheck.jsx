'use client';

import { Turnstile } from '@marsidev/react-turnstile';

// Real bot protection via Cloudflare Turnstile. Replaces the earlier
// placeholder. Needs a real site key from dash.cloudflare.com (Turnstile
// product, free tier) added as NEXT_PUBLIC_TURNSTILE_SITE_KEY.
// Like the Supabase keys, this one is meant to be public. Add it in
// Vercel as type "Config", not "Secret".
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
        onSuccess={() => onChange(true)}
        onExpire={() => onChange(false)}
        onError={() => onChange(false)}
      />
    </div>
  );
}
