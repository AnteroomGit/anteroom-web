// A small, honest rate limiter for public API routes.
//
// What it is: a counter held in the memory of one running server instance.
// What that means: on Vercel, instances come and go and run side by side,
// so a determined attacker can get past it, and every cold start resets it.
// It stops casual abuse, accidental loops and the cheapest bots. It is not
// a substitute for a shared limiter (for example Upstash or Vercel's own
// firewall rules) if abuse ever becomes a real problem.

const buckets = new Map();
const MAX_BUCKETS = 5000;

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();

  // Sweep expired entries now and then so the map cannot grow forever.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

// On Vercel the first address in x-forwarded-for is the visitor's. Anywhere
// else this header can be set by the caller, which is one more reason this
// limiter is best effort.
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function tooMany(retryAfter) {
  return Response.json(
    { error: 'Too many requests. Please wait a little while and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
