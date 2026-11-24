// Makes sure a signed-in person who is not a practitioner has a row in
// `clients`. Needed because bookings and saved answers point at that row,
// and a person who signs in with Google or Apple can arrive without one.
//
// The database now creates the row at sign-up (see
// supabase-migrations/2026-10-15_invite_only_signup.sql). This is the
// safety net for accounts made before that was run, and for anything else
// that slips through. It never overwrites an existing row.

const checked = new Set();

function namesFrom(user) {
  const meta = user?.user_metadata || {};
  const full = String(meta.full_name || meta.name || '').trim();
  const parts = full.split(/\s+/).filter(Boolean);
  const first = String(meta.given_name || meta.first_name || parts[0] || '').trim();
  const last = String(meta.family_name || meta.last_name || parts.slice(1).join(' ') || '').trim();
  return { first_name: first || null, last_name: last || null };
}

export async function ensureClientRow(supabase, user) {
  if (!user?.id) return { ok: false, reason: 'no-user' };
  if (checked.has(user.id)) return { ok: true, cached: true };

  // A practitioner's sign-up says so in its metadata, so there is no need to
  // ask the database. This also covers a practitioner row that is briefly
  // unreadable.
  if (user.user_metadata?.account_type === 'practitioner') {
    checked.add(user.id);
    return { ok: true, skipped: 'practitioner' };
  }

  try {
    // Practitioners never get a client row. If this lookup fails we stop
    // rather than guess: a client row for a practitioner would flip their
    // header and dashboard into client mode.
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (practitionerError) throw practitionerError;
    if (practitioner) {
      checked.add(user.id);
      return { ok: true, skipped: 'practitioner' };
    }

    const { data: existing, error: readError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) {
      checked.add(user.id);
      return { ok: true, existed: true };
    }

    // ignoreDuplicates makes this "insert unless it is already there", so a
    // row that appears a moment earlier is never overwritten.
    const { error: writeError } = await supabase
      .from('clients')
      .upsert({ id: user.id, ...namesFrom(user) }, { onConflict: 'id', ignoreDuplicates: true });
    if (writeError) throw writeError;

    checked.add(user.id);
    return { ok: true, created: true };
  } catch (err) {
    console.error('ensureClientRow failed:', err);
    return { ok: false, reason: 'error', error: err };
  }
}
