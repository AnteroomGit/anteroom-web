import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp, tooMany } from '../../../lib/rateLimit';
import { verifyTurnstile, turnstileConfigured } from '../../../lib/turnstile';
import { sendEmail } from '../../../lib/email';
import { CONTACT_EMAIL } from '../../../lib/site';

// One door for the contact form and the "tell us your region" form.
//
// What it does, in order: ignores bots that fill the hidden field, checks
// the input, limits repeat submissions, runs the Turnstile bot check (for
// the contact form), saves the message, and emails Jack when email is
// configured. Saving comes first and is what counts: if email is not set
// up, or fails, the visitor still sees success because the message is safe
// in the contact_messages table.

const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const MAX_REGION = 100;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

function refuse(message, status = 400) {
  return Response.json({ error: message }, { status });
}

// The service role key is used when it is present, so this keeps working
// if the open "anyone can insert" policy on contact_messages is ever
// removed to stop direct writes from the browser. The public key is the
// fallback, which the current policy allows.
function writeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return refuse('Something was wrong with that request. Please try again.');
  }
  if (!body || typeof body !== 'object') {
    return refuse('Something was wrong with that request. Please try again.');
  }

  // Hidden field that people never see and bots fill in. Pretend it worked.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return Response.json({ ok: true });
  }

  const kind = body.kind === 'waitlist' ? 'waitlist' : 'contact';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const region = typeof body.region === 'string' ? body.region.trim() : '';

  if (!email || email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return refuse('Please enter a valid email address.');
  }
  if (kind === 'contact') {
    if (message.length < 3) return refuse('Please write a short message.');
    if (message.length > MAX_MESSAGE) {
      return refuse(`Please keep your message under ${MAX_MESSAGE} characters.`);
    }
  }
  if (region.length > MAX_REGION) return refuse('That region is too long.');

  const ip = clientIp(request);
  const allowance = kind === 'waitlist'
    ? { limit: 5, windowMs: 60 * 60 * 1000 }
    : { limit: 5, windowMs: 10 * 60 * 1000 };
  const limited = rateLimit(`contact:${kind}:${ip}`, allowance);
  if (!limited.ok) return tooMany(limited.retryAfter);

  // The bot check applies when the server has a Turnstile secret. Without
  // one the form still works, which keeps local development simple.
  if (kind === 'contact' && turnstileConfigured()) {
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
    if (!token) return refuse('Please complete the bot check and try again.');
    try {
      const result = await verifyTurnstile(token);
      if (!result.success) {
        console.error('contact: Turnstile refused the token:', result.codes);
        return refuse('The bot check did not pass. Please try again.');
      }
    } catch (err) {
      console.error('contact: Turnstile request failed:', err);
      return refuse('We could not run the bot check just now. Please try again.', 503);
    }
  }

  const stored = kind === 'waitlist'
    ? `[Waitlist] Region: ${region || 'not given'}`
    : message;

  const db = writeClient();
  if (!db) {
    console.error('contact: Supabase is not configured on this server');
    return refuse(`We could not save your message. Please email ${CONTACT_EMAIL} instead.`, 500);
  }
  const { error: insertError } = await db.from('contact_messages').insert({ email, message: stored });
  if (insertError) {
    console.error('contact: could not save the message:', insertError);
    return refuse(`We could not save your message. Please email ${CONTACT_EMAIL} instead.`, 500);
  }

  // Saved. Now let Jack know, if email is set up. A failure here must not
  // turn a saved message into an error for the visitor.
  if (kind === 'contact') {
    try {
      await sendEmail({
        to: process.env.CONTACT_NOTIFY_TO || CONTACT_EMAIL,
        subject: 'New message on the AnteRoom contact form',
        replyTo: email,
        text:
          `Someone sent a message through the AnteRoom contact form.\n\n` +
          `From: ${email}\n\n${message}\n\n---\n` +
          `Reply to this email to answer them directly. The message is also saved ` +
          `in the contact_messages table in Supabase.`,
      });
    } catch (err) {
      console.error('contact: notification email failed:', err);
    }
  }

  return Response.json({ ok: true });
}
