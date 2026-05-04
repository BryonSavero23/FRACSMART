import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Fraction } from './Fraction';
import { QuizSidebar } from './QuizSidebar';
import { StepProgressBar } from './StepProgressBar';
import { useQuizStore } from '../store/quizStore';
import { detectMisconception, type MisconceptionType } from '../lib/misconceptionDetection';
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS, POST_TEST_ORDER, type QuizQuestion } from '../data/questions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TestModeProps {
  mode: 'pre' | 'post';
  onComplete: () => void;
  onBack: () => void;
}

interface SavedAnswer {
  questionNum: number;
  questionId: string | null;
  studentNumerator: number;
  studentDenominator: number;
  isCorrect: boolean;
  misconceptionType: string | null;
  timeTakenMs: number;
}

export function TestMode({ mode, onComplete, onBack }: TestModeProps) {
  const { student, logout } = useAuth();
  const { startPreTest, startPostTest, recordAnswer, finalizeRun } = useQuizStore();

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const questionDbIds = useRef<string[]>([]);
  const savedAnswers = useRef<SavedAnswer[]>([]);
  const testStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputWhole, setInputWhole] = useState('');
  const [inputNumerator, setInputNumerator] = useState('');
  const [inputDenominator, setInputDenominator] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [inputError, setInputError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load questions from Supabase; fall back to hardcoded if unavailable
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('test_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (data && data.length >= 8) {
        const mapped: QuizQuestion[] = data.map(row => ({
          id: row.sort_order as number,
          display1: {
            whole: row.display1_whole as number,
            numerator: row.display1_numerator as number,
            denominator: row.display1_denominator as number,
          },
          display2: {
            whole: row.display2_whole as number,
            numerator: row.display2_numerator as number,
            denominator: row.display2_denominator as number,
          },
          fraction1: { numerator: row.fraction1_numerator as number, denominator: row.fraction1_denominator as number },
          fraction2: { numerator: row.fraction2_numerator as number, denominator: row.fraction2_denominator as number },
          correctAnswer: { numerator: row.correct_numerator as number, denominator: row.correct_denominator as number },
        }));

        const ids: string[] = data.map(r => r.id as string);
        const ordered = mode === 'post' ? POST_TEST_ORDER.map(i => mapped[i]) : mapped;
        const orderedIds = mode === 'post' ? POST_TEST_ORDER.map(i => ids[i]) : ids;
        setQuestions(ordered);
        questionDbIds.current = orderedIds;
      } else {
        setQuestions(mode === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS);
      }
      setLoadingQuestions(false);
    };

    load();

    if (mode === 'pre') startPreTest();
    else startPostTest();

    testStartTime.current = Date.now();
    questionStartTime.current = Date.now();
  }, [mode]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[questionIndex];
  const headerColor = mode === 'pre' ? '#5C35A0' : '#F5A623';
  const progressPct = totalQuestions > 0 ? Math.round((questionIndex / totalQuestions) * 100) : 0;

  // Render a number in display form: whole number, fraction, or mixed number
  const renderDisplayNumber = (d: { whole: number; numerator: number; denominator: number }) => {
    const isWholeOnly = d.whole > 0 && d.numerator === 0;
    const isFractionOnly = d.whole === 0 && d.numerator > 0;

    if (isWholeOnly) {
      return <span className="text-4xl font-bold text-indigo-600">{d.whole}</span>;
    }
    if (isFractionOnly) {
      return <Fraction numerator={d.numerator} denominator={d.denominator} size="xl" color="text-indigo-600" />;
    }
    // Mixed number
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-4xl font-bold text-indigo-600">{d.whole}</span>
        <Fraction numerator={d.numerator} denominator={d.denominator} size="xl" color="text-indigo-600" />
      </div>
    );
  };

  const gcd = (a: number, b: number): number => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a;
  };

  const handleSubmit = () => {
    const wStr = inputWhole.trim();
    const nStr = inputNumerator.trim();
    const dStr = inputDenominator.trim();

    const hasWhole = wStr !== '';
    const hasNum = nStr !== '';
    const hasDen = dStr !== '';

    // Must enter at least a whole number, or both numerator and denominator
    if (!hasWhole && !hasNum) {
      setInputError('Please enter an answer (whole number, fraction, or mixed number).');
      return;
    }
    if (hasNum && !hasDen) {
      setInputError('Please also enter a denominator.');
      return;
    }
    if (!hasNum && hasDen) {
      setInputError('Please also enter a numerator.');
      return;
    }

    const w = hasWhole ? parseInt(wStr, 10) : 0;
    const n = hasNum ? parseInt(nStr, 10) : 0;
    const d = hasDen ? parseInt(dStr, 10) : 1;

    if (isNaN(w) || isNaN(n) || isNaN(d)) {
      setInputError('Please enter valid numbers.');
      return;
    }
    if (hasDen && d === 0) {
      setInputError('Denominator cannot be zero.');
      return;
    }
    // Fraction part of a mixed number must be proper (numerator < denominator)
    if (w > 0 && n > 0 && n >= d) {
      setInputError('The fraction part of a mixed number must have numerator < denominator (e.g. 3 and 5/8, not 3 and 13/8).');
      return;
    }

    setInputError('');

    // Convert to improper fraction: (whole × denominator + numerator) / denominator
    const studentAnswer = { numerator: w * d + n, denominator: d };
    const correctAnswer = currentQuestion.correctAnswer;

    // ── Strictness checks ──────────────────────────────────────────────────────
    // Is the student's answer equivalent to the correct answer?
    const isEquivalent =
      studentAnswer.numerator * correctAnswer.denominator ===
      studentAnswer.denominator * correctAnswer.numerator;

    let finalIsCorrect: boolean;
    let finalMisconceptionType: MisconceptionType;

    if (isEquivalent) {
      // Must be fully simplified (GCD = 1)
      const g = gcd(studentAnswer.numerator, studentAnswer.denominator);
      if (g > 1) {
        finalIsCorrect = false;
        finalMisconceptionType = 'unsimplified';
      } else {
        // If the correct answer is an improper fraction (not a whole number),
        // the student must enter it as a mixed number.
        const needsMixedForm =
          correctAnswer.numerator > correctAnswer.denominator &&
          correctAnswer.denominator > 1;
        if (needsMixedForm && w === 0) {
          // Student gave an improper fraction instead of a mixed number
          finalIsCorrect = false;
          finalMisconceptionType = 'other';
        } else {
          finalIsCorrect = true;
          finalMisconceptionType = null;
        }
      }
    } else {
      // Wrong answer — classify the misconception
      const result = detectMisconception(studentAnswer, {
        fraction1: currentQuestion.fraction1,
        fraction2: currentQuestion.fraction2,
        correctAnswer,
      });
      finalIsCorrect = false;
      finalMisconceptionType = result.type ?? 'other';
    }
    // ──────────────────────────────────────────────────────────────────────────

    setIsCorrect(finalIsCorrect);
    setSubmitted(true);

    const timeTakenMs = Date.now() - questionStartTime.current;

    recordAnswer(mode, {
      questionId: currentQuestion.id,
      studentNumerator: studentAnswer.numerator,
      studentDenominator: studentAnswer.denominator,
      isCorrect: finalIsCorrect,
      misconceptionType: finalMisconceptionType,
    });

    savedAnswers.current.push({
      questionNum: questionIndex + 1,
      questionId: questionDbIds.current[questionIndex] ?? null,
      studentNumerator: studentAnswer.numerator,
      studentDenominator: studentAnswer.denominator,
      isCorrect: finalIsCorrect,
      misconceptionType: finalMisconceptionType,
      timeTakenMs,
    });
  };

  const saveToSupabase = async () => {
    if (!student) return;
    try {
      const score = savedAnswers.current.filter(a => a.isCorrect).length;
      const { data: session } = await supabase
        .from('test_sessions')
        .insert({
          student_id: student.id,
          test_type: mode,
          score,
          total_questions: totalQuestions,
          started_at: new Date(testStartTime.current).toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!session) return;

      await supabase.from('test_answers').insert(
        savedAnswers.current.map(a => ({
          session_id: session.id,
          question_id: a.questionId,
          question_num: a.questionNum,
          student_numerator: a.studentNumerator,
          student_denominator: a.studentDenominator,
          is_correct: a.isCorrect,
          misconception_type: a.misconceptionType,
          time_taken_ms: a.timeTakenMs,
        }))
      );
    } catch (err) {
      console.error('Failed to save test results to Supabase:', err);
    }
  };

  const handleNext = async () => {
    const isLastQuestion = questionIndex === totalQuestions - 1;
    if (isLastQuestion) {
      finalizeRun(mode);
      setSaving(true);
      await saveToSupabase();
      setSaving(false);
      onComplete();
    } else {
      setQuestionIndex(i => i + 1);
      setInputWhole('');
      setInputNumerator('');
      setInputDenominator('');
      setSubmitted(false);
      setIsCorrect(null);
      setInputError('');
      questionStartTime.current = Date.now();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted) handleSubmit();
    if (e.key === 'Enter' && submitted && !saving) handleNext();
  };

  if (loadingQuestions) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <QuizSidebar activeItem="quiz" onNavigate={onBack} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-gray-500 text-sm">Loading questions…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <QuizSidebar activeItem="quiz" onNavigate={onBack} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Coloured header */}
        <div style={{ backgroundColor: headerColor }}>
          <StepProgressBar currentStep={mode === 'pre' ? 0 : 3} />
          <div className="px-8 pb-5">
            <h1 className="text-2xl font-heading text-white">
              {mode === 'pre' ? 'Pre-Test (No Hints)' : 'Post-Test (Quiz Mode)'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {mode === 'pre' ? 'Diagnostic (No Hints)' : 'Assessment (No Hints)'}
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
          {/* Info banner */}
          <div className="w-full mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              {mode === 'pre'
                ? 'This is a diagnostic test. No explanations or hints will be shown.'
                : 'This is similar to the pre-test. No explanations or hints.'}
            </p>
          </div>

          {/* Question progress */}
          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-600">
                Question {questionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-sm text-gray-400">{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%`, backgroundColor: headerColor }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <p className="text-center text-gray-500 text-sm mb-6 font-medium">Multiply the fractions:</p>

            {/* Question display */}
            <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
              {renderDisplayNumber(currentQuestion.display1)}
              <span className="text-3xl font-bold text-gray-400">×</span>
              {renderDisplayNumber(currentQuestion.display2)}
              <span className="text-3xl font-bold text-gray-400">=</span>
            </div>

            {/* Answer input */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {/* Whole number part (optional) */}
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Whole"
                    value={inputWhole}
                    onChange={e => setInputWhole(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitted}
                    className="w-24 text-center p-3 text-gray-700 placeholder-gray-300 text-sm font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 transition-colors"
                  />
                  <span className="text-xs text-gray-400">whole (opt.)</span>
                </div>

                <span className="text-xl font-bold text-gray-300 pb-4">+</span>

                {/* Fraction part */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex flex-col items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
                    <input
                      type="number"
                      min="0"
                      placeholder="Numerator"
                      value={inputNumerator}
                      onChange={e => setInputNumerator(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={submitted}
                      className="w-36 text-center p-3 text-gray-700 placeholder-gray-300 text-sm font-semibold focus:outline-none bg-transparent disabled:bg-gray-50"
                    />
                    <div className="w-full border-t-2 border-gray-200" />
                    <input
                      type="number"
                      min="1"
                      placeholder="Denominator"
                      value={inputDenominator}
                      onChange={e => setInputDenominator(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={submitted}
                      className="w-36 text-center p-3 text-gray-700 placeholder-gray-300 text-sm font-semibold focus:outline-none bg-transparent disabled:bg-gray-50"
                    />
                  </div>
                  <span className="text-xs text-gray-400">fraction (opt.)</span>
                </div>
              </div>

              {/* Input hint */}
              {!submitted && (
                <p className="text-center text-gray-400 text-xs">
                  e.g. whole number → Whole only &nbsp;|&nbsp; fraction → Num/Den only &nbsp;|&nbsp; mixed → all three
                </p>
              )}

              {inputError && (
                <p className="text-center text-red-500 text-xs">{inputError}</p>
              )}
            </div>

            {/* Result indicator */}
            {submitted && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {isCorrect ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="font-bold text-green-600">Correct</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-red-600">Incorrect</span>
                  </>
                )}
              </div>
            )}

            {submitted && (
              <p className="text-center text-gray-400 text-xs mt-2 italic">
                {mode === 'pre'
                  ? 'No explanation is shown in pre-test. We are checking what you already know!'
                  : 'Do your best! This will show how much you have improved.'}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3 w-full justify-end">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: headerColor }}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-70"
                style={{ backgroundColor: headerColor }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {questionIndex === totalQuestions - 1
                      ? mode === 'pre' ? 'Go to Lesson' : 'See Summary'
                      : 'Next Question'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
