-- Enable RLS on all tables
ALTER TABLE families          ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_status_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_managers   ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if the current auth user is a manager of the given family
CREATE OR REPLACE FUNCTION is_family_manager(fam_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_managers
    WHERE family_id = fam_id AND user_id = auth.uid()
  );
$$;

-- families: public read, no public write (managed via service role / SQL editor)
CREATE POLICY "families_select" ON families FOR SELECT USING (true);

-- babies: public read, managers can insert/update/delete their family's babies
CREATE POLICY "babies_select" ON babies FOR SELECT USING (true);
CREATE POLICY "babies_insert" ON babies FOR INSERT
  WITH CHECK (is_family_manager(family_id));
CREATE POLICY "babies_update" ON babies FOR UPDATE
  USING (is_family_manager(family_id));
CREATE POLICY "babies_delete" ON babies FOR DELETE
  USING (is_family_manager(family_id));

-- status_definitions: public read, managers can manage
CREATE POLICY "statusdefs_select" ON status_definitions FOR SELECT USING (true);
CREATE POLICY "statusdefs_insert" ON status_definitions FOR INSERT
  WITH CHECK (is_family_manager(family_id));
CREATE POLICY "statusdefs_update" ON status_definitions FOR UPDATE
  USING (is_family_manager(family_id));
CREATE POLICY "statusdefs_delete" ON status_definitions FOR DELETE
  USING (is_family_manager(family_id));

-- baby_status_current: public read, managers can insert/update
CREATE POLICY "current_select" ON baby_status_current FOR SELECT USING (true);
CREATE POLICY "current_insert" ON baby_status_current FOR INSERT
  WITH CHECK (
    is_family_manager((SELECT family_id FROM babies WHERE id = baby_id))
  );
CREATE POLICY "current_update" ON baby_status_current FOR UPDATE
  USING (
    is_family_manager((SELECT family_id FROM babies WHERE id = baby_id))
  );

-- baby_status_history: public read, managers can insert
CREATE POLICY "history_select" ON baby_status_history FOR SELECT USING (true);
CREATE POLICY "history_insert" ON baby_status_history FOR INSERT
  WITH CHECK (
    is_family_manager((SELECT family_id FROM babies WHERE id = baby_id))
  );

-- family_managers: users can only see their own rows; mutations via service role only
CREATE POLICY "managers_select_own" ON family_managers FOR SELECT
  USING (user_id = auth.uid());
