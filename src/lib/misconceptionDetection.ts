export type MisconceptionType =
  | 'adding_fractions'
  | 'whole_number_bias'
  | 'partial_multiplication'
  | 'mixed_number_error'
  | 'unsimplified'
  | 'other'
  | null;

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface Question {
  fraction1: Fraction;
  fraction2: Fraction;
  correctAnswer: Fraction;
}

export interface MisconceptionResult {
  type: MisconceptionType;
  message: string;
  tip: string;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function simplify(fraction: Fraction): Fraction {
  const divisor = gcd(fraction.numerator, fraction.denominator);
  return {
    numerator: fraction.numerator / divisor,
    denominator: fraction.denominator / divisor,
  };
}

function areEqual(f1: Fraction, f2: Fraction): boolean {
  const s1 = simplify(f1);
  const s2 = simplify(f2);
  return s1.numerator === s2.numerator && s1.denominator === s2.denominator;
}

export function detectMisconception(
  studentAnswer: Fraction | null,
  question: Question
): MisconceptionResult {
  if (!studentAnswer || !studentAnswer.numerator || !studentAnswer.denominator) {
    return {
      type: null,
      message: "Let's try again! Remember to fill in both the top and bottom numbers.",
      tip: "A fraction needs both a numerator (top) and denominator (bottom).",
    };
  }

  const { fraction1: f1, fraction2: f2, correctAnswer } = question;
  const student = studentAnswer;

  // Priority 1: unsimplified — equivalent to correct but not in lowest form
  if (areEqual(student, correctAnswer)) {
    if (gcd(student.numerator, student.denominator) === 1) {
      return { type: null, message: "Excellent work! That's correct!", tip: "" };
    }
    return {
      type: 'unsimplified',
      message: "Your answer is correct but not simplified.",
      tip: "Simplify your fraction to the smallest form.",
    };
  }

  // Priority 2: adding_fractions — (a+c)/(b+d)
  if (
    student.numerator === f1.numerator + f2.numerator &&
    student.denominator === f1.denominator + f2.denominator
  ) {
    return {
      type: 'adding_fractions',
      message: "You added the numbers instead of multiplying them.",
      tip: "Multiply the top numbers and the bottom numbers, not add.",
    };
  }

  // Priority 3: partial_multiplication
  // Numerator correct, denominator added: (a×c)/(b+d)
  if (
    student.numerator === f1.numerator * f2.numerator &&
    student.denominator === f1.denominator + f2.denominator
  ) {
    return {
      type: 'partial_multiplication',
      message: "You only multiplied part of the fraction.",
      tip: "Multiply both the top and the bottom numbers.",
    };
  }
  // Denominator correct, numerator added: (a+c)/(b×d)
  if (
    student.numerator === f1.numerator + f2.numerator &&
    student.denominator === f1.denominator * f2.denominator
  ) {
    return {
      type: 'partial_multiplication',
      message: "You only multiplied part of the fraction.",
      tip: "Multiply both the top and the bottom numbers.",
    };
  }

  // Priority 4: mixed_number_error — wrong conversion of an improper fraction
  // Detects: student used (whole × denom) as numerator instead of (whole × denom + frac_num)
  // e.g. 1½ = 3/2 wrongly converted to 2/2
  const hasImproper = f1.numerator > f1.denominator || f2.numerator > f2.denominator;
  if (hasImproper) {
    const wrongF1 = f1.numerator > f1.denominator
      ? { numerator: Math.floor(f1.numerator / f1.denominator) * f1.denominator, denominator: f1.denominator }
      : f1;
    const wrongF2 = f2.numerator > f2.denominator
      ? { numerator: Math.floor(f2.numerator / f2.denominator) * f2.denominator, denominator: f2.denominator }
      : f2;

    // Also check if student just used the whole number (integer part) as the fraction
    const wholeF1 = f1.numerator > f1.denominator
      ? { numerator: Math.floor(f1.numerator / f1.denominator), denominator: 1 }
      : f1;
    const wholeF2 = f2.numerator > f2.denominator
      ? { numerator: Math.floor(f2.numerator / f2.denominator), denominator: 1 }
      : f2;

    const candidates = [
      { numerator: wrongF1.numerator * f2.numerator, denominator: wrongF1.denominator * f2.denominator },
      { numerator: f1.numerator * wrongF2.numerator, denominator: f1.denominator * wrongF2.denominator },
      { numerator: wholeF1.numerator * f2.numerator, denominator: wholeF1.denominator * f2.denominator },
      { numerator: f1.numerator * wholeF2.numerator, denominator: f1.denominator * wholeF2.denominator },
    ];

    if (candidates.some(c => areEqual(student, c))) {
      return {
        type: 'mixed_number_error',
        message: "You need to convert mixed numbers before multiplying.",
        tip: "Change mixed numbers into improper fractions first.",
      };
    }
  }

  // Priority 5: whole_number_bias — answer is larger than both input fractions
  const studentValue = student.numerator / student.denominator;
  const f1Value = f1.numerator / f1.denominator;
  const f2Value = f2.numerator / f2.denominator;
  if (studentValue > f1Value && studentValue > f2Value) {
    return {
      type: 'whole_number_bias',
      message: "Multiplying fractions can make the answer smaller.",
      tip: "You are finding a part of a part, so the result is usually smaller.",
    };
  }

  return {
    type: 'other',
    message: "Not quite! Remember: multiply top × top, then bottom × bottom.",
    tip: "Multiply the top numbers together, then multiply the bottom numbers together.",
  };
}

export function generateQuestion(difficulty: 'beginner' | 'intermediate' | 'advanced'): Question {
  let numerator1: number, denominator1: number, numerator2: number, denominator2: number;

  switch (difficulty) {
    case 'beginner':
      numerator1 = Math.floor(Math.random() * 3) + 1;
      denominator1 = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      numerator2 = Math.floor(Math.random() * 3) + 1;
      denominator2 = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      break;
    case 'intermediate':
      numerator1 = Math.floor(Math.random() * 5) + 1;
      denominator1 = Math.floor(Math.random() * 6) + 2;
      numerator2 = Math.floor(Math.random() * 5) + 1;
      denominator2 = Math.floor(Math.random() * 6) + 2;
      break;
    case 'advanced':
      numerator1 = Math.floor(Math.random() * 7) + 2;
      denominator1 = Math.floor(Math.random() * 8) + 3;
      numerator2 = Math.floor(Math.random() * 7) + 2;
      denominator2 = Math.floor(Math.random() * 8) + 3;
      break;
  }

  const correctNumerator = numerator1 * numerator2;
  const correctDenominator = denominator1 * denominator2;

  return {
    fraction1: { numerator: numerator1, denominator: denominator1 },
    fraction2: { numerator: numerator2, denominator: denominator2 },
    correctAnswer: simplify({ numerator: correctNumerator, denominator: correctDenominator }),
  };
}

export function getWordProblem(question: Question, difficulty: string): string {
  const names = [
    'Amirah', 'Hafiz', 'Siti', 'Ahmad', 'Nurul', 'Farhan', 'Aisyah', 'Danial',
    'Zara', 'Irfan', 'Maya', 'Rizwan', 'Putri', 'Adam', 'Fatimah', 'Hassan'
  ];
  const name = names[Math.floor(Math.random() * names.length)];

  const items = [
    'a chocolate cake', 'a pizza', 'a bowl of noodles', 'a packet of nasi lemak',
    'a jar of cookies', 'a bottle of sirap bandung', 'a plate of roti canai',
    'a container of rendang', 'a box of kuih', 'a bag of muruku'
  ];
  const item = items[Math.floor(Math.random() * items.length)];

  const { fraction1, fraction2 } = question;

  if (difficulty === 'beginner') {
    return `${name} has ${item}. ${name} eats ${fraction1.numerator}/${fraction1.denominator} of it. Then ${name} shares ${fraction2.numerator}/${fraction2.denominator} of what's left with a friend. What fraction of the original amount did the friend receive?`;
  } else if (difficulty === 'intermediate') {
    return `${name} baked ${item}. ${name}'s family ate ${fraction1.numerator}/${fraction1.denominator} of it. Then ${name} gave ${fraction2.numerator}/${fraction2.denominator} of the remaining portion to the neighbours. What fraction of the original ${item} did the neighbours get?`;
  } else {
    return `At the school canteen, ${name} bought ${item}. ${name} decided to share it fairly. First, ${fraction1.numerator}/${fraction1.denominator} was set aside for the teachers. Then from what remained, ${fraction2.numerator}/${fraction2.denominator} was given to the younger students. What fraction represents the portion given to the younger students from the original ${item}?`;
  }
}
