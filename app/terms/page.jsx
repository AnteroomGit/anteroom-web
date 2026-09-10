import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'Terms of Service | AnteRoom' };

export default function Terms() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: 10 September 2026</p>

        <p>
          These terms form the agreement between you and AnteRoom for using our platform.
          Please read them before you use AnteRoom, book a consultation, or list your practice.
          If anything here doesn't make sense, get in touch via our{' '}
          <a href="/contact">Contact page</a> before proceeding.
        </p>

        <h2>1. What AnteRoom is</h2>
        <p>
          AnteRoom is a triage and connection service. We help you understand your situation
          and connect you with independent, verified insolvency, restructuring, accounting, or
          legal professionals (<strong>practitioners</strong>). AnteRoom is not a party to any
          engagement you enter into with a practitioner, and we do not provide legal, financial,
          or professional advice.
        </p>

        <h2>2. Account registration</h2>
        <p>
          To book a consultation or list your practice, you need to create an account. You must
          provide accurate information and keep it up to date, and you're responsible for
          keeping your password confidential and for all activity under your account. Tell us
          straight away if you believe your account's been accessed without your permission. One
          account per person, please; don't create an account on behalf of someone else without
          their authority to do so.
        </p>

        <h2>3. For directors and other users</h2>
        <p>
          Information provided through AnteRoom, including triage results and any AI-generated
          summary, is general in nature and provided to help you decide whether and who to
          speak with. It is not a substitute for advice from a qualified professional about your
          specific circumstances. You're responsible for the accuracy of the information you
          provide, including anything shared through the triage questions or an uploaded
          document.
        </p>

        <h2>4. Connecting accounting software</h2>
        <p>
          If you choose to connect Xero, MYOB, or Manager.io, you authorise AnteRoom to access
          the financial reports made available through that connection (such as your profit and
          loss, balance sheet, and aged payables) for the sole purpose of generating a briefing
          for a practitioner you have booked a consultation with. You can disconnect at any time
          from your account settings, which stops any future access; it doesn't retract a
          briefing already generated and shared with a practitioner. AnteRoom doesn't verify the
          accuracy of the data your accounting software returns, that responsibility (and the
          accuracy of your own books) remains yours and your accounting software provider's, not
          ours. Your relationship with Xero, MYOB, or Manager.io is governed by their own terms,
          separately from these.
        </p>

        <h2>5. For practitioners</h2>
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
          fee does not affect your position in search results or whether you're shown to a
          director. Matching is based only on practitioner type, location, and the director's
          triage answers. See <a href="/how-we-work">How We Work</a> for the full detail, which
          you're welcome to cite directly in your own independence disclosure.
        </p>
        <p>
          AnteRoom's founder is employed by an Australian insolvency advisory firm. That firm is
          permanently excluded from AnteRoom's practitioner network, and will not be listed or
          receive referrals under any circumstances.
        </p>
        <p>
          Where a director has connected accounting software and generated a financial briefing
          ahead of your consultation with them, that briefing is factual background material
          only. It is not advice, does not diagnose insolvency or recommend a pathway, and does
          not substitute for your own review of the director's actual books before forming any
          professional opinion.
        </p>

        <h2>6. Fees for directors</h2>
        <p>
          The triage questions, matching, and booking a consultation are free for directors and
          other users. Any fee for the practitioner's own services is a matter between you and
          that practitioner, agreed separately and not through AnteRoom.
        </p>

        <h2>7. Acceptable use</h2>
        <p>
          Don't use AnteRoom to provide false information, impersonate someone else, attempt to
          access another user's information without permission, scrape or systematically
          extract data from the platform, or interfere with its normal operation.
        </p>

        <h2>8. Availability of the platform</h2>
        <p>
          We aim to keep AnteRoom available and working properly, but we don't guarantee
          uninterrupted or error-free access. We may suspend, restrict, or change any part of
          the platform, including a specific feature such as an accounting software connection,
          at any time, including for maintenance or if a third-party provider we rely on changes
          or withdraws their own service.
        </p>

        <h2>9. Third-party and practitioner information</h2>
        <p>
          Practitioner registration status shown on AnteRoom reflects the relevant public
          register (such as ASIC's register of registered liquidators) at the time we last
          checked it, and may not reflect real-time changes. We encourage you to independently
          verify a practitioner's current registration before engaging them. AnteRoom is not
          responsible for the accuracy of information a practitioner or a third-party service
          (including Xero, MYOB, or Manager.io) provides.
        </p>

        <h2>10. Intellectual property</h2>
        <p>
          AnteRoom and its content, branding, and underlying software belong to us or our
          licensors. You retain ownership of the information you submit (such as your triage
          answers, documents, or connected accounting data), and by submitting it you grant us a
          licence to use it for the purposes described in our{' '}
          <a href="/privacy">Privacy Policy</a>, including generating summaries and briefings
          and sharing them with a practitioner you've chosen to book with.
        </p>

        <h2>11. Suspension and termination</h2>
        <p>
          You can stop using AnteRoom and ask us to delete your account at any time. We may
          suspend or terminate an account that breaches these terms, provides materially false
          information, or is used in a way that risks harming AnteRoom, its users, or its
          practitioner network, and we'll generally try to tell you why if we do.
        </p>

        <h2>12. Liability and indemnity</h2>
        <p>
          AnteRoom is provided on an "as is" basis. To the extent permitted by law, we're not
          liable for decisions made based on triage results or an AI-generated summary or
          briefing, for the conduct or advice of any practitioner you connect with through the
          platform, or for the accuracy of data retrieved from a connected accounting software
          provider. Nothing in these terms excludes a right or remedy you have under the
          Australian Consumer Law that can't lawfully be excluded. To the extent permitted by
          law, you agree to indemnify AnteRoom against any loss arising from your breach of
          these terms or your misuse of the platform.
        </p>

        <h2>13. Changes</h2>
        <p>
          We may update these terms from time to time. Continuing to use AnteRoom after a
          change means you accept the updated terms. We'll update the "last updated" date above
          whenever we do.
        </p>

        <h2>14. Governing law</h2>
        <p>These terms are governed by the laws of Victoria, Australia.</p>

        <h2>15. Contact</h2>
        <p>
          Questions about these terms can be sent via our <a href="/contact">Contact page</a>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
