import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <div className="ar-footer-main">
      <div className="ar-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Image src="/images/logo.svg" alt="AnteRoom" width={26} height={33} />
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
        <div>
          <h4>For practitioners</h4>
          <Link href="/signup/practitioner">List your practice</Link>
        </div>
      </div>
      <div className="ar-footer-bottom">
        <span>&copy; {new Date().getFullYear()} AnteRoom &middot; ABN 77 829 967 292</span>
        <span>General information only &mdash; not legal or financial advice.</span>
      </div>
    </div>
  );
}
