'use client';

import { useState } from 'react';
import { Check, X, Mail } from 'lucide-react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import BotCheck from '../../components/BotCheck';
import { supabase } from '../../../lib/supabase';

// Liquidator and SBR Practitioner are collapsed into one category here,
// since SBR Practitioners must themselves be registered liquidators
// (Corporations Act s456B(1)) and verify against the exact same ASIC
// register. Keeping them separate at this level was real duplication.
// Liquidators only for now, matching actual outreach focus. Add
// Accountant and Lawyer back (and to REG_INFO below) once that expands.
const CATEGORIES = ['Registered Liquidator / SBR Practitioner'];

const REG_INFO = {
  'Registered Liquidator / SBR Practitioner': {
    label: 'ASIC Registered Liquidator number',
    placeholder: 'e.g. 12345',
    helper: 'We verify this against ASIC\u2019s public register of registered liquidators.',
  },
  'Accountant': {
    label: 'CA ANZ or CPA Australia membership number',
    placeholder: 'e.g. CA123456',
    helper: 'We verify this against your professional body\u2019s member register.',
  },
  'Lawyer': {
    label: 'Practising certificate number',
    placeholder: 'e.g. 123456',
    helper: 'We verify this against your state\u2019s Legal Services Board or equivalent register.',
  },
};

// The actual services a practitioner offers, since most small-to-medium
// liquidators genuinely do several of these, not just one. This drives
// specialty matching, separate from the verification category above.
const SPECIALTIES = [
  'Liquidation',
  'Voluntary Administration',
  'Small Business Restructuring',
  'Turnaround / Safe Harbour advice',
  'Members Voluntary Liquidation',
];

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

export default function PractitionerSignup() {
  const [step, setStep] = useState('form');
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [regNumber, setRegNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState(null);

  const regInfo = REG_INFO[category];
  const pw = checkPassword(password);
  const pwValid = pw.length && pw.letterNumber;

  function toggleSpecialty(s) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pwValid || !agreed || !botVerified) return;

    setSubmitting(true);
    setSignupError(null);

    const verifyRes = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: botVerified }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      setSignupError('Bot check failed, please try again.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: 'practitioner',
          name,
          firm,
          practitioner_type: category,
          registration_number: regNumber,
          specialties,
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
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        {step === 'form' && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.4rem' }}>List your practice</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              For registered liquidators, restructuring practitioners, accountants, and lawyers.
            </p>

            <div className="ar-card" style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--ink-soft)' }}>
                Flat membership fee, no per-referral or success fees, no pay-to-rank. Full detail
                at <a href="/how-we-work" style={{ color: 'var(--brand)' }}>How We Work</a>, worth
                reading before you sign up, and something you're welcome to cite in your own DIRRI.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="ar-label">Full name</label>
              <input required className="ar-input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Firm</label>
              <input required className="ar-input" value={firm} onChange={(e) => setFirm(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Email</label>
              <input required type="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label">Password</label>
              <input required type="password" className="ar-input" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.1rem' }}>
                <Rule ok={pw.length}>8 or more characters</Rule>
                <Rule ok={pw.letterNumber}>At least 1 letter and 1 number</Rule>
              </div>

              <label className="ar-label">Professional category</label>
              <select required className="ar-select" value={category} onChange={(e) => { setCategory(e.target.value); setRegNumber(''); }} style={{ marginBottom: '1rem' }}>
                <option value="">Select one</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="ar-label">{regInfo ? regInfo.label : 'Professional registration number'}</label>
              <input
                required className="ar-input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
                placeholder={regInfo ? regInfo.placeholder : ''} disabled={!category}
                style={{ marginBottom: '1rem' }}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '-0.7rem', marginBottom: '1.25rem' }}>
                {regInfo ? regInfo.helper : 'Select a category above first.'}
              </p>

              <label className="ar-label">What do you actually do? Select all that apply.</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {SPECIALTIES.map((s) => (
                  <label key={s} className="ar-checkbox-row" style={{ margin: 0 }}>
                    <input type="checkbox" checked={specialties.includes(s)} onChange={() => toggleSpecialty(s)} style={{ marginTop: '0.15rem' }} />
                    <span style={{ color: 'var(--ink)' }}>{s}</span>
                  </label>
                ))}
              </div>

              <label className="ar-checkbox-row">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                <span>
                  I have read and agree to the <a href="/terms">Terms of Service</a> and{' '}
                  <a href="/privacy">Privacy Policy</a>.
                </span>
              </label>

              <BotCheck checked={botVerified} onChange={setBotVerified} />

              {signupError && (
                <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{signupError}</p>
              )}

              <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!pwValid || !agreed || !botVerified || submitting}>
                {submitting ? 'Creating account...' : 'Submit for verification'}
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
              We've sent a real verification link to <strong>{email}</strong>. Click it, then log
              in. We'll verify your registration details before your profile goes live.
            </p>
            <a href="/login" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.9rem' }}>
              Go to login
            </a>
            <div>
              <button className="ar-btn-ghost" onClick={handleResend}>Didn't get it? Resend</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
