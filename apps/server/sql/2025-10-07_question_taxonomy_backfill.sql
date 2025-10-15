-- Backfill taxonomy metadata for legacy questions so new uniqueness constraints are safe

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(difficulty, 0) <= 1 THEN 'D1'
      WHEN difficulty = 2 THEN 'D2'
      WHEN difficulty = 3 THEN 'D3'
      WHEN difficulty = 4 THEN 'D4'
      WHEN difficulty >= 5 THEN 'D5'
      ELSE 'D3'
    END AS band
  FROM public.questions
)
UPDATE public.questions q
SET
  family_id = COALESCE(NULLIF(q.family_id, ''), 'legacy.manual'),
  difficulty_band = COALESCE(NULLIF(q.difficulty_band, ''), n.band),
  generation_source = COALESCE(NULLIF(q.generation_source, ''), 'legacy.unknown')
FROM normalized n
WHERE q.id = n.id;

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(difficulty, 0) <= 1 THEN 'D1'
      WHEN difficulty = 2 THEN 'D2'
      WHEN difficulty = 3 THEN 'D3'
      WHEN difficulty = 4 THEN 'D4'
      WHEN difficulty >= 5 THEN 'D5'
      ELSE 'D3'
    END AS band
  FROM public.questions_staging
)
UPDATE public.questions_staging qs
SET
  family_id = COALESCE(NULLIF(qs.family_id, ''), 'legacy.manual'),
  difficulty_band = COALESCE(NULLIF(qs.difficulty_band, ''), n.band),
  generation_source = COALESCE(NULLIF(qs.generation_source, ''), 'legacy.staging')
FROM normalized n
WHERE qs.id = n.id;
