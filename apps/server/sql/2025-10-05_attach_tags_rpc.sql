-- RPC to attach multiple tags to a question by id.
-- Resolves input strings as slugs and aliases, creating tags when missing.

-- Reuse slugify helper from previous migration; ensure it exists.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT AS $$
DECLARE
  s TEXT;
BEGIN
  s := lower(trim(input));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '-{2,}', '-', 'g');
  s := trim(both '-' from s);
  IF s IS NULL OR length(s) = 0 THEN
    RETURN NULL;
  END IF;
  RETURN s;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper to get/create a tag by an incoming label/slug, considering aliases
CREATE OR REPLACE FUNCTION public.resolve_or_create_tag(label TEXT)
RETURNS BIGINT AS $$
DECLARE
  v_slug TEXT;
  v_tag_id BIGINT;
BEGIN
  IF label IS NULL OR length(btrim(label)) = 0 THEN
    RETURN NULL;
  END IF;

  v_slug := public.slugify(label);
  IF v_slug IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try canonical slug
  SELECT id INTO v_tag_id FROM public.tags WHERE slug = v_slug;
  IF v_tag_id IS NOT NULL THEN
    RETURN v_tag_id;
  END IF;

  -- Try alias
  SELECT tag_id INTO v_tag_id FROM public.tag_aliases WHERE alias_slug = v_slug;
  IF v_tag_id IS NOT NULL THEN
    RETURN v_tag_id;
  END IF;

  -- Create new canonical tag
  INSERT INTO public.tags(slug, display_name, kind)
  VALUES (v_slug::citext, trim(label), 'topic')
  ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name
  RETURNING id INTO v_tag_id;

  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- Main RPC: attach tags to a question
-- Returns the list of attached tags after operation
CREATE OR REPLACE FUNCTION public.attach_tags_to_question(
  question_id BIGINT,
  tag_slugs TEXT[]
)
RETURNS TABLE(tag_id BIGINT, slug CITEXT, display_name TEXT) AS $$
DECLARE
  v_tag_id BIGINT;
  v_label TEXT;
BEGIN
  IF question_id IS NULL THEN
    RAISE EXCEPTION 'question_id is required';
  END IF;
  IF tag_slugs IS NULL OR array_length(tag_slugs, 1) IS NULL OR array_length(tag_slugs, 1) = 0 THEN
    RETURN QUERY
    SELECT t.id, t.slug, t.display_name
    FROM public.question_tags qt
    JOIN public.tags t ON t.id = qt.tag_id
    WHERE qt.question_id = attach_tags_to_question.question_id;
    RETURN;
  END IF;

  FOREACH v_label IN ARRAY tag_slugs LOOP
    v_tag_id := public.resolve_or_create_tag(v_label);
    IF v_tag_id IS NOT NULL THEN
      INSERT INTO public.question_tags(question_id, tag_id)
      VALUES (question_id, v_tag_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN QUERY
  SELECT t.id, t.slug, t.display_name
  FROM public.question_tags qt
  JOIN public.tags t ON t.id = qt.tag_id
  WHERE qt.question_id = attach_tags_to_question.question_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Note: grant execution explicitly based on your security model.
-- Example (uncomment if you want client-side ability):
-- GRANT EXECUTE ON FUNCTION public.attach_tags_to_question(BIGINT, TEXT[]) TO authenticated;

