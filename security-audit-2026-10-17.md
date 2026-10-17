# Noura — Security Audit (17 Oct 2026)

> **Keep this file private.** It describes weaknesses that are live on `noura-restaurant.vercel.app` until fixed. Don't commit it to a public repo.

**Method:** code review of every API route, page guard, auth flow, storage helper and config file, plus a read-only page sweep (all 18 admin and guest pages load with no errors). No attack traffic was sent and no forms were submitted against the live database, which local dev and Vercel share.

**Roles in the app:** `PLATFORM_ADMIN` (1 account) and venue `OWNER`. Venue `MANAGER` and `STAFF` roles exist in the schema; routes check them through `verifyRestaurantAccess`.

---

## Summary

| # | Severity | Issue | Status |
|---|---|---|---|
| H1 | **High** | Demo owner account with a published password controls your real cafes | Open |
| H2 | **High** | Session-signing secret was committed to git | Fixed locally; **rotate on Vercel** |
| M1 | Medium | Reward redemption doesn't check who is redeeming | Open |
| M2 | Medium | Rate limits are in-memory, so they barely work on Vercel | Open |
| M3 | Medium | Guest feedback photos are publicly readable | Open |
| M4 | Medium | No Content-Security-Policy header | Open |
| M5 | Medium | Login `callbackUrl` can send users to an external site | Open |
| D1 | Medium (ops) | Supabase session-pool exhaustion caused 500s | Fixed locally; **set on Vercel** |
| L1 | Low | Guest wallet ID uses `Math.random` | Open |
| L2 | Low | `/admin/platform` page shell loads for any logged-in user | Open |
| L3 | Low | Anyone can post analytics events for any cafe | Open |
| L4 | Low | Every new browser gets a wallet and a customer number | Open |
| L5 | Low | 6-character minimum password | Open |
| L6 | Low | Stamp-claim endpoint has no rate limit | Open |

---

## High

### H1 — Demo owner account with a published password controls real cafes
- **Where:** `src/components/auth/auth-slider.tsx` (`handleFillDemoLogin`, the "Auto-fill demo" link) and the `demo@noura.com` user in the production database.
- **Problem:** the login page fills in `demo@noura.com` / `password123` for anyone. That account is **OWNER of Hari Cafe Final and Hari2 Cafe** in the shared production database. Anyone on the live site can sign in and read customer data, or change menus, Wi-Fi, rewards and branding.
- **Fix:**
  1. Remove the auto-fill from production. Render it only when `process.env.NEXT_PUBLIC_DEMO_MODE === "true"`.
  2. Change the demo account's password, or move your real cafes to a separate owner account.
  3. If you want a public demo, give it its own sandbox cafe with no real data.

### H2 — Session-signing secret was committed to git
- **Where:** `.env.example` (commit `2f3c866`) contained the real `AUTH_SECRET`/`NEXTAUTH_SECRET` value.
- **Problem:** anyone with that value can create a valid login session for any user, including the platform admin, wherever it's still in use.
- **Done:** `.env.example` now has placeholders, and your local `.env` has a fresh 64-character random secret.
- **Still needed:** in **Vercel → Project → Settings → Environment Variables**, set `NEXTAUTH_SECRET` and `AUTH_SECRET` to a new random value. Generate it with `openssl rand -base64 32`, don't reuse the local one, then redeploy. Everyone gets signed out once. The old value stays in git history, so rotating it is the real fix.

---

## Medium

### M1 — Reward redemption doesn't check ownership
- **Where:** `src/app/api/loyalty/rewards/[id]/redeem/route.ts`
- **Problem:** the route marks a reward REDEEMED for any caller who has its ID. It doesn't check that the caller owns the wallet, and no staff step is involved, so a guest can mark a reward used without staff present.
- **Fix:** require the guest's `browserId` in the body and match it to `reward.wallet.anonymousBrowserId` (404 otherwise). Better still, make redemption a staff action from the admin side, or require a short code shown at the counter.

