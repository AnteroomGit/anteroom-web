'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import { supabase } from '../../../lib/supabase';

// This page used to show email, SMS and marketing toggles. None of them saved
// anything and nothing here sends SMS, so the switches were not real. It now
// says what actually happens. If reminders or updates are ever built, add the
// real switches back here, wired to a column that something reads.
export default function Notifications() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setReady(true);
    }
    check();
  }, [router]);

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="notifications" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Notifications</h2>
          {!ready ? (
            <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
          ) : (
            <div style={{ maxWidth: 560 }}>
              <p style={{ marginTop: 0 }}>
                There is nothing to switch on or off here. AnteRoom only contacts you about
                your account, a booking you have made, or something you have asked us.
              </p>
              <p>
                We do not send marketing emails or text messages. Emails from your account,
                such as confirming your address or resetting your password, come from our
                sign in system and cannot be turned off.
              </p>
              <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--text-sm)' }}>
                You can delete your account any time under{' '}
                <Link href="/account/security" style={{ color: 'var(--brand)' }}>Security</Link>.
                Questions about what we keep? See our{' '}
                <Link href="/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</Link>{' '}
                or <Link href="/contact" style={{ color: 'var(--brand)' }}>contact us</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
