import { SITE_URL } from '../lib/site';

// Everything public may be crawled. Only the API is kept out.
//
// Private pages (account, practitioner area, sign-up, reset password, the
// version page) are left crawlable on purpose and marked noindex in their
// own metadata. Blocking them here would stop search engines from ever
// seeing that noindex, and a blocked address that is linked from elsewhere
// can still end up listed.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
