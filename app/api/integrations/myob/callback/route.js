import { createClient } from '@supabase/supabase-js';
import { exchangeMyobCode, getMyobCompanyFile } from '../../../../../lib/integrations/myob';

// Same service-role exception as the Xero callback, for the same reason:
// this request arrives with no Supabase session attached. See that file's
// comments for the full explanation.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const myobError = searchParams.get('error');

  if (myobError) {
    return Response.redirect(`${origin}/account/integrations?error=${encodeURIComponent(myobError)}`);
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
    const tokens = await exchangeMyobCode(code);
    const companyFile = await getMyobCompanyFile(tokens.access_token);

    const { error } = await supabaseAdmin.from('financial_connections').upsert(
      {
        client_id: clientId,
        provider: 'myob',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        tenant_id: companyFile?.Uri || null, // MYOB's company file URI, reused here as the generic tenant_id column
        org_name: companyFile?.Name || 'MYOB company file',
      },
      { onConflict: 'client_id,provider' }
    );

    if (error) throw error;
    return Response.redirect(`${origin}/account/integrations?connected=myob`);
  } catch (err) {
    console.error('MYOB callback error:', err);
    return Response.redirect(`${origin}/account/integrations?error=myob_connect_failed`);
  }
}
