# Anteroom

Real Next.js project version of the homepage prototype — same component, same
Karst fonts, but the fonts are now loaded as real files in `/public/fonts`
instead of the base64-embedded hack used inside the chat artifact.

## 1. Run it locally

You'll need [Node.js](https://nodejs.org) installed (LTS version is fine).

```bash
cd anteroom-web
npm install
npm run dev
```

Open http://localhost:3000 — you should see the real site running on your
own machine.

## 2. Push it to GitHub

If you don't already have a repo for this:

```bash
git init
git add .
git commit -m "Initial Anteroom site"
```

Then create a new empty repository on github.com (no README, no .gitignore —
you already have one), and follow the "push an existing repository" commands
it shows you, something like:

```bash
git remote add origin https://github.com/<your-username>/anteroom.git
git branch -M main
git push -u origin main
```

## 3. Deploy on Vercel

Same flow as Chumb:

1. Go to vercel.com, log in (GitHub login is easiest).
2. Click **Add New → Project**.
3. Select the `anteroom` repo you just pushed.
4. Vercel auto-detects Next.js — leave the defaults, click **Deploy**.
5. In a minute or two you'll get a live URL like `anteroom.vercel.app`.

## 4. Connect anteroom.com.au

Once the domain registration itself is sorted (the ASIC business name issue
from earlier, separate from this):

1. In the Vercel project, go to **Settings → Domains**.
2. Add `anteroom.com.au`.
3. Vercel will show you DNS records (usually an A record or CNAME) to add.
4. Add those records with whoever you registered the domain through — this
   part happens on the domain registrar's site, not Vercel's.
5. DNS changes can take anywhere from a few minutes to a few hours to
   propagate.

## What's placeholder vs. real

- The six practitioner listings in `app/page.jsx` are example data — replace
  the `PRACTITIONERS` array once real practitioners are signed up.
- The document upload in the booking flow captures file **names** into
  component state for the UI — it does not upload or store anything. Wiring
  up real, secure file storage is separate backend work, not something this
  front-end alone can do.
