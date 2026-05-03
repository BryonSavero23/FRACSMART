import React from 'react';
import { LayoutDashboard, BookOpen, Gamepad2, Star, BarChart3, LogOut, Calculator } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface QuizSidebarProps {
  activeItem: 'home' | 'learn' | 'practice' | 'quiz' | 'progress';
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard, targetPage: 'home' },
  { id: 'learn', label: 'Learn', icon: BookOpen, targetPage: 'learn' },
  { id: 'practice', label: 'Practice', icon: Gamepad2, targetPage: 'practice' },
  { id: 'quiz', label: 'Quiz', icon: Star, targetPage: 'pretest' },
  { id: 'progress', label: 'My Progress', icon: BarChart3, targetPage: 'progress' },
] as const;

type NavId = typeof NAV_ITEMS[number]['id'];

export function QuizSidebar({ activeItem, onNavigate, onLogout }: QuizSidebarProps) {
  const { student } = useAuth();

  const getLevelLabel = (score: number) => {
    if (score >= 500) return 'Pakar';
    if (score >= 200) return 'Pengamal';
    if (score >= 100) return 'Pelajar';
    return 'Pemula';
  };

  return (
    <aside
      className="flex flex-col w-60 min-h-screen flex-shrink-0"
      style={{ backgroundColor: '#1E1A3C' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#5C35A0' }}
        >
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-heading text-lg leading-none">FracSmart</div>
          <div className="text-white/50 text-[10px] leading-tight mt-0.5">Master Fractions, Smartly!</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.targetPage)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full text-left transition-all duration-150 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              style={isActive ? { backgroundColor: '#5C35A0' } : {}}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}

        <div className="mt-auto pt-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full text-left text-white/60 hover:text-white hover:bg-red-500/20 transition-all duration-150"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </nav>

      {/* Student info */}
      {student && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: '#5C35A0' }}
            >
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{student.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-amber-400 text-xs font-bold">
                  {student.total_score || 0} pts
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ backgroundColor: '#5C35A0' }}
                >
                  {getLevelLabel(student.total_score || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
