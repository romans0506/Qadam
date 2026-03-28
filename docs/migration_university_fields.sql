-- ============================================================
-- Migration: Add extended university info fields
-- Run this in Supabase SQL Editor
-- ============================================================

-- Logo URL (отдельно от фото-героя)
ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Format campus (Urban / Suburban / Rural / etc.)
ALTER TABLE universities ADD COLUMN IF NOT EXISTS campus_format TEXT;

-- Об университете
ALTER TABLE universities ADD COLUMN IF NOT EXISTS key_features TEXT;

-- Инфраструктура (массив строк)
ALTER TABLE universities ADD COLUMN IF NOT EXISTS infrastructure JSONB;

-- Стоимость
ALTER TABLE universities ADD COLUMN IF NOT EXISTS tuition_usd INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS housing_usd INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS total_cost_note TEXT;

-- Требования (бакалавриат)
ALTER TABLE universities ADD COLUMN IF NOT EXISTS gpa_min NUMERIC(4,2);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS sat_min INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS act_min INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS ent_min INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS ielts_min NUMERIC(3,1);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS toefl_min INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS documents_required JSONB;

-- Бакалавриат параметры
ALTER TABLE universities ADD COLUMN IF NOT EXISTS degree_language TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS degree_duration INTEGER;

-- Конкурентность
ALTER TABLE universities ADD COLUMN IF NOT EXISTS acceptance_rate NUMERIC(5,2);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS selection_criteria TEXT;

-- Социальные сети
ALTER TABLE universities ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS social_x TEXT;

-- ============================================================
-- Пример заполнения данных для одного университета:
-- ============================================================
/*
UPDATE universities SET
  logo_url           = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/120px-MIT_logo.svg.png',
  campus_format      = 'Urban',
  key_features       = 'Один из ведущих технологических университетов мира с сильнейшими программами по инженерии, CS и предпринимательству.',
  infrastructure     = '["Городской кампус в Кембридже", "500+ студенческих клубов и организаций", "Гарантированное жильё для первокурсников", "Карьерный центр с выходом на топ-500 компаний", "17 исследовательских лабораторий мирового уровня", "Спортивные площадки и фитнес-центр"]'::jsonb,
  tuition_usd        = 57986,
  housing_usd        = 17960,
  total_cost_note    = 'Данные за 2024-25 учебный год. Включает питание и базовые сборы.',
  gpa_min            = 3.9,
  act_min            = 35,
  ielts_min          = 7.0,
  toefl_min          = 100,
  documents_required = '["Транскрипты (аттестат / диплом)", "2-3 рекомендательных письма", "Common App Essay (650 слов)", "SAT / ACT результаты", "IELTS / TOEFL сертификат"]'::jsonb,
  degree_language    = 'English',
  degree_duration    = 4,
  acceptance_rate    = 3.9,
  selection_criteria = 'Академические достижения, оригинальность мышления, исследовательский опыт, внеклассная активность, мотивационное эссе.',
  social_instagram   = 'https://instagram.com/mitpics',
  social_youtube     = 'https://youtube.com/@MIT',
  social_linkedin    = 'https://linkedin.com/school/mit',
  social_x           = 'https://x.com/mit'
WHERE name ILIKE '%Massachusetts Institute%' OR name ILIKE '%MIT%';
*/
