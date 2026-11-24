// The real bot check. A bot can fake the widget in the browser, so what
// matters is asking Cloudflare's own servers "was this token genuine?"
// with the secret key, which never reaches the browser. Shared by
// /api/verify-turnstile (the sign-up forms) and /api/contact.

export function turnstileConfigured() {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await response.json();
  return {
    success: !!data.success,
    // invalid-input-secret means the secret is wrong or missing on this
    // server. timeout-or-duplicate means the token expired or was used.
    codes: Array.isArray(data['error-codes']) ? data['error-codes'] : [],
  };
}
