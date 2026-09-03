import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'How We Work | AnteRoom' };

export default function HowWeWork() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>How we work</h1>
        <p>
          This page exists so directors know exactly how AnteRoom is funded, and so practitioners
          have something concrete to point to for their own independence disclosure. No vague
          claims. Specific commitments.
        </p>

        <h2>How AnteRoom makes money</h2>
        <p>
          Directors never pay AnteRoom anything, at any point. AnteRoom is funded entirely by a
          flat, recurring membership fee paid by practitioners to be listed in the network. That
          fee is the same regardless of how many referrals a practitioner receives, whether any of
          them convert into real work, or the value of any matter that results. We never charge a
          per-referral fee, a success fee, or any fee tied to a specific director&apos;s case.
        </p>

        <h2>How matching works</h2>
        <p>
          When you&apos;re shown a list of practitioners, that list is filtered only on objective
          criteria: practitioner type, location, and the answers you gave in the triage questions.
          Nothing about a practitioner&apos;s position in that list, or whether they&apos;re shown at all, is
          influenced by how much they pay, how long they&apos;ve been a member, or any commercial
          arrangement with AnteRoom.
        </p>

        <h2>What &quot;verified&quot; means</h2>
        <p>
          Before any practitioner&apos;s profile goes live, their registration is checked against the
          relevant public register for their profession: ASIC&apos;s register of registered
          liquidators, or the equivalent for accountants and lawyers. A verified badge means that
          check has been done, not that AnteRoom vouches for the quality of their advice.
        </p>

        <h2>Scope of the network</h2>
        <p>
          AnteRoom shows practitioners who have chosen to join our network, verified their
          registration, and agreed to our terms. This is not every registered practitioner in
          Australia. It&apos;s the ones who&apos;ve chosen to be part of this network. We&apos;d rather say that
          plainly than imply broader coverage than we actually have.
        </p>

        <h2>Our conflict of interest policy</h2>
        <p>
          AnteRoom was founded by someone who works inside an Australian insolvency advisory firm.
          To keep that relationship from ever influencing who a director is matched with, that
          firm is permanently excluded from AnteRoom&apos;s practitioner network. This isn&apos;t a
          disclosure we rely on instead of managing the conflict. It&apos;s a decision not to have the
          conflict exist in the first place.
        </p>

        <h2>For practitioners: what this means for your DIRRI</h2>
        <p>
          If you accept an appointment referred through AnteRoom, you can accurately describe the
          referral source as: AnteRoom, a triage platform funded by a flat, non-exclusive
          membership fee unconnected to this or any specific referral, appointment, or outcome. No
          fee, commission, or benefit was paid or received in connection with this specific
          referral, and no conditions were attached to it.
        </p>

        <h2>Not advice, and not a recommendation</h2>
        <p>
          The triage questions produce general information about which formal pathway may be
          relevant to a director&apos;s situation. They do not determine whether a company is insolvent,
          and they are not a recommendation to take any particular course of action. See our{' '}
          <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a> for the
          full detail.
        </p>
      </div>
      <Footer />
    </div>
  );
}
