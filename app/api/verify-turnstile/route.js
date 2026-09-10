// The real check. A bot could fake the front-end widget entirely, so
// this is what actually matters: asking Cloudflare's own servers
// "was this token genuine?" using the secret key, which never reaches
// the browser. Called from both signup forms before account creation.
export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return Response.json({ success: false, error: 'No token provided' }, { status: 400 });
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = await res.json();

    if (data.success) {
      return Response.json({ success: true });
    }
    // Temporary: surface Cloudflare's actual error-codes instead of a generic
    // message, so a failed check is diagnosable instead of a dead end.
    // (invalid-input-secret = wrong/missing TURNSTILE_SECRET_KEY on this
    // server; timeout-or-duplicate = token expired or already used once.)
    console.error('Turnstile siteverify failed:', data['error-codes']);
    return Response.json(
      { success: false, error: 'Verification failed', codes: data['error-codes'] || [] },
      { status: 400 }
    );
  } catch (err) {
    console.error('verify-turnstile error:', err);
    return Response.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
