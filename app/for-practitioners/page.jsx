import { ShieldCheck, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pageMeta } from '../../lib/meta';
import { MONTHLY_PRICE_LABEL, foundingEndLabel } from '../../lib/pricing';

export const metadata = pageMeta({
  title: 'For registered liquidators',
  description: 'AnteRoom introduces company directors to verified registered liquidators for a flat membership fee. No per-referral fees and no paying for position.',
  path: '/for-practitioners',
});

// This page says when the founding period ends and stops saying it once that
// day has passed (see lib/pricing.js). A page like this is built once and then
// reused, so ask Next to rebuild it at most once an hour. Without this the old
// sentence could stay up long after the date.
export const revalidate = 3600;

const REQUEST_INVITATION = '/contact?topic=practitioner';

// The page a practitioner lands on from "For practitioners" or "List your
// practice". Everything here describes what the product does today. The
// founding period end date and the monthly price are decisions for Jack and
// live in lib/pricing.js; they only appear on this page once they are set.
export default function ForPractitioners() {
  const endLabel = foundingEndLabel();

  return (
    <div className="ar-root">
      <Header />

      <div className="ar-hero ar-pro-hero">
        <div className="ar-pro-hero-inner">
          <h1 className="ar-display">Meet directors earlier, with their situation already summarised.</h1>
          <p className="ar-hero-sub">
            AnteRoom is a free triage tool for Australian company directors facing ATO debt,
            Director Penalty Notices and statutory demands. When a director&apos;s answers point
            towards a registered liquidator, they can find verified members of the network and
            request a consultation.
          </p>
          <div className="ar-pro-actions">
            <a href={REQUEST_INVITATION} className="ar-hero-cta">Request an invitation</a>
            <a href="/how-we-work" className="ar-pro-link">How verification and fees work</a>
          </div>
          <p className="ar-hero-meta">AnteRoom is invitation only while it launches.</p>
        </div>
      </div>

      <div className="ar-section ar-pro-section">
        <h2>What you get</h2>
        <div className="ar-pro-grid">
          <div className="ar-card">
            <h3 className="ar-pro-card-title">A verified profile</h3>
            <p className="ar-pro-card-text">
              Your name, firm, suburb, specialties and a short bio, shown to directors with a
              verified badge once your registration has been checked.
            </p>
          </div>
          <div className="ar-card">
            <h3 className="ar-pro-card-title">Their answers before you speak</h3>
            <p className="ar-pro-card-text">
              When a director requests a consultation you see the answers they gave, the notice
              they received and anything they chose to add. You can download a short case summary
              as a PDF, clearly marked as self-reported background and not advice.
            </p>
          </div>
          <div className="ar-card">
            <h3 className="ar-pro-card-title">A simple way to keep track</h3>
            <p className="ar-pro-card-text">
              Set a status on each enquiry and keep private notes that the director never sees.
              Requests appear in your AnteRoom dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="ar-section ar-pro-section">
        <h2>What it costs</h2>
        <div className="ar-pro-cost">
          <p>
            A flat membership fee, the same for every member and unconnected to how many directors
            you meet or what work results. There are no per-referral fees, no success fees, and no
            way to pay for a better position in the results. Directors never pay anything.
          </p>
          {endLabel && (
            <p>
              <strong>Founding period:</strong> membership is free until {endLabel}.
              {MONTHLY_PRICE_LABEL ? ` After that it is ${MONTHLY_PRICE_LABEL}.` : ''}
            </p>
          )}
          {!endLabel && MONTHLY_PRICE_LABEL && (
            <p><strong>Membership:</strong> {MONTHLY_PRICE_LABEL}.</p>
          )}
          <p>
            The full explanation, including what you can say about AnteRoom in your own DIRRI, is
            on <a href="/how-we-work">How We Work</a>.
          </p>
        </div>
      </div>

      <div className="ar-section ar-pro-section">
        <h2>How you join</h2>
        <ol className="ar-pro-steps">
          <li>
            <strong>Ask for an invitation.</strong> Send a short message with your name, firm and
            ASIC registered liquidator number.
          </li>
          <li>
            <strong>We check your registration.</strong> We confirm who you are by phone and check
            your registration against ASIC&apos;s register of registered liquidators.
          </li>
          <li>
            <strong>Set up your login.</strong> You get a personal link. Your name and registration
            number are filled in from our call, and you add your firm details and what you do.
          </li>
          <li>
            <strong>Directors can find you.</strong> Once you are verified, your profile appears in
            the list of practitioners directors see after the check. Where you appear is never
            affected by what anyone pays.
          </li>
        </ol>
      </div>

      <div className="ar-section ar-pro-section">
        <h2>What a profile looks like</h2>
        <p className="ar-pro-example-note">
          Example only. This is a made-up profile to show the layout. It is not a real practitioner.
        </p>
        <div className="ar-card ar-pro-example" aria-label="Example profile, not a real practitioner">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div className="ar-avatar" aria-hidden="true">AE</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 300, fontSize: '0.98rem' }}>Alex Example</span>
                <ShieldCheck size={17} style={{ color: 'var(--sage)' }} aria-label="Verified" />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Registered Liquidator / SBR Practitioner</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>Example Advisory</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
            <MapPin size={16} aria-hidden="true" /> Melbourne VIC
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="ar-tag">Liquidation</span>
            <span className="ar-tag">Voluntary Administration</span>
            <span className="ar-tag">Small Business Restructuring</span>
          </div>
          <div className="ar-pro-example-button" aria-hidden="true">Request a consultation</div>
        </div>
      </div>

      <div className="ar-section ar-pro-section">
        <h2>Independence</h2>
        <p className="ar-pro-body">
          AnteRoom&apos;s founder works inside an Australian insolvency advisory firm. That firm is
          permanently excluded from the network, so the relationship can never influence who a
          director is shown. The detail is in the conflict of interest policy on{' '}
          <a href="/how-we-work">How We Work</a>.
        </p>
      </div>

      <div className="ar-practitioner-banner">
        <span>Registered liquidator?</span>
        <a href={REQUEST_INVITATION} className="ar-practitioner-banner-cta">Request an invitation</a>
      </div>
      <p className="ar-pro-footnote">
        Already invited? Use the personal link we sent you. Already a member? <a href="/login">Log in</a>.
      </p>

      <Footer />
    </div>
  );
}
