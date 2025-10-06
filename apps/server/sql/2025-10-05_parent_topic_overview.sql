-- Returns top-level parent topics with child counts and question coverage

CREATE OR REPLACE FUNCTION public.get_parent_topic_overview(limit_count INTEGER DEFAULT 12)
RETURNS TABLE(
  tag_id BIGINT,
  slug CITEXT,
  display_name TEXT,
  child_count INTEGER,
  question_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH parents AS (
    SELECT t.id, t.slug, t.display_name
    FROM public.tags t
    WHERE t.parent_tag_id IS NULL AND t.is_active
    ORDER BY t.display_name ASC
    LIMIT GREATEST(1, limit_count)
  ),
  child_counts AS (
    SELECT parent_tag_id AS parent_id, COUNT(*) AS child_count
    FROM public.tags
    WHERE parent_tag_id IS NOT NULL
    GROUP BY parent_tag_id
  ),
  question_counts AS (
    SELECT p.id AS parent_id, COUNT(DISTINCT qt.question_id) AS question_count
    FROM parents p
    LEFT JOIN LATERAL (
      WITH RECURSIVE descendants AS (
        SELECT t.id
        FROM public.tags t
        WHERE t.id = p.id
        UNION ALL
        SELECT t2.id
        FROM public.tags t2
        JOIN descendants d ON t2.parent_tag_id = d.id
      )
      SELECT qt.question_id
      FROM public.question_tags qt
      JOIN descendants d ON d.id = qt.tag_id
    ) AS linked ON TRUE
    GROUP BY p.id
  )
  SELECT p.id,
         p.slug,
         p.display_name,
         COALESCE(cc.child_count, 0) AS child_count,
         COALESCE(qc.question_count, 0) AS question_count
  FROM parents p
  LEFT JOIN child_counts cc ON cc.parent_id = p.id
  LEFT JOIN question_counts qc ON qc.parent_id = p.id
  ORDER BY question_count DESC, child_count DESC, p.display_name ASC;
END;
$$;

