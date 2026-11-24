import Header from '../components/Header';
import Footer from '../components/Footer';
import { pageMeta } from '../../lib/meta';
import { GUIDES, GUIDES_CHECKED } from '../../lib/guides';

export const metadata = pageMeta({
  title: 'Guides for company directors',
  description: 'Plain-English guides for Australian company directors on Director Penalty Notices, statutory demands, small business restructuring and liquidators.',
  path: '/guides',
});

export default function GuidesIndex() {
  return (
    <div className="ar-root">
      <Header />
      <div className="ar-prose">
        <h1>Guides for company directors</h1>
        <p>
          Short, plain-English explainers on the notices and processes directors run into when a
          company owes the ATO. Each one links to the ATO, ASIC or court pages it was checked
          against, so you can read the original.
        </p>
        <p className="muted">
          Last checked {GUIDES_CHECKED.label}. General information only, not legal or financial advice.
        </p>

        <ul className="ar-guides" style={{ marginTop: 'var(--space-5)' }}>
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <a href={`/guides/${g.slug}`}>
                <span className="ar-guides-title">{g.title}</span>
                <span className="ar-guides-desc">{g.description}</span>
              </a>
            </li>
          ))}
        </ul>

        <h2>You are not the only one</h2>
        <p>
          ASIC&apos;s figures show more than 14,000 companies entered external administration for
          the first time in the 2025-26 financial year. A company in trouble is not unusual, and
          there are set processes for dealing with it.
        </p>
        <p className="muted">
          Source:{' '}
          <a
            href="https://asic.gov.au/about-asic/corporate-publications/statistics/insolvency-statistics/"
            rel="noopener noreferrer"
            target="_blank"
          >
            ASIC insolvency statistics
          </a>
          , Series 1.
        </p>

        <p>
          Not sure which guide applies to you? <a href="/">Start the free check</a> and it will
          point you to the right place.
        </p>
      </div>
      <Footer />
    </div>
  );
}
