import { Check, X } from 'lucide-react';
import { checkPassword } from '../../lib/password';

// The one password rules list, used on every form that sets a password
// (client sign-up, practitioner sign-up, change password, reset password).
// Before this it was copy-pasted into four pages, and the client sign-up
// form showed two of the rules twice.
//
// The first four are checked live. The last two are advice only: there is
// no password history to check against and no test for "hard to guess", so
// they get a plain dot instead of a tick that would imply they were checked.
export default function PasswordRules({ password = '', id }) {
  const c = checkPassword(password);
  // Before anything is typed there is nothing to judge. Without this, the two
  // "don't" rules would show a tick on an empty field.
  const started = password.length > 0;
  const rules = [
    { ok: c.length, text: '8 or more characters' },
    { ok: c.letterNumber, text: 'At least 1 letter and 1 number' },
    { ok: c.noRepeat, text: "Don't use the same character 3+ times in a row (e.g. AAA, 111)" },
    { ok: c.noSequence, text: "Don't use 3+ characters in order (e.g. ABC, 123)" },
  ];

  return (
    <ul className="ar-pw-rules" id={id} aria-label="Password rules">
      {rules.map((rule) => (
        <li key={rule.text} className={started && rule.ok ? 'ok' : undefined}>
          {!started
            ? <span className="ar-pw-dot" aria-hidden="true" />
            : rule.ok
            ? <Check size={16} aria-hidden="true" />
            : <X size={16} className="ar-pw-x" aria-hidden="true" />}
          <span>
            {rule.text}
            <span className="ar-sr-only">{!started ? ' (not checked yet)' : rule.ok ? ' (met)' : ' (not met)'}</span>
          </span>
        </li>
      ))}
      <li><span className="ar-pw-dot" aria-hidden="true" />Don&apos;t reuse a password you&apos;ve used before</li>
      <li><span className="ar-pw-dot" aria-hidden="true" />Pick something hard to guess</li>
    </ul>
  );
}
