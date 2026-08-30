import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'Terms of Service — Anteroom' };

export default function Terms() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: 27 August 2026</p>

        <h2>What Anteroom is</h2>
        <p>
          Anteroom is a triage and connection service. We help you understand your situation
          and connect you with independent, verified insolvency, restructuring, accounting, or
          legal professionals. Anteroom is not a party to any engagement you enter into with a
          practitioner, and we do not provide legal, financial, or professional advice.
        </p>

        <h2>For directors and other users</h2>
        <p>
          Information provided through Anteroom, including triage results, is general in
          nature and provided to help you decide whether and who to speak with — it is not a
          substitute for advice from a qualified professional about your specific
          circumstances. You&apos;re responsible for the accuracy of the information you provide.
        </p>

        <h2>For practitioners</h2>
        <p>
          By listing your practice on Anteroom, you confirm the registration and professional
          details you provide are accurate and current, and you remain solely responsible for
          your own professional, regulatory, and independence obligations in any matter you
          accept through Anteroom. Anteroom does not direct, supervise, or take responsibility
          for the professional services you provide.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Don&apos;t use Anteroom to provide false information, to impersonate someone else, or to
          attempt to access another user&apos;s information without permission.
        </p>

        <h2>Liability</h2>
        <p>
          Anteroom is provided on an &quot;as is&quot; basis. To the extent permitted by law, we&apos;re
          not liable for decisions made based on triage results, or for the conduct or advice
          of any practitioner you connect with through the platform.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continuing to use Anteroom after a
          change means you accept the updated terms.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of Victoria, Australia.</p>
      </div>
      <Footer />
    </div>
  );
}
