/*
  # Question Management Schema

  Creates the `lessons` table and adapts existing `lesson_questions` /
  `practice_questions` tables to the schema used by this app.

  ## New Tables
  - `lessons` — teacher-created lesson containers per class/difficulty
    - id, teacher_id, class_code, title, description, difficulty,
      sort_order, is_active, created_at

  ## Modified Tables
  - `lesson_questions` — add `sort_order` column, keep existing columns
  - `practice_questions` — add `class_code`, `teacher_id`, `is_active`,
      `sort_order` columns

  ## Security
  - RLS enabled; anon + authenticated full CRUD (matches existing pattern)
*/

-- ── lessons ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_code  text NOT NULL REFERENCES class_codes(code) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  difficulty  text NOT NULL DEFAULT 'beginner',
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on lessons"
  ON lessons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on lessons"
  ON lessons FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on lessons"
  ON lessons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on lessons"
  ON lessons FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_lessons_class_code
  ON lessons(class_code, sort_order);

-- ── lesson_questions: add sort_order column ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_questions' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE lesson_questions ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Enable RLS + policies on lesson_questions if not already set
ALTER TABLE lesson_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_questions' AND policyname = 'Allow select on lesson_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow select on lesson_questions"
      ON lesson_questions FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_questions' AND policyname = 'Allow insert on lesson_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow insert on lesson_questions"
      ON lesson_questions FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_questions' AND policyname = 'Allow update on lesson_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow update on lesson_questions"
      ON lesson_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lesson_questions' AND policyname = 'Allow delete on lesson_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow delete on lesson_questions"
      ON lesson_questions FOR DELETE TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson_id
  ON lesson_questions(lesson_id, sort_order);

-- ── practice_questions: add missing columns ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_questions' AND column_name = 'class_code'
  ) THEN
    ALTER TABLE practice_questions ADD COLUMN class_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_questions' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE practice_questions ADD COLUMN teacher_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_questions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE practice_questions ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_questions' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE practice_questions ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'practice_questions' AND policyname = 'Allow select on practice_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow select on practice_questions"
      ON practice_questions FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'practice_questions' AND policyname = 'Allow insert on practice_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow insert on practice_questions"
      ON practice_questions FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'practice_questions' AND policyname = 'Allow update on practice_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow update on practice_questions"
      ON practice_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'practice_questions' AND policyname = 'Allow delete on practice_questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow delete on practice_questions"
      ON practice_questions FOR DELETE TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_practice_questions_class_difficulty
  ON practice_questions(class_code, difficulty);
