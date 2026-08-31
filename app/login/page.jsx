'use client';

import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1.5rem' }}>Log in</h1>

        <form onSubmit={(e) => e.preventDefault()}>
          <label className="ar-label">Email</label>
          <input required type="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label className="ar-label">Password</label>
          <input required type="password" className="ar-input" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: '1.25rem' }} />

          <button type="submit" className="ar-btn-primary" style={{ width: '100%', marginBottom: '0.9rem' }}>Log in</button>
        </form>

        <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
          Don&apos;t have an account? <a href="/signup/client" style={{ color: 'var(--brand)' }}>Sign up</a>
        </p>
        <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '0.5rem' }}>
          Listing a practice? <a href="/signup/practitioner" style={{ color: 'var(--brand)' }}>Sign up as a practitioner</a>
        </p>
      </div>
      <Footer />
    </div>
  );
}
