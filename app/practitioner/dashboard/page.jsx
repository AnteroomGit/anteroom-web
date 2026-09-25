'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ShieldCheck, ShieldAlert, ArrowRight, CheckCircle2, Circle, User, Calendar, Lock, MessageCircle, Camera, PenLine, MapPin, Tag } from 'lucide-react';
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
          <h2 className="ar-h2" style={{ marginTop: 0, marginBottom: '0.2rem' }}>
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
                  ? <ShieldCheck size={26} style={{ color: 'var(--sage)' }} />
                  : <ShieldAlert size={26} style={{ color: 'var(--amber)' }} />}
                <span className="ar-stat-number" style={{ fontSize: '1.1rem', color: verified ? 'var(--brand)' : 'var(--amber)' }}>
                  {verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="ar-stat-label">Verification status</div>
            </div>
          </div>

          <div className="ar-quick-actions" style={{ marginBottom: '1.25rem' }}>
            <a href="/practitioner/profile" className="ar-quick-action">
              <div className="ar-quick-action-icon"><User size={24} /></div>
              <div>
                <div className="ar-quick-action-label">Edit profile</div>
                <div className="ar-quick-action-sub">Bio, photo, specialties</div>
              </div>
            </a>
            <a href="/practitioner/appointments" className="ar-quick-action">
              <div className="ar-quick-action-icon"><Calendar size={24} /></div>
              <div>
                <div className="ar-quick-action-label">Appointments</div>
                <div className="ar-quick-action-sub">Full calendar</div>
              </div>
            </a>
            <a href="/practitioner/security" className="ar-quick-action">
              <div className="ar-quick-action-icon"><Lock size={24} /></div>
              <div>
                <div className="ar-quick-action-label">Security</div>
                <div className="ar-quick-action-sub">Password, account</div>
              </div>
            </a>
            <a href="/contact" className="ar-quick-action">
              <div className="ar-quick-action-icon"><MessageCircle size={24} /></div>
              <div>
                <div className="ar-quick-action-label">Get help</div>
                <div className="ar-quick-action-sub">Contact AnteRoom</div>
              </div>
            </a>
          </div>

          {upcomingCount === 0 && profileChecklist && Object.values(profileChecklist).some((v) => !v) && (() => {
            const items = [
              { key: 'photo', label: 'Add a real photo', sub: 'Profiles with a photo get chosen more often', icon: Camera },
              { key: 'bio', label: 'Write a short bio', sub: 'A few lines on how you work', icon: PenLine },
              { key: 'address', label: 'Set your firm address', sub: 'Shown so directors know where you are', icon: MapPin },
              { key: 'specialties', label: 'Select your specialties', sub: 'What you actually take on', icon: Tag },
            ];
            const doneCount = items.filter((item) => profileChecklist[item.key]).length;
            return (
              <div className="ar-card" style={{ marginBottom: '1.25rem', padding: 0, gap: 0 }}>
                <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-4)' }}>
                  <p style={{ fontWeight: 600, margin: '0 0 0.2rem' }}>Get your profile ready</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                    A fuller profile is more likely to get picked when a director's comparing options.
                  </p>
                  <div style={{ height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(doneCount / items.length) * 100}%`, background: 'var(--brand)', transition: 'width 200ms ease' }} />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0.4rem 0 0' }}>{doneCount} of {items.length} completed</p>
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const done = profileChecklist[item.key];
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem var(--space-5)', borderTop: '1px solid var(--line)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: done ? 'var(--sage-tint)' : 'var(--brand-tint)', color: done ? 'var(--sage)' : 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={19} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--ink-soft)' : 'var(--ink)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{item.sub}</div>
                      </div>
                      {done
                        ? <CheckCircle2 size={24} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                        : <a href="/practitioner/profile" className="ar-btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.82rem', textDecoration: 'none' }}>Add</a>}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="ar-card" style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, margin: '0 0 0.6rem' }}>
              Next up
            </p>
            {nextAppointment ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CalendarClock size={22} style={{ color: 'var(--brand)' }} />
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

          <a href="/practitioner/appointments" className="ar-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem', textDecoration: 'none', color: '#fff' }}>
            View full calendar <ArrowRight size={18} />
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
