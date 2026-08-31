'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * Placeholder bot check. This is NOT real bot protection — it's a UI
 * placeholder in the right spot, styled like the real thing.
 *
 * To make this genuinely block bots, swap this component out for
 * Cloudflare Turnstile (free, privacy-friendly, no puzzles):
 *   1. Sign up at dash.cloudflare.com -> Turnstile, add "anteroom.com.au"
 *   2. You'll get a public Site Key
 *   3. npm install @marsidev/react-turnstile
 *   4. Replace the button below with <Turnstile siteKey="..." onSuccess={...} />
 * Real verification also needs the token checked server-side, which
 * needs a backend — same "not yet built" boundary as login and email.
 */
export default function BotCheck({ checked, onChange }) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (checked) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onChange(true);
    }, 500);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        border: '1.5px solid var(--line)', borderRadius: 10, padding: '0.7rem 0.9rem',
        cursor: checked ? 'default' : 'pointer', marginBottom: '1.1rem', maxWidth: 260,
        background: checked ? 'var(--sage-tint)' : 'var(--paper-raised)',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${checked ? 'var(--sage)' : 'var(--line)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: checked ? 'var(--sage)' : 'transparent',
      }}>
        {checked && <Check size={13} color="#fff" />}
      </div>
      <span style={{ fontSize: '0.86rem' }}>
        {loading ? 'Checking...' : checked ? 'Verified' : "I'm not a robot"}
      </span>
    </div>
  );
}
