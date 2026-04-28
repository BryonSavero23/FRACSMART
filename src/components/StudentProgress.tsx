import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Trophy, Target, Calendar } from 'lucide-react';
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
import { useAuth } from '../contexts/AuthContext';

const misconceptionLabels: Record<string, string> = {
  adding_fractions: 'Additive Interference',
  whole_number_bias: 'Whole Number Bias',
  denominator_only: 'Denominator Multiplication Only',
  numerator_only: 'Mixed Number Errors',
  unsimplified: 'Simplification Confusion',
  other: 'General Wrong Answer',
};

const misconceptionColors: Record<string, string> = {
  adding_fractions: '#ef4444',
  whole_number_bias: '#f97316',
  denominator_only: '#eab308',
  numerator_only: '#22c55e',
  unsimplified: '#3b82f6',
  other: '#8b5cf6',
};

export function StudentProgress() {
  const { student } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allAnswers, setAllAnswers] = useState<SessionAnswer[]>([]);
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
      name: misconceptionLabels[type] || type,
      type,
      count,
      color: misconceptionColors[type] || '#6b7280',
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

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-indigo-700 mb-2">My Progress</h1>
          <p className="text-gray-600">Track your learning journey!</p>
        </div>

        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl text-gray-600 mb-2">No Practice Sessions Yet</h3>
          <p className="text-gray-500">Complete some practice sessions to see your progress here!</p>
        </div>
      </div>
    );
  }

  const scoreData = getScoreChartData();
  const misconceptionData = getMisconceptionData();
  const stats = getTotalStats();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl text-indigo-700 mb-2">My Progress</h1>
        <p className="text-gray-600">Track your learning journey, {student?.name}!</p>
      </div>

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
    </div>
  );
}
