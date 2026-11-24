import { privateMeta } from '../../lib/meta';

export const metadata = privateMeta('Your account');

export default function AccountLayout({ children }) {
  return children;
}
