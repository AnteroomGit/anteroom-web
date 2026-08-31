'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const INITIAL = [
  { id: 1, name: 'A. Chen', reason: 'Non-lockdown DPN', when: 'Thu 3 Sep, 9:00 AM', status: 'Consulted' },
  { id: 2, name: 'R. Patel', reason: 'Statutory demand', when: 'Fri 4 Sep, 11:30 AM', status: 'New' },
];

const STATUSES = ['New', 'Consulted', 'Engaged — SBR', 'Engaged — VA', 'Engaged — Liquidation', 'Engaged — Other', 'No further action'];

export default function PractitionerAppointments() {
  const [appointments, setAppointments] = useState(INITIAL);

  function updateStatus(id, status) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-section" style={{ maxWidth: 720 }}>
        <h2>Your appointments</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
          Keeping this updated means our monthly check-in is quick, not a guessing game.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map((a) => (
            <div key={a.id} className="ar-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 300 }}>{a.name}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>{a.reason} — {a.when}</div>
              </div>
              <select className="ar-select" style={{ width: 'auto', minWidth: 160 }} value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
