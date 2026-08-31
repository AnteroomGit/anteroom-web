'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { REASONS } from '../../constants';
import { supabase } from '../../../lib/supabase';

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

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      // Not logged in — send them to log in rather than showing an
      // empty or fake profile.
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email);

      const { data: profile } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setMobile(profile.mobile || '');
        setReasons(profile.reasons || []);
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
          <form onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
            <label className="ar-label">First name</label>
            <input className="ar-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Last name</label>
            <input className="ar-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Email</label>
            <input className="ar-input" value={email} disabled style={{ marginBottom: '0.4rem', opacity: 0.7, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '1rem' }}>
              Changing your email isn't wired up yet — get in touch via Contact if you need it updated.
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
