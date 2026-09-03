'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === 'Email not confirmed'
          ? 'Please verify your email first. Check your inbox for the link we sent.'
          : signInError.message === 'Invalid login credentials'
          ? 'Wrong email or password.'
          : signInError.message
      );
      return;
    }

    // If they'd answered triage questions before hitting the login wall,
    // send them home so that flow can pick up and resume automatically,
    // rather than to their profile.
    let hasPending = false;
    try {
      hasPending = !!localStorage.getItem('anteroom_pending_booking');
    } catch {
      hasPending = false;
    }
    router.push(hasPending ? '/' : '/account/profile');
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1.5rem' }}>Log in</h1>

        <form onSubmit={handleSubmit}>
          <label className="ar-label">Email</label>
          <input required type="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Password</label>
          <input required type="password" className="ar-input" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: '1.25rem' }} />

          {error && <p style={{ color: 'var(--clay)', fontSize: '0.84rem', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="ar-btn-primary" style={{ width: '100%', marginBottom: '0.9rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
          Don't have an account? <a href="/signup/client" style={{ color: 'var(--brand)' }}>Sign up</a>
        </p>
        <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '0.5rem' }}>
          Listing a practice? <a href="/signup/practitioner" style={{ color: 'var(--brand)' }}>Sign up as a practitioner</a>
        </p>
      </div>
      <Footer />
    </div>
  );
}
