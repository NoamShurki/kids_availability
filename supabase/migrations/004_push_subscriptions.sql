CREATE TABLE push_subscriptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id   uuid NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  endpoint  text NOT NULL UNIQUE,
  p256dh    text NOT NULL,
  auth      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own subscription (no auth required)
CREATE POLICY "push_insert" ON push_subscriptions FOR INSERT WITH CHECK (true);
-- Anyone can delete by endpoint (so unsubscribe works without login)
CREATE POLICY "push_delete" ON push_subscriptions FOR DELETE USING (true);
-- Server reads all (via service role, bypasses RLS)
