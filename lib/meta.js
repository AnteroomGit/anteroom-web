import { SITE_NAME } from './site';

// Next merges page metadata shallowly: a page that sets `openGraph`
// replaces the whole object from the layout, including its image. So every
// page builds its metadata through this helper, which always sets the
// complete set and the share image, rather than relying on inheritance.

export const SHARE_IMAGE = {
  url: '/images/anteroom-share.png',
  width: 1200,
  height: 630,
  alt: 'AnteRoom: the room before the appointment that matters.',
};

// Public pages. `path` is the page's own address, for example '/help'.
// `absolute` is for the homepage, whose title is written out in full instead
// of getting " | AnteRoom" added to it.
export function pageMeta({ title, description, path, absolute = false }) {
  const full = absolute ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_AU',
      title: full,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: full,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}

// Private or functional pages (account, practitioner area, sign-up, reset).
// They get their own tab title and are kept out of search results.
export function privateMeta(title) {
  return {
    title,
    robots: { index: false, follow: false },
  };
}
