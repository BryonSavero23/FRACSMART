import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Target, BarChart3, ArrowLeft, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase, SessionAnswer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Fraction } from './Fraction';

interface SessionResultsProps {
  sessionId: string;
  onBack: () => void;
  onContinueToPostTest?: () => void;
}

const misconceptionLabels: Record<string, string> = {
  adding_fractions: 'Adding Instead\nof Multiplying',
  whole_number_bias: 'Whole Number\nBias',
  denominator_only: 'Only Multiplied\nDenominators',
  numerator_only: 'Only Multiplied\nNumerators',
  unsimplified: 'Forgot to\nSimplify',
  other: 'Other Errors',
};

const misconceptionColors: Record<string, string> = {
  adding_fractions: '#ef4444',
  whole_number_bias: '#f97316',
  denominator_only: '#eab308',
  numerator_only: '#22c55e',
  unsimplified: '#3b82f6',
  other: '#8b5cf6',
};

export function SessionResults({ sessionId, onBack, onContinueToPostTest }: SessionResultsProps) {
  const { student } = useAuth();
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    score: number;
    correct_answers: number;
    questions_answered: number;
    difficulty: string;
  } | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (session) {
      setSessionData(session);
    }

    const { data: sessionAnswers } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_num', { ascending: true });

    if (sessionAnswers) {
      setAnswers(sessionAnswers);
    }

    setIsLoading(false);
  };

  const getMisconceptionData = () => {
    const counts: Record<string, number> = {};

    answers.forEach((answer) => {
      if (!answer.is_correct && answer.misconception_type) {
        counts[answer.misconception_type] = (counts[answer.misconception_type] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([type, count]) => ({
      name: misconceptionLabels[type] || type,
      type,
      count,
      color: misconceptionColors[type] || '#6b7280',
    }));
  };

  const getMostCommonMisconception = () => {
    const data = getMisconceptionData();
    if (data.length === 0) return null;
    return data.reduce((max, item) => (item.count > max.count ? item : max), data[0]);
  };

  const getAccuracyPercentage = () => {
    if (!sessionData || sessionData.questions_answered === 0) return 0;
    return Math.round((sessionData.correct_answers / sessionData.questions_answered) * 100);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const misconceptionData = getMisconceptionData();
  const mostCommon = getMostCommonMisconception();
  const accuracy = getAccuracyPercentage();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-400 rounded-3xl mb-4 shadow-xl">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl text-indigo-700 mb-2">Session Complete!</h1>
        <p className="text-gray-600">Great effort, {student?.name}!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-indigo-700">{sessionData?.score || 0}</p>
          <p className="text-sm text-gray-600">Total Points</p>
        </div>
        <div className="card text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
          <p className="text-sm text-gray-600">Accuracy</p>
        </div>
        <div className="card text-center">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-orange-600">{sessionData?.correct_answers || 0}</p>
          <p className="text-sm text-gray-600">Correct</p>
        </div>
        <div className="card text-center">
          <BarChart3 className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-indigo-600">{sessionData?.questions_answered || 0}</p>
          <p className="text-sm text-gray-600">Questions</p>
        </div>
      </div>

      {accuracy === 100 && (
        <div className="card bg-green-50 border-2 border-green-300 mb-6">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-xl text-green-700">Perfect Score!</h3>
            <p className="text-green-600">You got every question right! Amazing work!</p>
          </div>
        </div>
      )}

      {misconceptionData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-xl text-indigo-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Your Mistakes This Session
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={misconceptionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {misconceptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {mostCommon && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
              <p className="text-amber-700">
                <span className="font-semibold">Tip for next time:</span> Your most common mistake was{' '}
                <span className="font-bold">{mostCommon.name.replace('\n', ' ')}</span>. Review the
                "Common Mistakes" lesson to improve!
              </p>
            </div>
          )}
        </div>
      )}

      {misconceptionData.length === 0 && (
        <div className="card bg-green-50 border-2 border-green-300 mb-6">
          <div className="text-center">
            <Star className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-xl text-green-700">No Mistakes!</h3>
            <p className="text-green-600">You didn't make any common errors. Keep up the great work!</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-xl text-indigo-700 mb-4">Question Review</h3>
        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div
              key={answer.id}
              className={`p-4 rounded-xl ${
                answer.is_correct ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold text-gray-600">Q{answer.question_num}</span>
                  <div className="flex items-center gap-2">
                    <Fraction
                      numerator={answer.numerator1}
                      denominator={answer.denominator1}
                      color="text-indigo-600"
                      size="sm"
                    />
                    <span className="text-gray-400 font-bold">×</span>
                    <Fraction
                      numerator={answer.numerator2}
                      denominator={answer.denominator2}
                      color="text-indigo-600"
                      size="sm"
                    />
                    <span className="text-gray-400 font-bold">=</span>
                    <Fraction
                      numerator={answer.correct_numerator}
                      denominator={answer.correct_denominator}
                      color="text-green-600"
                      size="sm"
                    />
                  </div>
                </div>
                {answer.is_correct ? (
                  <span className="text-green-600 font-semibold flex-shrink-0">Correct!</span>
                ) : (
                  <span className="text-red-600 font-semibold flex-shrink-0 flex items-center gap-1">
                    Your answer:{' '}
                    <Fraction
                      numerator={answer.student_numerator ?? '?'}
                      denominator={answer.student_denominator ?? '?'}
                      color="text-red-600"
                      size="sm"
                    />
                  </span>
                )}
              </div>
              {!answer.is_correct && answer.misconception_type && (
                <p className="text-sm text-gray-500 mt-2">
                  Error: {misconceptionLabels[answer.misconception_type]?.replace('\n', ' ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
        {onContinueToPostTest && (
          <button
            onClick={onContinueToPostTest}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: '#F5A623' }}
          >
            Continue to Post-Test
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
