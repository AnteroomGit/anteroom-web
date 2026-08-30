import './globals.css';
import CookieBanner from './components/CookieBanner';

export const metadata = {
  title: 'Anteroom — Find insolvency and restructuring professionals',
  description:
    'Search, compare, and book registered liquidators, restructuring practitioners, accountants, and lawyers near you.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
