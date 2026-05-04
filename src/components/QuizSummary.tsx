import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Trophy, TrendingUp, Clock, Target, CheckCircle,
  Download, RotateCcw, Home, ArrowRight, Star, Brain, Loader2,
} from 'lucide-react';
import { useQuizStore, type QuizRun } from '../store/quizStore';
import { useAuth } from '../contexts/AuthContext';
import { StepProgressBar } from './StepProgressBar';
import { supabase } from '../lib/supabase';
import type { TestSession, TestAnswer } from '../lib/supabase';
import type { MisconceptionType } from '../lib/misconceptionDetection';

interface QuizSummaryProps {
  onReviewAnswers: () => void;
  onBack: () => void;
}

const MISCONCEPTION_LABELS: Record<NonNullable<MisconceptionType>, string> = {
  adding_fractions: 'Additive Interference',
  partial_multiplication: 'Partial Multiplication',
  mixed_number_error: 'Mixed Number Error',
  whole_number_bias: 'Whole Number Bias',
  unsimplified: 'Simplification Confusion',
  other: 'Other Errors',
};

const MISCONCEPTION_COLORS: Record<NonNullable<MisconceptionType>, string> = {
  adding_fractions: '#ef4444',
  partial_multiplication: '#f97316',
  mixed_number_error: '#eab308',
  whole_number_bias: '#22c55e',
  unsimplified: '#8b5cf6',
  other: '#6b7280',
};

const MISCONCEPTION_ORDER: NonNullable<MisconceptionType>[] = [
  'adding_fractions',
  'partial_multiplication',
  'mixed_number_error',
  'whole_number_bias',
  'unsimplified',
  'other',
];

function formatTime(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  pre: string;
  post: string;
  delta: string;
  deltaPositive: boolean;
}

function StatCard({ icon, iconBg, title, pre, post, delta, deltaPositive }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-500">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-gray-400">{pre}</span>
        <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <span className="text-xl font-bold text-gray-800">{post}</span>
      </div>
      <span className={`text-xs font-bold ${deltaPositive ? 'text-green-600' : 'text-red-500'}`}>
        {delta}
      </span>
    </div>
  );
}

