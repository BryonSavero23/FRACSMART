export interface QuizQuestion {
  id: number;
  fraction1: { numerator: number; denominator: number };
  fraction2: { numerator: number; denominator: number };
  correctAnswer: { numerator: number; denominator: number };
}

// 8 placeholder questions — swap numerator/denominator values to replace with real questions
export const PRE_TEST_QUESTIONS: QuizQuestion[] = [
  { id: 1, fraction1: { numerator: 1, denominator: 2 }, fraction2: { numerator: 1, denominator: 3 }, correctAnswer: { numerator: 1, denominator: 6 } },
  { id: 2, fraction1: { numerator: 2, denominator: 3 }, fraction2: { numerator: 3, denominator: 4 }, correctAnswer: { numerator: 1, denominator: 2 } },
  { id: 3, fraction1: { numerator: 3, denominator: 5 }, fraction2: { numerator: 2, denominator: 7 }, correctAnswer: { numerator: 6, denominator: 35 } },
  { id: 4, fraction1: { numerator: 4, denominator: 5 }, fraction2: { numerator: 1, denominator: 2 }, correctAnswer: { numerator: 2, denominator: 5 } },
  { id: 5, fraction1: { numerator: 1, denominator: 4 }, fraction2: { numerator: 3, denominator: 5 }, correctAnswer: { numerator: 3, denominator: 20 } },
  { id: 6, fraction1: { numerator: 5, denominator: 6 }, fraction2: { numerator: 2, denominator: 3 }, correctAnswer: { numerator: 5, denominator: 9 } },
  { id: 7, fraction1: { numerator: 3, denominator: 8 }, fraction2: { numerator: 4, denominator: 9 }, correctAnswer: { numerator: 1, denominator: 6 } },
  { id: 8, fraction1: { numerator: 7, denominator: 10 }, fraction2: { numerator: 2, denominator: 5 }, correctAnswer: { numerator: 7, denominator: 25 } },
];

// Post-test presents the same 8 questions in a different order (0-indexed into PRE_TEST_QUESTIONS)
export const POST_TEST_ORDER = [3, 7, 1, 5, 0, 6, 4, 2];
export const POST_TEST_QUESTIONS: QuizQuestion[] = POST_TEST_ORDER.map(i => PRE_TEST_QUESTIONS[i]);
