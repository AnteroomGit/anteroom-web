import { createClient } from '@supabase/supabase-js';

// Uses the service role specifically because RLS revokes UPDATE on
// practitioners.verified from the authenticated role -- see the schema
// comment on that revoke for why. This route is the one legitimate way
// verified gets set to true; everything else (browser dev tools
// included) is blocked from touching that column.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Identity is now trusted by construction, not by a heuristic check
// after the fact: signup is only reachable at all via a specific,
// unclaimed practitioner_leads row (see /api/lead-lookup and the now-
// locked signup form), and that row only exists because Jack personally
// confirmed the real person by phone before ever sending the link. So
// this route's job is narrower than it used to be -- re-confirm server-
// side that the lead is real and still unclaimed (never trust the
// client's word alone, even though the form already checked this on
// load), then verify and mark it claimed.
export async function POST(request) {
  try {
    const { practitionerId, leadId } = await request.json();
    if (!practitionerId || !leadId) {
      return Response.json({ error: 'Missing practitionerId or leadId' }, { status: 400 });
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('practitioner_leads')
      .select('id, claimed_by')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return Response.json({ autoVerified: false, error: 'Lead not found' }, { status: 200 });
    }
    if (lead.claimed_by) {
      // Already used by someone else, most likely a race between two
      // people opening the same link -- signup itself already
      // succeeded, but this account is left unverified for a manual
      // look rather than silently trusted.
      return Response.json({ autoVerified: false, error: 'This lead has already been claimed' }, { status: 200 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('practitioners')
      .update({ verified: true })
      .eq('id', practitionerId);
    if (updateError) throw updateError;

    await supabaseAdmin
      .from('practitioner_leads')
      .update({ contact_status: 'claimed', claimed_by: practitionerId, claimed_at: new Date().toISOString() })
      .eq('id', leadId);

    return Response.json({ autoVerified: true });
  } catch (err) {
    console.error('verify-registration error:', err);
    // Fails safe: any error here just means no auto-verification
    // happened, not that signup itself failed. Manual review still
    // exists as the fallback either way.
    return Response.json({ autoVerified: false, error: err.message }, { status: 200 });
  }
}
