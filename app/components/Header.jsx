'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAccount } from '../../lib/account';
import ConfirmDialog from './ConfirmDialog';

export default function Header({ confirmBeforeHome, onConfirmedHome }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  // undefined while checking, null if logged out, otherwise
  // { name, href, type } for whichever account type they are. The answer
  // is looked up once and shared with the footer (see lib/account.js), so
  // moving between pages no longer re-asks the database or flickers.
  const account = useAccount();
  const checked = account !== undefined;

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

  // Pages do not share a layout, so there is no <main> element to jump to.
  // The first thing after the header is the page's content, so the skip
  // link finds that and moves focus into it.
  function handleSkip(e) {
    e.preventDefault();
    const header = document.querySelector('.ar-header');
    let target = header ? header.nextElementSibling : null;
    while (target && target.classList.contains('ar-modal-overlay')) target = target.nextElementSibling;
    if (!target) return;
    if (!target.id) target.id = 'main-content';
    target.setAttribute('tabindex', '-1');
    target.focus();
    target.scrollIntoView();
  }

  return (
    <>
      <a href="#main-content" className="ar-skip-link" onClick={handleSkip}>Skip to main content</a>
      {account?.type === 'practitioner' && <div className="ar-practitioner-rail" aria-hidden="true" />}
      <div className="ar-header">
        <Link href="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <Image src="/images/logo.svg" alt="AnteRoom" width={30} height={30} priority />
          <span className="ar-wordmark" style={{ fontSize: 'var(--text-md)' }}>Ante<span className="ar-wordmark-light">Room</span></span>
          {account?.type === 'practitioner' && <span className="ar-practitioner-badge">Practitioner</span>}
        </Link>
        <nav aria-label="Main" className="ar-nav">
          {/* Avoid a flash of the logged-out nav before the account check
              resolves: render nothing in this slot until we actually
              know, rather than briefly showing "Log in" to someone who
              is, a beat later, revealed to already be logged in. */}
          {!checked ? null : account ? (
            <>
              <Link className="ar-nav-link ar-nav-secondary" href="/guides">Guides</Link>
              {account.type === 'client' && (
                <Link className="ar-nav-link ar-nav-secondary" href="/for-practitioners">For practitioners</Link>
              )}
              <Link className="ar-nav-link ar-nav-account" href={account.href}>{account.name}</Link>
              <button type="button" className="ar-nav-link ar-nav-button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="ar-nav-link ar-nav-secondary" href="/guides">Guides</Link>
              <Link className="ar-nav-link ar-nav-secondary" href="/for-practitioners">For practitioners</Link>
              <Link className="ar-nav-link" href="/login">Log in / Sign up</Link>
            </>
          )}
        </nav>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Leave this page?"
        confirmLabel="Go to homepage"
        cancelLabel="Stay here"
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowConfirm(false)}
      >
        Your answers to the questions so far will be lost.
      </ConfirmDialog>
    </>
  );
}
