import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';

const APPOINTMENTS = [
  { id: 1, name: 'Marcus Reid', firm: 'Reid & Associates', when: 'Thu 3 Sep, 9:00 AM', status: 'Upcoming' },
  { id: 2, name: 'Claire Whitfield', firm: 'Whitfield Partners', when: 'Mon 17 Aug, 2:00 PM', status: 'Past' },
];

export default function Appointments() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="appointments" />
        <div>
          <h2 style={{ marginTop: 0 }}>Appointments</h2>
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
