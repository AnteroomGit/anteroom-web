import localFont from 'next/font/local';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import { HOME_TITLE, SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '../lib/site';
import { SHARE_IMAGE } from '../lib/meta';
import { BUILD_STAMP } from '../lib/build';
import { PRE_PAINT_SCRIPT } from '../lib/sessionHint';

// Karst stays for headlines, buttons and key numbers only -- see
// DESIGN.md. Loaded via next/font/local so both weights are preloaded
// with no flash of fallback text, rather than the manual @font-face
// this replaces.
const karst = localFont({
  src: [
    { path: '../public/fonts/karst-light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/karst-extrabold.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-karst',
  display: 'swap',
});

// The actual root-cause fix for "everything is either whisper-thin or
// shouting-bold": Karst only has 300 and 800 as real files, nothing
// between, which is why body text and labels have been stuck on 300
// this whole time. Public Sans was designed specifically for
// institutional/official-communication legibility (it's the typeface
// behind the US Web Design System), has a real 400/500/600 range, and
// isn't one of the fonts that's become an AI-generated-site default
// (Inter, Space Grotesk, Poppins, Manrope) -- a deliberate choice, not
// just "a font with more weights."
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
      </body>
    </html>
  );
}
