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
  '/guides',
  '/guides/director-penalty-notice',
  '/guides/statutory-demand',
  '/guides/what-a-liquidator-does',
  '/guides/small-business-restructuring',
  '/guides/before-you-speak-to-a-liquidator',
  '/contact',
  '/privacy',
  '/terms',
];

export default function sitemap() {
  return PUBLIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
