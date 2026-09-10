import { createClient } from '@supabase/supabase-js';
import { exchangeXeroCode, getXeroTenantId } from '../../../../../lib/integrations/xero';

// This route is reached by the user's browser being redirected here
// directly by Xero -- unlike every other route in this app, there's no
// Supabase session attached to this request (a top-level OAuth redirect
// can't carry an Authorization header the way a fetch() from a logged-in
// page can, which is the pattern generate-summary.js and every other
// route here relies on).
//
// Instead, this route trusts the 'state' value it put on the outbound
// Xero URL itself (containing the AnteRoom client's id) and uses the
// service role key -- which bypasses Row Level Security -- to write the
// resulting tokens against that specific client id. This is a deliberate,
// narrow exception to this app's usual "always act as the real user, let
// RLS decide" rule, made only because there's no session available to act
// as here. It should stay narrow: this key must never be sent to the
// browser, and no other route should reach for it just for convenience.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const xeroError = searchParams.get('error');

  if (xeroError) {
    return Response.redirect(`${origin}/account/integrations?error=${encodeURIComponent(xeroError)}`);
  }
  if (!code || !state) {
    return Response.redirect(`${origin}/account/integrations?error=missing_code_or_state`);
  }

  let clientId;
  try {
    ({ clientId } = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')));
  } catch {
    return Response.redirect(`${origin}/account/integrations?error=invalid_state`);
  }

  try {
    const tokens = await exchangeXeroCode(code);
    const tenantId = await getXeroTenantId(tokens.access_token);

    const { error } = await supabaseAdmin.from('financial_connections').upsert(
      {
        client_id: clientId,
        provider: 'xero',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        tenant_id: tenantId,
        org_name: 'Xero organisation', // getXeroTenantId's response also includes tenantName -- worth wiring through and storing here instead once confirmed live
      },
      { onConflict: 'client_id,provider' }
    );

    if (error) throw error;
    return Response.redirect(`${origin}/account/integrations?connected=xero`);
  } catch (err) {
    console.error('Xero callback error:', err);
    return Response.redirect(`${origin}/account/integrations?error=xero_connect_failed`);
  }
}
