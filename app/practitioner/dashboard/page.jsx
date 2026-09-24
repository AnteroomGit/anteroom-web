'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ShieldCheck, ShieldAlert, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PractitionerAccountNav from '../../components/PractitionerAccountNav';
import { supabase } from '../../../lib/supabase';

export default function PractitionerDashboard() {
  const router = useRouter();  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [verified, setVerified] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [needsBriefingCount, setNeedsBriefingCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [profileChecklist, setProfileChecklist] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      const [{ data: profile }, { data: upcoming }] = await Promise.all([
        supabase.from('practitioners').select('name, verified, bio, suburb, tags, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('appointments')
          .select('id, slot_time, appointment_date, financial_report, clients(first_name, last_name)')
          .eq('practitioner_id', user.id)
          .gte('appointment_date', today)
          .order('appointment_date', { ascending: true }),
      ]);

      if (profile) {
        setName(profile.name || '');
        setVerified(!!profile.verified);
        setProfileChecklist({
          bio: !!profile.bio,
          address: !!profile.suburb,
          specialties: (profile.tags || []).length > 0,
          photo: !!profile.avatar_url,
        });
      }

      const list = upcoming || [];
      setUpcomingCount(list.length);
      setNeedsBriefingCount(list.filter((a) => !a.financial_report).length);
      setNextAppointment(list[0] || null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="ar-root">
        <Header />
        <div className="ar-account-layout">
          <PractitionerAccountNav active="dashboard" />
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <PractitionerAccountNav active="dashboard" />
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '0.2rem' }}>
            {name ? `Welcome back, ${name.split(' ')[0]}` : 'Dashboard'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
            The state of your practice on AnteRoom, at a glance.
          </p>

          <div className="ar-status-bar">
            <div className="ar-status-bar-item">
              <div className="ar-stat-number">{upcomingCount}</div>
              <div className="ar-stat-label">Upcoming appointments</div>
            </div>
            <div className="ar-status-bar-item">
              <div className="ar-stat-number">{needsBriefingCount}</div>
              <div className="ar-stat-label">Awaiting a financial briefing</div>
            </div>
            <div className="ar-status-bar-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {verified
                  ? <ShieldCheck size={22} style={{ color: 'var(--sage)' }} />
                  : <ShieldAlert size={22} style={{ color: 'var(--amber)' }} />}
                <span className="ar-stat-number" style={{ fontSize: '1.1rem', color: verified ? 'var(--brand)' : 'var(--amber)' }}>
                  {verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="ar-stat-label">Verification status</div>
            </div>
          </div>

          {upcomingCount === 0 && profileChecklist && Object.values(profileChecklist).some((v) => !v) && (
            <div className="ar-card" style={{ marginBottom: '1.25rem', borderColor: 'var(--brand)' }}>
              <p style={{ fontWeight: 300, margin: '0 0 0.2rem' }}>Get your profile ready</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                A fuller profile is more likely to get picked when a director's comparing options.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { key: 'photo', label: 'Add a real photo', href: '/practitioner/profile' },
                  { key: 'bio', label: 'Write a short bio', href: '/practitioner/profile' },
                  { key: 'address', label: 'Set your firm address', href: '/practitioner/profile' },
                  { key: 'specialties', label: 'Select your specialties', href: '/practitioner/profile' },
                ].map((item) => (
                  <a key={item.key} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: profileChecklist[item.key] ? 'var(--ink-soft)' : 'var(--ink)', fontSize: '0.88rem' }}>
                    {profileChecklist[item.key]
                      ? <CheckCircle2 size={16} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                      : <Circle size={16} style={{ color: 'var(--line)', flexShrink: 0 }} />}
                    <span style={{ textDecoration: profileChecklist[item.key] ? 'line-through' : 'none' }}>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="ar-card" style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.6rem' }}>
              Next up
            </p>
            {nextAppointment ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CalendarClock size={18} style={{ color: 'var(--brand)' }} />
                <div>
                  <div style={{ fontWeight: 300 }}>
                    {nextAppointment.clients?.first_name || 'Client'} {nextAppointment.clients?.last_name || ''}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                    {nextAppointment.appointment_date
                      ? new Date(nextAppointment.appointment_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
                      : 'Date not on file'}{nextAppointment.slot_time ? `, ${nextAppointment.slot_time}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-soft)' }}>Nothing booked yet.</p>
            )}
          </div>

          <a href="/practitioner/appointments" className="ar-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'auto', textDecoration: 'none' }}>
            View full calendar <ArrowRight size={15} />
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
