'use client';

import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  // Real check, separate from the appointment list itself: only show the
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
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: appts }, { count: connectionCount }] = await Promise.all([
        supabase.from('appointments')
          .select('id, slot_time, appointment_date, status, practitioners(name, firm)')
          .eq('client_id', user.id)
          .order('appointment_date', { ascending: false, nullsFirst: false }),
        supabase.from('financial_connections').select('id', { count: 'exact', head: true }),
      ]);

      setAppointments(appts || []);
      setShowPrompt((appts?.length || 0) > 0 && (connectionCount || 0) === 0);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="appointments" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Appointments</h2>

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
                  <Link2 size={17} /> Connect accounting
                </a>
              </div>
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
          ) : appointments.length === 0 ? (
            <div className="ar-card">
              <p style={{ margin: 0 }}>No appointments yet.</p>
              <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
                <a href="/?start=1" style={{ color: 'var(--brand)' }}>Answer the questions</a> to get matched with a practitioner and book one.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map((a) => {
                const isPast = a.appointment_date && a.appointment_date < today;
                return (
                  <div key={a.id} className="ar-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 300 }}>
                        {a.practitioners?.name || 'Practitioner'}{a.practitioners?.firm ? `, ${a.practitioners.firm}` : ''}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                        {a.appointment_date
                          ? new Date(a.appointment_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
                          : 'Date not on file'}{a.slot_time ? `, ${a.slot_time}` : ''}
                      </div>
                    </div>
                    <span className="ar-tag" style={{ color: isPast ? 'var(--ink-soft)' : 'var(--brand)' }}>{isPast ? 'Past' : 'Upcoming'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
