'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { REASONS } from '../../constants';
import { supabase } from '../../../lib/supabase';

// Friendlier labels than the raw pathway keys stored on the appointment
// row (sbr, va, cvl, mvl, simple-close) -- keep in sync with PATHWAY_INFO
// in app/page.jsx if a pathway is ever renamed there.
const PATHWAY_LABELS = {
  sbr: 'Small Business Restructuring',
  va: 'Voluntary Administration',
  cvl: 'Creditors Voluntary Liquidation',
  mvl: 'Members Voluntary Liquidation',
  'simple-close': 'Simple close',
};

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [reasons, setReasons] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [latestAppointment, setLatestAppointment] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      // Not logged in: send them to log in rather than showing an
      // empty or fake profile.
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email);

      const [{ data: profile }, { data: appointments }, { data: session }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', user.id).single(),
        supabase.from('appointments').select('triage_summary, pathway, notice_type, notice_date, created_at')
          .eq('client_id', user.id).order('created_at', { ascending: false }).limit(1),
        // Falls back here when someone's completed the check but never
        // booked anyone -- previously this page had nothing to show in
        // that case at all.
        supabase.from('triage_sessions').select('answers, summary, pathway, updated_at').eq('client_id', user.id).maybeSingle(),
      ]);

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setMobile(profile.mobile || '');
        setReasons(profile.reasons || []);
      }
      if (appointments?.[0]) {
        setLatestAppointment(appointments[0]);
      } else if (session?.summary) {
        setLatestAppointment({ triage_summary: session.summary, pathway: session.pathway });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  function toggleReason(id) {
    setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from('clients')
      .update({ first_name: firstName, last_name: lastName, mobile, reasons })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
    }
  }

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-account-layout">
          <AccountNav active="profile" />
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="profile" />
        <div>
          <h2 style={{ marginTop: 0 }}>Profile</h2>

          {/* What was previously missing entirely: this account had no
              way to see the answers or result you'd actually come here
              for. Pulled from your most recent appointment, since that's
              the only point triage answers are durably saved. */}
          {latestAppointment ? (
            <div className="ar-result-banner" style={{ marginBottom: '1.75rem' }}>
              <span className="ar-result-label" style={{ color: 'var(--brand)' }}>Your last result</span>
              <p className="ar-result-title">{latestAppointment.triage_summary || 'Check completed'}</p>
              {latestAppointment.pathway && (
                <p className="ar-result-text">
                  Suggested pathway: {PATHWAY_LABELS[latestAppointment.pathway] || latestAppointment.pathway}
                </p>
              )}
              {latestAppointment.notice_type && (
                <p className="ar-result-text">
                  Notice: {latestAppointment.notice_type}{latestAppointment.notice_date ? ` (dated ${latestAppointment.notice_date})` : ''}
                </p>
              )}
              <p style={{ fontSize: '0.82rem', marginTop: '0.6rem' }}>
                <a href="/account/appointments" style={{ color: 'var(--brand)' }}>View your appointments</a>
                {' · '}
                <a href="/?start=1" style={{ color: 'var(--brand)' }}>Run the check again</a>
              </p>
            </div>
          ) : (
            <div className="ar-card" style={{ marginBottom: '1.75rem' }}>
              <p style={{ margin: 0 }}>You haven't completed the check yet.</p>
              <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
                <a href="/?start=1" style={{ color: 'var(--brand)' }}>Answer the questions</a> to see what your situation means.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
            <label className="ar-label">First name</label>
            <input className="ar-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Last name</label>
            <input className="ar-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Email</label>
            <input className="ar-input" value={email} disabled style={{ marginBottom: '0.4rem', opacity: 0.7, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1rem' }}>
              Changing your email isn't wired up yet. Get in touch via Contact if you need it updated.
            </p>

            <label className="ar-label">Mobile</label>
            <input className="ar-input" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ marginBottom: '1.25rem' }} />

            <p className="ar-label">What brings you here?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {REASONS.map((r) => (
                <label key={r.id} className="ar-checkbox-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={reasons.includes(r.id)} onChange={() => toggleReason(r.id)} style={{ marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--ink)' }}>{r.label}</span>
                </label>
              ))}
            </div>

            {error && <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{error}</p>}

            <button type="submit" className="ar-btn-primary">Save changes</button>
            {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Saved</span>}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
