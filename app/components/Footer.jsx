'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { BUILD_STAMP } from '../../lib/build';

export default function Footer() {
  // Hides the "List your practice" column entirely once someone is
  // already logged in as a practitioner -- pitching signup to someone
  // who's already signed up doesn't make sense, and reads as the site
  // not knowing who it's talking to.
  const [isPractitioner, setIsPractitioner] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('practitioners').select('id').eq('id', user.id).maybeSingle();
      setIsPractitioner(!!data);
    }
    check();
  }, []);

  return (
    <div className="ar-footer-main">
      <div className="ar-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Image src="/images/logo.svg" alt="AnteRoom" width={30} height={30} />
            <span className="ar-wordmark" style={{ fontSize: '1.15rem' }}>AnteRoom</span>
          </div>
          <p className="ar-tagline">The room before the appointment that matters.</p>
          {/* No real AnteRoom LinkedIn page exists yet. A link to a
              generic linkedin.com URL would be dishonest, same reason
              the placeholder practitioners got removed. Add this back
              with a real profile URL once one exists. */}
        </div>
        <div>
          <h4>Company</h4>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/help">Help</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/how-we-work">How We Work</Link>
        </div>
        {!isPractitioner && (
          <div>
            <h4>For practitioners</h4>
            <Link href="/signup/practitioner">List your practice</Link>
          </div>
        )}
      </div>
      <div className="ar-footer-bottom">
        <span>&copy; {new Date().getFullYear()} AnteRoom &middot; ABN 77 829 967 292 &middot; {BUILD_STAMP}</span>
        <span>General information only, not legal or financial advice.</span>
      </div>
    </div>
  );
}
