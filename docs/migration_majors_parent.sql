-- ============================================================
-- Migration: Add parent_id to majors for sub-specializations
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE majors ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES majors(id) ON DELETE CASCADE;

-- Example: IT -> Cybersecurity, Software Engineering
-- INSERT INTO majors (name, code) VALUES ('Информационные технологии', '6B06');
-- INSERT INTO majors (name, code, parent_id) VALUES ('Cybersecurity', '6B06102', (SELECT id FROM majors WHERE name = 'Информационные технологии'));
-- INSERT INTO majors (name, code, parent_id) VALUES ('Software Engineering', '6B06103', (SELECT id FROM majors WHERE name = 'Информационные технологии'));
