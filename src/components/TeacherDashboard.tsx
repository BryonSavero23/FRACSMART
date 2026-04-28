import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BarChart3,
  Download,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Gamepad2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Hash,
  AlertTriangle,
  Check,
  LayoutList,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { supabase, Student, Session, SessionAnswer, Lesson } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LessonQuestionManager, PracticeQuestionManager } from './QuestionManager';
import {
  fetchCurriculumLessons,
  buildModules,
  defaultContent,
  CurriculumLesson,
  LessonModule,
  BasicsContent,
  AreaModelContent,
  ExamplesContent,
  MistakesContent,
  CurriculumContent,
} from './LearnMode';

// ─── constants ────────────────────────────────────────────────────────────────
const misconceptionLabels: Record<string, string> = {
  adding_fractions: 'Adding Instead',
  whole_number_bias: 'Whole Number Bias',
  denominator_only: 'Denominator Only',
  numerator_only: 'Numerator Only',
  unsimplified: 'Unsimplified',
  other: 'Other',
};

const misconceptionColors: Record<string, string> = {
  adding_fractions: '#ef4444',
  whole_number_bias: '#f97316',
  denominator_only: '#eab308',
  numerator_only: '#22c55e',
  unsimplified: '#3b82f6',
  other: '#8b5cf6',
};

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner Island',
  intermediate: 'Intermediate Mountain',
  advanced: 'Advanced Castle',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
};

// ─── interfaces ───────────────────────────────────────────────────────────────
interface StudentWithStats extends Student {
  sessions: Session[];
  answers: SessionAnswer[];
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
}

// ─── small reusable helpers ───────────────────────────────────────────────────
function ConfirmDeleteDialog({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Delete "{label}"?</h3>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          All questions inside this lesson will also be deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-semibold z-[60]">
      {message}
    </div>
  );
}

// ─── Lesson form (create / edit) ──────────────────────────────────────────────
interface LessonFormProps {
  classCode: string;
  teacherId: string;
  initial?: Lesson;
  onSave: () => void;
  onCancel: () => void;
}

