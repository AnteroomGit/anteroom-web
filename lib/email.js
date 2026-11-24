// Sends a plain-text email through Resend's HTTP API. No package needed.
//
// Needs two environment variables on the server:
//   RESEND_API_KEY  an API key from resend.com (keep it secret)
//   EMAIL_FROM      for example: AnteRoom <hello@anteroom.com.au>
//                   (the domain must be verified in Resend)
//
// If either is missing this does nothing and says so, so a feature that
// sends email still works without it. Callers must never let a failed or
// skipped email break the thing the visitor actually asked for.

export async function sendEmail({ to, subject, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false, reason: 'not-configured' };
  }

  // Header values must never contain line breaks.
  const cleanSubject = String(subject || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject: cleanSubject,
    text: String(text || ''),
  };
  if (replyTo) payload.reply_to = String(replyTo).replace(/[\r\n]+/g, ' ').trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      // Log the status only. The response body is not needed and the key
      // is never logged.
      console.error('sendEmail: Resend returned', response.status);
      return { sent: false, reason: `http-${response.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('sendEmail: request failed', err?.name || err);
    return { sent: false, reason: 'network' };
  }
}
