'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';
import { checkPassword, passwordValid } from '../../../lib/password';

function Rule({ ok, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: ok ? 'var(--sage)' : 'var(--ink-soft)' }}>
      {ok ? <Check size={16} /> : <X size={16} style={{ opacity: 0.4 }} />} {children}
    </div>
  );
}

// Advisory only -- see lib/password.js for why these two can't be
// checked client-side the way the four Rule items above can.
function Tip({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
      <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid var(--line)', flexShrink: 0 }} /> {children}
    </div>
  );
}

export default function Security() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saved, setSaved] = useState(false);
  const pw = checkPassword(next);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not delete account');
      // The account is already gone at this point -- signOut just clears
      // the now-invalid local session so nothing lingers in the browser.
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="security" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Security</h2>

          <form onSubmit={(e) => { e.preventDefault(); if (passwordValid(next)) setSaved(true); }} style={{ maxWidth: 380, marginBottom: '2.5rem' }}>
            <label className="ar-label">Current password</label>
            <input type="password" className="ar-input" value={current} onChange={(e) => setCurrent(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">New password</label>
            <input type="password" className="ar-input" value={next} onChange={(e) => setNext(e.target.value)} style={{ marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <Rule ok={pw.length}>8 or more characters</Rule>
              <Rule ok={pw.letterNumber}>At least 1 letter and 1 number</Rule>
              <Rule ok={pw.noRepeat}>Don't use the same character 3+ times in a row (e.g. AAA, 111)</Rule>
              <Rule ok={pw.noSequence}>Don't use 3+ characters in order (e.g. ABC, 123)</Rule>
              <Tip>Don't reuse a password you've used before</Tip>
              <Tip>Pick something hard to guess</Tip>
            </div>

            <button type="submit" className="ar-btn-primary" disabled={!passwordValid(next) || !current}>Update password</button>
            {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Updated</span>}
          </form>

          <div className="ar-card" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 300, margin: 0 }}>Your data</p>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              You can request a copy of the information we hold about you at any time through our{' '}
              <a href="/contact" style={{ color: 'var(--brand)' }}>Contact page</a>.
            </p>
          </div>

          <div className="ar-card" style={{ maxWidth: 480, borderColor: 'var(--clay)' }}>
            <p style={{ fontWeight: 300, margin: 0 }}>Delete your account</p>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Permanently deletes your login, profile, appointment history, and any connected
              accounting data. There's no undo.
            </p>
            <button className="ar-btn-ghost" style={{ color: 'var(--clay)', borderColor: 'var(--clay)', width: 'auto' }} onClick={() => setShowDeleteConfirm(true)}>
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="ar-modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <p className="ar-modal-title">Delete your account?</p>
            <p className="ar-modal-text">
              This permanently deletes your login, profile, appointment history, and any
              connected accounting data. This can't be undone.
            </p>
            {deleteError && (
              <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginTop: '0.75rem' }}>{deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
              <button className="ar-btn-ghost" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Keep my account
              </button>
              <button className="ar-btn-primary" style={{ flex: 1, background: 'var(--clay)' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, delete it'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
