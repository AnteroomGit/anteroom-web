// Security headers for every page.
//
// The first group is enforced: each one is safe to turn on without
// checking, because none of them can stop the site from working.
//
// The Content-Security-Policy is sent as REPORT-ONLY. That means browsers
// check every page against it and write any breach to the console, but
// block nothing. It is a safe way to find out whether the list below is
// complete before it is allowed to block anything. Nobody receives these
// reports yet (there is no reporting address), so to use it, open the site
// in a browser, open the developer console, click through the main pages,
// and look for "Content Security Policy" messages. When a full pass is
// clean, rename the header below to Content-Security-Policy to enforce it.
//
// The inline-script allowance is needed because Next.js and the small
// sign-in check script in layout.jsx are both inline. A stricter policy
// would give each a nonce, which needs middleware this project does not use.

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  // Supabase storage holds profile photos; OpenStreetMap supplies map tiles.
  "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  // Supabase for data and sign-in, Nominatim for address search, Turnstile
  // for the bot check.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
