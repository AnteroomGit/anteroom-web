import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'Privacy Policy | AnteRoom' };

export default function Privacy() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: 27 August 2026</p>

        <h2>What we collect</h2>
        <p>
          When you use AnteRoom&apos;s triage questions, we collect your answers about your
          situation, for example the type of notice you&apos;ve received and relevant dates. If
          you book a consultation, we collect your name and contact details. If you choose to
          add financial statements, ATO correspondence, or other documents ahead of a
          consultation, we collect those files. If you sign up as a practitioner, we collect
          your name, firm, contact details, and professional registration information.
        </p>

        <h2>How your information is shared</h2>
        <p>
          Your triage answers and any documents you add are <strong>only</strong> shared with a
          specific practitioner after you have separately and explicitly agreed to that at the
          point of booking, not as part of a general signup agreement. You will always see
          exactly who you&apos;re sharing information with, and you can decline to add any
          document or detail you&apos;re not comfortable sharing. We do not sell your information,
          and we do not share it with any practitioner you have not chosen to book with.
        </p>

        <h2>Practitioners</h2>
        <p>
          Practitioner profile and verification information may be displayed publicly on
          AnteRoom (name, firm, registration status, specialty areas) so that directors can
          make an informed choice. Verification details used to confirm registration status
          are kept for our records and are not displayed publicly.
        </p>

        <h2>Security</h2>
        <p>
          We take reasonable steps to keep your information secure, including restricting who
          can access it and reviewing our practices as the platform grows. No online service
          can guarantee complete security, and we&apos;ll let you know if we become aware of any
          issue affecting your information.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask us what information we hold about you, ask us to correct it, or ask us to
          delete it, by contacting us through our <a href="/contact">Contact page</a>. We aim to
          handle your information in line with the Australian Privacy Principles under the
          Privacy Act 1988 (Cth).
        </p>

        <h2>Not advice</h2>
        <p>
          AnteRoom provides general information only. Nothing on this site, including anything
          generated from your triage answers, is legal, financial, or professional advice.
        </p>

        <h2>Questions</h2>
        <p>
          If you have questions about this policy, get in touch via our{' '}
          <a href="/contact">Contact page</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
