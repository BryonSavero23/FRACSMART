import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, Star, Flame, CheckCircle, XCircle, ArrowRight, Lock, Trophy } from 'lucide-react';
import { detectMisconception, getWordProblem, Question, MisconceptionResult } from '../lib/misconceptionDetection';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Fraction } from './Fraction';
import confetti from 'canvas-confetti';

interface PracticeModeProps {
  onComplete: (sessionId: string, difficulty: string) => void;
}

interface AnswerRecord {
  question: Question;
  studentAnswer: { numerator: number; denominator: number } | null;
  isCorrect: boolean;
  misconception: MisconceptionResult;
  questionNum: number;
}

const BEGINNER_QUESTIONS = [
  {
    fraction1: { numerator: 3, denominator: 1 },
    fraction2: { numerator: 1, denominator: 2 },
    correctAnswer: { numerator: 3, denominator: 2 },
  },
  {
    fraction1: { numerator: 5, denominator: 1 },
    fraction2: { numerator: 2, denominator: 3 },
    correctAnswer: { numerator: 10, denominator: 3 },
  },
  {
    fraction1: { numerator: 4, denominator: 1 },
    fraction2: { numerator: 3, denominator: 5 },
    correctAnswer: { numerator: 12, denominator: 5 },
  },
  {
    fraction1: { numerator: 5, denominator: 6 },
    fraction2: { numerator: 3, denominator: 1 },
    correctAnswer: { numerator: 5, denominator: 2 },
  },
  {
    fraction1: { numerator: 7, denominator: 8 },
    fraction2: { numerator: 2, denominator: 1 },
    correctAnswer: { numerator: 7, denominator: 4 },
  },
];

const INTERMEDIATE_QUESTIONS = [
  {
    display1: { whole: 0, numerator: 2, denominator: 3 },
    display2: { whole: 0, numerator: 5, denominator: 4 },
    fraction1: { numerator: 2, denominator: 3 },
    fraction2: { numerator: 5, denominator: 4 },
    correctAnswer: { numerator: 5, denominator: 6 },
  },
  {
    display1: { whole: 0, numerator: 3, denominator: 5 },
    display2: { whole: 0, numerator: 7, denominator: 8 },
    fraction1: { numerator: 3, denominator: 5 },
    fraction2: { numerator: 7, denominator: 8 },
    correctAnswer: { numerator: 21, denominator: 40 },
  },
  {
    display1: { whole: 0, numerator: 4, denominator: 7 },
    display2: { whole: 0, numerator: 3, denominator: 5 },
    fraction1: { numerator: 4, denominator: 7 },
    fraction2: { numerator: 3, denominator: 5 },
    correctAnswer: { numerator: 12, denominator: 35 },
  },
  {
    display1: { whole: 2, numerator: 1, denominator: 5 },
    display2: { whole: 0, numerator: 2, denominator: 3 },
    fraction1: { numerator: 11, denominator: 5 },
    fraction2: { numerator: 2, denominator: 3 },
    correctAnswer: { numerator: 22, denominator: 15 },
  },
  {
    display1: { whole: 3, numerator: 2, denominator: 5 },
    display2: { whole: 0, numerator: 2, denominator: 5 },
    fraction1: { numerator: 17, denominator: 5 },
    fraction2: { numerator: 2, denominator: 5 },
    correctAnswer: { numerator: 34, denominator: 25 },
  },
  {
    display1: { whole: 1, numerator: 3, denominator: 4 },
    display2: { whole: 0, numerator: 2, denominator: 4 },
    fraction1: { numerator: 7, denominator: 4 },
    fraction2: { numerator: 2, denominator: 4 },
    correctAnswer: { numerator: 7, denominator: 8 },
  },
  {
    display1: { whole: 2, numerator: 1, denominator: 4 },
    display2: { whole: 34, numerator: 0, denominator: 1 },
    fraction1: { numerator: 9, denominator: 4 },
    fraction2: { numerator: 34, denominator: 1 },
    correctAnswer: { numerator: 153, denominator: 2 },
  },
  {
    display1: { whole: 3, numerator: 1, denominator: 4 },
    display2: { whole: 56, numerator: 0, denominator: 1 },
    fraction1: { numerator: 13, denominator: 4 },
    fraction2: { numerator: 56, denominator: 1 },
    correctAnswer: { numerator: 182, denominator: 1 },
  },
  {
    display1: { whole: 10, numerator: 3, denominator: 8 },
    display2: { whole: 32, numerator: 0, denominator: 1 },
    fraction1: { numerator: 83, denominator: 8 },
    fraction2: { numerator: 32, denominator: 1 },
    correctAnswer: { numerator: 332, denominator: 1 },
  },
  {
    display1: { whole: 3, numerator: 4, denominator: 5 },
    display2: { whole: 0, numerator: 3, denominator: 4 },
    fraction1: { numerator: 19, denominator: 5 },
    fraction2: { numerator: 3, denominator: 4 },
    correctAnswer: { numerator: 57, denominator: 20 },
  },
];

type AdvStepLayout = 'frac-x-frac' | 'frac-x-whole' | 'mixed-single' | 'mixed-x-mixed' | 'fraction' | 'mixed';
interface AdvStep { label: string; layout: AdvStepLayout; values: number[]; }
interface AdvQuestion {
  scenario: string | null;
  displayLeft: { whole: number; numerator: number; denominator: number };
  displayRight: { whole: number; numerator: number; denominator: number };
  steps: (AdvStep | null)[];
}

