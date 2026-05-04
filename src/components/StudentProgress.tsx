import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Trophy, Target, Calendar, Brain, ArrowRight, Star, CheckCircle, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { supabase, Session, SessionAnswer } from '../lib/supabase';
import type { TestSession, TestAnswer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { MisconceptionType } from '../lib/misconceptionTypes';
import { MISCONCEPTION_LABELS, MISCONCEPTION_COLORS, MISCONCEPTION_ORDER } from '../lib/misconceptionTypes';

function formatTime(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface TestRunData {
  preSession: TestSession;
  postSession: TestSession;
  preAnswers: TestAnswer[];
  postAnswers: TestAnswer[];
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

export function StudentProgress() {
  const { student } = useAuth();
  const [activeTab, setActiveTab] = useState<'progress' | 'report'>('progress');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allAnswers, setAllAnswers] = useState<SessionAnswer[]>([]);
  const [testData, setTestData] = useState<TestRunData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (student?.id) {
      fetchProgressData();
    }
  }, [student?.id]);

  const fetchProgressData = async () => {
    if (!student) return;

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });

    if (sessionsData) {
      setSessions(sessionsData);
    }

    if (sessionsData && sessionsData.length > 0) {
      const sessionIds = sessionsData.map((s) => s.id);
      const { data: answersData } = await supabase
        .from('session_answers')
        .select('*')
        .in('session_id', sessionIds);

      if (answersData) {
        setAllAnswers(answersData);
      }
    }

    const { data: testSessions } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('student_id', student.id)
      .in('test_type', ['pre', 'post'])
      .order('created_at', { ascending: false });

    if (testSessions?.length) {
      const preSession = testSessions.find((s: TestSession) => s.test_type === 'pre');
      const postSession = testSessions.find((s: TestSession) => s.test_type === 'post');

      if (preSession && postSession) {
        const [preAnswersRes, postAnswersRes] = await Promise.all([
          supabase.from('test_answers').select('*').eq('session_id', preSession.id).order('question_num'),
          supabase.from('test_answers').select('*').eq('session_id', postSession.id).order('question_num'),
        ]);

        setTestData({
          preSession,
          postSession,
          preAnswers: preAnswersRes.data ?? [],
          postAnswers: postAnswersRes.data ?? [],
        });
      }
    }

    setIsLoading(false);
  };

  const getScoreChartData = () => {
    return sessions.map((session, index) => ({
      name: `Session ${index + 1}`,
      score: session.score,
      accuracy:
        session.questions_answered > 0
          ? Math.round((session.correct_answers / session.questions_answered) * 100)
          : 0,
      date: new Date(session.created_at).toLocaleDateString(),
    }));
  };

  const getMisconceptionData = () => {
    const counts: Record<string, number> = {};

    allAnswers.forEach((answer) => {
      if (!answer.is_correct && answer.misconception_type) {
        counts[answer.misconception_type] = (counts[answer.misconception_type] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([type, count]) => ({
      name: MISCONCEPTION_LABELS[type as NonNullable<MisconceptionType>] ?? type,
      type,
      count,
      color: MISCONCEPTION_COLORS[type as NonNullable<MisconceptionType>] ?? '#6b7280',
    }));
  };

  const getTotalStats = () => {
    const totalQuestions = allAnswers.length;
    const correctAnswers = allAnswers.filter((a) => a.is_correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const bestScore = sessions.length > 0 ? Math.max(...sessions.map((s) => s.score)) : 0;
    const totalPoints = sessions.reduce((sum, s) => sum + s.score, 0);
    const avgScore =
      sessions.length > 0
        ? Math.round(totalPoints / sessions.length)
        : 0;

    return { totalQuestions, correctAnswers, accuracy, bestScore, avgScore, totalPoints };
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const scoreData = getScoreChartData();
  const misconceptionData = getMisconceptionData();
  const stats = getTotalStats();

  const renderReportTab = () => {
    if (!testData) {
      return (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-600 mb-2">No Test Report Yet</h3>
          <p className="text-gray-500">Complete both the Pre-Test and Post-Test to see your report here!</p>
        </div>
      );
    }

    const { preSession, postSession, preAnswers, postAnswers } = testData;
    const totalQ = 8;
    const preScore = preSession.score;
    const postScore = postSession.score;
    const preAccuracy = Math.round((preScore / totalQ) * 100);
    const postAccuracy = Math.round((postScore / totalQ) * 100);
    const scoreDelta = postScore - preScore;
    const accuracyDelta = postAccuracy - preAccuracy;

    const preTimeMs = preSession.started_at && preSession.completed_at
      ? new Date(preSession.completed_at).getTime() - new Date(preSession.started_at).getTime()
      : 0;
    const postTimeMs = postSession.started_at && postSession.completed_at
      ? new Date(postSession.completed_at).getTime() - new Date(postSession.started_at).getTime()
      : 0;
    const timeDelta = preTimeMs - postTimeMs;

    const counts: Record<string, { pre: number; post: number }> = {};
    MISCONCEPTION_ORDER.forEach(t => { counts[t] = { pre: 0, post: 0 }; });

    preAnswers.forEach((a: TestAnswer) => {
      const mt = a.misconception_type as NonNullable<MisconceptionType> | null;
      if (mt && mt in counts) counts[mt].pre++;
    });
    postAnswers.forEach((a: TestAnswer) => {
      const mt = a.misconception_type as NonNullable<MisconceptionType> | null;
      if (mt && mt in counts) counts[mt].post++;
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
      ? 'Excellent progress! Keep up the great work.'
      : scoreDelta === 0
      ? "Keep practicing — you'll improve!"
      : "Don't give up! Every mistake is a lesson.";

    return (
      <div>
        {/* Title row */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* 4 stat cards */}
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
            pre={`${preAnswers.length} / ${totalQ}`}
            post={`${postAnswers.length} / ${totalQ}`}
            delta={
              preAnswers.length === totalQ && postAnswers.length === totalQ
                ? 'Great consistency!'
                : 'Keep going!'
            }
            deltaPositive={true}
          />
        </div>

        {/* Misconception breakdown + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <span className="text-green-600 font-bold text-xs">-{row.improvement} ↓</span>
                        )}
                        {row.improvement < 0 && (
                          <span className="text-red-500 font-bold text-xs">+{Math.abs(row.improvement)} ↑</span>
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

            <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 text-xs">
                You made fewer mistakes in most areas. Keep practicing!
              </p>
            </div>
          </div>

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
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl text-indigo-700 mb-2">My Progress</h1>
        <p className="text-gray-600">Track your learning journey, {student?.name}!</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-all ${
            activeTab === 'progress'
              ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Practice Progress
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-all ${
            activeTab === 'report'
              ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Report
        </button>
      </div>

      {/* Practice Progress Tab */}
      {activeTab === 'progress' && (
        <>
          {sessions.length === 0 ? (
            <div className="card text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl text-gray-600 mb-2">No Practice Sessions Yet</h3>
              <p className="text-gray-500">Complete some practice sessions to see your progress here!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-indigo-700">{stats.totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
                <div className="card text-center">
                  <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">{stats.accuracy}%</p>
                  <p className="text-sm text-gray-600">Overall Accuracy</p>
                </div>
                <div className="card text-center">
                  <TrendingUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-indigo-600">{stats.bestScore}</p>
                  <p className="text-sm text-gray-600">Best Score</p>
                </div>
                <div className="card text-center">
                  <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{sessions.length}</p>
                  <p className="text-sm text-gray-600">Sessions</p>
                </div>
              </div>

              <div className="card mb-6">
                <h3 className="text-xl text-indigo-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Score History
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                        name="Score"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                        name="Accuracy %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded" />
                    <span className="text-sm text-gray-600">Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded" />
                    <span className="text-sm text-gray-600">Accuracy %</span>
                  </div>
                </div>
              </div>

              {misconceptionData.length > 0 && (
                <div className="card mb-6">
                  <h3 className="text-xl text-indigo-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    My Common Mistakes
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={misconceptionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
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
                </div>
              )}

              <div className="card">
                <h3 className="text-xl text-indigo-700 mb-4">Session History</h3>
                <div className="space-y-3">
                  {sessions
                    .slice()
                    .reverse()
                    .map((session, index) => {
                      const sessionNum = sessions.length - index;
                      const accuracy =
                        session.questions_answered > 0
                          ? Math.round((session.correct_answers / session.questions_answered) * 100)
                          : 0;

                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <span className="text-lg font-bold text-indigo-600">#{sessionNum}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700">
                                {new Date(session.created_at).toLocaleDateString('en-MY', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{session.difficulty} difficulty</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-lg font-bold text-indigo-600">{session.score}</p>
                              <p className="text-xs text-gray-500">points</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{accuracy}%</p>
                              <p className="text-xs text-gray-500">accuracy</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-amber-600">
                                {session.correct_answers}/{session.questions_answered}
                              </p>
                              <p className="text-xs text-gray-500">correct</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* My Report Tab */}
      {activeTab === 'report' && renderReportTab()}
    </div>
  );
}
