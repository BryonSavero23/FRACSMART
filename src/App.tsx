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
import { TestReview } from './components/TestReview';
import { supabase } from './lib/supabase';

const ALL_PRACTICE_KEY = (id: string) => `fracsmart_allpractice_${id}`;

function AppContent() {
  const { student, teacher, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [completedDifficulty, setCompletedDifficulty] = useState<string | null>(null);
  const [progressKey, setProgressKey] = useState(0);
  const [allPracticeComplete, setAllPracticeComplete] = useState(false);

  useEffect(() => {
    if (!student) return;
    const allPractice = localStorage.getItem(ALL_PRACTICE_KEY(student.id));
    if (allPractice) {
      setAllPracticeComplete(true);
      return;
    }
    supabase
      .from('sessions')
      .select('difficulty, questions_answered')
      .eq('student_id', student.id)
      .then(({ data }) => {
        if (!data) return;
        const completed = new Set<string>();
        data.forEach(s => {
          const needed = s.difficulty === 'beginner' ? 5 : 10;
          if (s.questions_answered >= needed) completed.add(s.difficulty);
        });
        if (completed.has('beginner') && completed.has('intermediate') && completed.has('advanced')) {
          localStorage.setItem(ALL_PRACTICE_KEY(student.id), 'done');
          setAllPracticeComplete(true);
        }
      });
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
    return <Login onLogin={(isNewStudent) => setCurrentPage(isNewStudent ? 'pretest' : 'home')} />;
  }

  if (teacher) {
    return <TeacherDashboard />;
  }

  const navigateTo = (page: string) => {
    if (page === 'posttest' && !allPracticeComplete) return;
    if (page === 'progress') setProgressKey(k => k + 1);
    setCurrentPage(page);
  };

  const handlePracticeComplete = (sessionId: string, difficulty: string) => {
    setCurrentSessionId(sessionId);
    setCompletedDifficulty(difficulty);
    if (difficulty === 'advanced' && student) {
      localStorage.setItem(ALL_PRACTICE_KEY(student.id), 'done');
      setAllPracticeComplete(true);
    }
    setCurrentPage('results');
  };

  const getContinueAction = () => {
    if (completedDifficulty === 'beginner') return { label: 'Continue to Intermediate', dest: 'practice' };
    if (completedDifficulty === 'intermediate') return { label: 'Continue to Advanced', dest: 'practice' };
    return { label: 'Continue to Post-Test', dest: 'posttest' };
  };

  const isQuizPage = ['pretest', 'posttest', 'quiz-summary', 'test-review'].includes(currentPage);

  const renderStudentPage = () => {

    switch (currentPage) {
      case 'home':
        return <StudentHome onNavigate={navigateTo} allPracticeComplete={allPracticeComplete} />;
      case 'learn':
        return (
          <LearnMode
            onBack={() => navigateTo('home')}
            onNext={() => navigateTo('practice')}
          />
        );
      case 'practice':
        return <PracticeMode onComplete={handlePracticeComplete} />;
      case 'results': {
        const { label, dest } = getContinueAction();
        return currentSessionId ? (
          <SessionResults
            sessionId={currentSessionId}
            onBack={() => navigateTo('home')}
            onContinue={() => navigateTo(dest)}
            continueLabel={label}
          />
        ) : (
          <StudentHome onNavigate={navigateTo} allPracticeComplete={allPracticeComplete} />
        );
      }
      case 'progress':
        return <StudentProgress key={progressKey} />;
      case 'pretest':
        return (
          <TestMode
            mode="pre"
            onComplete={() => navigateTo('learn')}
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
        return <QuizSummary onReviewAnswers={() => navigateTo('test-review')} onBack={() => navigateTo('home')} />;
      case 'test-review':
        return <TestReview onBack={() => navigateTo('quiz-summary')} />;
      default:
        return <StudentHome onNavigate={navigateTo} allPracticeComplete={allPracticeComplete} />;
    }
  };

  return (
    <div className={isQuizPage ? 'min-h-screen bg-gray-50' : 'min-h-screen bg-gradient-to-br from-indigo-50 to-amber-50'}>
      <StudentNav currentPage={currentPage} onNavigate={navigateTo} postTestUnlocked={allPracticeComplete} />
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
