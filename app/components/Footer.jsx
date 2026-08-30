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
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/help">Help</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
        <div>
          <h4>For practitioners</h4>
          <a href="/signup/practitioner">List your practice</a>
        </div>
      </div>
      <div className="ar-footer-bottom">
        Anteroom gives general information only — not legal or financial advice. Always confirm details directly with your practitioner.
      </div>
    </div>
  );
}
