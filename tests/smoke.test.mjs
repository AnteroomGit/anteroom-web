// Dependency-free checks, run with `npm test` (Node's built-in test runner).
//
// Part 1 reads the source files. It needs nothing running and takes about a
// second, so it is safe to run before every push.
//
// Part 2 checks a running copy of the site. It only runs when SMOKE_URL is
// set. For example, in one terminal:
//
//     npm run build && npm start
//
// and in another:
//
//     SMOKE_URL=http://localhost:3000 npm test
//
// The same thing runs on every pull request (see .github/workflows/ci.yml).
// It cannot sign in, because that needs a real Supabase project, so still
// click through the login, booking and password flows on the preview link.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function walk(dir, found = []) {
  for (const name of readdirSync(join(root, dir))) {
    if (name === 'node_modules' || name === '.next') continue;
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) walk(rel, found);
    else found.push(rel.split(sep).join('/'));
  }
  return found;
}

const sourceFiles = walk('app').filter((f) => /\.(js|jsx)$/.test(f));

// ---------------------------------------------------------------------
// Part 1: the source files
// ---------------------------------------------------------------------

test('the build stamp looks like a release label', () => {
  assert.match(read('lib/build.js'), /export const BUILD_STAMP = 'v\d+';/);
});

test('no em or en dashes in any page, component, shared setting or stylesheet', () => {
  const checked = [...sourceFiles, ...walk('lib'), 'app/globals.css', 'README.md', '.env.local.example', 'DESIGN.md'];
  // The character itself, plus the ways of writing it that still show up on the page:
  // a \u2013 style escape in a string, or an HTML entity.
  const dash = /[\u2013\u2014]|\\u\{?(2013|2014)\}?|&(ndash|mdash);|&#(8211|8212|x2013|x2014);/i;
  const offenders = checked.filter((f) => existsSync(join(root, f)) && dash.test(read(f)));
  assert.deepEqual(offenders, [], `Use a comma, colon, "to" or a full stop instead in: ${offenders.join(', ')}`);
});

test('the cookie banner is gone and stays gone', () => {
  assert.equal(existsSync(join(root, 'app/components/CookieBanner.jsx')), false);
  assert.doesNotMatch(read('app/globals.css'), /ar-cookie/);
  assert.doesNotMatch(read('app/layout.jsx'), /CookieBanner/);
});

test('claims that were removed do not come back', () => {
  const home = read('app/components/Home.jsx');
  for (const phrase of ['ar-dropzone', 'type="file"', 'Booking confirmed', 'Get notified', 'Share your documents ahead']) {
    assert.ok(!home.includes(phrase), `Home.jsx should not contain "${phrase}"`);
  }
  // A box that does nothing when ticked is a claim too: sessions are kept by
  // the browser regardless, so the sign-up page must not offer a choice.
  assert.ok(!read('app/signup/client/page.jsx').includes('Keep me signed in'), 'the sign-up page should not offer "Keep me signed in" until it does something');
});

