-- Add per-question round time metadata to question storage

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS round_time_ms INTEGER;

ALTER TABLE public.questions_staging
  ADD COLUMN IF NOT EXISTS round_time_ms INTEGER;

COMMENT ON COLUMN public.questions.round_time_ms IS 'Optional round duration (milliseconds) specific to this question';
COMMENT ON COLUMN public.questions_staging.round_time_ms IS 'Optional round duration (milliseconds) specific to this question submission';

