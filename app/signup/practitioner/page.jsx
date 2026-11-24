'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock } from 'lucide-react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import BotCheck from '../../components/BotCheck';
import PasswordField from '../../components/PasswordField';
import PasswordRules from '../../components/PasswordRules';
import { supabase } from '../../../lib/supabase';
import { passwordValid } from '../../../lib/password';

// Liquidator and SBR Practitioner are collapsed into one category here,
// since SBR Practitioners must themselves be registered liquidators
// (Corporations Act s456B(1)) and verify against the exact same ASIC
// register. Keeping them separate at this level was real duplication.
// Liquidators only for now, matching actual outreach focus. Add
// Accountant and Lawyer back once that expands.
const CATEGORIES = ['Registered Liquidator / SBR Practitioner'];

// The actual services a practitioner offers, since most small-to-medium
// liquidators genuinely do several of these, not just one. This drives
// specialty matching, separate from the verification category above.
export const SPECIALTIES = [
  'Liquidation',
  'Voluntary Administration',
  'Small Business Restructuring',
  'Turnaround / Safe Harbour advice',
  'Members Voluntary Liquidation',
];

export default function PractitionerSignup() {
  const [step, setStep] = useState('form');
  const [autoVerified, setAutoVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState(null);
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPreference, setContactPreference] = useState('either');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [regNumber, setRegNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState(null);
  // Turnstile tokens are single-use and short-lived -- reusing the same
  // one on a retry after any failed attempt gets rejected by Cloudflare
  // as timeout-or-duplicate. Bumping this key forces the widget to fully
  // remount and issue a fresh token whenever a submit attempt fails.
  const [botKey, setBotKey] = useState(0);

  // Signup is now closed by default -- the only way in is a link tied
  // to a specific, already-phone-confirmed lead. No valid lead, no form,
  // full stop. See /api/lead-lookup for why this can't be checked
  // client-side against practitioner_leads directly.
  const [leadState, setLeadState] = useState('loading'); // 'loading' | 'valid' | 'invalid' | 'claimed'
  const [leadId, setLeadId] = useState(null);

  useEffect(() => {
    async function loadLead() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('lead');
      if (!id) {
        setLeadState('invalid');
        return;
      }
      try {
        const res = await fetch(`/api/lead-lookup?leadId=${encodeURIComponent(id)}`);
        const body = await res.json();
        if (!body.valid) {
          setLeadState(body.alreadyClaimed ? 'claimed' : 'invalid');
          return;
        }
        setLeadId(body.lead.id);
        setName(body.lead.name);
        setFirm(body.lead.firm || '');
        setRegNumber(body.lead.registrationNumber);
        setLeadState('valid');
      } catch {
        setLeadState('invalid');
      }
    }
    loadLead();
  }, []);

  const pwValid = passwordValid(password);

  function toggleSpecialty(s) {
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pwValid || !agreed || !botVerified || !leadId) return;

    setSubmitting(true);
    setSignupError(null);

    const verifyRes = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: botVerified }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      const codes = verifyData.codes && verifyData.codes.length ? ` (${verifyData.codes.join(', ')})` : '';
      setSignupError(`Bot check failed, please try again.${codes}`);
      setSubmitting(false);
      setBotVerified(false);
      setBotKey((k) => k + 1); // force Turnstile to remount and issue a fresh token
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          account_type: 'practitioner',
          // The invitation. The database only creates a practitioner from
          // a valid, unclaimed invitation, and takes the name and
          // registration number from it rather than from this form. The
          // name and number are still sent so the older database rules
          // (before the v67 migration is run) keep working.
          lead_id: leadId,
          name,
          firm,
          phone,
          contact_preference: contactPreference,
          practitioner_type: category,
          registration_number: regNumber,
          specialties,
        },
      },
    });

    if (error) {
      // The database refuses a sign-up that does not carry a valid,
      // unused invitation, and Supabase reports any refusal like that as
      // the generic "Database error saving new user". A duplicate
      // registration number used to surface as raw Postgres text; that
      // case is still recognised in case the older rules are in place.
      const isDuplicateRegNumber = /duplicate key|unique constraint/i.test(error.message) && /registration_number/i.test(error.message);
      const isRefusedByDatabase = /database error saving new user/i.test(error.message);
      setSignupError(
        isDuplicateRegNumber || isRefusedByDatabase
          ? "We couldn't create an account from this invitation. The link may already have been used. Please get in touch and we'll sort it out."
          : error.message.includes('already registered')
          ? 'An account with that email already exists. Try logging in instead.'
          : error.message
      );
      setSubmitting(false);
      setBotVerified(false);
      setBotKey((k) => k + 1); // the token was already spent in the verify call above either way
      return;
    }

    // Identity was already confirmed by phone before this link was ever
    // sent, so a successful signup against a still-unclaimed lead is
    // verified immediately -- this call also marks the lead claimed so
    // Jack can see which calls converted.
    if (data?.user?.id) {
      try {
        const res = await fetch('/api/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ practitionerId: data.user.id, leadId }),
        });
        const verifyResult = await res.json();
        setAutoVerified(!!verifyResult.autoVerified);
      } catch {
        // Silent -- manual review still covers this either way.
      }
    }

    setSubmitting(false);
    setStep('verifying');
  }

  async function handleResend() {
    setResendError(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setResendError(error.message);
    else setResent(true);
  }

  if (leadState === 'loading') {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-form-page"><p style={{ color: 'var(--ink-soft)' }}>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  if (leadState !== 'valid') {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-form-page">
          <div className="ar-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <Lock size={34} style={{ color: 'var(--brand)', marginBottom: '0.75rem' }} />
            <h2 className="ar-h2" style={{ marginTop: 0 }}>Invitation only, for now</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              {leadState === 'claimed'
                ? 'This invitation link has already been used to create an account.'
                : 'AnteRoom\u2019s practitioner network is currently by invitation only. If we\u2019ve spoken and you\u2019re expecting a link, check your email.'}
              {' '}Otherwise, you can <a href="/contact?topic=practitioner" style={{ color: 'var(--brand)' }}>request an invitation</a>{' '}
              or read <a href="/for-practitioners" style={{ color: 'var(--brand)' }}>how AnteRoom works for practitioners</a>.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        {step === 'form' && (
          <>
            <h1 className="ar-h1" style={{ marginBottom: '0.4rem' }}>List your practice</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Set up your login below. Your name and registration are already confirmed from our call.
            </p>

            <div className="ar-card" style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--ink-soft)' }}>
                Flat membership fee, no per-referral or success fees, no pay-to-rank. Full detail
                at <a href="/how-we-work" style={{ color: 'var(--brand)' }}>How We Work</a>, worth
                reading before you sign up, and something you're welcome to cite in your own DIRRI.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="ar-auth-card">
              <label className="ar-label" htmlFor="signup-name">Full name</label>
              <input id="signup-name" disabled className="ar-input" value={name} style={{ marginBottom: '0.35rem', opacity: 0.7 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1rem' }}>
                Confirmed on our call. <a href="/contact" style={{ color: 'var(--brand)' }}>Contact</a> if this needs correcting.
              </p>

              <label className="ar-label" htmlFor="signup-firm">Firm</label>
              <input id="signup-firm" required autoComplete="organization" className="ar-input" value={firm} onChange={(e) => setFirm(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label className="ar-label" htmlFor="signup-phone">Phone</label>
              <input id="signup-phone" autoComplete="tel" className="ar-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: '1rem' }} placeholder="Optional, but needed if you'd rather directors call" />

              <label className="ar-label">If a director wants to reach out, you'd prefer...</label>
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
                {[
                  { value: 'email', label: 'Email' },
                  { value: 'call', label: 'A call' },
                  { value: 'either', label: 'Either is fine' },
                ].map((opt) => (
                  <label key={opt.value} className="ar-checkbox-row" style={{ margin: 0, flex: 1, justifyContent: 'center', border: '1px solid var(--line)', borderRadius: 8, padding: '0.5rem', background: contactPreference === opt.value ? 'var(--brand-tint)' : 'transparent' }}>
                    <input type="radio" name="contactPreference" value={opt.value} checked={contactPreference === opt.value} onChange={() => setContactPreference(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>

              <label className="ar-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" required type="email" autoComplete="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                describedBy="practitioner-password-rules"
              />
              <PasswordRules password={password} id="practitioner-password-rules" />

              <label className="ar-label" htmlFor="signup-category">Professional category</label>
              <select id="signup-category" required className="ar-select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: '1rem' }}>
                <option value="">Select one</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="ar-label" htmlFor="signup-reg">ASIC Registered Liquidator number</label>
              <input id="signup-reg" disabled className="ar-input" value={regNumber} style={{ marginBottom: '0.35rem', opacity: 0.7 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1.25rem' }}>
                Confirmed against ASIC's register on our call.
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

              <BotCheck key={botKey} checked={botVerified} onChange={setBotVerified} />

              {signupError && (
                <p role="alert" style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{signupError}</p>
              )}

              <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!pwValid || !agreed || !botVerified || submitting}>
                {submitting ? 'Creating account...' : 'Activate my account'}
              </button>
            </form>

            <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '1.25rem' }}>
              Already have an account? <a href="/login" style={{ color: 'var(--brand)' }}>Log in</a>
            </p>
          </>
        )}

        {step === 'verifying' && (
          <div className="ar-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <Mail size={34} style={{ color: 'var(--brand)', marginBottom: '0.75rem' }} />
            <h2 className="ar-h2" style={{ marginTop: 0 }}>Check your email</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              We've sent a real verification link to <strong>{email}</strong>. Click it, then log
              in.{' '}
              {autoVerified
                ? 'Your profile is already verified and will go live once you\'ve confirmed your email.'
                : 'There was an issue auto-verifying your account, so it\'s been left for manual review instead.'}
            </p>
            <a href="/login" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.9rem' }}>
              Go to login
            </a>
            <div>
              <button className="ar-btn-ghost" onClick={handleResend} disabled={resent}>
                {resent ? 'Email resent' : "Didn't get it? Resend"}
              </button>
              {resendError && (
                <p style={{ color: 'var(--clay)', fontSize: '0.82rem', marginTop: '0.6rem' }}>
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
