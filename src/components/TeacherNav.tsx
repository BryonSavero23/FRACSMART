import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, LayoutDashboard, LogOut } from 'lucide-react';

interface TeacherNavProps {
  onLogout: () => void;
}

export function TeacherNav({ onLogout }: TeacherNavProps) {
  const { teacher } = useAuth();

  return (
    <nav className="bg-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <span className="text-xl text-white">FracSmart</span>
              <span className="ml-2 text-sm text-indigo-200">Teacher Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl">
              <LayoutDashboard className="w-5 h-5 text-indigo-200" />
              <span className="text-white font-semibold">Dashboard</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-indigo-200">Welcome,</span>
              <span className="ml-1 text-white font-semibold">{teacher?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
