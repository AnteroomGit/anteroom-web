import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'Terms of Service | AnteRoom' };

export default function Terms() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: 27 August 2026</p>

        <h2>What AnteRoom is</h2>
        <p>
          AnteRoom is a triage and connection service. We help you understand your situation
          and connect you with independent, verified insolvency, restructuring, accounting, or
          legal professionals. AnteRoom is not a party to any engagement you enter into with a
          practitioner, and we do not provide legal, financial, or professional advice.
        </p>

        <h2>For directors and other users</h2>
        <p>
          Information provided through AnteRoom, including triage results, is general in
          nature and provided to help you decide whether and who to speak with, it is not a
          substitute for advice from a qualified professional about your specific
          circumstances. You&apos;re responsible for the accuracy of the information you provide.
        </p>

        <h2>For practitioners</h2>
        <p>
          By listing your practice on AnteRoom, you confirm the registration and professional
          details you provide are accurate and current, and you remain solely responsible for
          your own professional, regulatory, and independence obligations in any matter you
          accept through AnteRoom. AnteRoom does not direct, supervise, or take responsibility
          for the professional services you provide.
        </p>
        <p>
          AnteRoom charges practitioners a flat, recurring membership fee only. We do not charge
          per referral, per appointment, or any fee calculated on the value of a matter. Your
          fee does not affect your position in search results or whether you&apos;re shown to a
          director. Matching is based only on practitioner type, location, and the director&apos;s
          triage answers. See <a href="/how-we-work">How We Work</a> for the full detail, which
          you&apos;re welcome to cite directly in your own independence disclosure.
        </p>
        <p>
          AnteRoom&apos;s founder is employed by an Australian insolvency advisory firm. That firm is
          permanently excluded from AnteRoom&apos;s practitioner network, and will not be listed or
          receive referrals under any circumstances.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Don&apos;t use AnteRoom to provide false information, to impersonate someone else, or to
          attempt to access another user&apos;s information without permission.
        </p>

        <h2>Liability</h2>
        <p>
          AnteRoom is provided on an &quot;as is&quot; basis. To the extent permitted by law, we&apos;re
          not liable for decisions made based on triage results, or for the conduct or advice
          of any practitioner you connect with through the platform.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continuing to use AnteRoom after a
          change means you accept the updated terms.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of Victoria, Australia.</p>
      </div>
      <Footer />
    </div>
  );
}
