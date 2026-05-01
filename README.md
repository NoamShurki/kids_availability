# Baby Available?

A family web app that lets parents post their baby's availability status — so relatives can check the URL instead of calling.

**Public viewers** see the status in real time, no login required.  
**Parents** log in with a magic-link email to update the status.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Postgres + Realtime + Auth
- **Tailwind CSS**
- **Vercel** — hosting (free tier)

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/kids_availability.git
cd kids_availability
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In **SQL Editor**, run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 3. Seed initial data

In the Supabase SQL Editor, run:

```sql
-- 1. Create your family
INSERT INTO families (name, slug) VALUES ('Your Family Name', 'your-family-slug');

-- 2. Note the family id
SELECT id FROM families WHERE slug = 'your-family-slug';

-- 3. Add status definitions (replace YOUR_FAMILY_ID with the id from step 2)
INSERT INTO status_definitions (family_id, label, emoji, color_hex, sort_order, is_default)
VALUES
  ('YOUR_FAMILY_ID', 'Sleeping',            '😴', '#94a3b8', 1, true),
  ('YOUR_FAMILY_ID', 'Not Home',            '🏠', '#f59e0b', 2, false),
  ('YOUR_FAMILY_ID', 'Available for Visit', '👋', '#22c55e', 3, false),
  ('YOUR_FAMILY_ID', 'Available for Call',  '📹', '#3b82f6', 4, false),
  ('YOUR_FAMILY_ID', 'Busy',               '⏳', '#ef4444', 5, false);

-- 4. Add your baby
INSERT INTO babies (family_id, name, slug)
VALUES ('YOUR_FAMILY_ID', 'Baby Name', 'baby-slug');

-- 5. Set initial status (replace BABY_ID and STATUS_DEF_ID with values from above)
INSERT INTO baby_status_current (baby_id, status_def_id)
VALUES ('BABY_ID', 'STATUS_DEF_ID');
```

### 4. Add managers (parents)

After each parent logs in once via the app:

```sql
-- Find the user id
SELECT id, email FROM auth.users;

-- Add them as a manager
INSERT INTO family_managers (family_id, user_id)
VALUES ('YOUR_FAMILY_ID', 'USER_ID');
```

### 5. Configure environment

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 6. Enable Supabase Auth

In Supabase Dashboard → Authentication → Providers:
- Enable **Email** (magic link), disable password sign-in

In Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect: `http://localhost:3000/auth/callback`

### 7. Enable Realtime

Supabase Dashboard → Database → Replication → enable `baby_status_current` table.

### 8. Run

```bash
npm run dev
```

Open `http://localhost:3000/your-family-slug/baby-slug`

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
4. Update Supabase Auth redirect URLs to your Vercel domain
5. Every push to `main` auto-deploys — cost: $0/month

---

## Adding a Second Family Later

No code changes needed. Repeat the SQL seeding steps with a new family slug and add yourself as a manager. The routing already supports multiple independent families.

---

## URL Structure

| URL | Description |
|---|---|
| `/` | All families overview |
| `/[familySlug]` | One family's babies |
| `/[familySlug]/[babySlug]` | **Baby status page — share this link with family** |
| `/manage` | Manager dashboard (login required) |
| `/manage/[babySlug]` | Update a baby's status (login required) |
| `/login` | Magic-link login for parents |
