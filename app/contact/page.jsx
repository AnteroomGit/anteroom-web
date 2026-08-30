'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.4rem' }}>Get in touch</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          Director, practitioner, or press — send a short message and we&apos;ll get back to you.
        </p>

        {sent ? (
          <div className="ar-card">
            <p style={{ margin: 0 }}>Thanks — we&apos;ll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
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
            <button type="submit" className="ar-btn-primary" style={{ width: '100%' }}>Send</button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
