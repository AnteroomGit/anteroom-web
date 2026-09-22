import { createClient } from '@supabase/supabase-js';

// practitioner_leads has no RLS policies granting client access at all
// (see the schema comment on that table), on purpose -- this route is
// the one controlled opening into it, and it only ever returns the
// handful of fields the signup page actually needs to show, never the
// full row (no internal notes, no contact_status history).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  if (!leadId) {
    return Response.json({ error: 'Missing leadId' }, { status: 400 });
  }

  const { data: lead, error } = await supabaseAdmin
    .from('practitioner_leads')
    .select('id, name, firm, registration_number, claimed_by')
    .eq('id', leadId)
    .maybeSingle();

  if (error || !lead) {
    return Response.json({ valid: false });
  }
  if (lead.claimed_by) {
    // Already used -- same message a practitioner would see either way,
    // whether this exact link was reused or someone else independently
    // claimed that registration number in the meantime.
    return Response.json({ valid: false, alreadyClaimed: true });
  }

  return Response.json({
    valid: true,
    lead: { id: lead.id, name: lead.name, firm: lead.firm, registrationNumber: lead.registration_number },
  });
}
