'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';

function Toggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: '0.92rem' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{sub}</div>}
      </div>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
    </div>
  );
}

export default function Notifications() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="notifications" />
        <div>
          <h2 style={{ marginTop: 0 }}>Notifications</h2>
          <div style={{ maxWidth: 460 }}>
            <Toggle label="Email reminders" sub="Appointment confirmations and reminders" value={emailReminders} onChange={setEmailReminders} />
            <Toggle label="SMS reminders" sub="Text reminders ahead of a consultation" value={smsReminders} onChange={setSmsReminders} />
            <Toggle label="Occasional updates from AnteRoom" sub="You can opt out of these at any time" value={marketing} onChange={setMarketing} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
