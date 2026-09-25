import { BUILD_STAMP, BUILD_TIME } from '../../lib/build';

export const metadata = { title: 'Build version' };

export default function Version() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
      <p>build: {BUILD_STAMP}</p>
      <p>time: {BUILD_TIME}</p>
    </div>
  );
}
