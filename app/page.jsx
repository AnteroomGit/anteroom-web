import Home from './components/Home';
import { HOME_TITLE, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '../lib/site';
import { pageMeta } from '../lib/meta';

// This file is a server component on purpose. The homepage itself is a
// client component (it runs the triage questions), but wrapping it here
// means the first response already contains the hero, the headings and the
// links, so search engines and slow phones see a real page. It also gives
// the homepage somewhere to export its own title, canonical address and
// structured data.
export const metadata = pageMeta({
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
  absolute: true,
});

// Facts only: who we are, what the site is, and where it is. No ratings,
// no review counts, no social profiles we do not have.
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-email.png`,
    description: SITE_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'Australia' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en-AU',
  },
];

export default function Page() {
  return (
    <>
      <Home />
      <script
        type="application/ld+json"
        // The "<" escape keeps the text from ever closing the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
