'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { REASONS } from '../../constants';

export default function Profile() {
  const [firstName, setFirstName] = useState('Jack');
  const [lastName, setLastName] = useState('James');
  const [email, setEmail] = useState('you@example.com');
  const [mobile, setMobile] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="profile" />
        <div>
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); setSaved(true); }} style={{ maxWidth: 380 }}>
            <label className="ar-label">First name</label>
            <input className="ar-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Last name</label>
            <input className="ar-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Email</label>
            <input className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Mobile</label>
            <input className="ar-input" value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ marginBottom: '1.25rem' }} />

            <p className="ar-label">What you told us at signup</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {REASONS.map((r) => <span key={r.id} className="ar-tag">{r.label}</span>)}
            </div>

            <button type="submit" className="ar-btn-primary">Save changes</button>
            {saved && <span style={{ marginLeft: '0.75rem', fontSize: '0.84rem', color: 'var(--sage)' }}>Saved</span>}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
