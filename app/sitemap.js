import { SITE_URL } from '../lib/site';

// The public pages worth finding in a search. Sign-in, sign-up and the
// private areas are left out. There is no lastModified on purpose: the
// dates would have to be kept up by hand, and a wrong date is worse than
// none.
const PUBLIC_PATHS = [
  '/',
  '/for-practitioners',
  '/how-we-work',
  '/help',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

export default function sitemap() {
  return PUBLIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
