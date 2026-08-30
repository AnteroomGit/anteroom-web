import Header from '../../components/Header';
import Footer from '../../components/Footer';

const APPOINTMENTS = [
  { id: 1, name: 'A. Chen', reason: 'Non-lockdown DPN', when: 'Thu 3 Sep, 9:00 AM', status: 'Upcoming' },
  { id: 2, name: 'R. Patel', reason: 'Statutory demand', when: 'Fri 4 Sep, 11:30 AM', status: 'Upcoming' },
];

export default function PractitionerAppointments() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-section" style={{ maxWidth: 700 }}>
        <h2>Your appointments</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {APPOINTMENTS.map((a) => (
            <div key={a.id} className="ar-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 300 }}>{a.name}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>{a.reason} — {a.when}</div>
              </div>
              <span className="ar-tag" style={{ color: 'var(--teal)' }}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
