import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BarChart3, LogOut,
  Calculator, Download, X, ChevronUp, ChevronDown,
  AlertTriangle, TrendingUp, Star, FileText,
  Brain, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MockStudent } from '../data/mockTeacherData';
import { supabase } from '../lib/supabase';
import type { MisconceptionType } from '../lib/misconceptionTypes';
import { MISCONCEPTION_LABELS, MISCONCEPTION_TYPES_LIST } from '../lib/misconceptionTypes';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'heatmap';

function getStatus(pre: number, post: number): MockStudent['status'] {
  if (pre === 0 && post === 0) return 'Not Started';
  if (post > pre) return 'Improved';
  return 'Needs Attention';
}

function getTopMisconception(counts: MockStudent['misconceptionCounts']): string {
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0
    ? (MISCONCEPTION_LABELS[top[0] as NonNullable<MisconceptionType>] ?? top[0])
    : '—';
}

// ─── CSV export ──────────────────────────────────────────────────────────────

function downloadCSV(students: MockStudent[]) {
  const headers = [
    'Name', 'Class', 'Pre-Test Score', 'Post-Test Score', 'Improvement',
    'Top Misconception', 'Status', 'Additive Interference', 'Whole Number Bias',
    'Only Multiplied Denominators', 'Only Multiplied Numerators', 'Mixed Number Error',
    'Simplification Confusion', 'Other Errors',
  ];
  const rows = students.map(s => [
    s.name, s.classCode, s.preScore, s.postScore,
    s.postScore - s.preScore, s.topMisconception, s.status,
    s.misconceptionCounts.adding_fractions, s.misconceptionCounts.whole_number_bias,
    s.misconceptionCounts.denominator_only, s.misconceptionCounts.numerator_only,
    s.misconceptionCounts.mixed_number_error,
    s.misconceptionCounts.unsimplified, s.misconceptionCounts.other,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface TeacherSidebarProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  onLogout: () => void;
  teacherName: string | undefined;
}

function TeacherSidebar({ activeTab, setActiveTab, onLogout, teacherName }: TeacherSidebarProps) {
  const NAV = [
    { id: 'overview' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'heatmap' as Tab, label: 'Heatmap', icon: BarChart3 },
  ];

  return (
    <aside className="flex flex-col w-60 min-h-screen flex-shrink-0" style={{ backgroundColor: '#1E1A3C' }}>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#5C35A0' }}>
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-heading text-lg leading-none">FracSmart</div>
          <div className="text-white/50 text-[10px] leading-tight mt-0.5">Master Fractions, Smartly!</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full text-left transition-all duration-150 ${
                isActive ? 'text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/10'
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

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#5C35A0' }}>
            {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold truncate">{teacherName || 'Teacher'}</div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold inline-block mt-0.5"
              style={{ backgroundColor: '#F5A623' }}
            >
              Teacher
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MockStudent['status'] }) {
  const styles: Record<MockStudent['status'], string> = {
    'Improved': 'bg-green-100 text-green-700',
    'Needs Attention': 'bg-orange-100 text-orange-700',
    'Not Started': 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Class Overview Cards ─────────────────────────────────────────────────────

function OverviewCards({ students }: { students: MockStudent[] }) {
  const active = students.filter(s => s.preScore > 0 && s.postScore > 0);
  const total = students.length;
  const avgPre = active.length ? Math.round(active.reduce((s, x) => s + x.preScore, 0) / active.length * 100 / 8) : 0;
  const avgPost = active.length ? Math.round(active.reduce((s, x) => s + x.postScore, 0) / active.length * 100 / 8) : 0;
  const improved = active.filter(s => s.postScore > s.preScore).length;
  const improvedPct = active.length ? Math.round((improved / active.length) * 100) : 0;

  const cards = [
    { icon: <Users className="w-5 h-5 text-white" />, bg: 'bg-indigo-500', label: 'Total Students', value: String(total), sub: `${active.length} completed both tests` },
    { icon: <FileText className="w-5 h-5 text-white" />, bg: 'bg-blue-500', label: 'Avg Pre-Test', value: `${avgPre}%`, sub: 'Class baseline' },
    { icon: <TrendingUp className="w-5 h-5 text-white" />, bg: 'bg-green-500', label: 'Avg Post-Test', value: `${avgPost}%`, sub: `+${avgPost - avgPre}% avg improvement` },
    { icon: <Star className="w-5 h-5 text-white" />, bg: 'bg-amber-500', label: 'Improvement Rate', value: `${improvedPct}%`, sub: `${improved} of ${active.length} students improved` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>{c.icon}</div>
            <span className="text-xs font-semibold text-gray-500">{c.label}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{c.value}</p>
          <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Individual Student Panel ─────────────────────────────────────────────────

interface StudentPanelProps {
  student: MockStudent | null;
  note: string;
  onNoteChange: (v: string) => void;
  onClose: () => void;
}

function StudentPanel({ student, note, onNoteChange, onClose }: StudentPanelProps) {
  const isOpen = student !== null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {student && (
          <>
            <div
              className="flex items-center justify-between px-6 py-5 border-b border-white/10"
              style={{ backgroundColor: '#5C35A0' }}
            >
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{student.name}</h3>
                <div className="mt-1"><StatusBadge status={student.status} /></div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors ml-2 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Score comparison */}
              <div className="flex items-center justify-center gap-6 mb-6 p-4 bg-gray-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Pre-Test</div>
                  <div className="text-3xl font-bold" style={{ color: '#5C35A0' }}>
                    {student.preScore}<span className="text-lg text-gray-400">/8</span>
                  </div>
                  <div className="text-xs text-gray-400">{Math.round((student.preScore / 8) * 100)}%</div>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span className={`text-sm font-bold mt-1 ${student.postScore > student.preScore ? 'text-green-600' : 'text-red-500'}`}>
                    {student.postScore > student.preScore ? '+' : ''}{student.postScore - student.preScore}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-semibold mb-1">Post-Test</div>
                  <div className="text-3xl font-bold" style={{ color: '#F5A623' }}>
                    {student.postScore}<span className="text-lg text-gray-400">/8</span>
                  </div>
                  <div className="text-xs text-gray-400">{Math.round((student.postScore / 8) * 100)}%</div>
                </div>
              </div>

              {/* Misconception breakdown */}
              <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                Misconception Breakdown
              </h4>
              <div className="space-y-2.5 mb-6">
                {MISCONCEPTION_TYPES_LIST.map(mt => {
                  const count = student.misconceptionCounts[mt.key];
                  return (
                    <div key={mt.key} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mt.color }} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{mt.label}</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (count / 5) * 100)}%`, backgroundColor: mt.color }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-3 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Teacher note */}
              <h4 className="font-bold text-gray-700 text-sm mb-2">Teacher Notes (private)</h4>
              <textarea
                value={note}
                onChange={e => onNoteChange(e.target.value)}
                placeholder="Add a private note about this student..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-indigo-400 resize-none transition-colors"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

interface OverviewTabProps {
  students: MockStudent[];
  onSelectStudent: (s: MockStudent) => void;
}

function OverviewTab({ students, onSelectStudent }: OverviewTabProps) {
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const displayed = atRiskOnly ? students.filter(s => s.isAtRisk) : students;

  return (
    <div>
      <OverviewCards students={students} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Student List
            <span className="text-xs text-gray-400 font-normal ml-1">{displayed.length} student{displayed.length !== 1 ? 's' : ''}</span>
          </h3>
          <button
            onClick={() => setAtRiskOnly(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              atRiskOnly ? 'text-white shadow-md' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
            style={atRiskOnly ? { backgroundColor: '#F5A623' } : {}}
          >
            <AlertTriangle className="w-4 h-4" />
            {atRiskOnly ? 'Show All Students' : 'Show At-Risk Only'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-center">Pre-Test</th>
                <th className="px-4 py-3 text-center">Post-Test</th>
                <th className="px-4 py-3 text-center">Improvement</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Top Misconception</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map(s => {
                const improvement = s.postScore - s.preScore;
                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s)}
                    className={`cursor-pointer transition-colors ${
                      s.isAtRisk && atRiskOnly ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-indigo-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: '#5C35A0' }}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.classCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-gray-600">{s.preScore}/8</span>
                      <div className="text-xs text-gray-400">{Math.round((s.preScore / 8) * 100)}%</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-gray-800">{s.postScore}/8</span>
                      <div className="text-xs text-gray-400">{Math.round((s.postScore / 8) * 100)}%</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-bold flex items-center justify-center gap-0.5 text-sm ${
                        improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {improvement > 0 && <ChevronUp className="w-4 h-4" />}
                        {improvement < 0 && <ChevronDown className="w-4 h-4" />}
                        {improvement > 0 ? `+${improvement}` : improvement}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{s.topMisconception}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap Tab ──────────────────────────────────────────────────────────────

function HeatmapTab({ students }: { students: MockStudent[] }) {
  const active = students.filter(s => s.preScore > 0 || s.postScore > 0);

  const getCellStyle = (count: number, color: string): React.CSSProperties => {
    if (count === 0) return { backgroundColor: '#f9fafb' };
    const opacity = Math.min(1, 0.2 + (count / 5) * 0.8);
    return { backgroundColor: color, opacity };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Misconception Heatmap
        </h3>
        <p className="text-gray-400 text-xs mt-1">
          Color intensity = number of errors per student. Darker = more errors. Click a cell to see details.
        </p>
      </div>

      <div className="overflow-x-auto p-6">
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex gap-1 mb-1">
            <div className="w-44 flex-shrink-0" />
            {MISCONCEPTION_TYPES_LIST.map(mt => (
              <div key={mt.key} className="w-24 flex-shrink-0 text-center">
                <span className="text-xs font-bold" style={{ color: mt.color }}>{mt.short}</span>
              </div>
            ))}
          </div>

          {/* Student rows */}
          {active.map(s => (
            <div key={s.id} className="flex gap-1 mb-1 items-center">
              <div className="w-44 flex-shrink-0 pr-3">
                <span className="text-xs font-semibold text-gray-700 truncate block">{s.name}</span>
              </div>
              {MISCONCEPTION_TYPES_LIST.map(mt => {
                const count = s.misconceptionCounts[mt.key];
                return (
                  <div
                    key={mt.key}
                    className="w-24 flex-shrink-0 h-10 flex items-center justify-center rounded-lg border border-gray-100"
                    style={getCellStyle(count, mt.color)}
                    title={`${s.name} — ${mt.label}: ${count} error${count !== 1 ? 's' : ''}`}
                  >
                    <span className={`text-xs font-bold ${count > 0 ? 'text-white' : 'text-gray-300'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-500 font-semibold">Errors:</span>
        {[0, 1, 2, 3, 4].map(n => (
          <div key={n} className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center"
              style={n === 0 ? { backgroundColor: '#f9fafb' } : { backgroundColor: '#8b5cf6', opacity: 0.2 + (n / 5) * 0.8 }}
            >
              <span className={`text-[10px] font-bold ${n > 0 ? 'text-white' : 'text-gray-300'}`}>{n}</span>
            </div>
            <span className="text-xs text-gray-400">{n === 0 ? 'None' : n === 4 ? '4+' : ''}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">Hover cells for details</span>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const { teacher, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [teacherNotes, setTeacherNotes] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<MockStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    if (!teacher) return;
    setLoadingStudents(true);

    const fetchData = async () => {
      const { data: classCodes } = await supabase
        .from('class_codes')
        .select('code')
        .eq('teacher_id', teacher.id);

      const codes = classCodes?.map(c => c.code) ?? [];

      // If teacher has assigned class codes use them; otherwise show all students
      const baseQuery = supabase.from('students').select('*');
      const { data: studentsData } = codes.length > 0
        ? await baseQuery.in('class_code', codes)
        : await baseQuery;

      if (!studentsData || studentsData.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      const studentIds = studentsData.map(s => s.id);

      const { data: testSessions } = await supabase
        .from('test_sessions')
        .select('*')
        .in('student_id', studentIds);

      const allSessions = testSessions ?? [];
      const sessionIds = allSessions.map(s => s.id);

      const { data: testAnswers } = sessionIds.length > 0
        ? await supabase.from('test_answers').select('*').in('session_id', sessionIds)
        : { data: [] };

      const allAnswers = testAnswers ?? [];

      const mapped: MockStudent[] = studentsData.map(student => {
        const studentSessions = allSessions.filter(s => s.student_id === student.id);
        const preSessions = studentSessions
          .filter(s => s.test_type === 'pre')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const postSessions = studentSessions
          .filter(s => s.test_type === 'post')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const preScore = preSessions[0]?.score ?? 0;
        const postScore = postSessions[0]?.score ?? 0;

        const studentSessionIds = new Set(studentSessions.map(s => s.id));
        const studentAnswers = allAnswers.filter(a => studentSessionIds.has(a.session_id));

        const misconceptionCounts: MockStudent['misconceptionCounts'] = {
          adding_fractions: 0,
          whole_number_bias: 0,
          denominator_only: 0,
          numerator_only: 0,
          mixed_number_error: 0,
          unsimplified: 0,
          other: 0,
        };

        studentAnswers.forEach(a => {
          if (!a.is_correct && a.misconception_type) {
            const key = a.misconception_type as keyof typeof misconceptionCounts;
            if (key in misconceptionCounts) {
              misconceptionCounts[key]++;
            } else {
              misconceptionCounts.other++;
            }
          }
        });

        return {
          id: student.id,
          name: student.name,
          classCode: student.class_code,
          preScore,
          postScore,
          misconceptionCounts,
          topMisconception: getTopMisconception(misconceptionCounts),
          status: getStatus(preScore, postScore),
          isAtRisk: postScore <= 4 || postScore <= preScore,
          teacherNote: '',
        };
      });

      setStudents(mapped);
      setLoadingStudents(false);
    };

    fetchData();
  }, [teacher?.id]);

  const handleNoteChange = (note: string) => {
    if (!selectedStudent) return;
    setTeacherNotes(prev => ({ ...prev, [selectedStudent.id]: note }));
  };

  if (loadingStudents) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5C35A0' }} />
          <p className="text-gray-500 text-sm">Loading class data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeacherSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        teacherName={teacher?.username}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {activeTab === 'overview' ? 'Class Overview' : 'Misconception Heatmap'}
            </h1>
            <p className="text-gray-400 text-sm">
              {activeTab === 'overview'
                ? 'Pre-test and post-test results for all students'
                : 'Error frequency by student and misconception type'}
            </p>
          </div>
          <button
            onClick={() => downloadCSV(students)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all"
            style={{ backgroundColor: '#5C35A0' }}
          >
            <Download className="w-4 h-4" />
            Download Class Report
          </button>
        </div>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab students={students} onSelectStudent={setSelectedStudent} />
          )}
          {activeTab === 'heatmap' && (
            <HeatmapTab students={students} />
          )}
        </div>
      </div>

      <StudentPanel
        student={selectedStudent}
        note={selectedStudent ? (teacherNotes[selectedStudent.id] ?? '') : ''}
        onNoteChange={handleNoteChange}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
