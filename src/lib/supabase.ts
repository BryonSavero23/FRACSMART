import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Student {
  id: string;
  name: string;
  class_code: string;
  total_score: number;
  sessions_completed: number;
  created_at: string;
}

export interface Session {
  id: string;
  student_id: string;
  score: number;
  questions_answered: number;
  correct_answers: number;
  difficulty: string;
  created_at: string;
}

export interface SessionAnswer {
  id: string;
  session_id: string;
  question_num: number;
  numerator1: number;
  denominator1: number;
  numerator2: number;
  denominator2: number;
  student_numerator: number | null;
  student_denominator: number | null;
  correct_numerator: number;
  correct_denominator: number;
  is_correct: boolean;
  misconception_type: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  username: string;
  created_at: string;
}

export interface ClassCode {
  id: string;
  code: string;
  teacher_id: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  class_code: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface LessonQuestion {
  id: string;
  lesson_id: string;
  lesson_title: string;
  sort_order: number;
  fraction1_numerator: number;
  fraction1_denominator: number;
  fraction2_numerator: number;
  fraction2_denominator: number;
  correct_numerator: number;
  correct_denominator: number;
  hint: string;
  created_by: string | null;
  created_at: string;
}

export interface PracticeQuestion {
  id: string;
  teacher_id: string | null;
  class_code: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sort_order: number;
  fraction1_numerator: number;
  fraction1_denominator: number;
  fraction2_numerator: number;
  fraction2_denominator: number;
  correct_numerator: number;
  correct_denominator: number;
  hint: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}
