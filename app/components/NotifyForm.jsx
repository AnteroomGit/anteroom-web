'use client';

import { useId, useState } from 'react';

// "Tell us where you are" capture for a director whose area has no verified
// practitioner yet. It replaces a "Get notified" link that only opened the
// contact page. The address and region are stored through /api/contact
// (kind: waitlist) in the same contact_messages table as other messages.
// Someone has to check that table and write to people when a practitioner
// is listed, so only promise what you will actually do.
export default function NotifyForm() {
  const emailId = useId();
  const regionId = useId();
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [website, setWebsite] = useState(''); // hidden field: people leave it empty, bots fill it
  const [state, setState] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'waitlist', email, region, website }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Something went wrong. Please try again.');
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <p role="status" className="ar-success-text" style={{ margin: 0 }}>
        Thanks. We&apos;ll let you know when a verified practitioner is listed near you.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ar-notify-form">
      <div>
        <label className="ar-label" htmlFor={emailId}>Your email</label>
        <input
          id={emailId} required type="email" autoComplete="email" className="ar-input"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="ar-label" htmlFor={regionId}>Suburb, town or state (optional)</label>
        <input
          id={regionId} autoComplete="address-level2" className="ar-input"
          value={region} onChange={(e) => setRegion(e.target.value)}
        />
      </div>
      <div className="ar-hp" aria-hidden="true">
        <label>
          Leave this field empty
          <input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      {error && <p role="alert" className="ar-error-text" style={{ margin: 0 }}>{error}</p>}
      <button type="submit" className="ar-btn-primary" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : 'Tell me when someone is listed'}
      </button>
    </form>
  );
}