test('the founding period end date is empty or a real YYYY-MM-DD date', () => {
  // A typo here would make the practitioner page quietly say nothing, so catch it before it ships.
  const m = read('lib/pricing.js').match(/export const FOUNDING_PERIOD_ENDS = (null|'([^']*)');/);
  assert.ok(m, 'lib/pricing.js should set FOUNDING_PERIOD_ENDS to null or a quoted date');
  if (m[1] === 'null') return;
  const value = m[2];
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${value} should look like 2026-12-11`);
  const date = new Date(`${value}T00:00:00Z`);
  assert.ok(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value, `${value} is not a real calendar date`);
});

function siteConst(name) {
  const m = read('lib/site.js').match(new RegExp(`export const ${name} =\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  assert.ok(m, `lib/site.js should define ${name}`);
  return m[1];
}

function metaField(src, field) {
  const quoted = src.match(new RegExp(`${field}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  if (quoted) return quoted[1].replace(/\\'/g, "'");
  const named = src.match(new RegExp(`${field}:\\s*([A-Z][A-Z_]+)\\b`));
  return named ? siteConst(named[1]) : null;
}

function publicPaths() {
  const block = read('app/sitemap.js').match(/const PUBLIC_PATHS = \[([\s\S]*?)\];/);
  assert.ok(block, 'app/sitemap.js should list PUBLIC_PATHS');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function pageSources(path) {
  const dir = path === '/' ? 'app' : `app${path}`;
  const files = [`${dir}/page.jsx`, `${dir}/layout.jsx`].filter((f) => existsSync(join(root, f)));
  assert.ok(files.some((f) => f.endsWith('page.jsx')), `${path} should have a page`);
  return files.map(read).join('\n');
}

test('every public page has its own title and a description of 155 characters or fewer', () => {
  const titles = new Map();
  for (const path of publicPaths()) {
    const src = pageSources(path);
    assert.match(src, /pageMeta\(/, `${path} should build its metadata with pageMeta`);
    const title = metaField(src, 'title');
    const description = metaField(src, 'description');
    assert.ok(title, `${path} needs a title`);
    assert.ok(description, `${path} needs a description`);
    assert.ok(description.length <= 155, `${path} description is ${description.length} characters`);
    const full = /absolute:\s*true/.test(src) ? title : `${title} | ${siteConst('SITE_NAME')}`;
    assert.ok(!titles.has(full), `${path} has the same title as ${titles.get(full)}`);
    titles.set(full, path);
  }
  assert.ok(siteConst('SITE_DESCRIPTION').length <= 150, 'the default description should be 150 characters or fewer');
});

test('private areas are marked noindex', () => {
  for (const dir of ['login', 'signup/client', 'signup/practitioner', 'account', 'practitioner', 'reset-password', 'version']) {
    const files = [`app/${dir}/layout.jsx`, `app/${dir}/page.jsx`].filter((f) => existsSync(join(root, f)));
    assert.ok(files.some((f) => read(f).includes('privateMeta(')), `app/${dir} should use privateMeta`);
  }
});

test('the share image is a 1200 by 630 PNG', () => {
  const bytes = readFileSync(join(root, 'public/images/anteroom-share.png'));
  assert.equal(bytes.subarray(1, 4).toString('latin1'), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
});

test('security headers are set', async () => {
  const require = createRequire(import.meta.url);
  const config = require(join(root, 'next.config.js'));
  const rules = await config.headers();
  const headers = Object.fromEntries(rules[0].headers.map((h) => [h.key.toLowerCase(), h.value]));
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.ok(headers['x-frame-options']);
  const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];
  assert.ok(csp && csp.includes("frame-ancestors 'none'"), 'a Content-Security-Policy should be present');
});

test('every environment variable the code reads is explained in .env.local.example', () => {
  const documented = read('.env.local.example');
  const names = new Set();
  for (const file of [...sourceFiles, ...walk('lib'), 'next.config.js']) {
    for (const m of read(file).matchAll(/process\.env\.([A-Z0-9_]+)/g)) names.add(m[1]);
  }
  names.delete('NODE_ENV');
  const missing = [...names].filter((n) => !documented.includes(n));
  assert.deepEqual(missing, [], `Add these to .env.local.example: ${missing.join(', ')}`);
});

test('the invite-only sign-up migration comes with a rollback', () => {
  const dir = readdirSync(join(root, 'supabase-migrations'));
  assert.ok(dir.some((f) => /invite_only_signup\.sql$/.test(f)));
  assert.ok(dir.some((f) => /invite_only_signup_rollback\.sql$/.test(f)));
});

// ---------------------------------------------------------------------
// Part 2: a running copy of the site (only when SMOKE_URL is set)
// ---------------------------------------------------------------------

const base = (process.env.SMOKE_URL || '').replace(/\/$/, '');
const live = { skip: base ? false : 'set SMOKE_URL to check a running site' };

async function get(path, options) {
  const res = await fetch(`${base}${path}`, options);
  return { status: res.status, headers: res.headers, text: await res.text() };
}

function decode(html) {
  return html
    .replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const titleOf = (html) => decode((html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '');

test('the homepage is real HTML before any script runs', live, async () => {
  const { status, headers, text } = await get('/');
  assert.equal(status, 200);
  assert.match(headers.get('content-type'), /text\/html/);
  const html = decode(text);
  assert.ok(html.includes('Find out where you stand'), 'the hero headline should be in the first response');
  assert.ok(html.includes('Start the free check'), 'the main button should be in the first response');
  assert.equal(titleOf(text), siteConst('HOME_TITLE'));
  assert.match(text, /rel="canonical"/);
  assert.match(text, /property="og:image"/);
  assert.match(text, /name="twitter:card"/);
  assert.match(text, /application\/ld\+json/);
  assert.match(text, /"@type":"Organization"/);
  assert.ok(!text.includes('ar-cookie'), 'there should be no cookie banner');
  assert.match(text, /data-build="v\d+"/);
});

test('the help page has every answer in the HTML', live, async () => {
  const source = read('app/help/faqs.js');
  const { FAQS } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
  const { status, text } = await get('/help');
  assert.equal(status, 200);
  const html = decode(text);
  for (const { q, a } of FAQS) {
    assert.ok(html.includes(q), `missing question: ${q}`);
    assert.ok(html.includes(a), `missing answer to: ${q}`);
  }
  assert.match(text, /"@type":"FAQPage"/);
});

test('every public page answers with its own title', live, async () => {
  const seen = new Map();
  for (const path of publicPaths()) {
    const { status, text } = await get(path);
    assert.equal(status, 200, `${path} should answer 200`);
    const title = titleOf(text);
    assert.ok(title, `${path} should have a title`);
    assert.ok(!seen.has(title), `${path} repeats the title of ${seen.get(title)}`);
    seen.set(title, path);
    assert.ok(!/AnteRoom \| AnteRoom/.test(title), `${path} doubles the brand name in its title`);
  }
});

test('robots.txt and sitemap.xml are served', live, async () => {
  const robots = await get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.text, /Disallow: \/api\//);
  assert.match(robots.text, /Sitemap: /);
  const sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  for (const path of publicPaths()) {
    const loc = path === '/' ? '/</loc>' : `${path}</loc>`;
    assert.ok(sitemap.text.includes(loc), `sitemap should list ${path}`);
  }
});

test('the version page shows the build and asks not to be indexed', live, async () => {
  const { status, text } = await get('/version');
  assert.equal(status, 200);
  assert.ok(text.includes(read('lib/build.js').match(/BUILD_STAMP = '(v\d+)'/)[1]));
  assert.match(text, /name="robots" content="noindex/);
});

test('an unknown address returns a real 404', live, async () => {
  const { status } = await get('/this-page-does-not-exist');
  assert.equal(status, 404);
});

test('pages are served with the security headers', live, async () => {
  const { headers } = await get('/');
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.ok(headers.get('x-frame-options'));
  assert.ok(headers.get('content-security-policy') || headers.get('content-security-policy-report-only'));
});

test('the contact route turns away an empty message', live, async () => {
  const { status } = await get('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'contact', email: 'not-an-email', message: '' }),
  });
  assert.equal(status, 400);
});
