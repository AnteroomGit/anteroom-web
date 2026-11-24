import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp, tooMany } from '../../../lib/rateLimit';

// Uses the service role specifically because RLS revokes UPDATE on
// practitioners.verified from the authenticated role (see the schema
// comment on that revoke for why). This route is the one legitimate way
// the verified flag gets set from the application; everything else,
// browser dev tools included, is blocked from touching that column.
//
// Created on first use rather than when the file loads, so a missing
// setting cannot break the build.
let admin;
function db() {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return admin;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notVerified(reason) {
  return Response.json({ autoVerified: false, reason }, { status: 200 });
}

// What this route is, honestly.
//
// It cannot check who is calling. Email confirmation is on, so at the
// moment the sign-up page calls this there is no login session yet, only
// the id of the account that was just created. So the route does not trust
// the caller; it checks the records instead:
//
//   1. The lead must exist, and the account must exist.
//   2. The account's registration number must equal the lead's. That
//      number is copied from the lead, so a mismatch means something is
//      wrong, and nothing is verified.
//   3. The lead is claimed with one conditional update (claimed_by is
//      null), so two people racing for one invitation cannot both win.
//   4. Repeating the call for the rightful owner changes nothing.
//
// Since v67 the database does the same work itself when the account is
// created (see supabase-migrations/2026-10-15_invite_only_signup.sql), so
// by the time this runs the lead is normally already claimed by this very
// account and the route just confirms it. It still does the full job for
// the period before that migration is run. Either way the invitation link
// (an unguessable id that only Jack sends) is the real secret.
export async function POST(request) {
  const limited = rateLimit(`verify-registration:${clientIp(request)}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) return tooMany(limited.retryAfter);

  try {
    const { practitionerId, leadId } = await request.json();
    if (!UUID.test(practitionerId || '') || !UUID.test(leadId || '')) {
      return Response.json({ error: 'Missing or invalid practitionerId or leadId' }, { status: 400 });
    }

    const [leadResult, practitionerResult] = await Promise.all([
      db().from('practitioner_leads').select('id, registration_number, claimed_by').eq('id', leadId).maybeSingle(),
      db().from('practitioners').select('id, registration_number, verified').eq('id', practitionerId).maybeSingle(),
    ]);
    if (leadResult.error) throw leadResult.error;
    if (practitionerResult.error) throw practitionerResult.error;

    const lead = leadResult.data;
    const practitioner = practitionerResult.data;
    if (!lead || !practitioner) return notVerified('not-found');

    if (!lead.registration_number || lead.registration_number !== practitioner.registration_number) {
      console.warn('verify-registration: registration number does not match the invitation', { leadId, practitionerId });
      return notVerified('mismatch');
    }

    // Already claimed by someone else: leave this account for a manual look.
    if (lead.claimed_by && lead.claimed_by !== practitioner.id) return notVerified('claimed');

    // Already claimed by this account (the normal case once the migration
    // is live). Make sure the flag is set and stop. Safe to repeat.
    if (lead.claimed_by === practitioner.id) {
      if (!practitioner.verified) {
        const { error } = await db().from('practitioners').update({ verified: true }).eq('id', practitioner.id);
        if (error) throw error;
      }
      return Response.json({ autoVerified: true });
    }

    // Not claimed yet (the database is still on the older sign-up rules).
    // One conditional update claims it; if someone beat us to it, zero rows
    // come back and nothing is verified.
    const { data: claimedRows, error: claimError } = await db()
      .from('practitioner_leads')
      .update({ claimed_by: practitioner.id, claimed_at: new Date().toISOString(), contact_status: 'claimed' })
      .eq('id', lead.id)
      .is('claimed_by', null)
      .select('id');
    if (claimError) throw claimError;
    if (!claimedRows || claimedRows.length === 0) return notVerified('claimed');

    const { error: verifyError } = await db().from('practitioners').update({ verified: true }).eq('id', practitioner.id);
    if (verifyError) throw verifyError;

    return Response.json({ autoVerified: true });
  } catch (err) {
    console.error('verify-registration error:', err);
    // Fails safe: any error here just means no auto-verification happened,
    // not that sign-up itself failed. Manual review is still the fallback.
    return notVerified('error');
  }
}