const ADVANCED_QUESTIONS_DATA: AdvQuestion[] = [
  { scenario: null, displayLeft: { whole: 4, numerator: 2, denominator: 8 }, displayRight: { whole: 1, numerator: 3, denominator: 4 }, steps: [
    { label: 'Step 1: Convert to improper fractions', layout: 'frac-x-frac', values: [34, 8, 7, 4] },
    { label: 'Step 2: Multiply numerators and denominators', layout: 'fraction', values: [238, 32] },
    { label: 'Step 3: Simplify your answer', layout: 'fraction', values: [119, 16] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [7, 7, 16] },
  ]},
  { scenario: null, displayLeft: { whole: 2, numerator: 3, denominator: 5 }, displayRight: { whole: 3, numerator: 1, denominator: 2 }, steps: [
    { label: 'Step 1: Convert to improper fractions', layout: 'frac-x-frac', values: [13, 5, 7, 2] },
    { label: 'Step 2: Multiply numerators and denominators', layout: 'fraction', values: [91, 10] },
    { label: 'Step 3: Simplify your answer', layout: 'fraction', values: [91, 10] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [9, 1, 10] },
  ]},
  { scenario: null, displayLeft: { whole: 3, numerator: 5, denominator: 7 }, displayRight: { whole: 8, numerator: 1, denominator: 2 }, steps: [
    { label: 'Step 1: Convert to improper fractions', layout: 'frac-x-frac', values: [26, 7, 17, 2] },
    { label: 'Step 2: Multiply numerators and denominators', layout: 'fraction', values: [442, 14] },
    { label: 'Step 3: Simplify your answer', layout: 'fraction', values: [221, 7] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [31, 4, 7] },
  ]},
  { scenario: null, displayLeft: { whole: 2, numerator: 2, denominator: 5 }, displayRight: { whole: 7, numerator: 1, denominator: 4 }, steps: [
    { label: 'Step 1: Convert to improper fractions', layout: 'frac-x-frac', values: [12, 5, 29, 4] },
    { label: 'Step 2: Multiply numerators and denominators', layout: 'fraction', values: [348, 20] },
    { label: 'Step 3: Simplify your answer', layout: 'fraction', values: [87, 5] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [17, 2, 5] },
  ]},
  { scenario: null, displayLeft: { whole: 4, numerator: 1, denominator: 2 }, displayRight: { whole: 9, numerator: 4, denominator: 8 }, steps: [
    { label: 'Step 1: Convert to improper fractions', layout: 'frac-x-frac', values: [9, 2, 76, 8] },
    { label: 'Step 2: Multiply numerators and denominators', layout: 'fraction', values: [684, 16] },
    { label: 'Step 3: Simplify your answer', layout: 'fraction', values: [171, 4] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [42, 3, 4] },
  ]},
  { scenario: 'A baker uses 3/4 cup of sugar for one cake. She makes 3 cakes. How many cups of sugar does she use?', displayLeft: { whole: 0, numerator: 3, denominator: 4 }, displayRight: { whole: 3, numerator: 0, denominator: 1 }, steps: [
    { label: 'Step 1: Write the equation', layout: 'frac-x-whole', values: [3, 4, 3] },
    { label: 'Step 2: Set up as fractions', layout: 'frac-x-frac', values: [3, 4, 3, 1] },
    { label: 'Step 3: Multiply', layout: 'fraction', values: [9, 4] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [2, 1, 4] },
  ]},
  { scenario: 'A rope is 3½ metres long. Tina uses 2/3 of the rope. How many metres does she use?', displayLeft: { whole: 3, numerator: 1, denominator: 2 }, displayRight: { whole: 0, numerator: 2, denominator: 3 }, steps: [
    { label: 'Step 1: Write the mixed number', layout: 'mixed-single', values: [3, 1, 2] },
    { label: 'Step 2: Convert and set up multiplication', layout: 'frac-x-frac', values: [7, 2, 2, 3] },
    { label: 'Step 3: Multiply and simplify', layout: 'fraction', values: [7, 3] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [2, 1, 3] },
  ]},
  { scenario: 'A container holds 1¾ litres of water. It is filled 2½ times. How many litres of water are there in total?', displayLeft: { whole: 1, numerator: 3, denominator: 4 }, displayRight: { whole: 2, numerator: 1, denominator: 2 }, steps: [
    { label: 'Step 1: Write both mixed numbers', layout: 'mixed-x-mixed', values: [1, 3, 4, 2, 1, 2] },
    { label: 'Step 2: Convert to improper fractions', layout: 'frac-x-frac', values: [7, 4, 5, 2] },
    { label: 'Step 3: Multiply', layout: 'fraction', values: [35, 8] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [4, 3, 8] },
  ]},
  { scenario: 'A cyclist travels 2/3 km in one round. He completes 5 rounds. What is the total distance travelled?', displayLeft: { whole: 0, numerator: 2, denominator: 3 }, displayRight: { whole: 5, numerator: 0, denominator: 1 }, steps: [
    { label: 'Step 1: Write the equation', layout: 'frac-x-whole', values: [2, 3, 5] },
    { label: 'Step 2: Set up as fractions', layout: 'frac-x-frac', values: [2, 3, 5, 1] },
    { label: 'Step 3: Multiply', layout: 'fraction', values: [10, 3] },
    { label: 'Step 4: Convert to mixed number', layout: 'mixed', values: [3, 1, 3] },
  ]},
  { scenario: 'Bryon saves 2/3 of his pocket money. He spends 1/2 of his savings. What fraction of his pocket money does he spend?', displayLeft: { whole: 0, numerator: 2, denominator: 3 }, displayRight: { whole: 0, numerator: 1, denominator: 2 }, steps: [
    { label: 'Step 1: Write the equation', layout: 'frac-x-frac', values: [2, 3, 1, 2] },
    { label: 'Step 2: Multiply', layout: 'fraction', values: [2, 6] },
    { label: 'Step 3: Simplify', layout: 'fraction', values: [1, 3] },
    null,
  ]},
];

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Per-level static config used only in the menu UI
const LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner Island',
    questions: 5,
    pointsPerQ: 10,
    lines: ['Easy fractions with small numbers', 'Build your basics!'],
    unlockNeed: 0,
    unlockFrom: null as string | null,
    nextUnlockPoints: null as number | null,
    nextUnlockName: 'Intermediate Mountain',
    cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-200',
    titleColor: 'text-green-700',
    pointsColor: 'text-green-600',
    mapFrom: 'from-cyan-300',
    mapVia: 'via-teal-300',
    mapTo: 'to-green-400',
    nodeActive: 'bg-green-500 border-green-600',
    image: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTjDoY0LMq4IHfi0IpK1d5FcaFhbyFuFMIn--BdJVT4j6g0nxwQ',
  },
  intermediate: {
    label: 'Intermediate Mountain',
    questions: 10,
    pointsPerQ: 15,
    lines: ['More challenging fractions', 'Simplify and multiply!'],
    unlockNeed: 40,
    unlockFrom: 'Beginner Island',
    nextUnlockPoints: null as number | null,
    nextUnlockName: 'Advanced Castle',
    cardBg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    border: 'border-violet-200',
    titleColor: 'text-violet-700',
    pointsColor: 'text-violet-600',
    mapFrom: 'from-violet-300',
    mapVia: 'via-purple-400',
    mapTo: 'to-fuchsia-400',
    nodeActive: 'bg-gray-400 border-gray-500',
    image: 'https://png.pngtree.com/png-vector/20231214/ourmid/pngtree-natural-landscape-model-game-free-element-decorative-material-png-image_11343058.png',
  },
  advanced: {
    label: 'Advanced Castle',
    questions: 10,
    pointsPerQ: 20,
    lines: ['Word problems, mixed numbers', 'and tricky challenges!'],
    unlockNeed: 120,
    unlockFrom: 'Intermediate Mountain',
    nextUnlockPoints: null as number | null,
    nextUnlockName: null as string | null,
    cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    titleColor: 'text-orange-700',
    pointsColor: 'text-orange-600',
    mapFrom: 'from-amber-300',
    mapVia: 'via-orange-300',
    mapTo: 'to-yellow-400',
    nodeActive: 'bg-gray-400 border-gray-500',
    image: 'https://thumbs.dreamstime.com/b/whimsical-cartoon-illustration-grand-medieval-castle-complete-towers-battlements-perched-atop-grassy-hill-407541124.jpg',
  },
} as const;

