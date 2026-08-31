import Link from 'next/link';

export default function Footer() {
  return (
    <div className="ar-footer-main">
      <div className="ar-footer-grid">
        <div>
          <span className="ar-wordmark" style={{ fontSize: '1rem' }}>Anteroom</span>
          <p className="ar-tagline">The room before the appointment that matters.</p>
          <a href="https://linkedin.com" style={{ display: 'inline-block', marginTop: '0.6rem' }}>LinkedIn</a>
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
        </div>
        <div>
          <h4>For practitioners</h4>
          <Link href="/signup/practitioner">List your practice</Link>
        </div>
      </div>
      <div className="ar-footer-bottom">
        Anteroom gives general information only — not legal or financial advice. Always confirm details directly with your practitioner.
      </div>
    </div>
  );
}
