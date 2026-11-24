import { pageMeta } from '../../lib/meta';

// The contact page is a client component, so its title and description live
// in this small layout instead.
export const metadata = pageMeta({
  title: 'Contact',
  description: 'Contact AnteRoom. Directors, registered liquidators and press can send a short message here. AnteRoom is not an emergency service.',
  path: '/contact',
});

export default function ContactLayout({ children }) {
  return children;
}
