-- Add taxonomy metadata to questions tables to support structured ingestion and dedupe

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS family_id TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS param_values JSONB,
  ADD COLUMN IF NOT EXISTS params_hash TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_band TEXT,
  ADD COLUMN IF NOT EXISTS generation_source TEXT;

ALTER TABLE public.questions_staging
  ADD COLUMN IF NOT EXISTS family_id TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS param_values JSONB,
  ADD COLUMN IF NOT EXISTS params_hash TEXT,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_band TEXT,
  ADD COLUMN IF NOT EXISTS generation_source TEXT;

COMMENT ON COLUMN public.questions.family_id IS 'Taxonomy family identifier (e.g. dice.sum_exact)';
COMMENT ON COLUMN public.questions.template_id IS 'Specific phrasing template identifier within the family';
COMMENT ON COLUMN public.questions.param_values IS 'JSON payload of sampled parameters for the template';
COMMENT ON COLUMN public.questions.params_hash IS 'Deterministic hash of normalized param_values to ensure uniqueness';
COMMENT ON COLUMN public.questions.content_hash IS 'Deterministic hash of normalized question/answer content';
COMMENT ON COLUMN public.questions.difficulty_band IS 'Canonical difficulty bucket (D1–D5) assigned by taxonomy';
COMMENT ON COLUMN public.questions.generation_source IS 'Source label describing how the question was generated';

COMMENT ON COLUMN public.questions_staging.family_id IS 'Taxonomy family identifier (e.g. dice.sum_exact)';
COMMENT ON COLUMN public.questions_staging.template_id IS 'Specific phrasing template identifier within the family';
COMMENT ON COLUMN public.questions_staging.param_values IS 'JSON payload of sampled parameters for the template';
COMMENT ON COLUMN public.questions_staging.params_hash IS 'Deterministic hash of normalized param_values to ensure uniqueness';
COMMENT ON COLUMN public.questions_staging.content_hash IS 'Deterministic hash of normalized question/answer content';
COMMENT ON COLUMN public.questions_staging.difficulty_band IS 'Canonical difficulty bucket (D1–D5) assigned by taxonomy';
COMMENT ON COLUMN public.questions_staging.generation_source IS 'Source label describing how the question was generated';

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_template_params_unique
  ON public.questions (template_id, params_hash)
  WHERE template_id IS NOT NULL AND params_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_content_hash_unique
  ON public.questions (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_staging_template_params_unique
  ON public.questions_staging (template_id, params_hash)
  WHERE template_id IS NOT NULL AND params_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_staging_content_hash_unique
  ON public.questions_staging (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_family_id
  ON public.questions (family_id);

CREATE INDEX IF NOT EXISTS idx_questions_staging_family_id
  ON public.questions_staging (family_id);
