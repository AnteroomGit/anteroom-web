# AnteRoom

A free triage tool for Australian company directors facing ATO debt,
Director Penalty Notices and statutory demands, with an introduction to a
verified registered liquidator. Practitioners fund it. Directors never pay.

Built with Next.js 14 (App Router), Supabase (sign-in and database), and
hosted on Vercel at anteroom.com.au.

## Running it on your computer

You need [Node.js](https://nodejs.org) (the LTS version is fine).

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Where things live

| What | Where |
| --- | --- |
| Homepage and the whole triage flow | `app/components/Home.jsx` (`app/page.jsx` is a thin server wrapper so search engines get the real page) |
| Page titles, descriptions and share previews | `lib/meta.js`, `lib/site.js`, and each page's `metadata` |
| Facts used in several places (email address, response-time promise, site address) | `lib/site.js` |
| Free period end date and monthly price | `lib/pricing.js` (the price stays blank until you decide; the end date is hidden by the page itself once the day has passed) |
| Triage questions and results | `lib/triageQuestions.js` and `app/constants.js`. Change these with care. |
| Database setup and changes | `supabase-schema.sql` and `supabase-migrations/` |
| Release label | `lib/build.js` |

## What is real and what is not

- Practitioners shown to directors are real rows in the `practitioners` table
  with `verified = true`. There is no sample data.
- Practitioners join by invitation only. An invitation is a row in
  `practitioner_leads` and a link of the form
  `/signup/practitioner?lead=<id>`.
- A consultation "booking" is a request. The date and time a director picks
  are a preference, not a diary slot, and nothing is booked until the
  practitioner confirms with them. Practitioners are not emailed about new
  requests yet, so they see them in their dashboard.
- Files cannot be sent through AnteRoom yet. The request screen says so. Do
  not add an upload box until storage, access rules and a privacy review exist.
- The contact form and the "tell me when someone is listed" form save to the
  `contact_messages` table. Waitlist rows start with `[Waitlist]`. If
  `RESEND_API_KEY` is set you are also emailed. Someone has to read that table.
- Rate limiting is best effort and per server instance (`lib/rateLimit.js`).
  It slows down abuse. It is not a guarantee.

## Settings (environment variables)

Every setting is listed, with what it does, in `.env.local.example`. In Vercel
add them under Project, Settings, Environment Variables, then redeploy: a new
value only takes effect on the next deployment. Missing optional settings are
safe: the feature turns off or falls back to a default instead of breaking.

Never paste a secret into a chat, a commit or a screenshot. If one ever is,
rotate it (make a new one and delete the old one) the same day.

## Checking your work

```bash
npm test
```

This runs `tests/smoke.test.mjs` with Node's built-in test runner. It needs
nothing installed and takes about a second. It checks, among other things,
that no page contains an em or en dash, that the cookie banner and the
removed claims have not come back, that every public page has its own title
and description, and that the security headers are set.

Against a running copy of the site (for example a preview link, or
`npm run build && npm start`):

```bash
SMOKE_URL=http://localhost:3000 npm test
```

The same checks run on every pull request (`.github/workflows/ci.yml`). They
cannot sign in, so still click through log in, the triage, a request, and
change password on the preview link before you merge.

## Releasing a change

Do not push straight to `main`. Pushing to `main` puts the change in front of
real people within minutes.

1. Make a branch: `git checkout -b my-change`.
2. Commit and push it: `git push -u origin my-change`.
3. Vercel builds that branch on its own address (a "Preview"). Open the
   pull request on GitHub and click the Preview link Vercel adds to it.
4. On the preview, work through the checklist in the pull request template.
   Open `/version` and check it shows the number you expect.
5. If the change needs a database change, run it in the Supabase SQL editor
   only after the code that goes with it is live, unless the SQL file says
   otherwise at the top. Every migration has a rollback file beside it.
6. Merge the pull request. Vercel deploys `main` to the live site.
7. If something is wrong, open the project in Vercel, find the last good
   deployment under Deployments, and choose Promote to Production. That undoes
   a code change in seconds. Database changes need their rollback file.
8. Bump `lib/build.js` with each release so `/version` and the `data-build`
   attribute on the page (right-click, Inspect) tell you which release is live.

## Setting up from scratch

1. Put the code in a GitHub repository.
2. In Vercel choose Add New, Project, pick the repository, and leave the
   defaults (Vercel detects Next.js). Add the settings above, then Deploy.
3. To use anteroom.com.au, go to the project's Settings, Domains, add the
   domain, and add the DNS records Vercel shows at your domain registrar.
4. In Supabase, run `supabase-schema.sql` once on a new project. On an
   existing project run only the files in `supabase-migrations/` that you have
   not run yet.
5. In Supabase, Authentication, URL Configuration, add the live site's
   `/reset-password` address (both the www and non-www forms) to the
   Redirect URLs, or the "Forgot password" email link will be refused.
