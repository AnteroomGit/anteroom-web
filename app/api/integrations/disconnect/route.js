import { createClient } from '@supabase/supabase-js';

// One shared route for all three providers, since disconnecting is
// identical regardless of which one: delete the row, acting as the real
// logged-in client so RLS enforces they can only ever delete their own.
export async function POST(request) {
  try {
    const { provider, accessToken } = await request.json();
    if (!provider || !accessToken) {
      return Response.json({ error: 'Missing provider or accessToken' }, { status: 400 });
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

    const { error } = await supabase
      .from('financial_connections')
      .delete()
      .eq('client_id', user.id)
      .eq('provider', provider);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error('disconnect error:', err);
    return Response.json({ error: 'Could not disconnect' }, { status: 500 });
  }
}
