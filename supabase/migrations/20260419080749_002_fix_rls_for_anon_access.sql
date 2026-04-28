/*
  # Fix RLS Policies for Anonymous Access

  The app uses a custom authentication system (not Supabase Auth), so all
  requests come through the anon key without a Supabase Auth session.
  
  This migration drops the existing policies that require 'authenticated' role
  and replaces them with policies that also permit the 'anon' role, which is
  what the frontend client uses for all requests.

  ## Changes
  - Drop all existing policies on teachers, class_codes, students, sessions, session_answers
  - Re-create equivalent policies targeting both 'anon' and 'authenticated' roles
*/

-- Drop existing policies on teachers
DROP POLICY IF EXISTS "Teachers can read all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own record" ON teachers;

-- Drop existing policies on class_codes
DROP POLICY IF EXISTS "Anyone can read class codes" ON class_codes;
DROP POLICY IF EXISTS "Teachers can insert class codes" ON class_codes;

-- Drop existing policies on students
DROP POLICY IF EXISTS "Anyone can read students" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;
DROP POLICY IF EXISTS "Anyone can update students" ON students;

-- Drop existing policies on sessions
DROP POLICY IF EXISTS "Anyone can read sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON sessions;

-- Drop existing policies on session_answers
DROP POLICY IF EXISTS "Anyone can read session answers" ON session_answers;
DROP POLICY IF EXISTS "Anyone can insert session answers" ON session_answers;

-- Re-create policies for teachers (anon + authenticated)
CREATE POLICY "Allow read on teachers"
  ON teachers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow update on teachers"
  ON teachers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Re-create policies for class_codes
CREATE POLICY "Allow read on class_codes"
  ON class_codes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on class_codes"
  ON class_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Re-create policies for students
CREATE POLICY "Allow read on students"
  ON students FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on students"
  ON students FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update on students"
  ON students FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Re-create policies for sessions
CREATE POLICY "Allow read on sessions"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on sessions"
  ON sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update on sessions"
  ON sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Re-create policies for session_answers
CREATE POLICY "Allow read on session_answers"
  ON session_answers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert on session_answers"
  ON session_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);