'use client';

import { useState } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

const TYPES = ['Liquidator', 'Small Business Restructuring Practitioner', 'Accountant', 'Lawyer'];

export default function PractitionerSignup() {
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.4rem' }}>List your practice</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          For registered liquidators, restructuring practitioners, accountants, and lawyers.
        </p>

        {done ? (
          <div className="ar-card">
            <p style={{ margin: 0 }}>
              Thanks — we&apos;ll verify your registration details and be in touch shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <label className="ar-label">Full name</label>
            <input required className="ar-input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Firm</label>
            <input required className="ar-input" value={firm} onChange={(e) => setFirm(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Email</label>
            <input required type="email" className="ar-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: '1rem' }} />

            <label className="ar-label">Practitioner type</label>
            <select required className="ar-select" value={type} onChange={(e) => setType(e.target.value)} style={{ marginBottom: '1rem' }}>
              <option value="">Select one</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="ar-label">Professional registration number</label>
            <input required className="ar-input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '-0.7rem', marginBottom: '1rem' }}>
              We verify this against the relevant public register before your profile goes live.
            </p>

            <label className="ar-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.15rem' }} />
              <span>
                I have read and agree to the <a href="/privacy">Privacy Policy</a> and{' '}
                <a href="/terms">Terms of Service</a>.
              </span>
            </label>

            <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!agreed}>
              Submit for verification
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
