-- Populate params_hash and content_hash for legacy records to enable uniqueness constraints

WITH computed AS (
  SELECT
    id,
    CASE
      WHEN param_values IS NOT NULL THEN md5(coalesce(template_id, '') || '::' || param_values::text)
      ELSE NULL
    END AS new_params_hash,
    md5(
      concat_ws(
        '||',
        coalesce(lower(regexp_replace(question, '\s+', ' ', 'g')), ''),
        coalesce(lower(regexp_replace(correct_answer, '\s+', ' ', 'g')), ''),
        coalesce(lower(regexp_replace(acceptable_answers::text, '\s+', ' ', 'g')), '')
      )
    ) AS new_content_hash
  FROM public.questions
)
UPDATE public.questions q
SET
  params_hash = CASE
    WHEN q.params_hash IS NULL AND computed.new_params_hash IS NOT NULL THEN computed.new_params_hash
    ELSE q.params_hash
  END,
  content_hash = CASE
    WHEN q.content_hash IS NULL AND computed.new_content_hash IS NOT NULL THEN computed.new_content_hash
    ELSE q.content_hash
  END
FROM computed
WHERE computed.id = q.id;

WITH computed AS (
  SELECT
    id,
    CASE
      WHEN param_values IS NOT NULL THEN md5(coalesce(template_id, '') || '::' || param_values::text)
      ELSE NULL
    END AS new_params_hash,
    md5(
      concat_ws(
        '||',
        coalesce(lower(regexp_replace(question, '\s+', ' ', 'g')), ''),
        coalesce(lower(regexp_replace(correct_answer, '\s+', ' ', 'g')), ''),
        coalesce(lower(regexp_replace(acceptable_answers::text, '\s+', ' ', 'g')), '')
      )
    ) AS new_content_hash
  FROM public.questions_staging
)
UPDATE public.questions_staging qs
SET
  params_hash = CASE
    WHEN qs.params_hash IS NULL AND computed.new_params_hash IS NOT NULL THEN computed.new_params_hash
    ELSE qs.params_hash
  END,
  content_hash = CASE
    WHEN qs.content_hash IS NULL AND computed.new_content_hash IS NOT NULL THEN computed.new_content_hash
    ELSE qs.content_hash
  END
FROM computed
WHERE computed.id = qs.id;
