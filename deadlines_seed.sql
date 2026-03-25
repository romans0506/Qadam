-- Seed university deadlines
-- Run this in Supabase SQL Editor

INSERT INTO university_deadlines (university_id, type, date, description) VALUES

-- MIT
((SELECT id FROM universities WHERE name = 'Massachusetts Institute of Technology'), 'Early Action', '2025-11-01', 'Ранняя подача — результаты в декабре'),
((SELECT id FROM universities WHERE name = 'Massachusetts Institute of Technology'), 'Regular Decision', '2026-01-01', 'Основной дедлайн — результаты в марте'),

-- Harvard
((SELECT id FROM universities WHERE name = 'Harvard University'), 'Restrictive Early Action', '2025-11-01', 'Ранняя подача — результаты в середине декабря'),
((SELECT id FROM universities WHERE name = 'Harvard University'), 'Regular Decision', '2026-01-01', 'Основной дедлайн — результаты в конце марта'),

-- Stanford
((SELECT id FROM universities WHERE name = 'Stanford University'), 'Restrictive Early Action', '2025-11-01', 'Ранняя подача — результаты в декабре'),
((SELECT id FROM universities WHERE name = 'Stanford University'), 'Regular Decision', '2026-01-02', 'Основной дедлайн — результаты в апреле'),

-- Columbia
((SELECT id FROM universities WHERE name = 'Columbia University'), 'Early Decision I', '2025-11-01', 'Обязывающая ранняя подача'),
((SELECT id FROM universities WHERE name = 'Columbia University'), 'Early Decision II', '2026-01-01', 'Вторая волна Early Decision'),
((SELECT id FROM universities WHERE name = 'Columbia University'), 'Regular Decision', '2026-01-01', 'Основной дедлайн'),

-- Cambridge
((SELECT id FROM universities WHERE name = 'University of Cambridge'), 'UCAS Deadline', '2025-10-15', 'Единый дедлайн для Кембриджа через UCAS'),

-- Oxford
((SELECT id FROM universities WHERE name = 'University of Oxford'), 'UCAS Deadline', '2025-10-15', 'Единый дедлайн для Оксфорда через UCAS'),

-- Imperial College London
((SELECT id FROM universities WHERE name = 'Imperial College London'), 'UCAS Deadline', '2026-01-29', 'Дедлайн подачи через UCAS'),

-- UCL
((SELECT id FROM universities WHERE name = 'University College London'), 'UCAS Deadline', '2026-01-29', 'Дедлайн подачи через UCAS'),

-- TU Munich
((SELECT id FROM universities WHERE name = 'Technical University of Munich'), 'Зимний семестр', '2025-10-31', 'Дедлайн для зимнего семестра 2025/26'),
((SELECT id FROM universities WHERE name = 'Technical University of Munich'), 'Летний семестр', '2026-04-30', 'Дедлайн для летнего семестра 2026'),

-- TU Delft
((SELECT id FROM universities WHERE name = 'Delft University of Technology'), 'Application Deadline', '2026-01-15', 'Дедлайн для международных студентов'),

-- University of Amsterdam
((SELECT id FROM universities WHERE name = 'University of Amsterdam'), 'Application Deadline', '2026-04-01', 'Дедлайн для международных студентов'),

-- Charles University
((SELECT id FROM universities WHERE name = 'Charles University'), 'Application Deadline', '2026-02-28', 'Дедлайн для международных абитуриентов'),

-- Heidelberg University
((SELECT id FROM universities WHERE name = 'Heidelberg University'), 'Summer Semester', '2026-01-15', 'Дедлайн для летнего семестра 2026'),
((SELECT id FROM universities WHERE name = 'Heidelberg University'), 'Winter Semester', '2026-07-15', 'Дедлайн для зимнего семестра 2026/27'),

-- Nazarbayev University
((SELECT id FROM universities WHERE name = 'Назарбаев Университет'), 'Стипендиальный дедлайн', '2026-01-15', 'Подача на грантовое место — ранний дедлайн'),
((SELECT id FROM universities WHERE name = 'Назарбаев Университет'), 'Основной дедлайн', '2026-03-31', 'Финальный дедлайн подачи документов'),

-- КИМЭП
((SELECT id FROM universities WHERE name = 'КИМЭП'), 'Ранняя подача', '2026-02-28', 'Повышенные шансы на грант'),
((SELECT id FROM universities WHERE name = 'КИМЭП'), 'Основной дедлайн', '2026-04-30', 'Финальный дедлайн подачи'),

-- ЕНУ им. Гумилева
((SELECT id FROM universities WHERE name = 'ЕНУ им. Гумилева'), 'Подача документов (ЕНТ)', '2026-07-15', 'После публикации результатов ЕНТ'),

-- КазНУ им. Аль-Фараби
((SELECT id FROM universities WHERE name ILIKE '%Аль-Фараби%' LIMIT 1), 'Подача документов (ЕНТ)', '2026-07-15', 'После публикации результатов ЕНТ'),

-- МУИТ
((SELECT id FROM universities WHERE name = 'МУИТ'), 'Основной дедлайн', '2026-06-30', 'Дедлайн подачи документов'),

-- КБТУ
((SELECT id FROM universities WHERE name = 'КБТУ'), 'Основной дедлайн', '2026-06-30', 'Дедлайн подачи документов'),

-- АТУ
((SELECT id FROM universities WHERE name = 'АТУ'), 'Подача документов (ЕНТ)', '2026-07-15', 'После публикации результатов ЕНТ'),

-- КарТУ
((SELECT id FROM universities WHERE name = 'КарТУ'), 'Подача документов (ЕНТ)', '2026-07-15', 'После публикации результатов ЕНТ');
