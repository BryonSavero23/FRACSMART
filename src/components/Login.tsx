import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Calculator, Rocket, BookOpen, Target, Trophy, Gift } from 'lucide-react';

interface LoginProps {
  onLogin: (isNewStudent: boolean) => void;
}

/* ── Floating fraction tile ─────────────────────────────── */
function FractionTile({
  num,
  den,
  bg,
  className,
}: {
  num: string;
  den: string;
  bg: string;
  className: string;
}) {
  return (
    <div
      className={`absolute ${bg} text-white rounded-2xl shadow-xl flex flex-col items-center justify-center font-extrabold select-none pointer-events-none ${className}`}
      style={{ width: 64, height: 72 }}
    >
      <span className="text-2xl leading-none">{num}</span>
      <span className="block w-8 border-t-[3px] border-white my-0.5" />
      <span className="text-2xl leading-none">{den}</span>
    </div>
  );
}

/* ── Star sparkle ────────────────────────────────────────── */
function Sparkle({ className, size = 28, delay = 0 }: { className: string; size?: number; delay?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`absolute pointer-events-none select-none animate-twinkle ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export function Login({ onLogin }: LoginProps) {
  const { loginStudent, loginTeacher } = useAuth();
  const [isStudent, setIsStudent] = useState(true);
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!name.trim()) { setError('Please enter your name'); setIsLoading(false); return; }
    if (!classCode.trim()) { setError('Please enter your class code'); setIsLoading(false); return; }
    const result = await loginStudent(name, classCode);
    setIsLoading(false);
    if (result.success) onLogin(!!result.isNewStudent);
    else setError(result.error || 'Something went wrong');
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!username.trim() || !password.trim()) { setError('Please enter both username and password'); setIsLoading(false); return; }
    const result = await loginTeacher(username, password);
    setIsLoading(false);
    if (result.success) onLogin(false);
    else setError(result.error || 'Something went wrong');
  };

  return (
    /* ── Full-page adventure canvas ── */
    <div
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #b0e0f5 25%, #c8edda 60%, #8fce88 100%)' }}
    >
      {/* ══ Clouds ══ */}
      <div className="absolute top-8 left-[7%] w-28 h-14 bg-white/80 rounded-full blur-sm pointer-events-none" />
      <div className="absolute top-5 left-[9%] w-18 h-10 bg-white/90 rounded-full blur-sm pointer-events-none" style={{ width: 72 }} />
      <div className="absolute top-10 right-[10%] w-36 h-16 bg-white/80 rounded-full blur-sm pointer-events-none" />
      <div className="absolute top-8 right-[12%] w-22 h-12 bg-white/90 rounded-full blur-sm pointer-events-none" style={{ width: 88 }} />

      {/* ══ Stars scattered ══ */}
      <Sparkle className="text-yellow-300" size={22} delay={0}   style={{ top: 24, left: '29%' } as React.CSSProperties} />
      <Sparkle className="text-yellow-400" size={30} delay={0.4} style={{ top: 14, left: '43%' } as React.CSSProperties} />
      <Sparkle className="text-yellow-300" size={18} delay={0.8} style={{ top: 28, left: '59%' } as React.CSSProperties} />
      <Sparkle className="text-yellow-400" size={26} delay={0.2} style={{ top: 10, right: '29%' } as React.CSSProperties} />
      <Sparkle className="text-yellow-300" size={16} delay={1.0} style={{ top: 56, right: '20%' } as React.CSSProperties} />

      {/* ══ Floating fraction tiles ══ */}
      <div className="animate-float" style={{ position: 'absolute', top: '6%', left: '3%' }}>
        <FractionTile num="1" den="2" bg="bg-rose-400" className="" />
      </div>
      <div className="animate-float-alt" style={{ position: 'absolute', top: '34%', left: '1%' }}>
        <FractionTile num="3" den="4" bg="bg-sky-400" className="" />
      </div>
      <div className="animate-float-slow" style={{ position: 'absolute', top: '57%', left: '4%' }}>
        <FractionTile num="2" den="3" bg="bg-emerald-500" className="" />
      </div>
      <div className="animate-float" style={{ position: 'absolute', top: '37%', right: '2%', animationDelay: '0.7s' }}>
        <FractionTile num="4" den="5" bg="bg-orange-400" className="" />
      </div>

      {/* ══ Math operators ══ */}
      <div className="absolute text-3xl font-extrabold text-violet-500 pointer-events-none animate-float select-none"
        style={{ top: '44%', left: '9%', animationDelay: '1s' }}>÷</div>
      <div className="absolute text-3xl font-extrabold text-violet-400 pointer-events-none animate-float-alt select-none"
        style={{ top: '62%', left: '12%', animationDelay: '0.5s' }}>×</div>

      {/* ══ Trophy — top right ══ */}
      <div className="absolute animate-float-slow pointer-events-none select-none hidden lg:block"
        style={{ top: '6%', right: '6%' }}>
        <div className="relative">
          <div className="w-20 h-20 bg-white/50 rounded-full blur-md absolute inset-0 m-auto" />
          <span className="relative text-6xl drop-shadow-lg">🏆</span>
        </div>
      </div>

      {/* ══ Robot mascot — left of title ══ */}
      <div className="absolute animate-float pointer-events-none select-none hidden lg:block"
        style={{ top: '1%', left: '19%' }}>
        <span className="text-[72px] drop-shadow-xl">🤖</span>
      </div>

      {/* ══ Cartoon boy + social proof — bottom left ══ */}
      <div className="absolute bottom-[15%] left-[1%] hidden lg:flex flex-col items-start pointer-events-none select-none">
        <div className="bg-white/95 rounded-2xl px-4 py-3 shadow-xl mb-2 border border-white" style={{ maxWidth: 180 }}>
          <p className="text-sm text-gray-700 text-center leading-snug">
            <span className="font-extrabold text-violet-600">237 students</span>
            <br />are already learning<br />and having fun! 🎉
          </p>
        </div>
        <span className="text-[80px] drop-shadow-xl">👦</span>
      </div>

      {/* ══ "You will:" benefits — bottom right ══ */}
      <div className="absolute bottom-[15%] right-[1%] hidden lg:block pointer-events-none select-none">
        <div className="bg-white/95 rounded-2xl px-5 py-4 shadow-xl border border-white" style={{ minWidth: 160 }}>
          <p className="font-extrabold text-violet-600 text-sm mb-3">You will:</p>
          <ul className="space-y-2">
            {[
              { icon: '⭐', label: 'Earn Stars' },
              { icon: '🛡️', label: 'Unlock Badges' },
              { icon: '🔥', label: 'Build Streaks' },
              { icon: '🎮', label: 'Play Challenges' },
            ].map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-lg">{icon}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ══ Rolling green hills ══ */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 140,
          background: 'radial-gradient(ellipse 110% 120% at 50% 110%, #4ade80 0%, #22c55e 55%, #16a34a 100%)',
          borderRadius: '60% 60% 0 0 / 35% 35% 0 0',
        }}
      />
      <div
        className="absolute bottom-0 pointer-events-none"
        style={{
          left: '-5%', right: '-5%', height: 110,
          background: 'radial-gradient(ellipse 80% 120% at 25% 110%, #86efac 0%, #4ade80 100%)',
          borderRadius: '55% 75% 0 0 / 45% 45% 0 0',
          opacity: 0.65,
        }}
      />

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-5 pb-44 flex-1">

        {/* ── Speech bubble (desktop) ── */}
        <div className="hidden lg:block absolute" style={{ top: '7%', right: '15%' }}>
          <div className="bg-white rounded-2xl px-5 py-3 shadow-lg text-center text-sm font-semibold text-gray-700 relative" style={{ maxWidth: 165 }}>
            Hi there!<br />Let's become<br />
            <span className="text-violet-600 font-extrabold">Fraction<br />Heroes!</span>
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: -13, width: 0, height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '14px solid white',
              }}
            />
          </div>
        </div>

        {/* ── FracSmart title ── */}
        <h1
          className="text-center leading-none mb-2 drop-shadow-md"
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(52px, 7.5vw, 88px)',
          }}
        >
          <span style={{ color: '#2563eb', WebkitTextStroke: '3px white', paintOrder: 'stroke fill' }}>Frac</span>
          <span style={{ color: '#7c3aed', WebkitTextStroke: '3px white', paintOrder: 'stroke fill' }}>Smart</span>
        </h1>

        {/* ── Subtitle banner ── */}
        <div className="bg-violet-600 rounded-full px-7 py-2 shadow-lg mb-3">
          <p className="text-white font-extrabold text-sm md:text-base tracking-wide text-center whitespace-nowrap">
            Learn Fractions.{' '}
            <span className="text-yellow-300">Earn Stars.</span>{' '}
            Be a Hero!
          </p>
        </div>

        {/* ── Sub-subtext ── */}
        <p className="text-gray-700 font-semibold text-sm md:text-base text-center">
          Multiply fractions the fun way through
        </p>
        <p className="font-extrabold text-base md:text-xl text-center mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
          <span className="text-violet-600">Games, Challenges</span>
          <span className="text-gray-700"> &amp; </span>
          <span className="text-violet-600">Adventures!</span>
          <span className="ml-1.5">🚀</span>
        </p>

        {/* ── Login card ── */}
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-7 border border-gray-100">

          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setIsStudent(true); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
                ${isStudent ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>
            <button
              onClick={() => { setIsStudent(false); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
                ${!isStudent ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calculator className="w-5 h-5" />
              Teacher
            </button>
          </div>

          {isStudent ? (
            <form onSubmit={handleStudentLogin} className="space-y-5">
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <span>👤</span> Your Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your Full Name"
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-base transition-all bg-gray-50 focus:bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl pointer-events-none">😊</span>
                </div>
              </div>

              {/* Class code */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <span>🏫</span> Class Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="E.g., MATH5K"
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-base transition-all bg-gray-50 focus:bg-white uppercase tracking-widest"
                    maxLength={10}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl pointer-events-none">⭐</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl font-extrabold text-xl text-white flex items-center justify-center gap-3 shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              >
                <Rocket className="w-6 h-6" />
                {isLoading ? 'Joining...' : 'Start Adventure!'}
              </button>

              <p className="text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1.5">
                <span className="text-amber-400">⭐</span>
                Your learning adventure starts here!
              </p>
            </form>
          ) : (
            <form onSubmit={handleTeacherLogin} className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <span>👤</span> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-base transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
                  <span>🔒</span> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-base transition-all bg-gray-50 focus:bg-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl font-extrabold text-xl text-white flex items-center justify-center gap-3 shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              >
                <Calculator className="w-6 h-6" />
                {isLoading ? 'Logging in...' : 'Login to Dashboard'}
              </button>
            </form>
          )}
        </div>

        {/* ── Bottom feature strip ── */}
        <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { emoji: '📖', title: 'Learn',    desc: 'Understand with easy lessons!',  titleColor: 'text-orange-600', bg: 'bg-orange-50/90' },
            { emoji: '🎯', title: 'Practice', desc: 'Solve fun questions!',            titleColor: 'text-blue-600',   bg: 'bg-blue-50/90'   },
            { emoji: '🏆', title: 'Improve',  desc: 'Get feedback & level up!',        titleColor: 'text-violet-600', bg: 'bg-violet-50/90' },
            { emoji: '🎁', title: 'Achieve',  desc: 'Win rewards & be a champion!',    titleColor: 'text-orange-600', bg: 'bg-amber-50/90'  },
          ].map(({ emoji, title, desc, titleColor, bg }) => (
            <div key={title} className={`${bg} rounded-2xl px-4 py-4 shadow-md border border-white/80 flex flex-col items-start gap-1.5`}>
              <span className="text-3xl">{emoji}</span>
              <p className={`font-extrabold text-sm ${titleColor}`} style={{ fontFamily: "'Fredoka One', cursive" }}>{title}</p>
              <p className="text-xs text-gray-500 font-semibold leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
