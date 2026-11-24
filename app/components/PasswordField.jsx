'use client';

import { useId, useState } from 'react';

// A password input with a Show / Hide button that works from the keyboard
// and is announced properly by screen readers. The old sign-up form used a
// clickable <span>, which keyboard users could not reach.
//
// `labelExtra` is for something that sits on the same line as the label,
// such as the "Forgot password?" link on the login form.
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required = true,
  describedBy,
  name,
  labelExtra,
}) {
  const id = useId();
  const [shown, setShown] = useState(false);

  return (
    <div className="ar-pw-field">
      <div className="ar-pw-labelrow">
        <label className="ar-label" htmlFor={id}>{label}</label>
        {labelExtra}
      </div>
      <div className="ar-pw-wrap">
        <input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          className="ar-input ar-pw-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="ar-pw-toggle"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
