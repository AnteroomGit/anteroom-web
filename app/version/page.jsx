import { BUILD_STAMP, BUILD_TIME } from '../../lib/build';
import { privateMeta } from '../../lib/meta';

// Not for search engines: this page only exists so anyone can check which
// release is live.
export const metadata = privateMeta('Build version');

export default function Version() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
      <p>build: {BUILD_STAMP}</p>
      <p>time: {BUILD_TIME}</p>
    </div>
  );
}
