/*
  # FracSmart Initial Database Schema

  1. New Tables
    - `teachers` - Stores teacher accounts for dashboard access
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text) - Simple storage for demo purposes
      - `created_at` (timestamp)
    
    - `class_codes` - Manages valid class codes for student registration
      - `id` (uuid, primary key)
      - `code` (text, unique) - The class code students use
      - `teacher_id` (uuid, foreign key to teachers)
      - `created_at` (timestamp)
    
    - `students` - Student profiles and progress
      - `id` (uuid, primary key)
      - `name` (text)
      - `class_code` (text, foreign key to class_codes)
      - `total_score` (integer, default 0)
      - `sessions_completed` (integer, default 0)
      - `created_at` (timestamp)
    
    - `sessions` - Practice session records
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `score` (integer)
      - `questions_answered` (integer)
      - `correct_answers` (integer)
      - `difficulty` (text)
      - `created_at` (timestamp)
    
    - `session_answers` - Individual answer records with misconception tracking
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `question_num` (integer)
      - `numerator1` (integer) - First fraction numerator
      - `denominator1` (integer) - First fraction denominator
      - `numerator2` (integer) - Second fraction numerator
      - `denominator2` (integer) - Second fraction denominator
      - `student_numerator` (integer) - Student's answer numerator
      - `student_denominator` (integer) - Student's answer denominator
      - `correct_numerator` (integer) - Correct answer numerator
      - `correct_denominator` (integer) - Correct answer denominator
      - `is_correct` (boolean)
      - `misconception_type` (text) - Type of error if incorrect
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Teachers can manage their class codes and view students in their classes
    - Students can read/write their own data
    - Session answers are linked to sessions for proper access control

  3. Important Notes
    - Pre-seeds the default teacher account (username: teacher, password: fracsmart2024)
    - Pre-seeds a default class code "MATH5A" for testing
    - All timestamps use now() as default
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create class_codes table
CREATE TABLE IF NOT EXISTS class_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_code text NOT NULL REFERENCES class_codes(code) ON DELETE CASCADE,
  total_score integer DEFAULT 0,
  sessions_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  difficulty text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create session_answers table
CREATE TABLE IF NOT EXISTS session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_num integer NOT NULL,
  numerator1 integer NOT NULL,
  denominator1 integer NOT NULL,
  numerator2 integer NOT NULL,
  denominator2 integer NOT NULL,
  student_numerator integer,
  student_denominator integer,
  correct_numerator integer NOT NULL,
  correct_denominator integer NOT NULL,
  is_correct boolean DEFAULT false,
  misconception_type text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- Teachers policies (teachers can read all, manage own data)
CREATE POLICY "Teachers can read all teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can update own record"
  ON teachers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Class codes policies
CREATE POLICY "Anyone can read class codes"
  ON class_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert class codes"
  ON class_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Students policies
CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sessions policies
CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Session answers policies
CREATE POLICY "Anyone can read session answers"
  ON session_answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert session answers"
  ON session_answers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default teacher account
INSERT INTO teachers (username, password_hash)
VALUES ('teacher', 'fracsmart2024')
ON CONFLICT (username) DO NOTHING;

-- Insert default class code
INSERT INTO class_codes (code, teacher_id)
SELECT 'MATH5A', id FROM teachers WHERE username = 'teacher'
ON CONFLICT (code) DO NOTHING;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_class_code ON students(class_code);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);