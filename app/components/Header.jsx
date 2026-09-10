'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export default function Header({ confirmBeforeHome, onConfirmedHome }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  // null while checking, false if logged out, otherwise
  // { name, accountHref } for whichever account type they are.
  const [account, setAccount] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccount(false);
        setChecked(true);
        return;
      }

      // Header is shared across both client and practitioner pages, so it
      // doesn't already know which one this user is. A client and a
      // practitioner never share an id, so at most one of these two
      // lookups ever finds a row -- checking both is the simplest way to
      // find out, rather than threading account type through every page.
      const [{ data: client }, { data: practitioner }] = await Promise.all([
        supabase.from('clients').select('first_name').eq('id', user.id).maybeSingle(),
        supabase.from('practitioners').select('name').eq('id', user.id).maybeSingle(),
      ]);

      if (client) {
        setAccount({ name: client.first_name || 'Account', href: '/account/profile' });
      } else if (practitioner) {
        setAccount({ name: practitioner.name || 'Account', href: '/practitioner/profile' });
      } else {
        setAccount(false);
      }
      setChecked(true);
    }

    loadAccount();

    // Keeps the header in sync immediately on login/logout, rather than
    // only updating on the next full page load.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAccount();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  function handleLogoClick(e) {
    if (confirmBeforeHome) {
      e.preventDefault();
      setShowConfirm(true);
    }
    // Otherwise let the Link navigate normally. Nothing to lose on
    // any other page, so no reason to interrupt the click.
  }

  function handleConfirmLeave() {
    setShowConfirm(false);
    if (onConfirmedHome) onConfirmedHome();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <>
      <div className="ar-header">
        <Link href="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <Image src="/images/logo.svg" alt="AnteRoom" width={30} height={30} priority />
          <span className="ar-wordmark" style={{ fontSize: '1.05rem' }}>AnteRoom</span>
        </Link>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {/* Avoid a flash of the logged-out nav before the auth check
              resolves -- render nothing in this slot until we actually
              know, rather than briefly showing "Log in" to someone who
              is, a beat later, revealed to already be logged in. */}
          {!checked ? null : account ? (
            <>
              {account.href === '/account/profile' && (
                <Link className="ar-nav-link" href="/signup/practitioner">For practitioners</Link>
              )}
              <Link className="ar-nav-link" href={account.href}>{account.name}</Link>
              <Link className="ar-nav-link" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Log out</Link>
            </>
          ) : (
            <>
              <Link className="ar-nav-link" href="/signup/practitioner">For practitioners</Link>
              <Link className="ar-nav-link" href="/login">Log in / Sign up</Link>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="ar-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <p className="ar-modal-title">Leave this page?</p>
            <p className="ar-modal-text">Your answers to the questions so far will be lost.</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
              <button className="ar-btn-ghost" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Stay here</button>
              <button className="ar-btn-primary" style={{ flex: 1 }} onClick={handleConfirmLeave}>Go to homepage</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