// Small node circle for the level map
function MapNode({
  n,
  locked,
  completed,
}: {
  n: number;
  locked: boolean;
  completed?: boolean;
}) {
  return (
    <div
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 transition-all
        ${locked
          ? 'bg-gray-300 border-gray-400 text-gray-500'
          : completed
            ? 'bg-blue-500 border-blue-600 text-white'
            : 'bg-green-500 border-green-600 text-white'
        }`}
    >
      {locked ? <Lock className="w-3.5 h-3.5" /> : n}
    </div>
  );
}

export function PracticeMode({ onComplete }: PracticeModeProps) {
  const { student, updateStudentScore, incrementSessions } = useAuth();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'feedback'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [completedDifficulties, setCompletedDifficulties] = useState<Set<string>>(new Set());

  const [bestScores, setBestScores] = useState<
    Record<string, { points: number; correct: number; total: number }>
  >({});

  const [activeSessions, setActiveSessions] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!student) return;

    supabase
      .from('sessions')
      .select('*')
      .eq('student_id', student.id)
      .then(({ data }) => {
        if (!data) return;

        const completed = new Set<string>();
        const bests: Record<string, { points: number; correct: number; total: number }> = {};
        const active: Record<string, any> = {};

        data.forEach((s) => {
          const totalNeeded =
            s.difficulty === 'beginner' ? 5 : 10;

          if (s.questions_answered >= totalNeeded) {
            completed.add(s.difficulty);
          }

          const prev = bests[s.difficulty];
          if (!prev || s.score > prev.points) {
            bests[s.difficulty] = {
              points: s.score ?? 0,
              correct: s.correct_answers ?? 0,
              total: s.questions_answered ?? 0,
            };
          }

          if (
            s.questions_answered > 0 &&
            s.questions_answered < totalNeeded &&
            !active[s.difficulty]
          ) {
            active[s.difficulty] = s;
          }
        });

        setCompletedDifficulties(completed);
        setBestScores(bests);
        setActiveSessions(active);
      });
  }, [student]);

  const [questionNum, setQuestionNum] = useState(1);
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [whole, setWhole] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [feedback, setFeedback] = useState<MisconceptionResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [needsSimplify, setNeedsSimplify] = useState(false);
  const [rawAnswer, setRawAnswer] = useState<{ numerator: number; denominator: number } | null>(null);

  const [shakeBox, setShakeBox] = useState(false);

  const [showPoints, setShowPoints] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);


  const [simpNumerator, setSimpNumerator] = useState('');
  const [simpDenominator, setSimpDenominator] = useState('');

  const [simplifyMessage, setSimplifyMessage] = useState('');
  const [simplifyType, setSimplifyType] = useState<'success' | 'warning' | 'error' | ''>('');

  const [advQuestion, setAdvQuestion] = useState<AdvQuestion | null>(null);
  const [advStep, setAdvStep] = useState(0);
  const [advInputs, setAdvInputs] = useState<string[]>([]);
  const [advWrong, setAdvWrong] = useState(false);
  const [advDoneSteps, setAdvDoneSteps] = useState<number[]>([]);
  const [advAllDone, setAdvAllDone] = useState(false);

  const scoreRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const difficultyRef = useRef<Difficulty>('beginner');

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const simplifyFraction = (n: number, d: number) => {
    const g = gcd(Math.abs(n), Math.abs(d));
    return {
      numerator: n / g,
      denominator: d / g,
    };
  };

  const toMixedNumber = (n: number, d: number) => {
    if (d === 1 || n < d) return { whole: 0, numerator: n, denominator: d };
    return { whole: Math.floor(n / d), numerator: n % d, denominator: d };
  };

  const renderMixedAnswer = (n: number, d: number, color: string) => {
    const m = toMixedNumber(n, d);
    if (m.whole === 0) {
      return <Fraction numerator={m.numerator} denominator={m.denominator} color={color} size="lg" />;
    }
    if (m.numerator === 0) {
      return <span className={`font-bold text-2xl ${color}`}>{m.whole}</span>;
    }
    return (
      <div className="flex items-center gap-1">
        <span className={`font-bold text-2xl ${color}`}>{m.whole}</span>
        <Fraction numerator={m.numerator} denominator={m.denominator} color={color} size="lg" />
      </div>
    );
  };

  const isEquivalent = (
    n1: number,
    d1: number,
    n2: number,
    d2: number
  ) => {
    return n1 * d2 === n2 * d1;
  };

  const getTotalQuestions = (diff: Difficulty) => {
    if (diff === 'beginner') return 5;
    if (diff === 'intermediate') return 10;
    return 10;
  };

  const totalScore = student?.total_score ?? 0;

  const intermediateUnlocked = completedDifficulties.has('beginner');
  const advancedUnlocked = completedDifficulties.has('intermediate');

  const isUnlocked = (diff: Difficulty) => {
    if (diff === 'beginner') return true;
    if (diff === 'intermediate') return intermediateUnlocked;
    return advancedUnlocked;
  };

  const startGame = async (diff: Difficulty) => {
    if (!isUnlocked(diff)) return;
    const existing = activeSessions[diff];

    if (existing) {
      difficultyRef.current = diff;
      setDifficulty(diff);

      sessionIdRef.current = existing.id;
      scoreRef.current = existing.score || 0;

      setScore(existing.score || 0);
      setQuestionNum(existing.questions_answered + 1);
      setGameState('playing');
      if (diff === 'beginner') {
        setCurrentQuestion(BEGINNER_QUESTIONS[existing.questions_answered]);
      } else if (diff === 'intermediate') {
        setCurrentQuestion(INTERMEDIATE_QUESTIONS[existing.questions_answered]);
      } else {
        const qIdx = Math.min(existing.questions_answered, ADVANCED_QUESTIONS_DATA.length - 1);
        setAdvQuestion(ADVANCED_QUESTIONS_DATA[qIdx]);
        setAdvStep(0); setAdvInputs([]); setAdvWrong(false); setAdvDoneSteps([]); setAdvAllDone(false);
      }
      return;
    }
    difficultyRef.current = diff;
    scoreRef.current = 0;
    setDifficulty(diff);
    setGameState('playing');
    setQuestionNum(1);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswers([]);
    setNumerator('');
    setDenominator('');
    if (diff === 'beginner') {
      setCurrentQuestion(BEGINNER_QUESTIONS[0]);
    } else if (diff === 'intermediate') {
      setCurrentQuestion(INTERMEDIATE_QUESTIONS[0]);
    } else {
      setAdvQuestion(ADVANCED_QUESTIONS_DATA[0]);
      setAdvStep(0); setAdvInputs([]); setAdvWrong(false); setAdvDoneSteps([]); setAdvAllDone(false);
    }

    if (student) {
      const { data } = await supabase
        .from('sessions')
        .insert({
          student_id: student.id,
          difficulty: diff,
          score: 0,
          questions_answered: 0,
          correct_answers: 0,
        })
        .select()
        .single();

      if (data) {
        setSessionId(data.id);
        sessionIdRef.current = data.id;
      }
    }
  };

  const calculatePoints = (isCorrect: boolean): number => {
    if (!isCorrect) return 0;

    // Fixed score system per level only
    if (difficultyRef.current === 'beginner') return 10;
    if (difficultyRef.current === 'intermediate') return 15;
    return 20; // advanced
  };

  const celebrateCorrect = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 }
    });

    const pts = calculatePoints(true);
    setEarnedPoints(pts);
    setShowPoints(true);

    setTimeout(() => {
      setShowPoints(false);
    }, 1200);
  };


  const checkAnswer = async () => {
    if (!currentQuestion) return;

    const w = parseInt(whole) || 0;
    const n = parseInt(numerator) || 0;
    const d = parseInt(denominator) || 1;

    const studentAnswer = {
      numerator: w * d + n,
      denominator: d,
    };

    // 👉 BEGINNER: force mixed-number input
    if (difficultyRef.current === 'beginner') {
      const hasWhole = parseInt(whole) > 0;   // must include whole part
      const hasFraction = parseInt(numerator) > 0; // must include remainder

      const correct = currentQuestion.correctAnswer;

      const isEquivalentAnswer =
        studentAnswer.numerator * correct.denominator ===
        studentAnswer.denominator * correct.numerator;

      // If student gives correct value but NOT as mixed number → mark wrong
      if (isEquivalentAnswer && (!hasWhole || !hasFraction)) {
        const misconception: MisconceptionResult = {
          type: 'other', // you can rename later to 'conversion_error'
          message: '❌ Answer must be in mixed number form!',
          tip: 'Convert your improper fraction into a mixed number (e.g., 3/2 = 1 1/2).',
        };

        const answerRecord: AnswerRecord = {
          question: currentQuestion,
          studentAnswer,
          isCorrect: false,
          misconception,
          questionNum,
        };

        const updatedAnswers = [...answers, answerRecord];
        setAnswers(updatedAnswers);
        setFeedback(misconception);
        setStreak(0);
        setGameState('feedback');

        return; // 🚨 STOP normal checking
      }
    }

    const correct = currentQuestion.correctAnswer;

    // If equivalent but not simplest form
    if (
      isEquivalent(
        studentAnswer.numerator,
        studentAnswer.denominator,
        correct.numerator,
        correct.denominator
      ) &&
      (
        studentAnswer.numerator !== correct.numerator ||
        studentAnswer.denominator !== correct.denominator
      ) &&
      !needsSimplify
    ) {
      setNeedsSimplify(true);
      setRawAnswer(studentAnswer);
      return;
    }

    if (needsSimplify) {
      const simpAnswer = {
        numerator: parseInt(simpNumerator) || 0,
        denominator: parseInt(simpDenominator) || 0,
      };

      const simplifiedTry = simplifyFraction(
        simpAnswer.numerator,
        simpAnswer.denominator
      );

      // Final correct simplest answer
      if (
        simpAnswer.numerator === correct.numerator &&
        simpAnswer.denominator === correct.denominator
      ) {
        setNeedsSimplify(false);
        setRawAnswer(null);
        setSimplifyMessage('');
        setSimplifyType('');
        celebrateCorrect();

        const simpCorrect: MisconceptionResult = { type: null, message: "Excellent work! That's correct!", tip: "" };
        const newStreak = streak + 1;
        const newMaxStreak = Math.max(maxStreak, newStreak);
        const points = calculatePoints(true);
        const newScore = scoreRef.current + points;
        scoreRef.current = newScore;

        const answerRecord: AnswerRecord = {
          question: currentQuestion,
          studentAnswer: { numerator: simpAnswer.numerator, denominator: simpAnswer.denominator },
          isCorrect: true,
          misconception: simpCorrect,
          questionNum,
        };

        const updatedAnswers = [...answers, answerRecord];
        setAnswers(updatedAnswers);
        setFeedback(simpCorrect);
        setStreak(newStreak);
        setMaxStreak(newMaxStreak);
        setScore(newScore);
        setGameState('feedback');

        const sid = sessionIdRef.current;
        if (sid) {
          await supabase.from('session_answers').insert({
            session_id: sid,
            question_num: questionNum,
            numerator1: currentQuestion.fraction1.numerator,
            denominator1: currentQuestion.fraction1.denominator,
            numerator2: currentQuestion.fraction2.numerator,
            denominator2: currentQuestion.fraction2.denominator,
            student_numerator: simpAnswer.numerator,
            student_denominator: simpAnswer.denominator,
            correct_numerator: correct.numerator,
            correct_denominator: correct.denominator,
            is_correct: true,
            misconception_type: 'unsimplified',
          });

          await supabase
            .from('sessions')
            .update({
              score: newScore,
              questions_answered: questionNum,
              correct_answers: updatedAnswers.filter(a => a.isCorrect).length,
            })
            .eq('id', sid);
        }

        return;
      }

      // Equivalent but not simplest
      else if (
        isEquivalent(
          simpAnswer.numerator,
          simpAnswer.denominator,
          correct.numerator,
          correct.denominator
        )
      ) {
        // Student simplified somewhat
        if (
          simpAnswer.numerator !== rawAnswer?.numerator ||
          simpAnswer.denominator !== rawAnswer?.denominator
        ) {
          setSimplifyType('success');
          setSimplifyMessage('🧠 Great first step! You simplified it once. Can simplify one more time.');
        } else {
          setSimplifyType('warning');
          setSimplifyMessage('🟡 Good try! Your answer is correct but can still be simplified further.');
        }

        return;
      }

      // Wrong answer
      else {
        setSimplifyType('error');
        setSimplifyMessage('❌ That simplified answer is not correct.');
        setShakeBox(true);
        setTimeout(() => setShakeBox(false), 500);
        return;
      }
    }

    const misconception = detectMisconception(
      studentAnswer.numerator > 0 && studentAnswer.denominator > 0 ? studentAnswer : null,
      currentQuestion
    );

    const isCorrect = misconception.type === null;
    if (isCorrect) {
      celebrateCorrect();
    }
    const newStreak = isCorrect ? streak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);
    const points = calculatePoints(isCorrect);
    const newScore = scoreRef.current + points;
    scoreRef.current = newScore;

    const answerRecord: AnswerRecord = {
      question: currentQuestion,
      studentAnswer: studentAnswer.numerator > 0 && studentAnswer.denominator > 0 ? studentAnswer : null,
      isCorrect,
      misconception,
      questionNum,
    };

    const updatedAnswers = [...answers, answerRecord];
    setAnswers(updatedAnswers);
    setFeedback(misconception);
    setStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setScore(newScore);
    setGameState('feedback');

    const sid = sessionIdRef.current;
    if (sid) {
      await supabase.from('session_answers').insert({
        session_id: sid,
        question_num: questionNum,
        numerator1: currentQuestion.fraction1.numerator,
        denominator1: currentQuestion.fraction1.denominator,
        numerator2: currentQuestion.fraction2.numerator,
        denominator2: currentQuestion.fraction2.denominator,
        student_numerator: studentAnswer.numerator || null,
        student_denominator: studentAnswer.denominator || null,
        correct_numerator: currentQuestion.correctAnswer.numerator,
        correct_denominator: currentQuestion.correctAnswer.denominator,
        is_correct: isCorrect,
        misconception_type: misconception.type,
      });

      await supabase
        .from('sessions')
        .update({
          score: newScore,
          questions_answered: questionNum,
          correct_answers: updatedAnswers.filter(a => a.isCorrect).length,
        })
        .eq('id', sid);
    }
  };

  const completeAdvancedQuestion = async () => {
    const pts = 20;
    celebrateCorrect();
    const newScore = scoreRef.current + pts;
    scoreRef.current = newScore;
    setScore(newScore);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setMaxStreak(prev => Math.max(prev, newStreak));
    setAdvAllDone(true);
    const sid = sessionIdRef.current;
    if (sid) {
      await supabase.from('sessions').update({
        score: newScore,
        questions_answered: questionNum,
        correct_answers: questionNum,
      }).eq('id', sid);
    }
  };

  const checkAdvancedStep = async () => {
    if (!advQuestion) return;
    const step = advQuestion.steps[advStep];
    if (!step) return;
    const isCorrect = step.values.every((v, i) => parseInt(advInputs[i] ?? '') === v);
    if (!isCorrect) {
      setAdvWrong(true);
      setShakeBox(true);
      setTimeout(() => setShakeBox(false), 600);
      return;
    }
    setAdvWrong(false);
    const newDone = [...advDoneSteps, advStep];
    setAdvDoneSteps(newDone);
    let nextIdx = advStep + 1;
    while (nextIdx < 4 && advQuestion.steps[nextIdx] === null) nextIdx++;
    if (nextIdx >= 4) {
      await completeAdvancedQuestion();
    } else {
      setAdvStep(nextIdx);
      setAdvInputs([]);
    }
  };

  const nextQuestion = () => {
    if (questionNum >= getTotalQuestions(difficultyRef.current)) {
      endGame();
      return;
    }
    setQuestionNum(questionNum + 1);
    setWhole('');
    setNumerator('');
    setDenominator('');
    setNeedsSimplify(false);
    setRawAnswer(null);
    setSimpNumerator('');
    setSimpDenominator('');
    setSimplifyMessage('');
    setSimplifyType('');
    setFeedback(null);
    setGameState('playing');
    if (difficultyRef.current === 'beginner') {
      setCurrentQuestion(BEGINNER_QUESTIONS[questionNum]);
    } else if (difficultyRef.current === 'intermediate') {
      setCurrentQuestion(INTERMEDIATE_QUESTIONS[questionNum]);
    } else {
      setAdvQuestion(ADVANCED_QUESTIONS_DATA[questionNum]);
      setAdvStep(0); setAdvInputs([]); setAdvWrong(false); setAdvDoneSteps([]); setAdvAllDone(false);
    }
  };

  const endGame = async () => {
    const finalScore = scoreRef.current;
    const sid = sessionIdRef.current;
    if (sid && student) {
      await updateStudentScore(finalScore);
      await incrementSessions();
      setCompletedDifficulties(prev => new Set([...prev, difficultyRef.current]));
      onComplete(sid, difficultyRef.current);
    }
  };

  const goBackToMenu = async () => {
    const diff = difficultyRef.current;
    const sid = sessionIdRef.current;

    if (sid) {
      setActiveSessions(prev => ({
        ...prev,
        [diff]: {
          ...(prev[diff] || {}),
          id: sid,
          difficulty: diff,
          questions_answered: questionNum - 1,
          score: scoreRef.current,
        }
      }));
    }

    setGameState('menu');
    setNumerator('');
    setDenominator('');
  };

  // ─── Adventure map menu ────────────────────────────────────────────────────
  const renderMenu = () => {
    const maxPoints = 270;
    const progressPct = Math.min(100, Math.round((totalScore / maxPoints) * 100));

    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          {/* Sky / landscape background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=1400&h=300&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 via-cyan-400/70 to-teal-400/60" />

          <div className="relative flex flex-col lg:flex-row items-center gap-6 px-6 py-6">
            {/* Title block */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md leading-tight">
                  Practice Adventure
                </h1>
              </div>
              <p className="text-white/90 font-medium text-sm ml-1">
                Complete levels, earn points and become a Fraction Master!
              </p>
            </div>

            {/* Mascot speech bubble — hidden on small screens */}
            <div className="hidden md:flex items-end gap-3 flex-shrink-0">
              <div className="bg-white/95 rounded-2xl px-4 py-3 shadow-lg max-w-[180px] text-center text-sm text-gray-700 font-medium relative">
                Finish levels and collect enough points to unlock the next adventure!
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45" />
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl flex-shrink-0">
                🎓
              </div>
            </div>

            {/* Progress card */}
            <div className="w-full lg:w-64 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Your Progress</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-9 h-9 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-extrabold text-gray-900 leading-none">
                    {totalScore}
                    {/* <span className="text-gray-400 text-sm font-normal"> / {maxPoints}</span> */}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Points</p>
                </div>
                <div className="text-2xl flex-shrink-0">🏆</div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Level rows ── */}
        {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((diff) => {
          const cfg = LEVEL_CONFIG[diff];
          const locked = !isUnlocked(diff);
          const completed = completedDifficulties.has(diff);
          const best = bestScores[diff];
          const maxPossible = cfg.questions * cfg.pointsPerQ;

          return (
            <div
              key={diff}
              className={`rounded-3xl overflow-hidden shadow-lg border ${cfg.border} flex flex-col lg:flex-row`}
            >
              {/* ── Left: level info ── */}
              <div className={`${cfg.cardBg} p-5 lg:w-72 flex-shrink-0 flex flex-col justify-between`}>
                <div className="flex gap-4 items-start">
                  <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={cfg.image}
                      alt={cfg.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-base font-extrabold uppercase tracking-wide leading-tight ${cfg.titleColor}`}>
                      {cfg.label}
                    </h2>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{cfg.questions} Questions</p>
                    {cfg.lines.map((line, i) => (
                      <p key={i} className="text-xs text-gray-500 leading-snug">{line}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-300/70 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <span className={`text-xs font-semibold ${cfg.pointsColor}`}>
                    {cfg.pointsPerQ} points per correct answer
                  </span>
                </div>
              </div>

              {/* ── Centre: map ── */}
              <div
                className={`flex-1 relative flex flex-col bg-gradient-to-r ${cfg.mapFrom} ${cfg.mapVia} ${cfg.mapTo} min-h-[160px]`}
              >
                {/* Lock overlay */}
                {locked && (
                  <div className="absolute inset-0 bg-black/20 z-20 flex items-center justify-center">
                    <div className="bg-gray-900/75 backdrop-blur-sm text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl">
                      <Lock className="w-4 h-4" />
                      LOCKED
                    </div>
                  </div>
                )}

                {/* Node path */}
                <div className="flex-1 flex items-center justify-center px-4 py-4">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {Array.from({ length: cfg.questions }, (_, i) => (
                      <React.Fragment key={i}>
                        <MapNode
                          n={i + 1}
                          locked={locked}
                          completed={
                            activeSessions[diff]
                              ? i + 1 <= activeSessions[diff].questions_answered
                              : false
                          }
                        />
                        {i < cfg.questions - 1 && (
                          <div className="w-3 h-0.5 bg-white/50 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                    <div className="w-3 h-0.5 bg-white/50 flex-shrink-0" />
                    {/* Treasure chest at end */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-xl flex-shrink-0
                      ${locked ? 'bg-gray-400/60' : 'bg-amber-500'}`}>
                      🏆
                    </div>
                  </div>
                </div>

                {/* Bottom action / unlock bar */}
                <div className={`mx-3 mb-3 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3
                  ${locked ? 'bg-white/55' : 'bg-white/80'}`}>
                  {locked ? (
                    <p className="text-sm text-gray-700 flex items-center gap-1.5 min-w-0">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                      <span className="truncate">
                        Complete all questions in {cfg.unlockFrom} to unlock this level!
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 flex items-center gap-1.5 min-w-0">
                      {completed
                        ? <><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /><span>Completed! Play again to beat your score.</span></>
                        : cfg.nextUnlockName
                          ? <><Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" /><span>Complete all questions to unlock {cfg.nextUnlockName}!</span></>
                          : <><Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" /><span>Reach the top — become a Fraction Master!</span></>
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* ── Right: stats / CTA ── */}
              <div className="bg-white px-4 py-5 lg:w-48 flex-shrink-0 flex flex-col justify-between gap-3">
                {locked ? (
                  /* Unlocks-when panel */
                  <div className="text-center">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className={`font-bold text-sm ${cfg.titleColor}`}>Unlocks When</p>
                    <p className="text-xs text-gray-400 mt-2">Complete all questions in</p>
                    <p className="text-xs font-semibold text-gray-600 mt-1">{cfg.unlockFrom}</p>
                    <div className="mt-3 opacity-20 text-5xl text-center">🏆</div>
                  </div>
                ) : (
                  /* Your Best panel */
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-gray-700 text-sm">Your Best</span>
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Points</p>
                    <p className={`text-2xl font-extrabold leading-tight ${cfg.titleColor}`}>
                      {best?.points ?? 0}
                      <span className="text-gray-300 text-sm font-normal"> / {maxPossible}</span>
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mt-2">Completed</p>
                    <p className="text-xl font-bold text-gray-700">
                      {best?.correct ?? 0}
                      <span className="text-gray-300 text-sm font-normal"> / {cfg.questions}</span>
                    </p>
                  </div>
                )}

                {/* Play button */}
                {!locked && (
                  <button
                    onClick={() => startGame(diff)}
                    className={`w-full py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95
  ${completed
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    {
                      activeSessions[diff]
                        ? 'Continue'
                        : completed
                          ? 'Play Again'
                          : 'Start'
                    }
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Footer tip ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm text-gray-700">
          <span className="text-xl flex-shrink-0">💡</span>
          <p>
            Tip: The more points you earn, the closer you are to becoming a{' '}
            <strong className="text-amber-600">Fraction Master!</strong> ✨
          </p>
        </div>
      </div>
    );
  };

  // ─── Playing view ──────────────────────────────────────────────────────────
  const renderPlaying = () => {
    if (!currentQuestion) return null;
    const wordProblem =
      difficultyRef.current === 'advanced' && questionNum > 5
        ? getWordProblem(currentQuestion, difficultyRef.current)
        : 'Multiply the fractions below.';

    const renderMixed = (d: any) => {
  if (!d) return null;

  // Whole + fraction (e.g. 2 1/5)
  if (d.whole && d.numerator !== 0) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-4xl font-bold text-indigo-600">{d.whole}</span>
        <Fraction
          numerator={d.numerator}
          denominator={d.denominator}
          color="text-indigo-600"
          size="xl"
        />
      </div>
    );
  }

  // Whole only (e.g. 34)
  if (d.whole && d.numerator === 0) {
    return <span className="text-4xl font-bold text-indigo-600">{d.whole}</span>;
  }

  // Normal fraction
  return (
    <Fraction
      numerator={d.numerator}
      denominator={d.denominator}
      color="text-indigo-600"
      size="xl"
    />
  );
};    
    return (
      <div className="max-w-2xl mx-auto p-4 relative">
        <div className="flex items-center justify-between mb-6 gap-3">

          {/* Left side */}
          <div className="flex items-center gap-3">

            <button
              onClick={goBackToMenu}
              className="bg-white shadow px-4 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              ← Back
            </button>

            <div className="bg-indigo-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-indigo-600">Question</span>
              <span className="ml-2 text-xl font-bold text-indigo-700">
                {questionNum}/{getTotalQuestions(difficultyRef.current)}
              </span>
            </div>

            <div className="bg-amber-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-amber-600">Score</span>
              <span className="ml-2 text-xl font-bold text-amber-700">{score}</span>
            </div>

          </div>

          {showPoints && (
            <div className="absolute right-6 top-3 points-pop z-50">
              +{earnedPoints} POINTS ⭐
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xl font-bold text-orange-600">{streak}</span>
          </div>

        </div>

        <div className="card mb-6">
          <p className="text-lg text-gray-700 leading-relaxed">{wordProblem}</p>
        </div>

        <div className="card mb-6">
          <h3 className="text-lg text-gray-700 mb-4 text-center">Calculate the answer:</h3>
          <div className="flex items-center justify-center gap-6">
            {difficultyRef.current === 'intermediate'
  ? renderMixed((currentQuestion as any).display1)
  : (
    <Fraction
      numerator={currentQuestion.fraction1.numerator}
      denominator={currentQuestion.fraction1.denominator}
      color="text-indigo-600"
      size="xl"
    />
  )
}

<span className="text-3xl font-bold text-gray-400">×</span>

{difficultyRef.current === 'intermediate'
  ? renderMixed((currentQuestion as any).display2)
  : (
    <Fraction
      numerator={currentQuestion.fraction2.numerator}
      denominator={currentQuestion.fraction2.denominator}
      color="text-indigo-600"
      size="xl"
    />
  )
}
            <span className="text-3xl font-bold text-gray-400">=</span>
            <div className="flex items-center gap-3">

              {currentQuestion.correctAnswer.denominator === 1 ? (
                /* Whole number answer only */
                <input
                  type="number"
                  value={whole}
                  onChange={(e) => setWhole(e.target.value)}
                  placeholder="?"
                  className="w-16 h-16 text-center text-2xl font-bold border-2 border-indigo-300 rounded-xl bg-indigo-50 shadow-md focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                />
              ) : (
                <>
                  {/* WHOLE NUMBER */}
                  <input
                    type="number"
                    value={whole}
                    onChange={(e) => setWhole(e.target.value)}
                    placeholder="0"
                    className="w-16 h-[100px] text-center text-2xl font-bold border-2 border-indigo-300 rounded-xl bg-indigo-50 shadow-md focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                  />

                  {/* FRACTION */}
                  <div className="flex flex-col items-center shadow-md rounded-xl overflow-hidden w-16">
                    <input
                      type="number"
                      value={numerator}
                      onChange={(e) => setNumerator(e.target.value)}
                      placeholder="?"
                      className="w-full h-12 text-center text-xl font-bold border-2 border-indigo-300 border-b-0 rounded-t-xl bg-indigo-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="w-full h-0.5 bg-indigo-400" />
                    <input
                      type="number"
                      value={denominator}
                      onChange={(e) => setDenominator(e.target.value)}
                      placeholder="?"
                      className="w-full h-12 text-center text-xl font-bold border-2 border-indigo-300 border-t-0 rounded-b-xl bg-indigo-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

        {simplifyMessage && (
          <div
            className={`mb-4 px-4 py-3 rounded-2xl font-semibold text-sm shadow-sm
      ${simplifyType === 'success'
                ? 'bg-green-100 text-green-700'
                : simplifyType === 'warning'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
          >
            {simplifyMessage}
          </div>
        )}

        {needsSimplify && rawAnswer && (
          <div className="mt-6 text-center">

            <p className="text-green-600 font-bold">
              ✅ Multiplication correct!
            </p>

            <p className="text-blue-600 font-semibold mb-4">
              🔵 Now simplify your answer to lowest terms.
            </p>

            <div className="flex items-center justify-center gap-4">

              <Fraction
                numerator={rawAnswer.numerator}
                denominator={rawAnswer.denominator}
                color="text-indigo-600"
                size="lg"
              />

              <span className="text-2xl font-bold text-gray-500">=</span>

              <span className="inline-flex flex-col items-center">
                <input
                  type="number"
                  value={simpNumerator}
                  onChange={(e) => setSimpNumerator(e.target.value)}
                  className={`fraction-box ${shakeBox ? 'animate-shake' : ''}`}
                />

                <span className="block w-full border-t-2 border-amber-400 my-0.5" />

                <input
                  type="number"
                  value={simpDenominator}
                  onChange={(e) => setSimpDenominator(e.target.value)}
                  className={`fraction-box ${shakeBox ? 'animate-shake' : ''}`}
                />
              </span>

            </div>
          </div>
        )}

        <button
          onClick={checkAnswer}
          disabled={
            needsSimplify
              ? !simpNumerator || !simpDenominator
              : currentQuestion.correctAnswer.denominator === 1
                ? !whole
                : !numerator || !denominator
          }
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // ─── Feedback view ─────────────────────────────────────────────────────────
  const renderFeedback = () => {
    if (!feedback || !currentQuestion) return null;

    return (
      <div className="max-w-2xl mx-auto p-4 relative">
        {showPoints && (
          <div className="absolute right-4 top-2 points-pop z-50">
            +{earnedPoints} POINTS ⭐
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-indigo-600">Question</span>
              <span className="ml-2 text-xl font-bold text-indigo-700">{questionNum}/{getTotalQuestions(difficultyRef.current)}</span>
            </div>
            <div className="bg-amber-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-amber-600">Score</span>
              <span className="ml-2 text-xl font-bold text-amber-700">{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xl font-bold text-orange-600">{streak}</span>
          </div>
        </div>

        <div
          className={`card mb-6 ${feedback.type === null ? 'bg-green-50 border-2 border-green-300' : 'bg-amber-50 border-2 border-amber-300'
            }`}
        >
          <div className="flex items-start gap-4">
            {feedback.type === null ? (
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            )}
            <div>
              <h3 className={`text-xl mb-2 ${feedback.type === null ? 'text-green-700' : 'text-amber-700'}`}>
                {feedback.message}
              </h3>
              {feedback.tip && <p className="text-gray-600">{feedback.tip}</p>}
            </div>
          </div>
        </div>

        {feedback.type !== null && (
          <div className="card mb-6 bg-indigo-50">
            <h4 className="text-lg text-indigo-700 mb-3">The correct answer:</h4>
            <div className="flex items-center justify-center gap-4">
              {renderMixedAnswer(
                currentQuestion.fraction1.numerator,
                currentQuestion.fraction1.denominator,
                'text-indigo-600'
              )}
              <span className="text-2xl font-bold text-gray-400">×</span>
              {renderMixedAnswer(
                currentQuestion.fraction2.numerator,
                currentQuestion.fraction2.denominator,
                'text-indigo-600'
              )}
              <span className="text-2xl font-bold text-gray-400">=</span>
              {renderMixedAnswer(
                currentQuestion.correctAnswer.numerator,
                currentQuestion.correctAnswer.denominator,
                'text-green-600'
              )}
            </div>
          </div>
        )}

        <button
          onClick={nextQuestion}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {questionNum >= getTotalQuestions(difficultyRef.current)
            ? 'See Results'
            : 'Next Question'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderAdvancedPlaying = () => {
    if (!advQuestion) return null;

    const updateInput = (idx: number, val: string) =>
      setAdvInputs(prev => { const n = [...prev]; while (n.length <= idx) n.push(''); n[idx] = val; return n; });

    const renderBox = (idx: number, isDone: boolean, doneVal: number) =>
      isDone ? (
        <span className="w-12 h-10 inline-flex items-center justify-center font-bold text-lg text-green-700 bg-green-100 rounded-lg border border-green-300">{doneVal}</span>
      ) : (
        <input type="number" value={advInputs[idx] ?? ''} onChange={e => updateInput(idx, e.target.value)}
          className={`w-12 h-10 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:ring-2 ${advWrong ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-indigo-300 bg-indigo-50 focus:ring-indigo-200'}`} />
      );

    const renderFracPair = (isDone: boolean, nVal: number, dVal: number, nIdx: number, dIdx: number) => (
      <div className="flex flex-col items-center gap-0.5">
        {renderBox(nIdx, isDone, nVal)}
        <div className={`w-10 h-0.5 ${isDone ? 'bg-green-400' : 'bg-indigo-400'}`} />
        {renderBox(dIdx, isDone, dVal)}
      </div>
    );

    const renderStepContent = (step: AdvStep, isDone: boolean) => {
      const { layout, values: v } = step;
      const times = <span className="text-xl font-bold text-gray-500">×</span>;
      if (layout === 'fraction') return <div className="flex justify-center">{renderFracPair(isDone, v[0], v[1], 0, 1)}</div>;
      if (layout === 'mixed' || layout === 'mixed-single') return (
        <div className="flex items-center justify-center gap-2">{renderBox(0, isDone, v[0])}{renderFracPair(isDone, v[1], v[2], 1, 2)}</div>
      );
      if (layout === 'frac-x-frac') return (
        <div className="flex items-center justify-center gap-4">{renderFracPair(isDone, v[0], v[1], 0, 1)}{times}{renderFracPair(isDone, v[2], v[3], 2, 3)}</div>
      );
      if (layout === 'frac-x-whole') return (
        <div className="flex items-center justify-center gap-4">{renderFracPair(isDone, v[0], v[1], 0, 1)}{times}{renderBox(2, isDone, v[2])}</div>
      );
      if (layout === 'mixed-x-mixed') return (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">{renderBox(0, isDone, v[0])}{renderFracPair(isDone, v[1], v[2], 1, 2)}</div>
          {times}
          <div className="flex items-center gap-1">{renderBox(3, isDone, v[3])}{renderFracPair(isDone, v[4], v[5], 4, 5)}</div>
        </div>
      );
      return null;
    };

    const renderMixedDisp = (d: { whole: number; numerator: number; denominator: number }) => {
      if (d.whole && d.numerator) return (
        <div className="flex items-center gap-1">
          <span className="text-3xl font-bold text-indigo-600">{d.whole}</span>
          <Fraction numerator={d.numerator} denominator={d.denominator} color="text-indigo-600" size="xl" />
        </div>
      );
      if (d.whole && !d.numerator) return <span className="text-3xl font-bold text-indigo-600">{d.whole}</span>;
      return <Fraction numerator={d.numerator} denominator={d.denominator} color="text-indigo-600" size="xl" />;
    };

    const currentStep = advQuestion.steps[advStep];
    const allFilled = !advAllDone && currentStep
      ? currentStep.values.every((_, i) => (advInputs[i] ?? '') !== '')
      : true;

    return (
      <div className="max-w-2xl mx-auto p-4 relative">
        {showPoints && <div className="absolute right-6 top-3 points-pop z-50">+{earnedPoints} POINTS ⭐</div>}

        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={goBackToMenu} className="bg-white shadow px-4 py-2 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition">← Back</button>
            <div className="bg-indigo-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-indigo-600">Question</span>
              <span className="ml-2 text-xl font-bold text-indigo-700">{questionNum}/{getTotalQuestions(difficultyRef.current)}</span>
            </div>
            <div className="bg-amber-100 px-4 py-2 rounded-xl">
              <span className="text-sm text-amber-600">Score</span>
              <span className="ml-2 text-xl font-bold text-amber-700">{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xl font-bold text-orange-600">{streak}</span>
          </div>
        </div>

        {advQuestion.scenario ? (
          <div className="card mb-4 bg-blue-50 border-2 border-blue-200">
            <p className="text-gray-700 leading-relaxed font-medium">{advQuestion.scenario}</p>
          </div>
        ) : (
          <div className="card mb-4 text-center">
            <p className="text-sm text-gray-500 mb-3">Multiply the fractions:</p>
            <div className="flex items-center justify-center gap-5">
              {renderMixedDisp(advQuestion.displayLeft)}
              <span className="text-3xl font-bold text-gray-400">×</span>
              {renderMixedDisp(advQuestion.displayRight)}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {advQuestion.steps.map((step, idx) => {
            if (!step) return null;
            const isDone = advDoneSteps.includes(idx);
            const isActive = idx === advStep && !advAllDone;
            const isLocked = !isDone && !isActive;
            return (
              <div key={idx} className={`rounded-2xl border-2 p-4 transition-all ${isDone ? 'bg-green-50 border-green-200' : isActive ? 'bg-white border-indigo-300 shadow-md' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isDone ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : isLocked ? <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full bg-indigo-500 flex-shrink-0" />}
                  <span className={`font-semibold text-sm ${isDone ? 'text-green-700' : isActive ? 'text-indigo-700' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {(isDone || isActive) && <div className="py-2">{renderStepContent(step, isDone)}</div>}
              </div>
            );
          })}
        </div>

        {advWrong && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold text-sm text-center">❌ Not quite! Check your working and try again.</div>}

        {advAllDone && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-2xl text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
            <p className="text-green-700 font-bold text-lg">Excellent work! +20 points 🌟</p>
          </div>
        )}

        {advAllDone ? (
          <button onClick={nextQuestion} className="btn-primary w-full flex items-center justify-center gap-2">
            {questionNum >= getTotalQuestions(difficultyRef.current) ? 'See Results' : 'Next Question'}
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={checkAdvancedStep} disabled={!allFilled}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Check Step {advStep + 1} <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && difficultyRef.current !== 'advanced' && renderPlaying()}
      {gameState === 'playing' && difficultyRef.current === 'advanced' && renderAdvancedPlaying()}
      {gameState === 'feedback' && renderFeedback()}
    </>
  );
}