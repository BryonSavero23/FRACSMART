import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Gamepad2, BarChart3, Star, Trophy, Target, ClipboardCheck, Lock } from 'lucide-react';
import { Fraction } from './Fraction';

interface StudentHomeProps {
  onNavigate: (page: string) => void;
  allPracticeComplete: boolean;
}

export function StudentHome({ onNavigate, allPracticeComplete }: StudentHomeProps) {
  const { student } = useAuth();

  const menuItems = [
    {
      id: 'learn',
      title: 'Learn',
      description: 'Explore lessons about fraction multiplication',
      icon: BookOpen,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-500',
      locked: false,
    },
    {
      id: 'practice',
      title: 'Practice',
      description: 'Complete all 3 levels: Beginner, Intermediate, Advanced',
      icon: Gamepad2,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-500',
      locked: false,
    },
    {
      id: 'posttest',
      title: 'Post-Test',
      description: allPracticeComplete
        ? 'Take your final assessment!'
        : 'Complete all 3 practice levels to unlock',
      icon: allPracticeComplete ? ClipboardCheck : Lock,
      bgColor: allPracticeComplete ? 'bg-violet-100' : 'bg-gray-100',
      iconColor: allPracticeComplete ? 'text-violet-500' : 'text-gray-400',
      locked: !allPracticeComplete,
    },
    {
      id: 'progress',
      title: 'My Progress',
      description: 'See how much you have improved',
      icon: BarChart3,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-500',
      locked: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl text-indigo-700 mb-2">
          Welcome, {student?.name}!
        </h1>
        <p className="text-gray-600">Ready to learn about fraction multiplication?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-indigo-700">{student?.total_score || 0}</p>
          <p className="text-sm text-gray-600">Total Points</p>
        </div>
        <div className="card text-center">
          <Trophy className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-indigo-600">{student?.sessions_completed || 0}</p>
          <p className="text-sm text-gray-600">Sessions Completed</p>
        </div>
        <div className="card text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-green-600">{student?.class_code}</p>
          <p className="text-sm text-gray-600">Class Code</p>
        </div>
      </div>

      <div className="space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => !item.locked && onNavigate(item.id)}
              disabled={item.locked}
              className={`w-full card text-left transition-all ${
                item.locked ? 'opacity-60 cursor-not-allowed' : 'card-hover'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${item.bgColor} rounded-2xl flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {!item.locked && (
                  <div className="text-indigo-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 card bg-indigo-50 border-2 border-indigo-200">
        <h3 className="text-lg text-indigo-700 mb-2">Quick Tip</h3>
        <p className="text-gray-700">
          When multiplying fractions, remember: multiply the tops together, then multiply the bottoms together!
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Fraction numerator={2} denominator={3} color="text-indigo-600" size="lg" />
          <span className="text-2xl font-bold text-gray-400">×</span>
          <Fraction numerator={1} denominator={4} color="text-indigo-600" size="lg" />
          <span className="text-2xl font-bold text-gray-400">=</span>
          <Fraction numerator={2} denominator={12} color="text-amber-500" size="lg" />
        </div>
      </div>
    </div>
  );
}
