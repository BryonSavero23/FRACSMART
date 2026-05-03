import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Fraction } from './Fraction';
import { QuizSidebar } from './QuizSidebar';
import { StepProgressBar } from './StepProgressBar';
import { useQuizStore } from '../store/quizStore';
import { detectMisconception } from '../lib/misconceptionDetection';
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS } from '../data/questions';
import { useAuth } from '../contexts/AuthContext';

interface TestModeProps {
  mode: 'pre' | 'post';
  onComplete: () => void;
  onBack: () => void;
}

export function TestMode({ mode, onComplete, onBack }: TestModeProps) {
  const { logout } = useAuth();
  const { startPreTest, startPostTest, recordAnswer, finalizeRun } = useQuizStore();

  const questions = mode === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;
  const totalQuestions = questions.length;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [inputNumerator, setInputNumerator] = useState('');
  const [inputDenominator, setInputDenominator] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (mode === 'pre') {
      startPreTest();
    } else {
      startPostTest();
    }
  }, [mode]);

  const currentQuestion = questions[questionIndex];
  const headerColor = mode === 'pre' ? '#5C35A0' : '#F5A623';
  const progressPct = Math.round((questionIndex / totalQuestions) * 100);

  const handleSubmit = () => {
    const n = parseInt(inputNumerator, 10);
    const d = parseInt(inputDenominator, 10);

    if (!inputNumerator.trim() || !inputDenominator.trim() || isNaN(n) || isNaN(d) || d === 0) {
      setInputError('Please enter valid numerator and denominator values.');
      return;
    }
    setInputError('');

    const studentAnswer = { numerator: n, denominator: d };
    const result = detectMisconception(studentAnswer, {
      fraction1: currentQuestion.fraction1,
      fraction2: currentQuestion.fraction2,
      correctAnswer: currentQuestion.correctAnswer,
    });

    const correct = result.type === null;
    setIsCorrect(correct);
    setSubmitted(true);

    recordAnswer(mode, {
      questionId: currentQuestion.id,
      studentNumerator: n,
      studentDenominator: d,
      isCorrect: correct,
      misconceptionType: result.type,
    });
  };

  const handleNext = () => {
    const isLastQuestion = questionIndex === totalQuestions - 1;
    if (isLastQuestion) {
      finalizeRun(mode);
      onComplete();
    } else {
      setQuestionIndex(i => i + 1);
      setInputNumerator('');
      setInputDenominator('');
      setSubmitted(false);
      setIsCorrect(null);
      setInputError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted) handleSubmit();
    if (e.key === 'Enter' && submitted) handleNext();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <QuizSidebar activeItem="quiz" onNavigate={onBack} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Colored header */}
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

        {/* Main content area */}
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

            {/* Fraction display + input */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Fraction
                numerator={currentQuestion.fraction1.numerator}
                denominator={currentQuestion.fraction1.denominator}
                size="xl"
                color="text-indigo-600"
              />
              <span className="text-3xl font-bold text-gray-400">×</span>
              <Fraction
                numerator={currentQuestion.fraction2.numerator}
                denominator={currentQuestion.fraction2.denominator}
                size="xl"
                color="text-indigo-600"
              />
              <span className="text-3xl font-bold text-gray-400">=</span>

              {/* Stacked answer input */}
              <div className="flex flex-col items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
                <input
                  type="number"
                  min="0"
                  placeholder="Enter numerator"
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
                  placeholder="Enter denominator"
                  value={inputDenominator}
                  onChange={e => setInputDenominator(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitted}
                  className="w-36 text-center p-3 text-gray-700 placeholder-gray-300 text-sm font-semibold focus:outline-none bg-transparent disabled:bg-gray-50"
                />
              </div>
            </div>

            {inputError && (
              <p className="text-center text-red-500 text-xs mt-3">{inputError}</p>
            )}

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

            {/* No explanation shown banner */}
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
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: headerColor }}
              >
                {questionIndex === totalQuestions - 1
                  ? mode === 'pre' ? 'Go to Lesson' : 'See Summary'
                  : 'Next Question'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
