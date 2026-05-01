-- families are the top-level tenant
CREATE TABLE families (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- babies belong to a family
CREATE TABLE babies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       text NOT NULL,
  slug       text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, slug)
);

-- per-family status labels (seeded by migration 003)
CREATE TABLE status_definitions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  label      text NOT NULL,
  emoji      text,
  color_hex  text,
  sort_order int DEFAULT 0,
  is_default bool DEFAULT false,
  UNIQUE(family_id, label)
);

-- current status: one row per baby, overwritten on each change
CREATE TABLE baby_status_current (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id       uuid NOT NULL REFERENCES babies(id) ON DELETE CASCADE UNIQUE,
  status_def_id uuid NOT NULL REFERENCES status_definitions(id),
  note          text,
  updated_at    timestamptz DEFAULT now(),
  updated_by    uuid REFERENCES auth.users(id)
);

-- append-only history log — never updated, only inserted
CREATE TABLE baby_status_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id       uuid NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  status_def_id uuid NOT NULL REFERENCES status_definitions(id),
  note          text,
  set_at        timestamptz DEFAULT now(),
  set_by        uuid REFERENCES auth.users(id)
);

-- which users can manage which family's babies
CREATE TABLE family_managers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'manager',
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- indexes for suggestion queries (history by baby + time)
CREATE INDEX idx_history_baby_set_at ON baby_status_history(baby_id, set_at DESC);
CREATE INDEX idx_current_baby        ON baby_status_current(baby_id);
