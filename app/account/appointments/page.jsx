'use client';

import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';

const APPOINTMENTS = [
  { id: 1, name: 'Marcus Reid', firm: 'Reid & Associates', when: 'Thu 3 Sep, 9:00 AM', status: 'Upcoming' },
  { id: 2, name: 'Claire Whitfield', firm: 'Whitfield Partners', when: 'Mon 17 Aug, 2:00 PM', status: 'Past' },
];

export default function Appointments() {
  // Real check, separate from the placeholder list above: only show the
  // "connect your accounting software" prompt once someone actually has
  // a booked appointment and hasn't connected anything yet -- surfacing
  // it here rather than during triage or at signup is a deliberate
  // choice, not a default. Asking for access to live financial data
  // before any trust has been built, mid-crisis, in the free triage
  // flow itself would work against everything that flow is built to be:
  // low-friction and calm. By the time someone's booked with a real
  // practitioner, the ask has an immediate, concrete payoff attached
  // instead of being a cold request for sensitive access.
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    async function checkPrompt() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count: appointmentCount }, { count: connectionCount }] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('client_id', user.id),
        supabase.from('financial_connections').select('id', { count: 'exact', head: true }),
      ]);

      setShowPrompt((appointmentCount || 0) > 0 && (connectionCount || 0) === 0);
    }
    checkPrompt();
  }, []);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="appointments" />
        <div>
          <h2 style={{ marginTop: 0 }}>Appointments</h2>

          {showPrompt && (
            <div className="ar-card" style={{ marginBottom: '1rem', borderColor: 'var(--brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 300 }}>Want your practitioner to walk in already knowing your numbers?</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                    Connect Xero, MYOB, or Manager.io and they'll have a clear financial picture ready before you sit down. Optional, and only shared with a practitioner you actually book with.
                  </div>
                </div>
                <a href="/account/integrations" className="ar-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                  <Link2 size={14} /> Connect accounting
                </a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {APPOINTMENTS.map((a) => (
              <div key={a.id} className="ar-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 300 }}>{a.name}, {a.firm}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>{a.when}</div>
                </div>
                <span className="ar-tag" style={{ color: a.status === 'Upcoming' ? 'var(--brand)' : 'var(--ink-soft)' }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
