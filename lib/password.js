// Was previously copy-pasted into signup/client, signup/practitioner, and
// account/security separately -- and inconsistently: the client signup
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
// password" and "pick something hard to guess" aren't -- there's no
// password history to check against client-side, and "hard to guess" has
// no test. Those two are shown as plain advisory tips, not live
// pass/fail rules, same honest distinction HotDoc's own checklist makes.
export function passwordValid(pw) {
  const c = checkPassword(pw);
  return c.length && c.letterNumber && c.noRepeat && c.noSequence;
}
