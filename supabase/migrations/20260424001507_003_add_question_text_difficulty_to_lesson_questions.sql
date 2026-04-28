/*
  # Add question_text and difficulty to lesson_questions

  1. Changes to lesson_questions
    - `question_text` (text) — free-text description the teacher writes, e.g. "What is ½ × ¾?"
    - `difficulty` (text, default 'beginner') — per-question difficulty level

  2. Notes
    - Both columns are added safely with IF NOT EXISTS checks
    - Existing rows get sensible defaults (empty string and 'beginner')
    - No data is destroyed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_questions' AND column_name = 'question_text'
  ) THEN
    ALTER TABLE lesson_questions ADD COLUMN question_text text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_questions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE lesson_questions ADD COLUMN difficulty text NOT NULL DEFAULT 'beginner';
  END IF;
END $$;
