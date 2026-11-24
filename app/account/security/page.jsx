'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AccountNav from '../../components/AccountNav';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import DeleteAccount from '../../components/DeleteAccount';

export default function Security() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <AccountNav active="security" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Security</h2>

          <ChangePasswordForm />

          <div className="ar-card" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 300, margin: 0 }}>Your data</p>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              You can request a copy of the information we hold about you at any time through our{' '}
              <a href="/contact" style={{ color: 'var(--brand)' }}>Contact page</a>.
            </p>
          </div>

          <DeleteAccount
            cardText="Permanently deletes your login, profile, appointment history, and any connected accounting data. There's no undo."
            dialogText="This permanently deletes your login, profile, appointment history, and any connected accounting data. This can't be undone."
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
