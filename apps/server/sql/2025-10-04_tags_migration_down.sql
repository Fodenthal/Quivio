-- Rollback for 2025-10-04_tags_migration
-- Drops RPC, triggers, helper functions, and tables created by the up migration

-- Drop trigger on questions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'trg_questions_topic_to_tags' AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER trg_questions_topic_to_tags ON public.questions;
  END IF;
END $$;

-- Drop RPC function if exists
DROP FUNCTION IF EXISTS public.search_questions_by_tags(text[], boolean, boolean, integer);

-- Drop helper functions if desired (comment out if you want to keep)
DROP FUNCTION IF EXISTS public.questions_topic_to_tag_join();
DROP FUNCTION IF EXISTS public.get_or_create_tag_for_topic(text);
DROP FUNCTION IF EXISTS public.slugify(text);
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop join table and tag tables
DROP TABLE IF EXISTS public.question_tags;
DROP TABLE IF EXISTS public.tag_aliases;
DROP TABLE IF EXISTS public.tags;

