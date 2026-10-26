# Lock “Microsoft Excel Training” to specific Google accounts (Vercel)

This adds a real **Google sign‑in gate**: only the Gmail addresses you list can open the
training. Everyone else is redirected to a sign‑in page and denied.

Files added to the project:

| File | Purpose |
|---|---|
| `middleware.js` | Blocks `/` and `/index.html` unless a valid signed‑in cookie exists |
| `login.html` | “Sign in with Google” page |
| `api/config.js` | Returns the public Google Client ID to the login page |
| `api/verify.js` | Verifies the Google token, checks the email allowlist, sets the session cookie |
| `api/logout.js` | Clears the session |

The middleware is **fail‑open until `APP_SECRET` is set**, so deploying these files will not
lock you out while you are setting things up.

---

## Step 1 — Create a Google OAuth Client ID (once)

1. Go to https://console.cloud.google.com/ → create/select a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name + your email → Save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
4. **Authorized JavaScript origins:** add exactly:
   - `https://excel-playbook.vercel.app`
   - (and `http://localhost:3000` if you want to test locally)
5. Create → copy the **Client ID** (ends with `.apps.googleusercontent.com`).

## Step 2 — Add Environment Variables in Vercel

Project → **Settings → Environment Variables** (add to Production, and Preview if you like):

- `GOOGLE_CLIENT_ID` = your client id
- `ALLOWED_EMAILS` = comma‑separated Gmail addresses, e.g. `you@gmail.com,student1@gmail.com`
- `APP_SECRET` = any long random string (e.g. run `openssl rand -hex 32`)

## Step 3 — Connect this repo to Vercel (if not already)

- Vercel → Add New → Project → import `Sanjeed-Ferhan/excel-ribbon-function-explorer`.
- Framework preset: **Other**. No build command needed (static + `/api` + middleware).
- Put the env vars from Step 2, then **Deploy**.

> If you previously uploaded a single HTML file by drag‑and‑drop, switch to importing the repo
> (or upload this whole folder) so `middleware.js` and `api/` are included.

## Step 4 — Test

1. Open the site in an incognito window → you are redirected to **Sign in with Google**.
2. Sign in with an email **in** `ALLOWED_EMAILS` → you see the training.
3. Sign in with an email **not** in the list → “This Google account is not authorized.”

## Manage access later

- **Add a user:** append their Gmail to `ALLOWED_EMAILS` in Vercel → Save → redeploy.
- **Remove a user:** delete their email → redeploy.
- **Sign out:** call `/api/logout` (or add a link to it) — the cookie lasts 12 hours.

---

## Important note about “no one can copy”

A webpage is always downloadable by the person viewing it. The copy/inspect deterrents already
added reduce casual copying, but **the only real protection is this login gate**: without a valid
Google account you never receive the page at all.

Even signed‑in users can still copy what they see — if that matters, consider:
- a visible watermark with the user’s email (I can add this), and
- legal/usage terms in the training.

---
Prepared by **Sanjeed Ferhan**
