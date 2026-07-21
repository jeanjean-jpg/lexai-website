# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**lexai-website** — the marketing site + licensing/update backend for **LEX AI**, a Windows desktop legal-assistant app for Romanian law firms. Live at `https://lexai.software`. Deployed on Vercel from GitHub `jeanjean-jpg/lexai-website`; **pushing to `main` auto-deploys**. All visitor-facing content is in **Romanian** — diacritics matter, keep them correct.

The desktop app itself lives in a separate repo (`C:\Users\Usuario\Desktop\MocanuAsociatii-Dashboard`, has its own CLAUDE.md). Release binaries are hosted on the public repo `jeanjean-jpg/lexai-releases`.

## Commands

There is **no build step, no tests, no linter**. The site is plain static files; the API is Vercel serverless functions.

```bash
npx vercel dev      # run site + serverless functions locally
npx vercel          # preview deploy
npx vercel --prod   # production deploy (normally unnecessary — git push to main deploys)
git push origin main   # the normal way to ship — Vercel builds on push
```

`package.json` only declares runtime deps for the API (`stripe`, `resend`); the front-end pulls React/Babel from a CDN (see below).

## Front-End Architecture

**Static multi-page site with in-browser JSX.** Each page is a standalone `.html` file that loads React 18 + Babel Standalone from unpkg and transpiles JSX **in the browser at runtime** — there is no bundler.

- Pages: `index.html`, `functionalitati.html`, `preturi.html`, `descarcare.html`, `ajutor.html`. Clean URLs (`/preturi` → `preturi.html`) are mapped in `vercel.json` rewrites — add a rewrite there when you add a page.
- Shared React components live in `.jsx` files loaded via `<script type="text/babel" src="shared.jsx">` and attached to **`window`** (e.g. `window.Nav`, `window.Footer`, `window.MIcon`, `window.AgentDemo`). Pages consume them with `const { Nav, Footer } = window;` inside their own `<script type="text/babel">` block, then `ReactDOM.createRoot(...).render(...)`.
  - `shared.jsx` — `MIcon` (inline SVG icon set), `Nav`, `Footer`, `Logo`, `Wordmark`, `Reveal`.
  - `demos.jsx` — interactive marketing demos (`AgentDemo`, `CorpusDemo`) with hard-coded sample data.
  - `help-content.jsx` — the `/ajutor` documentation content + TOC.
- **Navigation is data-driven**: the `links` array in `shared.jsx` (`Nav`) feeds *both* the desktop bar and the mobile hamburger menu. Add/remove/reorder nav items there in one place. Each page passes `<Nav active="<id>" />` to highlight the current tab (home page uses `active="home"`).

**Styling**: raw CSS only (`styles.css`, `demos.css`) — no Tailwind/framework. Uses the **same CSS-variable design tokens as the desktop app**: `--bg-0..--bg-3`, `--text`/`--text-muted`/`--text-dim`, `--gold`/`--gold-bg`/`--gold-soft`, `--red`/`--blue`/`--green`, `--border`/`--border-soft`, `--font-mono`. Don't invent token names — undefined vars fail silently.

When a page needs imperative behavior that shouldn't depend on Babel/React timing (e.g. the desktop-only download modal in `descarcare.html`), use a plain `<script>` with vanilla DOM, not a React component.

## Backend (`api/` — Vercel Serverless Functions)

Node CommonJS (`module.exports = async (req, res) => {…}`). These power the desktop app's licensing/updates and the Stripe flow:

| File | Purpose |
|---|---|
| `validate-license.js` | App calls on startup (cached 1h). Verifies HMAC + Stripe subscription status. Returns `{active, plan, status, daysUntilRenewal, …}`. |
| `updates.js` | License-gated Squirrel auto-update gateway. Reached via the `vercel.json` rewrite `/api/updates/:path*` → `/api/updates?path=:path*`. Validates entitlement, then **302-redirects** to the matching asset on the public `lexai-releases` GitHub Releases. |
| `billing-portal.js` | `POST {key}` → returns a Stripe Customer Portal URL (app opens it in the browser). |
| `stripe-webhook.js` | Handles `checkout.session.completed`, `invoice.upcoming`, `invoice.payment_failed`, `customer.subscription.deleted`; sends license/notification emails via Resend. |

**Licensing model** (shared with the app): keys are HMAC-SHA256-signed (`base64url(payload).<sig>`). Plans: `lifetime` (validated locally, always entitled) and `monthly` (validated online against Stripe; the Stripe customer id `cus_...` is carried in `payload.nonce`). Unknown/trial keys are treated as entitled for downloads because the binaries are public — real enforcement is runtime read-only mode in the app.

### Critical env vars (Vercel project settings)

- `LEXAI_LICENSE_SECRET` — **must byte-for-byte match the desktop app's value**, or every key fails verification.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe API + webhook signature.
- Resend API key — transactional license emails.

`vercel.json` sets `Cache-Control: no-store` on `/api/*` and HSTS / `X-Frame-Options: DENY` / `X-Content-Type-Options: nosniff` site-wide.

## Conventions / Gotchas

- **Version numbers on the download page are hard-coded** (`descarcare.html`): the kicker, the Windows card (`os-version`), and the release-notes block. The actual download link always points to `releases/latest/download/LexAI-Setup.exe`, so it serves the newest build regardless — but bump the displayed strings when the app releases a new version.
- **Repo root is the website folder** (not HOME), so staging is safe here — but still commit specific files, and end commit messages with the Co-Authored-By trailer.
- Git warns about LF→CRLF on commit (Windows checkout); harmless.
