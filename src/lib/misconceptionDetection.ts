export type MisconceptionType =
  | 'adding_fractions'
  | 'whole_number_bias'
  | 'denominator_only'
  | 'numerator_only'
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

  const { fraction1, fraction2, correctAnswer } = question;
  const student = studentAnswer;

  if (areEqual(student, correctAnswer)) {
    return {
      type: null,
      message: "Excellent work! That's correct!",
      tip: "",
    };
  }

  const simplifiedCorrect = simplify(correctAnswer);
  const simplifiedStudent = simplify(student);

  if (areEqual(student, correctAnswer) === false &&
      student.numerator * correctAnswer.denominator === student.denominator * correctAnswer.numerator) {
    return {
      type: 'unsimplified',
      message: "You need to simplify your answer first before multiplying. Find the common factor and divide!",
      tip: `Try dividing both numbers by their greatest common divisor. ${student.numerator} and ${student.denominator} can both be divided by ${gcd(student.numerator, student.denominator)}.`,
    };
  }

  const addedNumerator = fraction1.numerator + fraction2.numerator;
  const addedDenominator = fraction1.denominator + fraction2.denominator;
  if (student.numerator === addedNumerator && student.denominator === addedDenominator) {
    return {
      type: 'adding_fractions',
      message: "You added the numbers instead of multiplying them!",
      tip: "When multiplying fractions, multiply the tops together AND multiply the bottoms together. Don't add them!",
    };
  }

  if (student.numerator === fraction1.numerator * fraction2.numerator) {
    if (student.denominator === fraction1.denominator + fraction2.denominator) {
      return {
        type: 'denominator_only',
        message: "You only multiplied the bottom numbers. Don't forget to multiply the top numbers too!",
        tip: "Remember: multiply the denominators too! Don't add them.",
      };
    }
  }

  if (student.denominator === fraction1.denominator * fraction2.denominator) {
    if (student.numerator === fraction1.numerator + fraction2.numerator) {
      return {
        type: 'numerator_only',
        message: "Check how you changed your mixed number. For example, 2½ becomes 5/2, not 2/2 or 21/2!",
        tip: "Remember: multiply the numerators too! Don't add them.",
      };
    }
  }

  if (student.denominator === 1) {
    return {
      type: 'whole_number_bias',
      message: "When you multiply two fractions, the answer must be smaller, not bigger!",
      tip: "When we multiply two fractions, the answer is usually still a fraction (unless the numerators and denominators divide evenly).",
    };
  }

  return {
    type: 'other',
    message: "Not quite! Remember: multiply top × top, then bottom × bottom. Then simplify if you can!",
    tip: `Remember: ${fraction1.numerator}/${fraction1.denominator} × ${fraction2.numerator}/${fraction2.denominator} = ${fraction1.numerator * fraction2.numerator}/${fraction1.denominator * fraction2.denominator}. Can you simplify this?`,
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
