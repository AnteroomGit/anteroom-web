'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PractitionerAccountNav from '../../components/PractitionerAccountNav';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import DeleteAccount from '../../components/DeleteAccount';

export default function PractitionerSecurity() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-account-layout">
        <PractitionerAccountNav active="security" />
        <div>
          <h2 className="ar-h2" style={{ marginTop: 0 }}>Security</h2>

          <ChangePasswordForm />

          <DeleteAccount
            cardText="Permanently deletes your login and profile. Past appointments stay on record for any client you saw, just no longer linked to your account. There's no undo."
            dialogText="This permanently deletes your login and profile. This can't be undone."
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
