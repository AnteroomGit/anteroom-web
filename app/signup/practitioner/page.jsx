'use client';

import { useState } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import BotCheck from '../../components/BotCheck';

const TYPES = ['Liquidator', 'Small Business Restructuring Practitioner', 'Accountant', 'Lawyer'];

// Different professions verify against genuinely different registers in
// Australia. SBR Practitioners must themselves be registered liquidators
// (Corporations Act s456B(1)), while accountants and lawyers have their
// own separate systems entirely, not an ASIC registration at all.
const REG_INFO = {
  'Liquidator': {
    label: 'ASIC Registered Liquidator number',
    placeholder: 'e.g. 12345',
    helper: 'We verify this against ASIC\u2019s public register of registered liquidators.',
  },
  'Small Business Restructuring Practitioner': {
    label: 'ASIC Registered Liquidator number',
    placeholder: 'e.g. 12345',
    helper: 'SBR Practitioners must be registered liquidators \u2014 we verify this against ASIC\u2019s public register.',
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

export default function PractitionerSignup() {
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [done, setDone] = useState(false);

  const regInfo = REG_INFO[type];

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-form-page">
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

        {done ? (
          <div className="ar-card">
            <p style={{ margin: 0 }}>
              Thanks. We&apos;ll verify your registration details and be in touch shortly.
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
            <select required className="ar-select" value={type} onChange={(e) => { setType(e.target.value); setRegNumber(''); }} style={{ marginBottom: '1rem' }}>
              <option value="">Select one</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="ar-label">{regInfo ? regInfo.label : 'Professional registration number'}</label>
            <input
              required className="ar-input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
              placeholder={regInfo ? regInfo.placeholder : ''} disabled={!type}
              style={{ marginBottom: '1rem' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '-0.7rem', marginBottom: '1rem' }}>
              {regInfo ? regInfo.helper : 'Select a practitioner type above first.'}
            </p>

            <label className="ar-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '0.15rem' }} />
              <span>
                I have read and agree to the <a href="/terms">Terms of Service</a> and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            <BotCheck checked={botVerified} onChange={setBotVerified} />

            <button type="submit" className="ar-btn-primary" style={{ width: '100%' }} disabled={!agreed || !botVerified}>
              Submit for verification
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
