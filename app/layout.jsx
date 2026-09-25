import localFont from 'next/font/local';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import CookieBanner from './components/CookieBanner';

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

export const metadata = {
  title: 'AnteRoom | Find insolvency and restructuring professionals',
  description:
    'Search, compare, and book registered liquidators, restructuring practitioners, accountants, and lawyers near you.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU" className={`${karst.variable} ${publicSans.variable}`}>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
