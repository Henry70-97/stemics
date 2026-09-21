# Quantum Freelance Hub — Netlify site

A React frontend (public marketplace pages + an admin panel) that reads and
writes your **Zite Database** (`Quantum Freelance Hub`) through Netlify
Functions, so it can be hosted entirely on Netlify while Zite stays your
backend data store.

```
src/               React frontend (Vite)
netlify/functions/ Serverless functions — the only place your Zite API key lives
```

## Why there's a server in between

The Zite API key must never reach the browser — anyone could open dev tools
and steal it. So the frontend never calls `tables.zite.com` directly. Instead:

- `netlify/functions/zite-public.js` — no login required. Read-only access to
  `Jobs`, `Gigs`, `Clients`, plus one safe write (submitting a contact/help
  ticket). This powers the public pages.
- `netlify/functions/zite-admin.js` — requires a password (sent as the
  `X-Admin-Password` header on every request, checked against the
  `ADMIN_PASSWORD` environment variable). Full read/write/delete access to
  **every** table. This powers `/admin`.

Both functions hold the real `ZITE_API_KEY` as a server-side environment
variable, never shipped to the browser.

## 1. Local setup

```bash
npm install
cp .env.example .env
# edit .env: paste your Zite API key and pick an admin password
```

Get your API key from the Zite dashboard → **Settings → Developer**.

Run everything together with the Netlify CLI (recommended — this serves the
frontend and the functions on one port so `/.netlify/functions/...` calls
just work):

```bash
npm install -g netlify-cli   # once
netlify dev
```

Open the URL it prints (usually `http://localhost:8888`). Visit `/admin` and
log in with the password you put in `.env`.

## 2. Deploy to Netlify

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   Build command and publish directory are already set via `netlify.toml`
   (`npm run build` → `dist`), so you can leave those as detected.
3. Before the first deploy (or right after), go to **Site settings →
   Environment variables** and add:
   - `ZITE_API_KEY`
   - `ZITE_DATABASE_ID` (already defaults to `ac388e59ebc6c188` in code if
     you skip this, but setting it explicitly is clearer)
   - `ADMIN_PASSWORD`
4. Deploy. Your public site and `/admin` are both live at your Netlify URL.

## What's included

**Public pages**
- `/` — home
- `/jobs`, `/jobs/:id` — browse open jobs from the `Jobs` table
- `/gigs`, `/gigs/:id` — browse active gigs from the `Gigs` table
- `/contact` — a form that creates a record in `Help Tickets`

**Admin (`/admin`)**
- Password-gated (shared password, not per-person accounts — see below)
- A sidebar listing all 32 tables in your database, built dynamically from
  the live schema (nothing is hardcoded, so new tables/fields you add in
  Zite show up automatically)
- Click a table → a generic, editable grid: inline edit, add a record,
  delete a record. Field types are rendered appropriately (dropdowns for
  single-select, checkboxes, number/date inputs, etc.)
- Linked-record, lookup, attachment, and auto-number fields are shown
  read-only — editing those properly needs a picker UI, which is a
  reasonable next thing to build if you need it.

## Known limitations / good next steps

- **Admin auth is a single shared password**, not real accounts or roles.
  Fine for a small team, not for anything with different permission levels.
  To upgrade: add Netlify Identity, or better, use Zite's own
  [authentication](https://developers.zite.com/concepts/authentication) and
  have this site's admin check a signed-in user's `Role` field in the
  `Users` table instead of a static password.
- **Job applications aren't wired up** on the public site — the `Job
  Applications` table links an applicant to a `Users` record, so a real
  "Apply" button needs the freelancer to be signed in first. Once you add
  user accounts (see above), the application form is a straightforward
  `POST` to a new function endpoint that creates a `Job Applications` record.
- **Linked-record fields** (e.g. a Job's `Client`) show as read-only in the
  admin grid. A picker that searches the linked table and stores its ID is
  the natural next feature.
- **File uploads** (`attachments` fields like profile photos, gig images)
  aren't supported yet — Zite's upload endpoint takes `multipart/form-data`
  and would need its own function route.
- Rate limit: Zite allows 30 requests/second per database — plenty for this
  scale of app, but worth knowing if you add heavy polling.
