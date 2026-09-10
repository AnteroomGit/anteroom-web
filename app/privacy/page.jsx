import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'Privacy Policy | AnteRoom' };

export default function Privacy() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: 10 September 2026</p>

        <p>
          This policy explains what personal information AnteRoom collects, why, how it's used
          and disclosed, and the rights you have over it. We've tried to write it in plain
          language rather than dense legal boilerplate, because a privacy policy nobody can
          actually understand doesn't achieve much. If anything here is unclear, get in touch
          via our <a href="/contact">Contact page</a> and we'll explain it properly.
        </p>

        <h2>1. About this policy</h2>
        <p>
          AnteRoom (<strong>we</strong>, <strong>us</strong>, <strong>our</strong>) operates the
          AnteRoom platform: a free triage tool for Australian company directors dealing with
          ATO debt, Director Penalty Notices, and related financial distress, and a network
          connecting them with independent, verified insolvency, restructuring, accounting, and
          legal professionals (<strong>practitioners</strong>).
        </p>
        <p>
          "Personal information" in this policy has the meaning given to it by the Privacy Act
          1988 (Cth) (<strong>Privacy Act</strong>): information or an opinion about an
          identified individual, or an individual who is reasonably identifiable, whether true
          or not. We handle personal information in line with the Australian Privacy Principles
          (<strong>APPs</strong>) under that Act.
        </p>
        <p>
          This policy applies to directors and other individuals using AnteRoom's triage tool
          or booking a consultation (<strong>directors</strong> or <strong>you</strong>),
          practitioners who list on our network, and anyone else whose information we handle in
          running the business.
        </p>

        <h2>2. What AnteRoom actually does</h2>
        <p>
          Understanding what our platform does helps explain why we collect what we collect. In
          short, AnteRoom:
        </p>
        <ul>
          <li>Asks a director a short series of questions about their situation, and gives them
            plain-English general information about what it might mean and what kind of
            professional could help.</li>
          <li>Lets a director search for and book a consultation with a verified practitioner
            from our network.</li>
          <li>Optionally, lets a director connect their accounting software (currently Xero,
            MYOB, or Manager.io) so a practitioner they've booked with can review an
            AI-generated summary of their actual financial position ahead of that meeting.</li>
          <li>Lets practitioners create a profile, get verified against the relevant
            professional register, and receive appointment referrals.</li>
        </ul>

        <h2>3. Information we collect</h2>
        <p>The types of information we collect depend on how you use AnteRoom:</p>

        <h3>If you use the triage questions</h3>
        <p>
          We collect your answers, for example the type of notice you've received, relevant
          dates, and general information about your company's financial position. If you're not
          logged in, these answers stay in your browser only and aren't sent to us until you
          choose to book a consultation or otherwise submit them.
        </p>

        <h3>If you create an account or book a consultation</h3>
        <p>
          We collect your name, email address, mobile number, password (stored in encrypted
          form by our authentication provider, never visible to us as plain text), and the
          triage answers and notes attached to any consultation you book.
        </p>

        <h3>If you connect accounting software</h3>
        <p>
          If you choose to connect Xero, MYOB, or Manager.io from your account settings, we
          collect and store the access credentials needed to read your financial reports (for
          Xero and MYOB, this is an authorisation token you grant through their own login
          screen, not your Xero or MYOB password itself; for Manager.io, it's an API key you
          generate and paste in yourself). Once connected, and only once you have an appointment
          booked with a specific practitioner, we retrieve financial reports such as your
          profit and loss, balance sheet, and aged payables directly from that software, to
          generate a written briefing for that practitioner. This connection is entirely
          optional, can be disconnected at any time from your account settings, and is never
          used for any purpose beyond generating that briefing for a practitioner you've
          actually chosen to meet with.
        </p>

        <h3>If you upload documents</h3>
        <p>
          If you choose to add financial statements, ATO correspondence, or other documents
          ahead of a consultation, we collect and store those files.
        </p>

        <h3>If you sign up as a practitioner</h3>
        <p>
          We collect your name, firm, contact details, practitioner type, and professional
          registration number. We use your registration number to verify your status against
          the relevant public register (such as ASIC's register of registered liquidators)
          before your profile is shown publicly.
        </p>

        <h3>Automatically, from using the site</h3>
        <p>
          Like most websites, we use cookies and similar technologies for essential site
          functionality (such as keeping you logged in) and, where you've consented via our
          cookie banner, to understand how the site is used. See the Cookies section below.
        </p>

        <h2>4. How your information is used and disclosed</h2>
        <p>
          We are not interested in trading your personal information, and we will not sell it.
          We use and disclose it only for the purposes below, or as otherwise required or
          authorised by law.
        </p>
        <p>
          Your triage answers, documents, and any connected accounting data are{' '}
          <strong>only</strong> shared with a specific practitioner after you have separately
          and explicitly agreed to that at the point of booking, not as part of a general
          signup agreement. You will always see exactly who you're sharing information with
          before you share it, and you can decline to add any document, connection, or detail
          you're not comfortable sharing. We do not share your information with any
          practitioner you haven't chosen to book with.
        </p>
        <p>We otherwise use and disclose your information to:</p>
        <ul>
          <li>Operate the platform: process your triage answers, manage your account, facilitate
            bookings, and generate the AI-written case summaries and financial briefings
            described in this policy.</li>
          <li>Verify practitioner registration status against the relevant public professional
            register.</li>
          <li>Communicate with you about your account, a booking, or a query you've raised.</li>
          <li>Understand and improve the platform, generally using de-identified or aggregated
            information where practical.</li>
          <li>Investigate or respond to a complaint, enforce our Terms of Service, or protect
            the safety and security of AnteRoom and its users.</li>
          <li>Comply with our legal obligations, or where necessary to lessen a serious threat to
            someone's life, health, or safety.</li>
        </ul>
        <p>
          We disclose information to third-party service providers who help us run the
          platform, bound by confidentiality and, where applicable, their own privacy and
          security obligations. These currently include our hosting and infrastructure
          providers, our database and authentication provider, our AI provider (for generating
          case summaries and financial briefings), and, if you choose to connect them, Xero,
          MYOB, or Manager.io.
        </p>

        <h2>5. Automated decision-making and AI-generated content</h2>
        <p>
          AnteRoom uses rules-based logic to turn your triage answers into general information
          about which pathway may be relevant to your situation, and, separately, uses an AI
          model to write a plain-language summary of your triage answers, and (where you've
          connected accounting software) a briefing on your financial position, for a
          practitioner to read ahead of your consultation.
        </p>
        <p>
          None of this is a decision about you in any legal or clinical sense, and none of it
          is checked by a person before you see your own triage result. It's general
          information and a factual summary only, it does not determine whether your company is
          insolvent, and it is not a recommendation that you take any particular course of
          action. A practitioner's own professional judgement, not anything generated by
          AnteRoom, is what actually informs any advice you receive. See our{' '}
          <a href="/how-we-work">How We Work</a> page for more detail on how matching and
          triage logic works.
        </p>

        <h2>6. Overseas recipients</h2>
        <p>
          Some of our service providers, including our hosting, database, and AI infrastructure
          providers, may store or process your information on servers located outside
          Australia, including in the United States. Where this happens, we take reasonable
          steps to ensure your information continues to receive an appropriate standard of
          protection, but we're not always able to guarantee that every recipient will handle
          your information in exactly the way an Australian entity would be required to under
          the Privacy Act. If you have concerns about a specific disclosure, contact us and
          we'll do our best to answer them.
        </p>

        <h2>7. Practitioners</h2>
        <p>
          A practitioner's profile information (name, firm, registration status, specialty
          areas) may be displayed publicly on AnteRoom so that directors can make an informed
          choice about who to contact. Verification details used to confirm registration status
          are kept for our records and are not displayed publicly. A director's triage answers
          and any documents or connected accounting data are shared with a practitioner only
          once that director has booked a consultation with them specifically.
        </p>

        <h2>8. Security</h2>
        <p>
          We take reasonable technical and organisational steps to protect the information we
          hold, including restricting who can access it, using encryption in transit, and
          reviewing our practices as the platform grows. Passwords are managed by our
          authentication provider and are never visible to us in plain text. No online service
          can guarantee complete security, and if we become aware of a data breach likely to
          result in serious harm, we'll notify affected individuals and the Office of the
          Australian Information Commissioner in line with our obligations under the Privacy
          Act.
        </p>

        <h2>9. How long we keep your information</h2>
        <p>
          We keep your information for as long as your account is active, and for a reasonable
          period afterward in case you return, unless you ask us to delete it sooner or we're
          required to keep it longer by law (for example, some records may need to be retained
          for tax or accounting purposes). If you disconnect an accounting software connection,
          we delete the stored access credentials for that connection; previously generated
          briefings remain attached to the relevant appointment unless you ask us to delete
          them too.
        </p>

        <h2>10. Cookies</h2>
        <p>
          We use essential cookies needed for the site to function, such as keeping you logged
          in. Where our cookie banner asks for your consent, we may also use cookies to
          understand how the site is used, so we can improve it. You can control or clear
          cookies through your browser settings, though this may affect how the site works.
        </p>

        <h2>11. Your rights: access, correction, and deletion</h2>
        <p>
          Under the Privacy Act, you can ask us what personal information we hold about you,
          ask us to correct it, or ask us to delete your account and associated data. You can
          update some information (such as your name, mobile number, and what brings you to
          AnteRoom) directly from your account settings at any time. For anything else,
          including deletion, contact us via our <a href="/contact">Contact page</a>. We aim to
          respond within 30 days. We won't charge you for a straightforward request, though the
          Privacy Act permits a reasonable fee for more involved requests, and we'd tell you
          about that in advance if it applied.
        </p>

        <h2>12. Children</h2>
        <p>
          AnteRoom is intended for use by company directors and business professionals, and
          isn't directed at children. We don't knowingly collect personal information from
          anyone under 18. If you believe a child has provided us with personal information,
          contact us and we'll remove it.
        </p>

        <h2>13. Contacting us and complaints</h2>
        <p>
          If you have a question, concern, or complaint about this policy or how we've handled
          your personal information, contact us via our <a href="/contact">Contact page</a>. We
          aim to resolve any issue directly and promptly. If you're not satisfied with our
          response, you can lodge a complaint with the Office of the Australian Information
          Commissioner (OAIC) at{' '}
          <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">www.oaic.gov.au</a>.
        </p>

        <h2>14. Changes to this policy</h2>
        <p>
          We may update this policy from time to time as AnteRoom grows and changes. If we do,
          we'll update the "last updated" date at the top and post the revised policy here.
          Significant changes affecting how we handle your information will be highlighted
          clearly rather than buried in a routine update.
        </p>

        <h2>Not advice</h2>
        <p>
          AnteRoom provides general information only. Nothing on this site, including anything
          generated from your triage answers or connected accounting data, is legal, financial,
          or professional advice.
        </p>
      </div>
      <Footer />
    </div>
  );
}
