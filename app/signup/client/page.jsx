'use client';

import { useState } from 'react';
import { Check, X, Mail } from 'lucide-react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import BotCheck from '../../components/BotCheck';
import { REASONS } from '../../constants';
import { supabase } from '../../../lib/supabase';

function checkPassword(pw) {
  return {
    length: pw.length >= 8,
    letterNumber: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw),
    noRepeat: !/(.)\1\1/.test(pw),
    noSequence: !hasSequentialChars(pw),
  };
}

function hasSequentialChars(pw) {
  for (let i = 0; i < pw.length - 2; i++) {
    const a = pw.charCodeAt(i), b = pw.charCodeAt(i + 1), c = pw.charCodeAt(i + 2);
    if (b === a + 1 && c === b + 1) return true;
    if (b === a - 1 && c === b - 1) return true;
  }
  return false;
}

function Rule({ ok, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: ok ? 'var(--sage)' : 'var(--ink-soft)' }}>
      {ok ? <Check size={13} /> : <X size={13} style={{ opacity: 0.4 }} />} {children}
    </div>
  );
}

export default function ClientSignup() {
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [reasons, setReasons] = useState([]);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [resent, setResent] = useState(false);

  const pw = checkPassword(password);
  const pwValid = pw.length && pw.letterNumber && pw.noRepeat && pw.noSequence;

  function toggleReason(id) {
    setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pwValid || !agreed || !botVerified) return;

    setSubmitting(true);
    setSignupError(null);

    // Create the account, passing the profile details as signup metadata.
    // A database trigger (set up in supabase-schema.sql) reads this
    // automatically and creates the matching row in `clients` itself.
    // this avoids trying to write to the database before the account
    // has an active session, which is what caused the error before.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
      return;
    }

    setSubmitting(false);
    setStep('verifying');
  }

  async function handleResend() {
    await supabase.auth.resend({ type: 'signup', email });
    setResent(true);
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        {step === 'form' && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.3rem' }}>Create your account</h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Keep track of your consultations by creating an account.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="ar-label">Email</label>
              <input required type="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Password</label>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <input
                  required type={showPw ? 'text' : 'password'} className="ar-input"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <span onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 10, cursor: 'pointer', fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
                  {showPw ? 'Hide' : 'Show'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.1rem' }}>
                <Rule ok={pw.length}>8 or more characters</Rule>
                <Rule ok={pw.letterNumber}>At least 1 letter and 1 number</Rule>
                <Rule ok={pw.noRepeat}>No character repeated 3+ times in a row</Rule>
                <Rule ok={pw.noSequence}>No 3+ characters in sequence (e.g. abc, 123)</Rule>
              </div>

              <label className="ar-label">First name</label>
              <input required className="ar-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Last name</label>
              <input required className="ar-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Mobile number</label>
              <input required className="ar-input" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ marginBottom: '1.25rem' }} />

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
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                Keep me signed in on this device
              </label>

              <label className="ar-checkbox-row">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                <span>
                  I agree to the <a href="/terms">Terms of Service</a>, and to AnteRoom's use of my
                  information in accordance with its <a href="/privacy">Privacy Policy</a>.
                </span>
              </label>

              <BotCheck checked={botVerified} onChange={setBotVerified} />

              {signupError && (
                <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{signupError}</p>
              )}

              <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!pwValid || !agreed || !botVerified || submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '1.25rem' }}>
              Already have an account? <a href="/login" style={{ color: 'var(--brand)' }}>Log in</a>
            </p>
          </>
        )}

        {step === 'verifying' && (
          <div className="ar-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <Mail size={28} style={{ color: 'var(--brand)', marginBottom: '0.75rem' }} />
            <h2 style={{ marginTop: 0 }}>Check your email</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
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
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