### M2 — Rate limits don't survive on Vercel
- **Where:** `src/lib/rate-limit.ts` keeps counters in process memory.
- **Problem:** each Vercel function instance has its own memory, and counters reset on cold start. Login, sign-up, feedback and wallet throttles are therefore mostly ineffective in production.
- **Fix:** use a shared store. `.env.example` already reserves `UPSTASH_REDIS_REST_URL`/`TOKEN` for Upstash Redis (`@upstash/ratelimit`). Keep the in-memory store as the local-dev fallback.

### M3 — Guest feedback photos are publicly readable
- **Where:** `src/lib/supabase/feedback-photos.ts` and `src/app/api/restaurants/[id]/feedback/[feedbackId]/photos/[index]/route.ts`
- **Problem:** with no `SUPABASE_FEEDBACK_BUCKET` and no `SUPABASE_SERVICE_ROLE_KEY` set, photos land in the public `restaurant-assets` bucket. The admin photo route also redirects to the public URL when a download fails. Anyone with a photo's URL can view guests' photos without logging in.
- **Fix:**
  1. Create a **private** bucket and set `SUPABASE_FEEDBACK_BUCKET` and `SUPABASE_SERVICE_ROLE_KEY` (server-only) on Vercel.
  2. Remove the public-URL fallback, so the route returns 404 if a download fails.
  3. Move existing photos into the private bucket.

### M4 — No Content-Security-Policy
- **Where:** `next.config.*` sends X-Frame-Options, Referrer-Policy and Permissions-Policy, but no CSP.
- **Fix:** add a CSP covering self, Supabase storage, Google Fonts and `accounts.google.com`. Start with `Content-Security-Policy-Report-Only` to catch breakage, then enforce it. Add `Strict-Transport-Security` if you ever host off Vercel.

### M5 — Login redirect can point to an external site
- **Where:** `auth-slider.tsx`: `callbackUrl = searchParams.get("callbackUrl") || "/admin"`, then `router.push(callbackUrl)`.
- **Problem:** a crafted login link can send someone to an external site right after a genuine sign-in, which is useful for phishing.
- **Fix:** accept only same-site paths: `const safe = cb?.startsWith("/") && !cb.startsWith("//") ? cb : "/admin"`.

### D1 — Database connection exhaustion (ops)
- **Cause:** `DATABASE_URL` used Supabase's **session** pooler (port 5432, 15-client cap), which ran out of connections and returned 500s.
- **Done locally:** `DATABASE_URL` now uses the **transaction** pooler, `...:6543/postgres?pgbouncer=true&connection_limit=10`, and `DIRECT_URL` stays on 5432 for migrations. Verified: 24 of 24 concurrent stats calls now return 200 (all 24 failed before).
- **Still needed on Vercel:** set `DATABASE_URL` to the same 6543 pooler URL with **`connection_limit=1`**, since serverless functions should each hold one connection. Set `DIRECT_URL` to the 5432 URL.

---

## Low

- **L1 — Guest wallet ID uses `Math.random`** (`src/hooks/use-loyalty-wallet.ts`). That ID is the only credential for a wallet. Use `crypto.randomUUID()`; existing IDs keep working.
- **L2 — `/admin/platform` shell loads for any logged-in user.** Its data APIs correctly return 403 to non-admins, so no data leaks. Still, add `src/app/admin/platform/layout.tsx` that redirects anyone who isn't `PLATFORM_ADMIN`.
- **L3 — Unauthenticated analytics writes** (`/api/analytics/events`). Anyone can inflate any cafe's numbers. Check the restaurant exists and is active, cap event types, and use the shared rate limiter from M2.
- **L4 — Every new browser gets a wallet and customer number.** Opening `/r/<slug>/rewards` creates one, so crawlers and one-time visitors inflate the Customers list. Create the wallet on the first stamp claim instead of on page view.
- **L5 — Weak passwords allowed.** Sign-up allows 6 characters. Raise the minimum to 10 and apply it to the password-change route too.
- **L6 — No rate limit on stamp claims** (`/api/loyalty/checkout/[token]/claim`). Tokens are random and single-use, so the risk is low, but add a per-IP limit through the shared limiter.

---

## Checked and fine

