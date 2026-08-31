'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

// Sign up free at formspree.io, create a form, and replace the ID below
// with the one they give you (the part after "/f/" in your form's endpoint).
// This is the same tool used for Dahrt's landing page — same idea here.
const FORMSPREE_ID = 'YOUR_FORM_ID';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: JSON.stringify({ email, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.4rem' }}>Get in touch</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          Director, practitioner, or press — send a short message and we'll get back to you.
        </p>

        {sent ? (
          <div className="ar-card">
            <p style={{ margin: 0 }}>Thanks — we'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="ar-label">Email</label>
            <input
              required type="email" className="ar-input" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }}
            />
            <label className="ar-label">Message</label>
            <textarea
              required rows={5} className="ar-textarea" value={message}
              onChange={(e) => setMessage(e.target.value)} style={{ marginBottom: '1.25rem' }}
            />
            {error && (
              <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>
                Something went wrong sending that — try again, or email jack@anteroom.com.au directly.
              </p>
            )}
            <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={sending}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
