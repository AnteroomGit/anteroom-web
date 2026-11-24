'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import BotCheck from '../../components/BotCheck';
import PasswordField from '../../components/PasswordField';
import PasswordRules from '../../components/PasswordRules';
import { GoogleIcon, AppleIcon } from '../../components/OAuthIcons';
import { REASONS } from '../../constants';
import { supabase } from '../../../lib/supabase';
import { passwordValid } from '../../../lib/password';

// Apple sign-in is not set up yet, so its button stays hidden until it is.
// Set NEXT_PUBLIC_ENABLE_APPLE_SIGNIN=true in Vercel once Apple works.
const APPLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_SIGNIN === 'true';

export default function ClientSignup() {
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [reasons, setReasons] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState(null);
  // Turnstile tokens are single-use and short-lived -- reusing the same
  // one on a retry after any failed attempt gets rejected by Cloudflare
  // as timeout-or-duplicate. Bumping this key forces the widget to fully
  // remount and issue a fresh token whenever a submit attempt fails.
  const [botKey, setBotKey] = useState(0);

  const pwValid = passwordValid(password);

  function toggleReason(id) {
    setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pwValid || !agreed || !botVerified) return;

    setSubmitting(true);
    setSignupError(null);

    // Actually verify the bot-check token server-side before creating any
    // account, rather than trusting that the widget succeeding in the
    // browser is enough on its own.
    const verifyRes = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: botVerified }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      setSignupError('Bot check failed, please try again.');
      setSubmitting(false);
      setBotVerified(false);
      setBotKey((k) => k + 1); // force Turnstile to remount and issue a fresh token
      return;
    }

    // Create the account, passing the profile details as signup metadata.
    // A database trigger (set up in supabase-schema.sql) reads this
    // automatically and creates the matching row in `clients` itself.
    // this avoids trying to write to the database before the account
    // has an active session, which is what caused the error before.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Without this, Supabase falls back to whatever "Site URL" is
        // configured in the dashboard -- which was still pointing at
        // the raw Vercel deployment URL, landing people on Vercel's own
        // login wall instead of the actual site. Setting it explicitly
        // here sends a confirmed user straight to the login page,
        // regardless of what the dashboard's default happens to be.
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          account_type: 'client',
          first_name: firstName,
          last_name: lastName,
          mobile,
          reasons,
        },
      },
    });

    if (error) {
      setSignupError(
        error.message.includes('already registered')
          ? 'An account with that email already exists. Try logging in instead.'
          : error.message
      );
      setSubmitting(false);
      setBotVerified(false);
      setBotKey((k) => k + 1); // the token was already spent in the verify call above either way
      return;
    }

    setSubmitting(false);
    setStep('verifying');
  }

  async function handleOAuth(provider) {
    setSignupError(null);
    // signInWithOAuth has no way to pass custom account details through to
    // the sign-up trigger (an earlier version tried, and the option was
    // silently ignored). Google and Apple accounts get their client row
    // from the database trigger, which recognises them by provider, and
    // from ensureClientRow as a backstop when the profile page loads.
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/account/profile` },
    });
    if (oauthError) setSignupError(oauthError.message);
  }

  async function handleResend() {
    setResendError(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setResendError(error.message);
    } else {
      setResent(true);
    }
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        {step === 'form' && (
          <>
            <h1 className="ar-h1" style={{ marginBottom: '0.3rem' }}>Create your account</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Keep track of your consultations by creating an account.
            </p>

            <div className="ar-auth-card">
              <button type="button" className="ar-oauth-btn" onClick={() => handleOAuth('google')} style={{ marginBottom: APPLE_ENABLED ? '0.6rem' : 0 }}>
                <GoogleIcon /> Continue with Google
              </button>
              {APPLE_ENABLED && (
                <button type="button" className="ar-oauth-btn" onClick={() => handleOAuth('apple')}>
                  <AppleIcon /> Continue with Apple
                </button>
              )}

              <div className="ar-oauth-divider">or</div>

              <form onSubmit={handleSubmit}>
              <label className="ar-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" required type="email" autoComplete="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                describedBy="signup-password-rules"
              />
              <PasswordRules password={password} id="signup-password-rules" />

              <label className="ar-label" htmlFor="signup-first-name">First name</label>
              <input id="signup-first-name" required autoComplete="given-name" className="ar-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label" htmlFor="signup-last-name">Last name</label>
              <input id="signup-last-name" required autoComplete="family-name" className="ar-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label" htmlFor="signup-mobile">Mobile number</label>
              <input id="signup-mobile" required type="tel" autoComplete="tel" className="ar-input" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ marginBottom: '1.25rem' }} />

              <label className="ar-label">What brings you here? Select all that apply.</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {REASONS.map((r) => (
                  <label key={r.id} className="ar-checkbox-row" style={{ margin: 0 }}>
                    <input type="checkbox" checked={reasons.includes(r.id)} onChange={() => toggleReason(r.id)} style={{ marginTop: '0.15rem' }} />
                    <span style={{ color: 'var(--ink)' }}>{r.label}</span>
                  </label>
                ))}
              </div>

              <label className="ar-checkbox-row">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                <span>
                  I agree to the <a href="/terms">Terms of Service</a>, and to AnteRoom's use of my
                  information in accordance with its <a href="/privacy">Privacy Policy</a>.
                </span>
              </label>

              <BotCheck key={botKey} checked={botVerified} onChange={setBotVerified} />

              {signupError && (
                <p role="alert" style={{ color: 'var(--clay)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>{signupError}</p>
              )}

              <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!pwValid || !agreed || !botVerified || submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
              </form>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '1.25rem' }}>
              Already have an account? <a href="/login" style={{ color: 'var(--brand)' }}>Log in</a>
            </p>
          </>
        )}

        {step === 'verifying' && (
          <div className="ar-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <Mail size={34} style={{ color: 'var(--brand)', marginBottom: '0.75rem' }} />
            <h2 className="ar-h2" style={{ marginTop: 0 }}>Check your email</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              We've sent a real verification link to <strong>{email}</strong>. Click it, then come
              back and log in. Your account is active from that point on.
            </p>
            <a href="/login" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.9rem' }}>
              Go to login
            </a>
            <div>
              <button className="ar-btn-ghost" onClick={handleResend} disabled={resent}>
                {resent ? 'Email resent' : "Didn't get it? Resend"}
              </button>
              {resendError && (
                <p style={{ color: 'var(--clay)', fontSize: 'var(--text-sm)', marginTop: '0.6rem' }}>
                  Couldn't resend: {resendError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
