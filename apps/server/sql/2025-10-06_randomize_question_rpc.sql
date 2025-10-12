-- Randomize question ordering within usage buckets for tag-based search

CREATE OR REPLACE FUNCTION public.search_questions_by_tags(
  tag_slugs        TEXT[],
  require_all      BOOLEAN DEFAULT FALSE,
  include_descendants BOOLEAN DEFAULT FALSE,
  limit_count      INTEGER DEFAULT 10
)
RETURNS SETOF public.questions
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  input_slugs   TEXT[];
  base_tag_ids  BIGINT[];
  tag_ids       BIGINT[];
  base_count    INTEGER := 0;
BEGIN
  IF tag_slugs IS NULL OR array_length(tag_slugs, 1) IS NULL OR array_length(tag_slugs, 1) = 0 THEN
    RETURN QUERY
      SELECT q.* FROM public.questions q
      ORDER BY q.used_count ASC, random()
      LIMIT GREATEST(1, limit_count);
    RETURN;
  END IF;

  -- Normalize all inputs to canonical slug form once
  SELECT array_agg(DISTINCT public.slugify(s))
  INTO input_slugs
  FROM unnest(tag_slugs) AS t(s)
  WHERE s IS NOT NULL AND length(btrim(s)) > 0;

  IF input_slugs IS NULL OR array_length(input_slugs, 1) IS NULL THEN
    RETURN; -- nothing to match
  END IF;

  -- Resolve tag ids via canonical slugs and aliases
  WITH base AS (
    SELECT t.id
    FROM public.tags t
    WHERE t.slug = ANY(input_slugs)
    UNION
    SELECT a.tag_id
    FROM public.tag_aliases a
    WHERE a.alias_slug = ANY(input_slugs)
  )
  SELECT array_agg(id), COUNT(*)
  INTO base_tag_ids, base_count
  FROM (SELECT DISTINCT id FROM base) x;

  IF base_tag_ids IS NULL OR base_count = 0 THEN
    RETURN; -- nothing resolved
  END IF;

  IF include_descendants THEN
    WITH RECURSIVE expanded AS (
      SELECT unnest(base_tag_ids) AS id
      UNION ALL
      SELECT t.id
      FROM public.tags t
      JOIN expanded e ON t.parent_tag_id = e.id
    )
    SELECT array_agg(DISTINCT id)
    INTO tag_ids
    FROM expanded;
  ELSE
    tag_ids := base_tag_ids;
  END IF;

  RETURN QUERY
  WITH matched AS (
    SELECT qt.question_id, COUNT(DISTINCT qt.tag_id) AS matched_count
    FROM public.question_tags qt
    WHERE qt.tag_id = ANY(tag_ids)
    GROUP BY qt.question_id
  )
  SELECT q.*
  FROM public.questions q
  JOIN matched m ON m.question_id = q.id
  WHERE (require_all AND m.matched_count >= base_count)
     OR (NOT require_all AND m.matched_count >= 1)
  ORDER BY q.used_count ASC, random()
  LIMIT GREATEST(1, limit_count);
END;
$$;

