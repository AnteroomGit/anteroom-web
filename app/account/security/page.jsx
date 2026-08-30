'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';

function checkPassword(pw) {
  return {
    length: pw.length >= 8,
    letterNumber: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw),
  };
}

function Rule({ ok, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: ok ? 'var(--sage)' : 'var(--ink-soft)' }}>
      {ok ? <Check size={13} /> : <X size={13} style={{ opacity: 0.4 }} />} {children}
    </div>
  );
}

export default function Security() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saved, setSaved] = useState(false);
  const pw = checkPassword(next);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="security" />
        <div>
          <h2 style={{ marginTop: 0 }}>Security</h2>

          <form onSubmit={(e) => { e.preventDefault(); setSaved(true); }} style={{ maxWidth: 380, marginBottom: '2.5rem' }}>
            <label className="ar-label">Current password</label>
            <input type="password" className="ar-input" value={current} onChange={(e) => setCurrent(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">New password</label>
            <input type="password" className="ar-input" value={next} onChange={(e) => setNext(e.target.value)} style={{ marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <Rule ok={pw.length}>8 or more characters</Rule>
              <Rule ok={pw.letterNumber}>At least 1 letter and 1 number</Rule>
            </div>

            <button type="submit" className="ar-btn-primary">Update password</button>
            {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Updated</span>}
          </form>

          <div className="ar-card" style={{ maxWidth: 480 }}>
            <p style={{ fontWeight: 300, margin: 0 }}>Your data</p>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              You can request a copy of the information we hold about you, or ask us to delete
              your account and data, at any time. Get in touch through our{' '}
              <a href="/contact" style={{ color: 'var(--teal)' }}>Contact page</a> to make either
              request.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
