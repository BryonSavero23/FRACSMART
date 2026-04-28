import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { StudentNav } from './components/StudentNav';
import { TeacherNav } from './components/TeacherNav';
import { StudentHome } from './components/StudentHome';
import { LearnMode } from './components/LearnMode';
import { PracticeMode } from './components/PracticeMode';
import { SessionResults } from './components/SessionResults';
import { StudentProgress } from './components/StudentProgress';
import { TeacherDashboard } from './components/TeacherDashboard';

function AppContent() {
  const { student, teacher, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading FracSmart...</p>
        </div>
      </div>
    );
  }

  if (!student && !teacher) {
    return <Login onLogin={() => setCurrentPage('home')} />;
  }

  if (teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800">
        <TeacherNav onLogout={logout} />
        <div className="pt-4">
          <TeacherDashboard />
        </div>
      </div>
    );
  }

  const navigateTo = (page: string) => {
    if (page === 'progress') setProgressKey(k => k + 1);
    setCurrentPage(page);
  };

  const handlePracticeComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentPage('results');
  };

  const renderStudentPage = () => {
    switch (currentPage) {
      case 'home':
        return <StudentHome onNavigate={navigateTo} />;
      case 'learn':
        return <LearnMode />;
      case 'practice':
        return <PracticeMode onComplete={handlePracticeComplete} />;
      case 'results':
        return currentSessionId ? (
          <SessionResults sessionId={currentSessionId} onBack={() => navigateTo('home')} />
        ) : (
          <StudentHome onNavigate={navigateTo} />
        );
      case 'progress':
        return <StudentProgress key={progressKey} />;
      default:
        return <StudentHome onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50">
      <StudentNav currentPage={currentPage} onNavigate={navigateTo} />
      <main className="py-6">
        {renderStudentPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
