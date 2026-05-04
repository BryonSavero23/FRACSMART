import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { StepProgressBar } from './StepProgressBar';
import { Fraction } from './Fraction';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import { MISCONCEPTION_LABELS } from '../lib/misconceptionTypes';
import type { MisconceptionType } from '../lib/misconceptionTypes';

interface QuestionData {
  display1_whole: number;
  display1_numerator: number;
  display1_denominator: number;
  display2_whole: number;
  display2_numerator: number;
  display2_denominator: number;
  correct_numerator: number;
  correct_denominator: number;
}

interface ReviewAnswer {
  question_num: number;
  student_numerator: number | null;
  student_denominator: number | null;
  is_correct: boolean;
  misconception_type: string | null;
  question_id: string | null;
  questionData: QuestionData | null;
}

interface TestReviewProps {
  onBack: () => void;
}

function renderDisplayNum(whole: number, num: number, den: number, colorClass: string) {
  if (whole > 0 && num === 0) {
    return <span className={`font-bold text-lg ${colorClass}`}>{whole}</span>;
  }
  if (whole === 0) {
    return <Fraction numerator={num} denominator={den} size="sm" color={colorClass} />;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`font-bold text-lg ${colorClass}`}>{whole}</span>
      <Fraction numerator={num} denominator={den} size="sm" color={colorClass} />
    </span>
  );
}

function renderImproper(num: number | null, den: number | null, colorClass: string) {
  if (num === null || den === null) {
    return <span className={`text-sm font-bold ${colorClass}`}>—</span>;
  }
  if (den === 1) {
    return <span className={`font-bold ${colorClass}`}>{num}</span>;
  }
  const whole = Math.floor(num / den);
  const rem = num % den;
  if (whole > 0 && rem > 0) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className={`font-bold ${colorClass}`}>{whole}</span>
        <Fraction numerator={rem} denominator={den} size="sm" color={colorClass} />
      </span>
    );
  }
  if (whole > 0) {
    return <span className={`font-bold ${colorClass}`}>{whole}</span>;
  }
  return <Fraction numerator={num} denominator={den} size="sm" color={colorClass} />;
}

async function fetchAnswersForSession(sessionId: string): Promise<ReviewAnswer[]> {
  const { data: rawAnswers } = await supabase
    .from('test_answers')
    .select('question_num, student_numerator, student_denominator, is_correct, misconception_type, question_id')
    .eq('session_id', sessionId)
    .order('question_num');

  if (!rawAnswers?.length) return [];

  const questionIds = rawAnswers.map(a => a.question_id).filter(Boolean) as string[];
  let questionsMap = new Map<string, QuestionData>();

  if (questionIds.length) {
    const { data: questions } = await supabase
      .from('test_questions')
      .select('id, display1_whole, display1_numerator, display1_denominator, display2_whole, display2_numerator, display2_denominator, correct_numerator, correct_denominator')
      .in('id', questionIds);
    questions?.forEach(q => questionsMap.set(q.id, q));
  }

  return rawAnswers.map(a => ({
    question_num: a.question_num,
    student_numerator: a.student_numerator,
    student_denominator: a.student_denominator,
    is_correct: a.is_correct,
    misconception_type: a.misconception_type,
    question_id: a.question_id,
    questionData: a.question_id ? (questionsMap.get(a.question_id) ?? null) : null,
  }));
}

export function TestReview({ onBack }: TestReviewProps) {
  const { student } = useAuth();
  const [tab, setTab] = useState<'pre' | 'post'>('pre');
  const [preAnswers, setPreAnswers] = useState<ReviewAnswer[]>([]);
  const [postAnswers, setPostAnswers] = useState<ReviewAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data: sessions } = await supabase
          .from('test_sessions')
          .select('id, test_type')
          .eq('student_id', student.id)
          .in('test_type', ['pre', 'post'])
          .order('created_at', { ascending: false });

        if (!sessions?.length) return;

        const preSession = sessions.find(s => s.test_type === 'pre');
        const postSession = sessions.find(s => s.test_type === 'post');

        const [pre, post] = await Promise.all([
          preSession ? fetchAnswersForSession(preSession.id) : Promise.resolve([]),
          postSession ? fetchAnswersForSession(postSession.id) : Promise.resolve([]),
        ]);

        setPreAnswers(pre);
        setPostAnswers(post);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student?.id]);

  const answers = tab === 'pre' ? preAnswers : postAnswers;

  return (
    <div className="flex flex-col min-w-0">
      <div style={{ backgroundColor: '#5C35A0' }}>
        <StepProgressBar currentStep={4} />
        <div className="px-8 pb-5">
          <h1 className="text-2xl font-heading text-white">Review Answers</h1>
          <p className="text-white/80 text-sm mt-1">See how you answered each question</p>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('pre')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              tab === 'pre'
                ? 'text-white'
                : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            style={tab === 'pre' ? { backgroundColor: '#5C35A0' } : undefined}
          >
            Pre-Test
          </button>
          <button
            onClick={() => setTab('post')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              tab === 'post'
                ? 'text-white'
                : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            style={tab === 'post' ? { backgroundColor: '#F5A623' } : undefined}
          >
            Post-Test
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : answers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No answers found for this test.</div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {answers.map(a => (
              <div
                key={a.question_num}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
                  a.is_correct ? 'border-green-200' : 'border-red-200'
                }`}
              >
                {/* Q badge */}
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">Q{a.question_num}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Question display */}
                  {a.questionData ? (
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {renderDisplayNum(
                        a.questionData.display1_whole,
                        a.questionData.display1_numerator,
                        a.questionData.display1_denominator,
                        'text-indigo-600',
                      )}
                      <span className="text-gray-400 font-bold">×</span>
                      {renderDisplayNum(
                        a.questionData.display2_whole,
                        a.questionData.display2_numerator,
                        a.questionData.display2_denominator,
                        'text-indigo-600',
                      )}
                      <span className="text-gray-400 font-bold">=</span>
                      {renderImproper(
                        a.questionData.correct_numerator,
                        a.questionData.correct_denominator,
                        'text-green-600',
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs mb-2">Question data unavailable</p>
                  )}

                  {/* Student answer */}
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-gray-400 text-xs">Your answer:</span>
                    {renderImproper(
                      a.student_numerator,
                      a.student_denominator,
                      a.is_correct ? 'text-green-600' : 'text-red-500',
                    )}
                    {!a.is_correct && a.misconception_type && (
                      <span className="text-xs text-gray-400">
                        — {MISCONCEPTION_LABELS[a.misconception_type as NonNullable<MisconceptionType>] ?? a.misconception_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result icon */}
                <div className="flex-shrink-0">
                  {a.is_correct
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition-all hover:bg-gray-50"
            style={{ borderColor: '#5C35A0', color: '#5C35A0' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </button>
        </div>
      </div>
    </div>
  );
}
