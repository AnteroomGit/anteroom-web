import Header from './components/Header';
import Footer from './components/Footer';

export default function NotFound() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-404">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 300 }}>Page not found</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
          That page doesn&apos;t exist. It may have moved.
        </p>
        <a href="/" className="ar-btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Back to AnteRoom</a>
      </div>
      <Footer />
    </div>
  );
}
