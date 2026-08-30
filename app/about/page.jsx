import Footer from '../components/Footer';
import Header from '../components/Header';

export const metadata = { title: 'About — Anteroom' };

export default function About() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Why Anteroom exists</h1>
        <p>
          I work inside an Australian insolvency and turnaround advisory firm. Most days, that
          means statutory reports, creditor correspondence, and reading the same kind of
          letter over and over — a Director Penalty Notice, a garnishee notice, a statutory
          demand. What struck me wasn&apos;t how often directors ended up in real trouble. It was
          how often they found out what a notice actually meant only after the window that
          would have protected them had already closed, or had never really been open at all.
        </p>
        <p>
          The gap wasn&apos;t a shortage of good advisors. It was that nobody had anywhere to go
          <em> before </em> they needed one — no free, honest, plain-English way to understand
          a situation while there was still real time to act on it. The only entry point was
          picking up the phone to a professional, which assumes you already know you&apos;re in
          trouble and feel ready to make that call. A lot of directors don&apos;t get that far in
          time.
        </p>
        <h2>What Anteroom actually is</h2>
        <p>
          A free, fast, honest first stop. Anteroom asks a few short questions, tells you
          plainly what your situation means and how urgent it is, and — if it&apos;s time to talk
          to someone — connects you with a verified liquidator, restructuring practitioner,
          accountant, or lawyer near you, with your situation already summarised so the
          conversation doesn&apos;t start from zero.
        </p>
        <p>
          Anteroom isn&apos;t a replacement for any of those professionals, and it doesn&apos;t give
          legal or financial advice. It&apos;s the room before the appointment — the place you
          understand what&apos;s actually happening, before you decide what to do about it.
        </p>
      </div>
      <Footer />
    </div>
  );
}
