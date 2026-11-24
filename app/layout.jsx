import localFont from 'next/font/local';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import { HOME_TITLE, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '../lib/site';
import { SHARE_IMAGE } from '../lib/meta';
import { BUILD_STAMP } from '../lib/build';
import { PRE_PAINT_SCRIPT } from '../lib/sessionHint';

// Karst is the display face: the homepage headline, big numbers and the
// wordmark only. Everything else is Public Sans (see DESIGN.md). Loaded via
// next/font/local so both weights are preloaded with no flash of fallback
// text, rather than a manual @font-face.
const karst = localFont({
  src: [
    { path: '../public/fonts/karst-light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/karst-extrabold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-karst',
  display: 'swap',
});

// Karst only has 300 and 800 as real files, nothing in between, so it
// cannot carry body text or labels. Public Sans was designed for
// institutional, official-communication legibility, and it has a real
// 400 to 700 range, so body text, labels, buttons and headings below the
// page title all use true weights instead of a faked one.
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// Every other page is "<page title> | AnteRoom" through the template below,
// so a page only needs to supply its own short title. Pages that set their
// own social preview (all the public ones, through lib/meta.js) replace the
// openGraph and twitter blocks here wholesale, because Next merges metadata
// one level deep. These are the fallback for anything that does not.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_AU',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE.url],
  },
};

export default function RootLayout({ children }) {
  return (
    // data-build lets anyone check which release is live from the page
    // itself (right-click, inspect), and /version shows the same stamp.
    // suppressHydrationWarning is needed because the script below may add a
    // class to <html> before React has looked at it.
    <html
      lang="en-AU"
      className={`${karst.variable} ${publicSans.variable}`}
      data-build={BUILD_STAMP}
      suppressHydrationWarning
    >
      <body>
        {/* Runs before the first paint. See lib/sessionHint.js. */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        {children}
        {/* Vercel Web Analytics: counts page views, with no cookies. It only
            records anything once Web Analytics is switched on for the
            project in the Vercel dashboard (Analytics tab); until then the
            script address simply does not exist and nothing is sent. It is
            served from our own domain, so the content security policy
            already allows it. The privacy policy describes it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };',
          }}
        />
        <script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}
