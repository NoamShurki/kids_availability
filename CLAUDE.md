@AGENTS.md

# Baby Available? — Project Context

## What this is
A family web app where parents post their baby's availability status (sleeping, available for call, etc.) so relatives can check a URL instead of calling. Built for the Yankelovich family / baby Arbel.

## Live URLs
- **Production:** https://kids-availability-ufyr.vercel.app
- **Baby status page (share this):** https://kids-availability-ufyr.vercel.app/yankelovich/arbel
- **Parent login:** https://kids-availability-ufyr.vercel.app/login
- **GitHub:** https://github.com/NoamShurki/kids_availability

## Stack
- Next.js 16 (App Router, TypeScript) — `src/app/`
- Supabase — database, auth (magic link), realtime
- Tailwind CSS (v4)
- Vercel — hosting, auto-deploys from `master` branch

## Supabase project
- Project ref: `patcvpgmksnhxqokwfso`
- URL: `https://patcvpgmksnhxqokwfso.supabase.co`

## Key architecture decisions
- **Public access:** No login needed to view status — anon role has SELECT on all tables via RLS
- **Auth:** Magic link email only (no passwords). Only parents need accounts. Session persists for weeks in the browser after first login.
- **Realtime:** `baby_status_current` table is published to `supabase_realtime` — `RealtimeStatus.tsx` subscribes client-side
- **One-to-one quirk:** `baby_status_current` has `UNIQUE(baby_id)` so Supabase returns it as an object (not array). Always use `resolveCurrentStatus()` from `src/lib/types.ts` to access it safely.
- **Middleware:** Uses `src/middleware.ts` (standard Next.js convention) for Supabase session refresh on every request. Do NOT rename to `proxy.ts` — it breaks session persistence on Vercel.
- **Manager UX:** Parents bookmark `/yankelovich/arbel` — they see the Update Status section when logged in, relatives see only the status. No separate /manage page needed.

## Database tables
- `families` — top-level tenant (Yankelovich family, slug: `yankelovich`)
- `babies` — baby profiles (Arbel, slug: `arbel`)
- `status_definitions` — per-family status options (Sleeping, Not Home, Available for Visit, Available for Call, Busy, At the Beach/Pool)
- `baby_status_current` — one row per baby, overwritten on each status change
- `baby_status_history` — append-only log, used by suggestions algorithm
- `family_managers` — maps auth users to families they can manage

## Adding a manager (parent)
1. Parent visits `/yankelovich/arbel` and clicks "Log in to update status"
2. They enter their email and click the magic link — this creates their auth.users row
3. In Supabase SQL Editor:
```sql
INSERT INTO family_managers (family_id, user_id)
VALUES (
  (SELECT id FROM families WHERE slug = 'yankelovich'),
  (SELECT id FROM auth.users WHERE email = 'their@email.com')
);
```
4. They refresh the page — Update Status section appears

## Adding a second family in the future
No code changes needed — just insert rows:
```sql
INSERT INTO families (name, slug) VALUES ('New Family', 'new-family');
-- then babies, status_definitions, baby_status_current, family_managers
```

## Local dev
```bash
npm run dev        # start dev server at http://localhost:3000
npm run type-check # TypeScript check
npm run build      # production build
```
Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.

## Deploy
Every push to `master` auto-deploys to Vercel. No manual steps needed.