function LessonForm({ classCode, teacherId, initial, onSave, onCancel }: LessonFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'beginner');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setIsSaving(true);
    if (initial) {
      await supabase
        .from('lessons')
        .update({ title: title.trim(), description: description.trim(), difficulty })
        .eq('id', initial.id);
    } else {
      const { data: existing } = await supabase
        .from('lessons')
        .select('sort_order')
        .eq('class_code', classCode)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = existing ? existing.sort_order + 1 : 0;
      await supabase.from('lessons').insert({
        teacher_id: teacherId,
        class_code: classCode,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        sort_order: nextOrder,
        is_active: true,
      });
    }
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 mb-4">
      <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
        {initial ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {initial ? 'Edit Lesson' : 'New Lesson'}
      </h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="e.g. Introduction to Multiplying Fractions"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description shown to students"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 block">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  difficulty === d
                    ? DIFFICULTY_COLORS[d]
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {isSaving ? (
            'Saving…'
          ) : (
            <><Check className="w-4 h-4" />{initial ? 'Save Changes' : 'Create Lesson'}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Lesson card ──────────────────────────────────────────────────────────────
function LessonCard({
  lesson,
  questionCount,
  onEdit,
  onDelete,
  onToggleActive,
  onManageQuestions,
}: {
  lesson: Lesson;
  questionCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onManageQuestions: () => void;
}) {
  return (
    <div
      className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
        lesson.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-800 text-sm truncate">{lesson.title}</h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${DIFFICULTY_COLORS[lesson.difficulty]}`}>
                {lesson.difficulty}
              </span>
              {!lesson.is_active && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
                  Hidden
                </span>
              )}
            </div>
            {lesson.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{lesson.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              <span className="font-semibold text-gray-600">{questionCount}</span>{' '}
              question{questionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onManageQuestions}
            title="Manage questions"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all"
          >
            <Hash className="w-3.5 h-3.5" />
            Questions
          </button>
          <button
            onClick={onToggleActive}
            title={lesson.is_active ? 'Hide from students' : 'Show to students'}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
          >
            {lesson.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Edit lesson"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Delete lesson"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Practice pool summary card ───────────────────────────────────────────────
function PracticePoolCard({
  classCode,
  difficulty,
  onClick,
}: {
  classCode: string;
  difficulty: Difficulty;
  onClick: () => void;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('practice_questions')
      .select('*', { count: 'exact', head: true })
      .eq('class_code', classCode)
      .eq('difficulty', difficulty)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [classCode, difficulty]);

  const icons: Record<Difficulty, string> = { beginner: '🏝️', intermediate: '⛰️', advanced: '🏰' };
  const pointsPerQ: Record<Difficulty, number> = { beginner: 10, intermediate: 15, advanced: 20 };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md group ${DIFFICULTY_COLORS[difficulty]} hover:scale-[1.01] active:scale-[0.99]`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icons[difficulty]}</span>
        <span className="text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity">
          Manage →
        </span>
      </div>
      <p className="font-extrabold text-sm">{DIFFICULTY_LABELS[difficulty]}</p>
      <p className="text-xs mt-0.5 opacity-70">{pointsPerQ[difficulty]} pts per correct answer</p>
      <div className="mt-3 pt-3 border-t border-current/20">
        <p className="text-lg font-extrabold leading-none">
          {count === null ? '…' : count}
        </p>
        <p className="text-xs opacity-70 mt-0.5">custom question{count !== 1 ? 's' : ''}</p>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CurriculumEditForm — inline edit form for a curriculum lesson
// ═══════════════════════════════════════════════════════════════════
function TextField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white resize-none";
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea className={cls} rows={3} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={cls} type="text" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function CurriculumEditForm({
  moduleId,
  draft,
  onChange,
  saving,
  onSave,
  onCancel,
}: {
  moduleId: string;
  draft: CurriculumContent;
  onChange: (d: CurriculumContent) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<CurriculumContent>) => onChange({ ...draft, ...patch } as CurriculumContent);

  let fields: React.ReactNode;

  if (moduleId === 'basics') {
    const c = draft as BasicsContent;
    fields = (
      <div className="space-y-3">
        <TextField label="Section Title" value={c.sectionTitle} onChange={v => set({ sectionTitle: v } as Partial<BasicsContent>)} />
        <TextField label="Intro Paragraph" value={c.introParagraph} onChange={v => set({ introParagraph: v } as Partial<BasicsContent>)} multiline />
        <TextField label="Example Title" value={c.exampleTitle} onChange={v => set({ exampleTitle: v } as Partial<BasicsContent>)} />
        <TextField label="Remember Title" value={c.rememberTitle} onChange={v => set({ rememberTitle: v } as Partial<BasicsContent>)} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Bullet Points</label>
          {c.bullets.map((b, i) => (
            <input
              key={i}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white mb-1"
              value={b}
              onChange={e => { const bullets = [...c.bullets]; bullets[i] = e.target.value; set({ bullets } as Partial<BasicsContent>); }}
            />
          ))}
        </div>
      </div>
    );
  } else if (moduleId === 'area-model') {
    const c = draft as AreaModelContent;
    fields = (
      <div className="space-y-3">
        <TextField label="Section Title" value={c.sectionTitle} onChange={v => set({ sectionTitle: v } as Partial<AreaModelContent>)} />
        <TextField label="Intro Paragraph" value={c.introParagraph} onChange={v => set({ introParagraph: v } as Partial<AreaModelContent>)} multiline />
        <TextField label="How To Title" value={c.howToTitle} onChange={v => set({ howToTitle: v } as Partial<AreaModelContent>)} />
        <TextField label="Light Blue Label" value={c.lightBlueLabel} onChange={v => set({ lightBlueLabel: v } as Partial<AreaModelContent>)} />
        <TextField label="Light Blue Description" value={c.lightBlueDesc} onChange={v => set({ lightBlueDesc: v } as Partial<AreaModelContent>)} />
        <TextField label="Yellow Label" value={c.yellowLabel} onChange={v => set({ yellowLabel: v } as Partial<AreaModelContent>)} />
        <TextField label="Yellow Description" value={c.yellowDesc} onChange={v => set({ yellowDesc: v } as Partial<AreaModelContent>)} />
        <TextField label="Try Another Example Title" value={c.tryTitle} onChange={v => set({ tryTitle: v } as Partial<AreaModelContent>)} />
      </div>
    );
  } else if (moduleId === 'examples') {
    const c = draft as ExamplesContent;
    const updateSteps = (key: 'example1Steps' | 'example2Steps' | 'example3Steps', i: number, v: string) => {
      const steps = [...c[key]]; steps[i] = v; set({ [key]: steps } as Partial<ExamplesContent>);
    };
    fields = (
      <div className="space-y-4">
        {(['example1', 'example2', 'example3'] as const).map((ex, ei) => {
          const titleKey = `${ex}Title` as keyof ExamplesContent;
          const paraKey = `${ex}Para` as keyof ExamplesContent;
          const stepsKey = `${ex}Steps` as 'example1Steps' | 'example2Steps' | 'example3Steps';
          return (
            <div key={ex} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Example {ei + 1}</p>
              <TextField label="Title" value={c[titleKey] as string} onChange={v => set({ [titleKey]: v } as Partial<ExamplesContent>)} />
              <TextField label="Story Paragraph" value={c[paraKey] as string} onChange={v => set({ [paraKey]: v } as Partial<ExamplesContent>)} multiline />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Steps</label>
                {(c[stepsKey] as string[]).map((s, i) => (
                  <input
                    key={i}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white mb-1"
                    value={s}
                    onChange={e => updateSteps(stepsKey, i, e.target.value)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const c = draft as MistakesContent;
    fields = (
      <div className="space-y-3">
        <TextField label="Mistake 1 Title" value={c.mistake1Title} onChange={v => set({ mistake1Title: v } as Partial<MistakesContent>)} />
        <TextField label="Mistake 2 Title" value={c.mistake2Title} onChange={v => set({ mistake2Title: v } as Partial<MistakesContent>)} />
        <TextField label="Mistake 3 Title" value={c.mistake3Title} onChange={v => set({ mistake3Title: v } as Partial<MistakesContent>)} />
        <TextField label="Mistake 4 Title" value={c.mistake4Title} onChange={v => set({ mistake4Title: v } as Partial<MistakesContent>)} />
        <TextField label="Tips Section Title" value={c.tipsTitle} onChange={v => set({ tipsTitle: v } as Partial<MistakesContent>)} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tips</label>
          {c.tips.map((t, i) => (
            <input
              key={i}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white mb-1"
              value={t}
              onChange={e => { const tips = [...c.tips]; tips[i] = e.target.value; set({ tips } as Partial<MistakesContent>); }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-md"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Content Management Tab
// ═══════════════════════════════════════════════════════════════════
function ContentTab({ teacherId, classCodes }: { teacherId: string; classCodes: string[] }) {
  const [selectedClass, setSelectedClass] = useState(classCodes[0] ?? '');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [questionManagerLesson, setQuestionManagerLesson] = useState<Lesson | null>(null);
  const [practiceManager, setPracticeManager] = useState<{ difficulty: Difficulty } | null>(null);
  const [activeSection, setActiveSection] = useState<'lessons' | 'practice'>('lessons');
  const [toast, setToast] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [curriculumLessons, setCurriculumLessons] = useState<CurriculumLesson[]>([]);
  const [curriculumModules, setCurriculumModules] = useState<LessonModule[]>([]);
  const [editingCurriculum, setEditingCurriculum] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CurriculumContent | null>(null);
  const [savingCurriculum, setSavingCurriculum] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadLessons = useCallback(async () => {
    if (!selectedClass) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_code', selectedClass)
      .order('sort_order', { ascending: true });
    const rows = (data ?? []) as Lesson[];
    setLessons(rows);

    if (rows.length > 0) {
      const counts: Record<string, number> = {};
      await Promise.all(
        rows.map(async (lesson) => {
          const { count } = await supabase
            .from('lesson_questions')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id);
          counts[lesson.id] = count ?? 0;
        })
      );
      setQuestionCounts(counts);
    }
    setIsLoading(false);
  }, [selectedClass]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  const loadCurriculum = async () => {
    const lessons = await fetchCurriculumLessons();
    setCurriculumLessons(lessons);
    setCurriculumModules(buildModules(lessons));
  };

  useEffect(() => { loadCurriculum(); }, []);

  const handleToggleActive = async (lesson: Lesson) => {
    await supabase.from('lessons').update({ is_active: !lesson.is_active }).eq('id', lesson.id);
    showToast(lesson.is_active ? 'Lesson hidden from students.' : 'Lesson visible to students.');
    loadLessons();
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    await supabase.from('lessons').delete().eq('id', lesson.id);
    setDeletingLesson(null);
    showToast('Lesson deleted.');
    loadLessons();
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= lessons.length) return;
    const updated = [...lessons];
    const tmp = updated[index].sort_order;
    updated[index] = { ...updated[index], sort_order: updated[swapIndex].sort_order };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: tmp };
    setLessons(updated);
    await Promise.all([
      supabase.from('lessons').update({ sort_order: updated[index].sort_order }).eq('id', updated[index].id),
      supabase.from('lessons').update({ sort_order: updated[swapIndex].sort_order }).eq('id', updated[swapIndex].id),
    ]);
    loadLessons();
  };

  return (
    <div className="space-y-5">
      {/* Class selector */}
      {classCodes.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">Class:</span>
          <div className="flex gap-2 flex-wrap">
            {classCodes.map((code) => (
              <button
                key={code}
                onClick={() => setSelectedClass(code)}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                  selectedClass === code
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('lessons')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSection === 'lessons'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Lessons
          <span
            className={`text-xs px-1.5 py-0.5 rounded-lg ${
              activeSection === 'lessons' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {lessons.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('practice')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeSection === 'practice'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-amber-300'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Practice Questions
        </button>
      </div>

      {/* ── LESSONS ── */}
      {activeSection === 'lessons' && (
        <>
        {/* Curriculum preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Curriculum Lessons
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">These are the lessons students see in the Learn page</p>
          </div>
          <div className="p-5 space-y-3">
            {curriculumModules.map((module, index) => {
              const lessonData = curriculumLessons[index];
              const isExpanded = expandedModule === module.id;
              const isEditing = editingCurriculum === module.id;
              return (
                <div key={module.id} className="card card-hover overflow-hidden">
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                        {module.icon}
                      </div>
                      <div>
                        <h2 className="text-xl text-gray-800">Lesson {index + 1}</h2>
                        <p className="text-gray-600">{module.title}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fadeIn">
                      <div className="border-t-2 border-gray-100 pt-4">
                        {isEditing && editDraft ? (
                          <CurriculumEditForm
                            moduleId={module.id}
                            draft={editDraft}
                            onChange={setEditDraft}
                            saving={savingCurriculum}
                            onSave={async () => {
                              if (!lessonData) return;
                              setSavingCurriculum(true);
                              await supabase
                                .from('curriculum_lessons')
                                .update({ title: lessonData.title, content_json: editDraft, updated_at: new Date().toISOString() })
                                .eq('id', module.id);
                              await loadCurriculum();
                              setEditingCurriculum(null);
                              setEditDraft(null);
                              setSavingCurriculum(false);
                              showToast('Lesson updated!');
                            }}
                            onCancel={() => { setEditingCurriculum(null); setEditDraft(null); }}
                          />
                        ) : (
                          <>
                            {module.content}
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => {
                                  setEditingCurriculum(module.id);
                                  setEditDraft(lessonData?.content_json ?? defaultContent[module.id]);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm border border-indigo-200 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher-created lessons */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Lessons — {selectedClass}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Create structured lessons with custom questions</p>
            </div>
            {!showLessonForm && !editingLesson && (
              <button
                onClick={() => setShowLessonForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                New Lesson
              </button>
            )}
          </div>

          <div className="p-5 space-y-3">
            {(showLessonForm || editingLesson) && (
              <LessonForm
                classCode={selectedClass}
                teacherId={teacherId}
                initial={editingLesson ?? undefined}
                onSave={() => {
                  setShowLessonForm(false);
                  setEditingLesson(null);
                  showToast(editingLesson ? 'Lesson updated!' : 'Lesson created!');
                  loadLessons();
                }}
                onCancel={() => { setShowLessonForm(false); setEditingLesson(null); }}
              />
            )}

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : lessons.length === 0 && !showLessonForm ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No lessons yet for {selectedClass}</p>
                <p className="text-gray-400 text-sm mt-1">Create your first lesson to get started.</p>
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div key={lesson.id} className="relative group">
                  {/* Reorder controls */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => handleMoveLesson(index, 'up')}
                      disabled={index === 0}
                      className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 disabled:opacity-30 shadow-sm"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveLesson(index, 'down')}
                      disabled={index === lessons.length - 1}
                      className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-gray-400 hover:text-indigo-600 disabled:opacity-30 shadow-sm"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <LessonCard
                    lesson={lesson}
                    questionCount={questionCounts[lesson.id] ?? 0}
                    onEdit={() => { setShowLessonForm(false); setEditingLesson(lesson); }}
                    onDelete={() => setDeletingLesson(lesson)}
                    onToggleActive={() => handleToggleActive(lesson)}
                    onManageQuestions={() => setQuestionManagerLesson(lesson)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        </>
      )}

      {/* ── PRACTICE QUESTIONS ── */}
      {activeSection === 'practice' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              Practice Questions — {selectedClass}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add custom questions to each difficulty pool. These supplement the auto-generated questions.
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIFFICULTY_OPTIONS.map((diff) => (
              <PracticePoolCard
                key={diff}
                classCode={selectedClass}
                difficulty={diff}
                onClick={() => setPracticeManager({ difficulty: diff })}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {questionManagerLesson && (
        <LessonQuestionManager
          lessonId={questionManagerLesson.id}
          lessonTitle={questionManagerLesson.title}
          onClose={() => { setQuestionManagerLesson(null); loadLessons(); }}
        />
      )}

      {practiceManager && (
        <PracticeQuestionManager
          teacherId={teacherId}
          classCode={selectedClass}
          difficulty={practiceManager.difficulty}
          onClose={() => setPracticeManager(null)}
        />
      )}

      {deletingLesson && (
        <ConfirmDeleteDialog
          label={deletingLesson.title}
          onConfirm={() => handleDeleteLesson(deletingLesson)}
          onCancel={() => setDeletingLesson(null)}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TeacherDashboard — main component
// ═══════════════════════════════════════════════════════════════════
export function TeacherDashboard() {
  const { teacher } = useAuth();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [classCodes, setClassCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'student' | 'content'>('overview');

  useEffect(() => { fetchClassData(); }, []);

  const fetchClassData = async () => {
    const { data: classCodeRows } = await supabase.from('class_codes').select('code');

    if (!classCodeRows || classCodeRows.length === 0) { setIsLoading(false); return; }

    const codes = classCodeRows.map((c) => c.code);
    setClassCodes(codes);

    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .in('class_code', codes)
      .order('name', { ascending: true });

    if (!studentsData) { setIsLoading(false); return; }

    const studentsWithStats: StudentWithStats[] = await Promise.all(
      studentsData.map(async (student) => {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: true });

        const { data: answers } = await supabase
          .from('session_answers')
          .select('*')
          .in('session_id', sessions?.map((s) => s.id) || []);

        const totalCorrect = answers?.filter((a) => a.is_correct).length || 0;
        const totalQuestions = answers?.length || 0;
        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        return { ...student, sessions: sessions || [], answers: answers || [], totalCorrect, totalQuestions, accuracy };
      })
    );

    setStudents(studentsWithStats);
    setIsLoading(false);
  };

  const getClassStats = () => {
    const totalStudents = students.length;
    const totalSessions = students.reduce((sum, s) => sum + s.sessions.length, 0);
    const totalCorrect = students.reduce((sum, s) => sum + s.totalCorrect, 0);
    const totalQuestions = students.reduce((sum, s) => sum + s.totalQuestions, 0);
    const classAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const avgScore =
      totalSessions > 0
        ? Math.round(
            students.reduce((sum, s) => sum + s.sessions.reduce((sSum, sess) => sSum + sess.score, 0), 0) /
              totalSessions
          )
        : 0;
    return { totalStudents, totalSessions, classAccuracy, avgScore };
  };

  const getMisconceptionHeatmapData = () => {
    const allMisconceptions: Record<string, number> = {};
    students.forEach((student) => {
      student.answers.forEach((answer) => {
        if (!answer.is_correct && answer.misconception_type) {
          allMisconceptions[answer.misconception_type] =
            (allMisconceptions[answer.misconception_type] || 0) + 1;
        }
      });
    });
    return Object.entries(allMisconceptions)
      .map(([type, count]) => ({
        name: misconceptionLabels[type] || type,
        type,
        count,
        color: misconceptionColors[type] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getStudentMisconceptionBreakdown = (student: StudentWithStats) => {
    const counts: Record<string, number> = {};
    student.answers.forEach((answer) => {
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

  const getStudentScoreHistory = (student: StudentWithStats) =>
    student.sessions.map((session, index) => ({
      name: `Session ${index + 1}`,
      score: session.score,
      accuracy:
        session.questions_answered > 0
          ? Math.round((session.correct_answers / session.questions_answered) * 100)
          : 0,
    }));

  const exportToCSV = () => {
    const headers = [
      'Student Name', 'Class Code', 'Total Score', 'Sessions Completed',
      'Total Questions', 'Correct Answers', 'Accuracy %',
      'Adding Fractions Errors', 'Whole Number Bias Errors', 'Denominator Only Errors',
      'Numerator Only Errors', 'Unsimplified Errors', 'Other Errors',
    ];
    const rows = students.map((student) => {
      const misconceptionCounts: Record<string, number> = {};
      student.answers.forEach((answer) => {
        if (!answer.is_correct && answer.misconception_type) {
          misconceptionCounts[answer.misconception_type] =
            (misconceptionCounts[answer.misconception_type] || 0) + 1;
        }
      });
      return [
        student.name, student.class_code, student.total_score, student.sessions_completed,
        student.totalQuestions, student.totalCorrect, student.accuracy,
        misconceptionCounts['adding_fractions'] || 0, misconceptionCounts['whole_number_bias'] || 0,
        misconceptionCounts['denominator_only'] || 0, misconceptionCounts['numerator_only'] || 0,
        misconceptionCounts['unsimplified'] || 0, misconceptionCounts['other'] || 0,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fracsmart_class_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const classStats = getClassStats();
  const heatmapData = getMisconceptionHeatmapData();

  const tabs = [
    { id: 'overview' as const, label: 'Class Overview', Icon: Users },
    { id: 'heatmap' as const, label: 'Misconceptions', Icon: BarChart3 },
    { id: 'student' as const, label: 'Individual', Icon: TrendingUp },
    { id: 'content' as const, label: 'Content Manager', Icon: LayoutList },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-white">Teacher Dashboard</h1>
        <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
              activeTab === id
                ? 'bg-white text-indigo-700 shadow-md'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <Users className="w-8 h-8 text-indigo-500 mb-2" />
              <p className="text-3xl font-bold text-indigo-700">{classStats.totalStudents}</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <BarChart3 className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-3xl font-bold text-amber-700">{classStats.totalSessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <Target className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-green-600">{classStats.classAccuracy}%</p>
              <p className="text-sm text-gray-600">Class Accuracy</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-purple-600">{classStats.avgScore}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl text-indigo-700 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Student Leaderboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Class</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Score</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Sessions</th>
                    <th className="text-right py-3 px-4 text-gray-600 font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .sort((a, b) => b.total_score - a.total_score)
                    .map((student, index) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              index === 0 ? 'bg-amber-100 text-amber-700'
                              : index === 1 ? 'bg-gray-100 text-gray-700'
                              : index === 2 ? 'bg-orange-100 text-orange-700'
                              : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{student.name}</td>
                        <td className="py-3 px-4 text-gray-600">{student.class_code}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-600">{student.total_score}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{student.sessions_completed}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold ${
                              student.accuracy >= 80 ? 'text-green-600'
                              : student.accuracy >= 60 ? 'text-amber-600'
                              : 'text-red-600'
                            }`}
                          >
                            {student.accuracy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── HEATMAP ── */}
      {activeTab === 'heatmap' && (
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl text-indigo-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Class Misconception Heatmap
          </h3>
          {heatmapData.length > 0 ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <h4 className="font-semibold text-amber-700 mb-2">Teaching Recommendations</h4>
                <ul className="space-y-2 text-amber-800">
                  {heatmapData.slice(0, 2).map((item) => (
                    <li key={item.type} className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: item.color }} />
                      <span>Focus on <strong>{item.name}</strong> — {item.count} occurrences across the class</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No misconception data available yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── INDIVIDUAL STUDENT ── */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl text-indigo-700 mb-4">Select a Student</h3>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const s = students.find((s) => s.id === e.target.value);
                setSelectedStudent(s || null);
              }}
              className="input-field"
            >
              <option value="">Choose a student…</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.class_code}) — {student.accuracy}% accuracy
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <Award className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-3xl font-bold text-indigo-700">{selectedStudent.total_score}</p>
                  <p className="text-sm text-gray-600">Total Score</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <Target className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold text-green-600">{selectedStudent.accuracy}%</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <BarChart3 className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="text-3xl font-bold text-indigo-600">{selectedStudent.sessions_completed}</p>
                  <p className="text-sm text-gray-600">Sessions</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{selectedStudent.totalQuestions}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
              </div>

              {selectedStudent.sessions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl text-indigo-700 mb-4">Score History</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getStudentScoreHistory(selectedStudent)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} name="Score" />
                        <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" name="Accuracy %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {getStudentMisconceptionBreakdown(selectedStudent).length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl text-indigo-700 mb-4">Misconception Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getStudentMisconceptionBreakdown(selectedStudent)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                          {getStudentMisconceptionBreakdown(selectedStudent).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── CONTENT MANAGER ── */}
      {activeTab === 'content' && teacher && (
        <ContentTab teacherId={teacher.id} classCodes={classCodes} />
      )}
    </div>
  );
}
