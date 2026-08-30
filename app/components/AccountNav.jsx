'use client';

function AccountNav({ active }) {
  const items = [
    { id: 'profile', label: 'Profile', href: '/account/profile' },
    { id: 'appointments', label: 'Appointments', href: '/account/appointments' },
    { id: 'security', label: 'Security', href: '/account/security' },
    { id: 'notifications', label: 'Notifications', href: '/account/notifications' },
  ];
  return (
    <nav className="ar-account-nav">
      {items.map((i) => (
        <a key={i.id} href={i.href} className={active === i.id ? 'active' : ''}>{i.label}</a>
      ))}
      <a href="/" className="logout">Log out</a>
    </nav>
  );
}

export default AccountNav;
