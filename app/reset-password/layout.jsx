import { privateMeta } from '../../lib/meta';

// A page reached only from an email link: it gets its own tab title and is
// kept out of search results.
export const metadata = privateMeta('Set a new password');

export default function ResetPasswordLayout({ children }) {
  return children;
}
