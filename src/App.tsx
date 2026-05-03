import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { StudentNav } from './components/StudentNav';
import { StudentHome } from './components/StudentHome';
import { LearnMode } from './components/LearnMode';
import { PracticeMode } from './components/PracticeMode';
import { SessionResults } from './components/SessionResults';
import { StudentProgress } from './components/StudentProgress';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TestMode } from './components/TestMode';
import { QuizSummary } from './components/QuizSummary';

const PRETEST_KEY = (id: string) => `fracsmart_pretest_${id}`;

function AppContent() {
  const { student, teacher, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  // Redirect new students (no completed pre-test) straight to pre-test
  useEffect(() => {
    if (student) {
      const done = localStorage.getItem(PRETEST_KEY(student.id));
      if (!done) setCurrentPage('pretest');
    }
  }, [student?.id]);

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
    return <TeacherDashboard />;
  }

  const navigateTo = (page: string) => {
    if (page === 'progress') setProgressKey(k => k + 1);
    setCurrentPage(page);
  };

  const handlePracticeComplete = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentPage('results');
  };

  const markPreTestDone = () => {
    if (student) localStorage.setItem(PRETEST_KEY(student.id), 'done');
  };

  const isQuizPage = ['pretest', 'posttest', 'quiz-summary'].includes(currentPage);

  const renderStudentPage = () => {
    switch (currentPage) {
      case 'home':
        return <StudentHome onNavigate={navigateTo} />;
      case 'learn':
        return (
          <LearnMode
            onBack={() => navigateTo('home')}
            onNext={() => navigateTo('practice')}
          />
        );
      case 'practice':
        return <PracticeMode onComplete={handlePracticeComplete} />;
      case 'results':
        return currentSessionId ? (
          <SessionResults
            sessionId={currentSessionId}
            onBack={() => navigateTo('home')}
            onContinueToPostTest={() => navigateTo('posttest')}
          />
        ) : (
          <StudentHome onNavigate={navigateTo} />
        );
      case 'progress':
        return <StudentProgress key={progressKey} />;
      case 'pretest':
        return (
          <TestMode
            mode="pre"
            onComplete={() => { markPreTestDone(); navigateTo('learn'); }}
            onBack={() => navigateTo('home')}
          />
        );
      case 'posttest':
        return (
          <TestMode
            mode="post"
            onComplete={() => navigateTo('quiz-summary')}
            onBack={() => navigateTo('practice')}
          />
        );
      case 'quiz-summary':
        return <QuizSummary onReviewAnswers={() => {}} onBack={() => navigateTo('home')} />;
      default:
        return <StudentHome onNavigate={navigateTo} />;
    }
  };

  return (
    <div className={isQuizPage ? '' : 'min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50'}>
      {!isQuizPage && <StudentNav currentPage={currentPage} onNavigate={navigateTo} />}
      <main className={isQuizPage ? '' : 'py-6'}>
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