- Every admin API route checks that the caller belongs to the cafe in the URL, and writes are scoped by `restaurantId` (covered by unit tests).
- Brand colours are validated as hex before being injected into the guest page's `<style>` tag, which is the only raw-HTML use in the app.
- Changing a password requires the current password, and "sign out everywhere" invalidates old sessions through `tokenVersion`.
- Checkout QRs are consumed atomically, and claims at the wrong cafe are rejected without consuming the QR.
- Menu and feedback uploads are checked by file signature, and feedback images are re-encoded.
- React escapes all user text, and `.env` is git-ignored.
- The Wi-Fi password is shown publicly on the guest page by design.

---

## Ready-made prompt for Claude Code

```
Implement these security fixes in this Next.js 15 + Prisma + NextAuth v4 app. Keep each change minimal, keep
existing behaviour otherwise, add a unit test (vitest, tests/unit) for each server-side change, and run
`npx tsc --noEmit` and `npx vitest run` at the end.

1. Demo login (H1): in src/components/auth/auth-slider.tsx, render the "Auto-fill demo" links and their
   handlers only when process.env.NEXT_PUBLIC_DEMO_MODE === "true". Add NEXT_PUBLIC_DEMO_MODE="false"
   to .env.example.

2. Redeem ownership (M1): in src/app/api/loyalty/rewards/[id]/redeem/route.ts, require a JSON body
   { browserId: string }. Load the reward with its wallet and return 404 unless
   reward.wallet.anonymousBrowserId === browserId. Update src/components/loyalty/unlocked-reward-card.tsx
   to send the browserId from useLoyaltyWallet. Keep the existing atomic updateMany.

3. Shared rate limiting (M2, L3, L6): change src/lib/rate-limit.ts so rateLimit() uses @upstash/ratelimit
   + @upstash/redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, and falls back to the
   current in-memory store otherwise. Keep the same function signature. Then add rateLimit calls to
   /api/loyalty/checkout/[token]/claim (per IP, 20/min), and in /api/analytics/events check that the
   restaurant exists and is ACTIVE.

4. Private feedback photos (M3): in src/lib/supabase/feedback-photos.ts, remove the public-URL fallback in
   downloadFeedbackPhoto. In src/app/api/restaurants/[id]/feedback/[feedbackId]/photos/[index]/route.ts,
   remove the redirect to getFeedbackPhotoPublicUrl and return 404 when the download fails. Make
   toFeedbackPhotoUrls return only the authenticated /api/... photo route URLs. Document
   SUPABASE_FEEDBACK_BUCKET and SUPABASE_SERVICE_ROLE_KEY in .env.example.

5. CSP (M4): in next.config, add a Content-Security-Policy-Report-Only header allowing 'self',
   the Supabase project URL (images and connect), fonts.googleapis.com / fonts.gstatic.com,
   and accounts.google.com (form-action / navigation for Google sign-in).

6. Safe login redirect (M5): in auth-slider.tsx, only accept a callbackUrl that starts with "/" and
   not "//"; otherwise use "/admin". Apply it to both the credentials and the Google sign-in calls.

7. Wallet IDs (L1): in src/hooks/use-loyalty-wallet.ts, generate new IDs with crypto.randomUUID()
   (keep the "wal_" prefix). Existing stored IDs must keep working.

8. Platform admin gate (L2): add src/app/admin/platform/layout.tsx (server component) that calls
   getSession() and redirects to /admin unless session.user.role === "PLATFORM_ADMIN".

9. Lazy wallet creation (L4): in src/app/api/loyalty/wallet/route.ts, don't create a wallet on GET.
   Return an empty "not joined yet" wallet shape instead. Create it in the claim route on the first
   successful stamp (it already creates when missing). Make sure the guest rewards page still renders.

10. Password policy (L5): raise the minimum to 10 characters in src/app/api/auth/signup/route.ts and
    src/app/api/user/password/route.ts, and update the client-side hints in auth-slider.tsx.

Don't change NEXTAUTH_SECRET, DATABASE_URL or any Vercel settings — those are handled separately.
```
