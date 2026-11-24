'use client';

import { useEffect, useId, useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import BotCheck from '../components/BotCheck';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_RESPONSE_PROMISE } from '../../lib/site';

// Used when someone arrives from "Request an invitation" on the
// practitioner page (/contact?topic=practitioner). They can edit it.
const PRACTITIONER_PREFILL =
  "Hi, I'm a registered liquidator and I'd like an invitation to list my practice on AnteRoom.\n\n" +
  'My name:\nMy firm:\nMy ASIC registered liquidator number:\n';

export default function Contact() {
  const emailId = useId();
  const messageId = useId();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // A hidden field people never see. Bots that fill in every field give
  // themselves away by filling this one too.
  const [website, setWebsite] = useState('');
  // Turnstile tokens are single-use, so a failed attempt remounts the widget.
  const [botToken, setBotToken] = useState(null);
  const [botKey, setBotKey] = useState(0);
  const botRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('topic') === 'practitioner') {
        setMessage((current) => current || PRACTITIONER_PREFILL);
      }
    } catch {
      // No address to read; an empty message box is fine.
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      // The message goes through our own server route, which checks it,
      // saves it, and emails Jack. It used to be written straight to the
      // database from the browser, so nobody was told it had arrived.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'contact', email, message, website, turnstileToken: botToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Something went wrong sending that. Try again, or email ${CONTACT_EMAIL} directly.`);
        setBotToken(null);
        setBotKey((k) => k + 1);
        return;
      }
      setSent(true);
    } catch {
      setError(`Something went wrong sending that. Try again, or email ${CONTACT_EMAIL} directly.`);
      setBotToken(null);
      setBotKey((k) => k + 1);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 className="ar-h1" style={{ marginBottom: '0.4rem' }}>Get in touch</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          Director, practitioner, or press: send a short message and we&apos;ll get back to you.{' '}
          {CONTACT_RESPONSE_PROMISE}
          {CONTACT_PHONE ? <> Prefer to talk? Call {CONTACT_PHONE}.</> : null}
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          AnteRoom isn&apos;t an emergency service. If a notice deadline is close, speak to a
          registered liquidator or your accountant now rather than waiting for a reply.
        </p>

        {sent ? (
          <div className="ar-card" role="status">
            <p style={{ margin: 0 }}>Thanks, we&apos;ve got your message. {CONTACT_RESPONSE_PROMISE}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="ar-label" htmlFor={emailId}>Email</label>
            <input
              id={emailId} required type="email" autoComplete="email" className="ar-input" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }}
            />
            <label className="ar-label" htmlFor={messageId}>Message</label>
            <textarea
              id={messageId} required rows={5} className="ar-textarea" value={message}
              onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: '1.25rem' }}
            />
            <div className="ar-hp" aria-hidden="true">
              <label>
                Leave this field empty
                <input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            {botRequired && <BotCheck key={botKey} checked={!!botToken} onChange={setBotToken} />}
            {error && (
              <p role="alert" className="ar-error-text">{error}</p>
            )}
            <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={sending || (botRequired && !botToken)}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
