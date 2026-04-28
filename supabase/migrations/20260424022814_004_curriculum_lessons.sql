/*
  # Create curriculum_lessons table

  ## Summary
  Stores editable text content for the 4 built-in curriculum lessons shown on the Student Learn page.
  Teachers can update lesson text via the Teacher Dashboard; the Student Learn page reads from this table.

  ## New Tables
  - `curriculum_lessons`
    - `id` (text, primary key) — matches module id: 'basics', 'area-model', 'examples', 'mistakes'
    - `lesson_number` (integer) — display order 1-4
    - `title` (text) — card subtitle shown in the accordion header
    - `content_json` (jsonb) — all editable text fields for the lesson, structure varies per lesson
    - `updated_at` (timestamptz) — last edit timestamp

  ## Security
  - RLS enabled
  - Anon can SELECT (students read lessons without auth)
  - Authenticated users can SELECT and UPDATE (teachers edit)
  - No INSERT/DELETE from client (rows are seeded via migration)
*/

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id text PRIMARY KEY,
  lesson_number integer NOT NULL,
  title text NOT NULL DEFAULT '',
  content_json jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE curriculum_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read curriculum lessons"
  ON curriculum_lessons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update curriculum lessons"
  ON curriculum_lessons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the 4 default lessons
INSERT INTO curriculum_lessons (id, lesson_number, title, content_json) VALUES
(
  'basics',
  1,
  'What is Fraction Multiplication?',
  '{
    "sectionTitle": "The Golden Rule",
    "introParagraph": "When we multiply two fractions, we follow a simple pattern:",
    "exampleTitle": "Let''s See an Example",
    "rememberTitle": "Remember",
    "bullets": [
      "Multiply the numerators (top numbers) together",
      "Multiply the denominators (bottom numbers) together",
      "Simplify if possible"
    ]
  }'::jsonb
),
(
  'area-model',
  2,
  'Area Model Visuals',
  '{
    "sectionTitle": "What is an Area Model?",
    "introParagraph": "An area model helps us SEE fraction multiplication! We draw a rectangle and shade parts of it.",
    "howToTitle": "How to Read the Area Model",
    "lightBlueLabel": "Light Blue Areas",
    "lightBlueDesc": "Show each fraction separately",
    "yellowLabel": "Yellow Area (Overlap)",
    "yellowDesc": "Shows the answer! This is where both fractions meet.",
    "tryTitle": "Try Another Example"
  }'::jsonb
),
(
  'examples',
  3,
  'Worked Examples',
  '{
    "example1Title": "Example 1: Amirah''s Pizza",
    "example1Para": "Amirah has a pizza. She eats ½ of it. Then she gives ⅓ of what''s left to her brother. What fraction did her brother get?",
    "example1Steps": [
      "We need to multiply: ¹⁄₂ × ¹⁄₃",
      "Multiply the tops: 1 × 1 = 1",
      "Multiply the bottoms: 2 × 3 = 6",
      "The answer is ¹⁄₆ of the original pizza!"
    ],
    "example2Title": "Example 2: Hafiz''s Nasi Lemak",
    "example2Para": "Hafiz bought nasi lemak. He ate ⅔ of it. Then he shared ½ of the remaining portion with Siti. How much did Siti get?",
    "example2Steps": [
      "We need to multiply: ²⁄₃ × ¹⁄₂",
      "Multiply the tops: 2 × 1 = 2",
      "Multiply the bottoms: 3 × 2 = 6",
      "The answer is ²⁄₆, which simplifies to ¹⁄₃!"
    ],
    "example3Title": "Example 3: Siti''s Cookies",
    "example3Para": "Siti baked cookies. She gave ¾ to her friends. Then she gave ⅔ of the remaining cookies to her teacher. What fraction of the original cookies did the teacher receive?",
    "example3Steps": [
      "We need to multiply: ³⁄₄ × ²⁄₃",
      "Multiply the tops: 3 × 2 = 6",
      "Multiply the bottoms: 4 × 3 = 12",
      "The answer is ⁶⁄₁₂, which simplifies to ¹⁄₂!"
    ]
  }'::jsonb
),
(
  'mistakes',
  4,
  'Common Mistakes to Avoid',
  '{
    "mistake1Title": "Mistake 1: Adding Instead of Multiplying",
    "mistake2Title": "Mistake 2: Only Multiplying Denominators",
    "mistake3Title": "Mistake 3: Only Multiplying Numerators",
    "mistake4Title": "Mistake 4: Forgetting to Simplify",
    "tipsTitle": "Remember These Tips!",
    "tips": [
      "Always MULTIPLY both tops and bottoms — never add them!",
      "Check if your answer can be simplified by dividing both numbers by the same value",
      "Use the area model to visualize and check your work"
    ]
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
