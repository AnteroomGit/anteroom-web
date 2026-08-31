'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function AccountNav({ active }) {
  const router = useRouter();
  const items = [
    { id: 'profile', label: 'Profile', href: '/account/profile' },
    { id: 'appointments', label: 'Appointments', href: '/account/appointments' },
    { id: 'security', label: 'Security', href: '/account/security' },
    { id: 'notifications', label: 'Notifications', href: '/account/notifications' },
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

export default AccountNav;
