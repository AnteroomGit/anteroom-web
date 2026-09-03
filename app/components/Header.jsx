'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header({ confirmBeforeHome, onConfirmedHome }) {
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <>
      <div className="ar-header">
        <Link href="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <Image src="/images/logo.svg" alt="AnteRoom" width={26} height={33} priority />
          <span className="ar-wordmark" style={{ fontSize: '1.05rem' }}>AnteRoom</span>
        </Link>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link className="ar-nav-link" href="/signup/practitioner">For practitioners</Link>
          <Link className="ar-nav-link" href="/login">Log in / Sign up</Link>
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
