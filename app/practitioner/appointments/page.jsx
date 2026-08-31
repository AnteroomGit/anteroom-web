'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { supabase } from '../../../lib/supabase';

const STATUSES = ['New', 'Consulted', 'Engaged — SBR', 'Engaged — VA', 'Engaged — Liquidation', 'Engaged — Other', 'No further action'];

export default function PractitionerAppointments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('appointments')
        .select('*, clients(first_name, last_name)')
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false });

      setAppointments(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function updateStatus(id, status) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await supabase.from('appointments').update({ status }).eq('id', id);
  }

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-section"><p style={{ color: 'var(--ink-soft)' }}>Loading...</p></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-section" style={{ maxWidth: 720 }}>
        <h2>Your appointments</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
          Keeping this updated means our monthly check-in is quick, not a guessing game.
        </p>

        {appointments.length === 0 && (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>No referrals yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map((a) => {
            const name = a.clients ? `${a.clients.first_name || ''} ${a.clients.last_name || ''}`.trim() : 'Client';
            const isOpen = expanded === a.id;
            return (
              <div key={a.id} className="ar-card">
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                >
                  <div>
                    <div style={{ fontWeight: 300 }}>{name || 'Client'}</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                      {a.triage_summary || 'No summary recorded'} — {a.slot_time}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <select
                      className="ar-select" style={{ width: 'auto', minWidth: 160 }}
                      value={a.status} onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)', fontSize: '0.86rem' }}>
                    {a.notice_type && <p><strong>Notice:</strong> {a.notice_type}{a.notice_date ? ` (dated ${a.notice_date})` : ''}</p>}
                    {a.notes && <p><strong>Notes from client:</strong> {a.notes}</p>}
                    <p style={{ fontWeight: 300, marginTop: '0.75rem', marginBottom: '0.4rem' }}>Full triage answers</p>
                    <pre style={{
                      background: 'var(--paper)', padding: '0.75rem', borderRadius: 8,
                      fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap',
                    }}>
                      {JSON.stringify(a.triage_answers, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
