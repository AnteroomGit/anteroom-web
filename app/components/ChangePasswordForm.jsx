'use client';

import { useEffect, useId, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { passwordValid, explainPasswordError } from '../../lib/password';
import PasswordField from './PasswordField';
import PasswordRules from './PasswordRules';

// The change-password form for both the client and practitioner security
// pages. The old version flipped a local flag and showed a green "Updated"
// without calling Supabase at all.
//
// What it does now:
//   1. Re-checks the current password by signing in with it. A wrong one
//      stops here and nothing is changed.
//   2. Only then asks Supabase to set the new password.
//   3. Shows "updated" only after both calls have succeeded.
//   4. Signs out the person's other devices (best effort).
//
// Someone who only ever signed in with Google has no password to change.
// They get an explanation and a way to set one by email instead.
export default function ChangePasswordForm() {
  const rulesId = useId();
  const [status, setStatus] = useState('loading'); // loading | form | no-password | signed-out
  const [email, setEmail] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // null, or { othersSignedOut: boolean }
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setStatus('signed-out');
        return;
      }
      setEmail(user.email || '');
      const hasPassword =
        (user.identities || []).some((i) => i.provider === 'email') ||
        user.app_metadata?.provider === 'email';
      setStatus(hasPassword ? 'form' : 'no-password');
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setDone(null);

    if (!current) {
      setError('Enter your current password first.');
      return;
    }
    if (!passwordValid(next)) {
      setError('Your new password does not meet all of the rules yet.');
      return;
    }
    if (next === current) {
      setError('Your new password needs to be different from your current one.');
      return;
    }

    setBusy(true);
    try {
      // Step 1: prove it is really them.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) {
        console.error('Change password: current password check failed:', signInError);
        setError(
          /invalid login credentials/i.test(signInError.message || '')
            ? "That isn't your current password. Check it and try again."
            : 'We could not check your current password just now. Check your connection and try again.'
        );
        return;
      }

      // Step 2: change it.
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        console.error('Change password: update failed:', updateError);
        setError(explainPasswordError(updateError).message);
        return;
      }

      // Step 3: sign out everywhere else. A failure here does not undo the
      // change, so it only affects what we tell the person.
      let othersSignedOut = true;
      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
        if (signOutError) {
          othersSignedOut = false;
          console.error('Change password: could not sign out other devices:', signOutError);
        }
      } catch (err) {
        othersSignedOut = false;
        console.error('Change password: could not sign out other devices:', err);
      }

      setCurrent('');
      setNext('');
      setDone({ othersSignedOut });
    } catch (err) {
      console.error('Change password: unexpected error:', err);
      setError('We could not update your password. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function sendSetPasswordLink() {
    setError('');
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        console.error('Set password link failed:', resetError);
        setError('We could not send that email just now. Please try again in a moment.');
        return;
      }
      setLinkSent(true);
    } catch (err) {
      console.error('Set password link failed:', err);
      setError('We could not send that email just now. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '2.5rem' }}>Loading...</p>;
  }

  if (status === 'signed-out') {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '2.5rem' }}>
        You need to be logged in to change your password. <a href="/login">Log in</a>
      </p>
    );
  }

  if (status === 'no-password') {
    return (
      <div style={{ maxWidth: 420, marginBottom: '2.5rem' }}>
        <h3 style={{ margin: '0 0 0.4rem' }}>Password</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 1rem' }}>
          It looks like you signed in with Google or Apple, so there may be no AnteRoom password
          to change. If you would also like to log in with an email and password, we can email{' '}
          {email ? <strong>{email}</strong> : 'you'} a link to set one.
        </p>
        {linkSent ? (
          <p role="status" className="ar-success-text">Done. Check your inbox for the link.</p>
        ) : (
          <button type="button" className="ar-btn-ghost" onClick={sendSetPasswordLink} disabled={busy}>
            {busy ? 'Sending...' : 'Email me a link to set a password'}
          </button>
        )}
        {error && <p role="alert" className="ar-error-text" style={{ marginTop: '0.75rem' }}>{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 380, marginBottom: '2.5rem' }}>
      <h3 style={{ margin: '0 0 0.9rem' }}>Change your password</h3>

      <div style={{ marginBottom: '1rem' }}>
        <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
      </div>

      <PasswordField
        label="New password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        describedBy={rulesId}
      />
      <PasswordRules password={next} id={rulesId} />

      <button type="submit" className="ar-btn-primary" disabled={busy || !current || !passwordValid(next)}>
        {busy ? 'Updating...' : 'Update password'}
      </button>

      <div role="status" aria-live="polite">
        {done && (
          <p className="ar-success-text" style={{ marginTop: '0.9rem' }}>
            Your password has been updated.
            {done.othersSignedOut ? ' We also signed you out of any other devices.' : ''}
          </p>
        )}
      </div>
      {error && <p role="alert" className="ar-error-text" style={{ marginTop: '0.9rem' }}>{error}</p>}
    </form>
  );
}
