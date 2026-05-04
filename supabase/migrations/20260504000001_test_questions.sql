/*
  # Pre/Post Test Questions, Sessions, and Answers

  1. New Tables
    - `test_questions` - Stores the 8 real pre/post test questions
    - `test_sessions` - Records each student test attempt (pre or post)
    - `test_answers`  - Individual answer records per question per session

  2. Security
    - RLS enabled on all tables
    - Public read access on active test_questions
    - Insert/select for test_sessions and test_answers (anon access)

  3. Seed Data
    - 8 real questions covering: fraction × whole, mixed × whole, fraction × fraction,
      fraction × mixed, and mixed × mixed multiplication
*/

-- ─── test_questions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_questions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order            INTEGER NOT NULL,
  -- What the student sees (display form)
  display1_whole        INTEGER NOT NULL DEFAULT 0,
  display1_numerator    INTEGER NOT NULL DEFAULT 0,
  display1_denominator  INTEGER NOT NULL DEFAULT 1,
  display2_whole        INTEGER NOT NULL DEFAULT 0,
  display2_numerator    INTEGER NOT NULL DEFAULT 0,
  display2_denominator  INTEGER NOT NULL DEFAULT 1,
  -- Improper fraction form used for calculation
  fraction1_numerator   INTEGER NOT NULL,
  fraction1_denominator INTEGER NOT NULL,
  fraction2_numerator   INTEGER NOT NULL,
  fraction2_denominator INTEGER NOT NULL,
  -- Correct answer as fully simplified improper fraction
  correct_numerator     INTEGER NOT NULL,
  correct_denominator   INTEGER NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active test questions"
  ON test_questions FOR SELECT
  USING (is_active = TRUE);

-- ─── test_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_type        TEXT NOT NULL CHECK (test_type IN ('pre', 'post')),
  score            INTEGER NOT NULL DEFAULT 0,
  total_questions  INTEGER NOT NULL DEFAULT 8,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert test sessions"
  ON test_sessions FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read test sessions"
  ON test_sessions FOR SELECT USING (TRUE);

-- ─── test_answers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id         UUID REFERENCES test_questions(id),
  question_num        INTEGER NOT NULL,
  student_numerator   INTEGER,
  student_denominator INTEGER,
  is_correct          BOOLEAN NOT NULL,
  misconception_type  TEXT,
  time_taken_ms       INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert test answers"
  ON test_answers FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read test answers"
  ON test_answers FOR SELECT USING (TRUE);

-- ─── Seed 8 real questions ────────────────────────────────────────────────────
-- Columns: sort_order,
--   display1_whole, display1_numerator, display1_denominator,
--   display2_whole, display2_numerator, display2_denominator,
--   fraction1_numerator, fraction1_denominator,
--   fraction2_numerator, fraction2_denominator,
--   correct_numerator, correct_denominator

INSERT INTO test_questions (
  sort_order,
  display1_whole, display1_numerator, display1_denominator,
  display2_whole, display2_numerator, display2_denominator,
  fraction1_numerator, fraction1_denominator,
  fraction2_numerator, fraction2_denominator,
  correct_numerator, correct_denominator
) VALUES
  -- Q1: 2/9 × 45 = 10
  (1,  0, 2, 9,   45, 0, 1,   2, 9,   45, 1,   10,  1),
  -- Q2: 6 2/7 × 63 = 396  (6 2/7 = 44/7; 44×63/7 = 396)
  (2,  6, 2, 7,   63, 0, 1,   44, 7,  63, 1,   396, 1),
  -- Q3: 1/4 × 3/4 = 3/16
  (3,  0, 1, 4,    0, 3, 4,    1, 4,   3, 4,    3, 16),
  -- Q4: 4/5 × 5/8 = 1/2   (20/40 simplified)
  (4,  0, 4, 5,    0, 5, 8,    4, 5,   5, 8,    1,  2),
  -- Q5: 8/9 × 1/4 = 2/9   (8/36 simplified)
  (5,  0, 8, 9,    0, 1, 4,    8, 9,   1, 4,    2,  9),
  -- Q6: 5/6 × 1 1/3 = 10/9  (1 1/3 = 4/3; 20/18 simplified)
  (6,  0, 5, 6,    1, 1, 3,    5, 6,   4, 3,   10,  9),
  -- Q7: 1 3/8 × 2 7/8 = 253/64  (11/8 × 23/8)
  (7,  1, 3, 8,    2, 7, 8,   11, 8,  23, 8,  253, 64),
  -- Q8: 4 3/7 × 1 7/10 = 527/70  (31/7 × 17/10)
  (8,  4, 3, 7,    1, 7, 10,  31, 7,  17, 10, 527, 70);
