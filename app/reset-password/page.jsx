'use client';

import { useEffect, useId, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PasswordField from '../components/PasswordField';
import PasswordRules from '../components/PasswordRules';
import { supabase } from '../../lib/supabase';
import { passwordValid, explainPasswordError } from '../../lib/password';

// The page the "Forgot password" email links to. Until v67 it did not
// exist, so the link ended on "Page not found".
//
// How it works: when the person arrives from the email, Supabase reads the
// token from the address, signs them in with a short-lived recovery
// session, and announces a PASSWORD_RECOVERY event. This page waits for
// that, shows a form, and calls updateUser. If the link is expired or has
// already been used, Supabase puts an error in the address instead, and
// this page offers a way to ask for a new link.

// Captured as soon as this file loads, because Supabase tidies the address
// bar once it has read a good token.
const FIRST_HASH = typeof window === 'undefined' ? '' : window.location.hash;
const FIRST_SEARCH = typeof window === 'undefined' ? '' : window.location.search;

function addressHasError() {
  const raw = `${FIRST_HASH}&${window.location.hash}&${FIRST_SEARCH}&${window.location.search}`.replace(/[#?]/g, '&');
  const params = new URLSearchParams(raw);
  return Boolean(params.get('error') || params.get('error_code') || params.get('error_description'));
}

export default function ResetPassword() {
  const rulesId = useId();
  const [state, setState] = useState('checking'); // checking | ready | invalid | done
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const settle = (next) => setState((current) => (current === 'checking' ? next : current));

    if (addressHasError()) {
      setState('invalid');
      return undefined;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) settle('ready');
    });

    // The recovery event can fire before this page is listening, so also
    // ask whether the link has already produced a session. getSession waits
    // for Supabase to finish reading the address first.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (active) settle(session ? 'ready' : 'invalid');
      })
      .catch(() => {
        if (active) settle('invalid');
      });

    // Safety net in case neither of the above ever answers.
    const timer = setTimeout(() => { if (active) settle('invalid'); }, 6000);

    return () => {
      active = false;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!passwordValid(password)) {
      setError('Your new password does not meet all of the rules yet.');
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error('Reset password: update failed:', updateError);
        const { message, expired } = explainPasswordError(updateError);
        if (expired) setState('invalid');
        else setError(message);
        return;
      }
      // Anyone else who was signed in as this person is signed out now.
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch (err) {
        console.error('Reset password: could not sign out other devices:', err);
      }
      setPassword('');
      setState('done');
    } catch (err) {
      console.error('Reset password: unexpected error:', err);
      setError('We could not update your password. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        {state === 'checking' && (
          <p role="status" style={{ color: 'var(--ink-soft)' }}>Checking your link...</p>
        )}

        {state === 'invalid' && (
          <div className="ar-card" style={{ padding: '2rem 1.5rem' }}>
            <h1 className="ar-h2" style={{ margin: 0 }}>This link has expired</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0.5rem 0 1rem' }}>
              Password reset links only work once, and only for a short time. We can email you a
              new one.
            </p>
            <a href="/login?reset=1" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', padding: '0.65rem 1.1rem' }}>
              Send me a new link
            </a>
          </div>
        )}

        {state === 'ready' && (
          <>
            <h1 className="ar-h1" style={{ marginBottom: '0.3rem' }}>Set a new password</h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Choose a password you haven&apos;t used here before.
            </p>
            <form onSubmit={handleSubmit} className="ar-auth-card">
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                describedBy={rulesId}
              />
              <PasswordRules password={password} id={rulesId} />
              {error && <p role="alert" className="ar-error-text">{error}</p>}
              <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={busy || !passwordValid(password)}>
                {busy ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          </>
        )}

        {state === 'done' && (
          <div className="ar-card" style={{ padding: '2rem 1.5rem' }}>
            <h1 className="ar-h2" style={{ margin: 0 }}>Password updated</h1>
            <p role="status" style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0.5rem 0 1rem' }}>
              You&apos;re logged in with your new password. Any other devices that were logged in
              have been signed out.
            </p>
            <a href="/" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', padding: '0.65rem 1.1rem' }}>
              Continue to AnteRoom
            </a>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
