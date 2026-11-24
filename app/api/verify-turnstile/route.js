import { verifyTurnstile } from '../../../lib/turnstile';
import { rateLimit, clientIp, tooMany } from '../../../lib/rateLimit';

// The real check. A bot could fake the front-end widget entirely, so
// this is what actually matters: asking Cloudflare's own servers
// "was this token genuine?" using the secret key, which never reaches
// the browser. Called from both signup forms before account creation.
export async function POST(request) {
  const limited = rateLimit(`verify-turnstile:${clientIp(request)}`, { limit: 30, windowMs: 60 * 1000 });
  if (!limited.ok) return tooMany(limited.retryAfter);

  try {
    const { token } = await request.json();
    if (!token) {
      return Response.json({ success: false, error: 'No token provided' }, { status: 400 });
    }

    const { success, codes } = await verifyTurnstile(token);

    if (success) {
      return Response.json({ success: true });
    }
    // Cloudflare's error codes are passed back so a failed check can be
    // diagnosed instead of being a dead end (invalid-input-secret = wrong
    // or missing TURNSTILE_SECRET_KEY on this server; timeout-or-duplicate
    // = token expired or already used once).
    console.error('Turnstile siteverify failed:', codes);
    return Response.json(
      { success: false, error: 'Verification failed', codes },
      { status: 400 }
    );
  } catch (err) {
    console.error('verify-turnstile error:', err);
    return Response.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
