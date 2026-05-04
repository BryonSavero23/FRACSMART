export interface QuizQuestion {
  id: number;
  // Display form shown to the student (whole = 0 means no whole part)
  display1: { whole: number; numerator: number; denominator: number };
  display2: { whole: number; numerator: number; denominator: number };
  // Improper fraction form used for calculation / misconception detection
  fraction1: { numerator: number; denominator: number };
  fraction2: { numerator: number; denominator: number };
  // Correct answer as fully simplified improper fraction
  correctAnswer: { numerator: number; denominator: number };
}

export const PRE_TEST_QUESTIONS: QuizQuestion[] = [
  // Q1: 2/9 × 45 = 10
  {
    id: 1,
    display1: { whole: 0, numerator: 2, denominator: 9 },
    display2: { whole: 45, numerator: 0, denominator: 1 },
    fraction1: { numerator: 2, denominator: 9 },
    fraction2: { numerator: 45, denominator: 1 },
    correctAnswer: { numerator: 10, denominator: 1 },
  },
  // Q2: 6 2/7 × 63 = 396  (44/7 × 63 = 2772/7 = 396)
  {
    id: 2,
    display1: { whole: 6, numerator: 2, denominator: 7 },
    display2: { whole: 63, numerator: 0, denominator: 1 },
    fraction1: { numerator: 44, denominator: 7 },
    fraction2: { numerator: 63, denominator: 1 },
    correctAnswer: { numerator: 396, denominator: 1 },
  },
  // Q3: 1/4 × 3/4 = 3/16
  {
    id: 3,
    display1: { whole: 0, numerator: 1, denominator: 4 },
    display2: { whole: 0, numerator: 3, denominator: 4 },
    fraction1: { numerator: 1, denominator: 4 },
    fraction2: { numerator: 3, denominator: 4 },
    correctAnswer: { numerator: 3, denominator: 16 },
  },
  // Q4: 4/5 × 5/8 = 1/2  (20/40 simplified)
  {
    id: 4,
    display1: { whole: 0, numerator: 4, denominator: 5 },
    display2: { whole: 0, numerator: 5, denominator: 8 },
    fraction1: { numerator: 4, denominator: 5 },
    fraction2: { numerator: 5, denominator: 8 },
    correctAnswer: { numerator: 1, denominator: 2 },
  },
  // Q5: 8/9 × 1/4 = 2/9  (8/36 simplified)
  {
    id: 5,
    display1: { whole: 0, numerator: 8, denominator: 9 },
    display2: { whole: 0, numerator: 1, denominator: 4 },
    fraction1: { numerator: 8, denominator: 9 },
    fraction2: { numerator: 1, denominator: 4 },
    correctAnswer: { numerator: 2, denominator: 9 },
  },
  // Q6: 5/6 × 1 1/3 = 10/9  (4/3 improper; 20/18 simplified)
  {
    id: 6,
    display1: { whole: 0, numerator: 5, denominator: 6 },
    display2: { whole: 1, numerator: 1, denominator: 3 },
    fraction1: { numerator: 5, denominator: 6 },
    fraction2: { numerator: 4, denominator: 3 },
    correctAnswer: { numerator: 10, denominator: 9 },
  },
  // Q7: 1 3/8 × 2 7/8 = 253/64  (11/8 × 23/8 = 253/64)
  {
    id: 7,
    display1: { whole: 1, numerator: 3, denominator: 8 },
    display2: { whole: 2, numerator: 7, denominator: 8 },
    fraction1: { numerator: 11, denominator: 8 },
    fraction2: { numerator: 23, denominator: 8 },
    correctAnswer: { numerator: 253, denominator: 64 },
  },
  // Q8: 4 3/7 × 1 7/10 = 527/70  (31/7 × 17/10 = 527/70)
  {
    id: 8,
    display1: { whole: 4, numerator: 3, denominator: 7 },
    display2: { whole: 1, numerator: 7, denominator: 10 },
    fraction1: { numerator: 31, denominator: 7 },
    fraction2: { numerator: 17, denominator: 10 },
    correctAnswer: { numerator: 527, denominator: 70 },
  },
];

// Post-test uses the same 8 questions in a different order (0-indexed)
export const POST_TEST_ORDER = [3, 7, 1, 5, 0, 6, 4, 2];
export const POST_TEST_QUESTIONS: QuizQuestion[] = POST_TEST_ORDER.map(i => PRE_TEST_QUESTIONS[i]);
