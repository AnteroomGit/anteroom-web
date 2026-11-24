import Header from './Header';
import Footer from './Footer';
import { GUIDES, GUIDES_CHECKED } from '../../lib/guides';
import { SITE_NAME, SITE_URL } from '../../lib/site';

// The shared frame for every guide: breadcrumb, title, a plain lead, the body,
// the sources it was checked against, and a side column with the free check
// and the other guides. A guide page only supplies the words.
//
// `sources` is a list of { label, href }. Every guide must have at least one,
// because that is how a reader (or a liquidator) checks the work.
export default function GuideLayout({ slug, title, description, lead, sources, children }) {
  const others = GUIDES.filter((g) => g.slug !== slug);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: 'en-AU',
    datePublished: GUIDES_CHECKED.iso,
    dateModified: GUIDES_CHECKED.iso,
    mainEntityOfPage: `${SITE_URL}/guides/${slug}`,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };

  return (
    <div className="ar-root">
      <Header />
      <div className="ar-guide-layout">
        <article className="ar-guide">
          <p className="ar-guide-crumb"><a href="/guides">Guides</a></p>
          <h1>{title}</h1>
          <p className="ar-guide-lead">{lead}</p>
          <p className="ar-guide-meta">
            Last checked {GUIDES_CHECKED.label}. General information only, not legal or financial advice.
          </p>

          {children}

          <section className="ar-sources" aria-labelledby="ar-sources-heading">
            <h2 id="ar-sources-heading">Sources</h2>
            <ul>
              {sources.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank">{s.label}</a>
                </li>
              ))}
            </ul>
            <p>
              Laws, ATO practice and ASIC guidance change. This guide is a starting point. For advice
              about your own company, talk to a registered liquidator, an accountant or a lawyer.
            </p>
          </section>
        </article>

        <aside className="ar-guide-aside" aria-label="Related">
          <div className="ar-aside-box">
            <h2>Not sure where you stand?</h2>
            <p>Answer a few short questions. It is free, takes about two minutes and needs no account.</p>
            <a href="/" className="ar-btn-primary">Start the free check</a>
          </div>
          <div className="ar-aside-box">
            <h2>More guides</h2>
            <ul>
              {others.map((g) => (
                <li key={g.slug}><a href={`/guides/${g.slug}`}>{g.title}</a></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <Footer />
      <script
        type="application/ld+json"
        // The "<" escape keeps the text from ever closing the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
    </div>
  );
}
