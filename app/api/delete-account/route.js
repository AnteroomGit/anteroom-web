import { createClient } from '@supabase/supabase-js';

// Deleting an auth.users row needs the service role -- there's no way
// for a logged-in user's own session to delete their own auth account
// directly, by design. This route's whole job is bridging that safely:
// confirm, using the caller's own session (not the service role), that
// they really are who they say they are, then use the service role for
// the one privileged action itself.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      return Response.json({ error: 'Missing accessToken' }, { status: 400 });
    }

    // Acts as the real caller, via their own token, so this can only
    // ever delete the account making the request -- never an id passed
    // in from the client, which would let anyone delete anyone.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Deletes the auth.users row. clients.id references it with
    // on delete cascade, which in turn cascades to appointments,
    // triage_sessions, and financial_connections -- one call removes
    // everything, rather than needing to delete each table by hand and
    // risk missing one as new tables get added later.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return Response.json({ success: true });
  } catch (err) {
    console.error('delete-account error:', err);
    return Response.json({ error: err.message || 'Could not delete account' }, { status: 500 });
  }
}
