// Facts the site repeats in several places live here, so each one changes
// in a single edit. Nothing in this file is secret.

// The public address, used for canonical links, the sitemap and link
// previews. Set NEXT_PUBLIC_SITE_URL in Vercel to whichever address your
// domain redirects to (with or without www). A missing scheme is added and
// a trailing slash is removed, so a small typo cannot break the build.
function normaliseSiteUrl(raw) {
  const fallback = 'https://www.anteroom.com.au';
  if (!raw) return fallback;
  let value = String(raw).trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL = normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_NAME = 'AnteRoom';

// The homepage's tab title and the title search engines show for it. Every
// other page is "<page> | AnteRoom" (see the title template in layout.jsx).
export const HOME_TITLE = 'AnteRoom | Free triage for directors facing ATO debt';

// Shown in search results and link previews. Keep it to 155 characters or
// fewer, and keep it true: liquidators only for now.
export const SITE_DESCRIPTION =
  'Free triage for Australian company directors facing ATO debt or a Director Penalty Notice, with an introduction to a verified registered liquidator.';

export const CONTACT_EMAIL = 'jack@anteroom.com.au';

// A promise made in public, and the only place it is written. Keep it only
// if you will keep it. It appears on the contact page.
export const CONTACT_RESPONSE_PROMISE = 'We reply within one business day.';
