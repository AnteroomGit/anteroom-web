import { getMyobAuthUrl } from '../../../../../lib/integrations/myob';

// Same pattern as the Xero connect route -- see that file's comments for
// why the client id travels as the OAuth 'state' param.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  if (!clientId) {
    return Response.json({ error: 'Missing client_id' }, { status: 400 });
  }
  const state = Buffer.from(JSON.stringify({ clientId })).toString('base64url');
  return Response.redirect(getMyobAuthUrl(state));
}
