import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, BookOpen, Gamepad2, BarChart3, LogOut } from 'lucide-react';

interface StudentNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function StudentNav({ currentPage, onNavigate }: StudentNavProps) {
  const { student, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Calculator },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Gamepad2 },
    { id: 'progress', label: 'My Progress', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-indigo-700 hidden sm:block">FracSmart</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-700">{student?.name}</span>
              <span className="text-xs text-amber-600 font-semibold">
                {student?.total_score || 0} points
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
