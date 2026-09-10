import { getXeroAuthUrl } from '../../../../../lib/integrations/xero';

// Redirects the browser straight to Xero's own login/consent screen. The
// client_id passed in is this app's own Supabase user id (not Xero's),
// carried through as the OAuth 'state' param so the callback route knows
// which AnteRoom client to attach the resulting tokens to once Xero
// redirects back. This is a lightweight version of state handling -- a
// hardened version would also store a random nonce server-side and verify
// it round-trips, to fully rule out CSRF, which this simpler version
// doesn't yet do.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  if (!clientId) {
    return Response.json({ error: 'Missing client_id' }, { status: 400 });
  }
  const state = Buffer.from(JSON.stringify({ clientId })).toString('base64url');
  return Response.redirect(getXeroAuthUrl(state));
}
