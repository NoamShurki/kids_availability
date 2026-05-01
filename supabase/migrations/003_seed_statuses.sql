-- This migration is a template — replace 'YOUR_FAMILY_ID' with the actual family uuid
-- after running: INSERT INTO families (name, slug) VALUES ('Your Family', 'your-family');
-- Then run: SELECT id FROM families WHERE slug = 'your-family';
-- And replace the placeholder below with that id.

-- Default status definitions (run after inserting your family)
-- Example (replace the family_id uuid with yours):
--
-- INSERT INTO status_definitions (family_id, label, emoji, color_hex, sort_order, is_default)
-- VALUES
--   ('YOUR_FAMILY_ID', 'Sleeping',              '😴', '#94a3b8', 1, true),
--   ('YOUR_FAMILY_ID', 'Not Home',              '🏠', '#f59e0b', 2, false),
--   ('YOUR_FAMILY_ID', 'Available for Visit',   '👋', '#22c55e', 3, false),
--   ('YOUR_FAMILY_ID', 'Available for Call',    '📹', '#3b82f6', 4, false),
--   ('YOUR_FAMILY_ID', 'Busy',                  '⏳', '#ef4444', 5, false);
--
-- See README.md for the full setup sequence.
SELECT 'Run the INSERT statements in README.md after creating your family.' AS instructions;
