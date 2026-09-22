import { createClient } from '@supabase/supabase-js';

// Uses the service role specifically because RLS now revokes UPDATE on
// practitioners.verified from the authenticated role -- see the schema
// comment on that revoke for why. This route is the one legitimate way
// verified gets set to true automatically; everything else (browser
// dev tools included) is now blocked from touching that column.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ASIC's names are "SURNAME, GIVEN NAMES" in all caps. The name someone
// types at signup could be almost any casing or order. Rather than
// attempt exact matching, this checks whether the ASIC record's surname
// appears as a whole word in what they typed -- lenient enough to
// tolerate nicknames or a missing middle name, strict enough that
// someone else's registration number attached to an unrelated name
// won't quietly pass. This is a heuristic, not a rigorous identity
// check, and is documented as such below.
function surnameMatches(asicName, enteredName) {
  const surname = asicName.split(',')[0].trim().toLowerCase();
  if (!surname) return false;
  const enteredWords = enteredName.toLowerCase().split(/\s+/);
  return enteredWords.includes(surname) || surname.split(/\s+/).every((w) => enteredWords.includes(w));
}

export async function POST(request) {
  try {
    const { practitionerId, registrationNumber, name } = await request.json();
    if (!practitionerId || !registrationNumber || !name) {
      return Response.json({ error: 'Missing practitionerId, registrationNumber, or name' }, { status: 400 });
    }

    const { data: matches, error: lookupError } = await supabaseAdmin
      .from('asic_liquidators')
      .select('name, region, firm')
      .eq('registration_number', String(registrationNumber).trim());

    if (lookupError) throw lookupError;

    const confidentMatch = (matches || []).find((m) => surnameMatches(m.name, name));

    if (!confidentMatch) {
      // No match, or the number exists but under a different surname --
      // either way, left for Jack's manual review exactly as before.
      // Not an error: this is the expected, normal path for anyone not
      // yet in this particular ASIC extract, or any mismatch worth a
      // human looking at rather than silently rejecting.
      return Response.json({ autoVerified: false });
    }

    const { error: updateError } = await supabaseAdmin
      .from('practitioners')
      .update({ verified: true })
      .eq('id', practitionerId);

    if (updateError) throw updateError;

    return Response.json({ autoVerified: true, matchedFirm: confidentMatch.firm, matchedRegion: confidentMatch.region });
  } catch (err) {
    console.error('verify-registration error:', err);
    // Fails safe: any error here just means no auto-verification
    // happened, not that signup itself failed. Manual review still
    // exists as the fallback either way.
    return Response.json({ autoVerified: false, error: err.message }, { status: 200 });
  }
}
