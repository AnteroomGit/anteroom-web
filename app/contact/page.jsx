'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { supabase } from '../../lib/supabase';

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
      // Was previously pointed at Web3Forms with a literal placeholder
      // access key, meaning this form has never actually sent anything
      // to anyone -- every real submission has silently failed since
      // this page was built. Storing it in Supabase instead needs no
      // new signup, since this app already has that fully wired up.
      // Trade-off worth knowing: this means checking Table Editor for
      // new rows rather than getting an email the moment one arrives --
      // switch to a real email-notification service like Web3Forms
      // later if that becomes the more useful path.
      const { error: insertError } = await supabase.from('contact_messages').insert({ email, message });
      if (insertError) throw insertError;
      setSent(true);
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
          Director, practitioner, or press: send a short message and we'll get back to you.
        </p>

        {sent ? (
          <div className="ar-card">
            <p style={{ margin: 0 }}>Thanks, we'll be in touch shortly.</p>
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
                Something went wrong sending that. Try again, or email jack@anteroom.com.au directly.
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
