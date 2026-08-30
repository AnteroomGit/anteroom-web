export default function Header() {
  return (
    <div className="ar-header">
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
        <div className="ar-wordmark" style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>A</div>
        <div>
          <div className="ar-wordmark" style={{ fontSize: '1rem', lineHeight: 1 }}>Anteroom</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Clarity before the call.</div>
        </div>
      </a>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <a className="ar-nav-link" href="/signup/practitioner">For practitioners</a>
        <a className="ar-nav-link" href="/login">Log in / Sign up</a>
      </div>
    </div>
  );
}
