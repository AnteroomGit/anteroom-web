import { createClient } from '@supabase/supabase-js';
import { testManagerConnection } from '../../../../../lib/integrations/manager';

// Unlike Xero/MYOB, this route is called directly from the client's own
// browser while they're logged in (a form submit, not an OAuth redirect),
// so it can use the same "act as the real user via their access token"
// pattern as every other ordinary route in this app -- no service role
// key needed here, matching generate-summary.js's approach.
export async function POST(request) {
  try {
    const { subdomain, apiKey, accessToken } = await request.json();
    if (!subdomain || !apiKey || !accessToken) {
      return Response.json({ error: 'Missing subdomain, apiKey, or accessToken' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Confirm the credentials actually work before storing them, so a
    // typo'd subdomain or key doesn't sit there silently broken until
    // someone tries to generate a report off it.
    await testManagerConnection(subdomain, apiKey);

    const { error } = await supabase.from('financial_connections').upsert(
      {
        client_id: user.id,
        provider: 'manager',
        subdomain,
        api_key: apiKey,
        org_name: subdomain,
      },
      { onConflict: 'client_id,provider' }
    );

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error('Manager.io connect error:', err);
    return Response.json({ error: err.message || 'Could not connect to Manager.io' }, { status: 400 });
  }
}
