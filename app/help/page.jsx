import Header from '../components/Header';
import Footer from '../components/Footer';
import { FAQS } from './faqs';
import { pageMeta } from '../../lib/meta';

export const metadata = pageMeta({
  title: 'Help and common questions',
  description: 'Answers about AnteRoom: what it costs, who sees your information, what to do if you are unsure which notice you have, and how practitioners are verified.',
  path: '/help',
});

// Structured data so search engines can show the questions and answers
// directly. The "<" escape keeps the text from ever closing the script tag.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// Each question is a native <details> element: the answer is in the page
// for everyone to read, keyboard users can open it with Enter or Space, and
// screen readers announce it as expandable.
export default function Help() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Help</h1>
        {FAQS.map((f) => (
          <details key={f.q} className="ar-faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <h2>Worried about a scam?</h2>
        <p>
          AnteRoom will never ask you to pay to speak with a practitioner, and we&apos;ll never ask
          for payment details, passwords, or bank information directly. If you receive a message
          claiming to be from AnteRoom asking for either, treat it as suspicious and contact us
          directly through our <a href="/contact">Contact page</a>.
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <Footer />
    </div>
  );
}
