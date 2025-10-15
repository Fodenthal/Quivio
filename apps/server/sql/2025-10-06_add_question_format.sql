-- Add format metadata to stored questions so clients can render LaTeX/markdown safely

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_format TEXT NOT NULL DEFAULT 'plain';

-- Ensure existing rows get normalized default value
UPDATE public.questions
SET question_format = COALESCE(NULLIF(question_format, ''), 'plain');

