'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function PractitionerAccountNav({ active }) {
  const router = useRouter();
  // Only the items that genuinely apply on this side -- no "Accounting
  // software" (that's a client connecting their own books, not
  // something a practitioner has) and no "Your answers" (that's a
  // client-only concept). Profile, Appointments, and Security are the
  // real parity items.
  const items = [
    { id: 'profile', label: 'Profile', href: '/practitioner/profile' },
    { id: 'appointments', label: 'Appointments', href: '/practitioner/appointments' },
    { id: 'security', label: 'Security', href: '/practitioner/security' },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <nav className="ar-account-nav">
      {items.map((i) => (
        <a key={i.id} href={i.href} className={active === i.id ? 'active' : ''}>{i.label}</a>
      ))}
      <button onClick={handleLogout} className="logout">Log out</button>
    </nav>
  );
}

export default PractitionerAccountNav;
