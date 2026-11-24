## What this changes

<!-- One or two plain sentences. -->

## How I checked it

<!-- Open the Preview link Vercel added to this pull request and say what you clicked through. -->

- [ ] Home page loads and the triage runs to a result
- [ ] Log in, log out
- [ ] Anything else this change touches:

## Before merging

- [ ] `lib/build.js` is bumped, and /version on the preview shows the new number
- [ ] If this adds a database change: the SQL file is in `supabase-migrations/`, a rollback file sits beside it, and the order to run things in is written at the top of the SQL
- [ ] If this reads a new environment variable: it is in `.env.local.example` and added in Vercel
- [ ] No em dashes in anything a visitor can read
