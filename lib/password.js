// Was previously copy-pasted into signup/client, signup/practitioner, and
// account/security separately, and inconsistently: the client signup
// form computed noRepeat/noSequence but never displayed them, and the
// practitioner signup form and security page didn't check for them at
// all. One shared source of truth now, checked everywhere the same way.

export function hasSequentialChars(pw) {
  for (let i = 0; i < pw.length - 2; i++) {
    const a = pw.charCodeAt(i), b = pw.charCodeAt(i + 1), c = pw.charCodeAt(i + 2);
    if (b === a + 1 && c === b + 1) return true;
    if (b === a - 1 && c === b - 1) return true;
  }
  return false;
}

export function checkPassword(pw) {
  return {
    length: pw.length >= 8,
    letterNumber: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw),
    noRepeat: !/(.)\1\1/.test(pw),
    noSequence: !hasSequentialChars(pw),
  };
}

// All four are genuinely checkable client-side. "Don't reuse a recent
// password" and "pick something hard to guess" aren't: there's no
// password history to check against client-side, and "hard to guess" has
// no test. Those two are shown as plain advisory tips, not live
// pass/fail rules, same honest distinction HotDoc's own checklist makes.
export function passwordValid(pw) {
  const c = checkPassword(pw);
  return c.length && c.letterNumber && c.noRepeat && c.noSequence;
}

// Turns what Supabase says when a password change fails into something a
// person can act on. `expired` means the login or reset link is no longer
// good, so the caller should offer a way to start again.
export function explainPasswordError(error) {
  const raw = String(error?.message || '');
  const code = String(error?.code || '');

  if (
    code === 'session_not_found' || code === 'session_expired' || code === 'bad_jwt' ||
    /auth session missing|session.*(expired|not found)|jwt expired|invalid jwt/i.test(raw)
  ) {
    return { message: 'This link has expired or has already been used.', expired: true };
  }
  if (code === 'same_password' || /different from the old|same password|should be different/i.test(raw)) {
    return { message: 'Your new password needs to be different from your current one.', expired: false };
  }
  if (code === 'reauthentication_needed' || /reauthenticat/i.test(raw)) {
    return { message: 'For your security, please log out, log in again, and then change your password.', expired: false };
  }
  if (code === 'weak_password' || /weak|easy to guess|pwned|leaked|at least \d+ char/i.test(raw)) {
    return { message: 'That password is too easy to guess. Try a longer one, or a few unrelated words together.', expired: false };
  }
  if (/fetch|network|timeout|offline|failed to/i.test(raw)) {
    return { message: 'We could not reach the server. Check your connection and try again.', expired: false };
  }
  return { message: 'We could not update your password. Please try again in a moment.', expired: false };
}