export function QuizSummary({ onReviewAnswers, onBack }: QuizSummaryProps) {
  const { preTest, postTest, resetAll } = useQuizStore();
  const { student } = useAuth();

  const [runPre, setRunPre] = useState<QuizRun | null>(preTest);
  const [runPost, setRunPost] = useState<QuizRun | null>(postTest);
  const [loadingFallback, setLoadingFallback] = useState(!preTest || !postTest);

  useEffect(() => {
    if (preTest && postTest) { setLoadingFallback(false); return; }
    if (!student) { setLoadingFallback(false); return; }

    const fetchFromDb = async () => {
      try {
        const { data: sessions } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('student_id', student.id)
          .in('test_type', ['pre', 'post'])
          .order('created_at', { ascending: false });

        if (!sessions?.length) return;

        const preSession = sessions.find((s: TestSession) => s.test_type === 'pre');
        const postSession = sessions.find((s: TestSession) => s.test_type === 'post');

        const buildRun = async (session: TestSession): Promise<QuizRun> => {
          const { data: answers } = await supabase
            .from('test_answers')
            .select('*')
            .eq('session_id', session.id)
            .order('question_num');
          return {
            score: session.score,
            startTime: session.started_at ? new Date(session.started_at).getTime() : 0,
            endTime: session.completed_at ? new Date(session.completed_at).getTime() : null,
            answers: (answers ?? []).map((a: TestAnswer) => ({
              questionId: a.question_num,
              studentNumerator: a.student_numerator,
              studentDenominator: a.student_denominator,
              isCorrect: a.is_correct,
              misconceptionType: (a.misconception_type ?? null) as MisconceptionType,
              timeTakenMs: a.time_taken_ms ?? 0,
            })),
          };
        };

        if (!runPre && preSession) setRunPre(await buildRun(preSession));
        if (!runPost && postSession) setRunPost(await buildRun(postSession));
      } finally {
        setLoadingFallback(false);
      }
    };

    fetchFromDb();
  }, [student?.id]);

  // Guard: loading from Supabase
  if (loadingFallback) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Guard: no data
  if (!runPre || !runPost) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No test data found.</p>
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: '#5C35A0' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const preScore = runPre.score;
  const postScore = runPost.score;
  const totalQ = 8;
  const preAccuracy = Math.round((preScore / totalQ) * 100);
  const postAccuracy = Math.round((postScore / totalQ) * 100);
  const scoreDelta = postScore - preScore;
  const accuracyDelta = postAccuracy - preAccuracy;

  const preTimeMs = runPre.endTime ? runPre.endTime - runPre.startTime : 0;
  const postTimeMs = runPost.endTime ? runPost.endTime - runPost.startTime : 0;
  const timeDelta = preTimeMs - postTimeMs; // positive = faster

  // Misconception counts
  const counts: Record<string, { pre: number; post: number }> = {};
  MISCONCEPTION_ORDER.forEach(t => { counts[t] = { pre: 0, post: 0 }; });

  runPre.answers.forEach(a => {
    if (a.misconceptionType && a.misconceptionType in counts) {
      counts[a.misconceptionType].pre++;
    }
  });
  runPost.answers.forEach(a => {
    if (a.misconceptionType && a.misconceptionType in counts) {
      counts[a.misconceptionType].post++;
    }
  });

  const misconceptionRows = MISCONCEPTION_ORDER.map(type => ({
    type,
    label: MISCONCEPTION_LABELS[type],
    color: MISCONCEPTION_COLORS[type],
    pre: counts[type].pre,
    post: counts[type].post,
    improvement: counts[type].pre - counts[type].post,
  }));

  const chartData = [
    { name: 'Pre-Test', score: preAccuracy },
    { name: 'Post-Test', score: postAccuracy },
  ];

  const improved = scoreDelta > 0;
  const summaryMessage = improved
    ? "Excellent progress! Keep up the great work."
    : scoreDelta === 0
    ? "Keep practicing — you'll improve!"
    : "Don't give up! Every mistake is a lesson.";

  const handleBack = () => {
    resetAll();
    onBack();
  };

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div style={{ backgroundColor: '#5C35A0' }}>
        <StepProgressBar currentStep={4} />
        <div className="px-8 pb-5">
          <h1 className="text-2xl font-heading text-white">Summary</h1>
          <p className="text-white/80 text-sm mt-1">See Your Improvement</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-md">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Summary of Your Progress</h2>
                <p className="text-gray-500 text-sm">
                  Well done{student?.name ? `, ${student.name}` : ''}! Keep it up! 🎉
                </p>
              </div>
            </div>
            <button
              onClick={() => {/* future: download PDF */}}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-all"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>

          {/* 4 Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Target className="w-5 h-5 text-white" />}
              iconBg="bg-indigo-500"
              title="Score Improvement"
              pre={`${preScore} / ${totalQ}`}
              post={`${postScore} / ${totalQ}`}
              delta={scoreDelta >= 0 ? `+${scoreDelta} points improvement!` : `${scoreDelta} points`}
              deltaPositive={scoreDelta >= 0}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              iconBg="bg-green-500"
              title="Accuracy Improvement"
              pre={`${preAccuracy}%`}
              post={`${postAccuracy}%`}
              delta={accuracyDelta >= 0 ? `+${accuracyDelta}% improvement!` : `${accuracyDelta}%`}
              deltaPositive={accuracyDelta >= 0}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-white" />}
              iconBg="bg-blue-500"
              title="Time Taken"
              pre={formatTime(preTimeMs)}
              post={formatTime(postTimeMs)}
              delta={timeDelta > 0 ? 'You are faster!' : timeDelta === 0 ? 'Same speed' : 'Took a bit longer'}
              deltaPositive={timeDelta >= 0}
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5 text-white" />}
              iconBg="bg-amber-500"
              title="Questions Attempted"
              pre={`${runPre.answers.length} / ${totalQ}`}
              post={`${runPost.answers.length} / ${totalQ}`}
              delta={
                runPre.answers.length === totalQ && runPost.answers.length === totalQ
                  ? 'Great consistency!'
                  : 'Keep going!'
              }
              deltaPositive={true}
            />
          </div>

          {/* Lower section: table + chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Misconception Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                Misconception Breakdown
              </h3>
              <p className="text-gray-400 text-xs mb-4">Number of errors per misconception type</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-semibold">Misconception Type</th>
                      <th className="text-center pb-2 font-semibold w-20">Pre-Test</th>
                      <th className="text-center pb-2 font-semibold w-20">Post-Test</th>
                      <th className="text-center pb-2 font-semibold w-24">Improvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {misconceptionRows.map(row => (
                      <tr key={row.type} className="py-2">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="text-gray-700 text-xs font-medium">{row.label}</span>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-gray-700">{row.pre}</span>
                            {row.pre > 0 && (
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, (row.pre / 4) * 100)}%`,
                                    backgroundColor: row.color,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-gray-700">{row.post}</span>
                            {row.post > 0 && (
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, (row.post / 4) * 100)}%`,
                                    backgroundColor: row.color,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          {row.improvement > 0 && (
                            <span className="text-green-600 font-bold text-xs">
                              -{row.improvement} ↓
                            </span>
                          )}
                          {row.improvement < 0 && (
                            <span className="text-red-500 font-bold text-xs">
                              +{Math.abs(row.improvement)} ↑
                            </span>
                          )}
                          {row.improvement === 0 && row.pre === 0 && (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                          {row.improvement === 0 && row.pre > 0 && (
                            <span className="text-gray-400 font-bold text-xs">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-xs">
                  You made fewer mistakes in most areas. Keep practicing!
                </p>
              </div>
            </div>

            {/* Performance chart + encouragement */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1">
                <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Performance Improvement
                </h3>
                <p className="text-gray-400 text-xs mb-4">Score (%) — Pre-Test vs Post-Test</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="40%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Score']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#5C35A0' : '#F5A623'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Encouragement card */}
              <div
                className="rounded-2xl p-5 text-white flex items-center gap-4"
                style={{ backgroundColor: improved ? '#5C35A0' : '#6b7280' }}
              >
                <div className="text-4xl flex-shrink-0">🧠</div>
                <div>
                  <div className="font-bold flex items-center gap-1 mb-1">
                    {improved ? 'Excellent Progress!' : 'Keep Practicing!'}
                    {improved && <Star className="w-4 h-4 text-amber-300" />}
                  </div>
                  <p className="text-white/90 text-sm">{summaryMessage}</p>
                  {improved && (
                    <p className="text-white/70 text-xs mt-1">
                      Keep up the great work and continue practicing!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <button
              onClick={onReviewAnswers}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: '#5C35A0', color: '#5C35A0' }}
            >
              <RotateCcw className="w-4 h-4" />
              Review Answers
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: '#5C35A0' }}
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
      </div>
    </div>
  );
}
