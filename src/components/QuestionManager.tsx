import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Lightbulb,
  Hash,
} from 'lucide-react';
import { supabase, LessonQuestion, PracticeQuestion } from '../lib/supabase';
import { Fraction } from './Fraction';

// ─── helpers ─────────────────────────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}
function autoCorrect(n1: number, d1: number, n2: number, d2: number) {
  const rn = n1 * n2, rd = d1 * d2;
  const g = gcd(rn, rd);
  return { correct_numerator: rn / g, correct_denominator: rd / g };
}

// ─── shared question row shape used internally ────────────────────────────────
interface QRow {
  id: string;
  sort_order: number;
  fraction1_numerator: number;
  fraction1_denominator: number;
  fraction2_numerator: number;
  fraction2_denominator: number;
  correct_numerator: number;
  correct_denominator: number;
  hint: string;
}

// ─── blank form state ─────────────────────────────────────────────────────────
const BLANK_FORM = {
  n1: '', d1: '', n2: '', d2: '', hint: '',
};

// ─── fraction input pair ──────────────────────────────────────────────────────
function FractionInput({
  label,
  num,
  den,
  onNum,
  onDen,
}: {
  label: string;
  num: string;
  den: string;
  onNum: (v: string) => void;
  onDen: (v: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex flex-col items-center gap-0.5">
        <input
          type="number"
          min={1}
          value={num}
          onChange={(e) => onNum(e.target.value)}
          placeholder="n"
          className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
        />
        <div className="w-12 border-t-2 border-gray-400" />
        <input
          type="number"
          min={1}
          value={den}
          onChange={(e) => onDen(e.target.value)}
          placeholder="d"
          className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
        />
      </div>
    </div>
  );
}

// ─── delete confirmation dialog ───────────────────────────────────────────────
function DeleteDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Delete Question?</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6">
          This action cannot be undone. The question will be permanently removed.
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

// ─── question form (add / edit) ───────────────────────────────────────────────
interface QuestionFormProps {
  initial?: QRow;
  onSave: (data: {
    n1: number; d1: number; n2: number; d2: number;
    cn: number; cd: number; hint: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function QuestionForm({ initial, onSave, onCancel, isSaving }: QuestionFormProps) {
  const [form, setForm] = useState({
    n1: initial ? String(initial.fraction1_numerator) : '',
    d1: initial ? String(initial.fraction1_denominator) : '',
    n2: initial ? String(initial.fraction2_numerator) : '',
    d2: initial ? String(initial.fraction2_denominator) : '',
    hint: initial?.hint ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    const n1 = parseInt(form.n1), d1 = parseInt(form.d1);
    const n2 = parseInt(form.n2), d2 = parseInt(form.d2);
    if (!form.n1 || isNaN(n1) || n1 < 1) e.n1 = 'Required (≥1)';
    if (!form.d1 || isNaN(d1) || d1 < 1) e.d1 = 'Required (≥1)';
    if (!form.n2 || isNaN(n2) || n2 < 1) e.n2 = 'Required (≥1)';
    if (!form.d2 || isNaN(d2) || d2 < 1) e.d2 = 'Required (≥1)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const n1 = parseInt(form.n1), d1 = parseInt(form.d1);
    const n2 = parseInt(form.n2), d2 = parseInt(form.d2);
    const { correct_numerator: cn, correct_denominator: cd } = autoCorrect(n1, d1, n2, d2);
    onSave({ n1, d1, n2, d2, cn, cd, hint: form.hint.trim() });
  };

  const previewN1 = parseInt(form.n1) || 0;
  const previewD1 = parseInt(form.d1) || 0;
  const previewN2 = parseInt(form.n2) || 0;
  const previewD2 = parseInt(form.d2) || 0;
  const canPreview = previewN1 > 0 && previewD1 > 0 && previewN2 > 0 && previewD2 > 0;
  const previewAns = canPreview
    ? autoCorrect(previewN1, previewD1, previewN2, previewD2)
    : null;

  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
      <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
        {initial ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {initial ? 'Edit Question' : 'Add New Question'}
      </h4>

      {/* Fraction inputs row */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <FractionInput
          label="Fraction 1"
          num={form.n1}
          den={form.d1}
          onNum={set('n1')}
          onDen={set('d1')}
        />
        <span className="text-2xl font-bold text-gray-400 mb-2">×</span>
        <FractionInput
          label="Fraction 2"
          num={form.n2}
          den={form.d2}
          onNum={set('n2')}
          onDen={set('d2')}
        />

        {/* Live answer preview */}
        {canPreview && previewAns && (
          <>
            <span className="text-2xl font-bold text-gray-400 mb-2">=</span>
            <div className="flex flex-col items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Answer</span>
              <Fraction
                numerator={previewAns.correct_numerator}
                denominator={previewAns.correct_denominator}
                color="text-green-600"
                size="lg"
              />
            </div>
          </>
        )}
      </div>

      {/* Inline validation errors */}
      {Object.keys(errors).length > 0 && (
        <p className="text-red-600 text-xs mb-3 font-semibold">
          Please fill in all fraction fields with positive integers.
        </p>
      )}

      {/* Hint input */}
      <div className="mb-4">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          <Lightbulb className="w-3.5 h-3.5" /> Hint (optional)
        </label>
        <input
          type="text"
          value={form.hint}
          onChange={(e) => set('hint')(e.target.value)}
          placeholder="e.g. Multiply tops, then bottoms, then simplify."
          className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {isSaving ? (
            <span>Saving…</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {initial ? 'Save Changes' : 'Add Question'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── question row card ────────────────────────────────────────────────────────
interface QuestionRowProps {
  q: QRow;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionRow({ q, index, total, onEdit, onDelete, onMoveUp, onMoveDown }: QuestionRowProps) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all group">
      {/* Index badge */}
      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>

      {/* Fraction display */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Fraction
          numerator={q.fraction1_numerator}
          denominator={q.fraction1_denominator}
          color="text-indigo-600"
          size="md"
        />
        <span className="text-lg font-bold text-gray-400">×</span>
        <Fraction
          numerator={q.fraction2_numerator}
          denominator={q.fraction2_denominator}
          color="text-indigo-600"
          size="md"
        />
        <span className="text-lg font-bold text-gray-400">=</span>
        <Fraction
          numerator={q.correct_numerator}
          denominator={q.correct_denominator}
          color="text-green-600"
          size="md"
        />
        {q.hint && (
          <span className="hidden sm:flex items-center gap-1 ml-2 text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 truncate max-w-[200px]">
            <Lightbulb className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{q.hint}</span>
          </span>
        )}
      </div>

      {/* Controls — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          title="Edit"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LessonQuestionManager — manages questions for a single lesson
// ═══════════════════════════════════════════════════════════════════
interface LessonQuestionManagerProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

export function LessonQuestionManager({ lessonId, lessonTitle, onClose }: LessonQuestionManagerProps) {
  const [questions, setQuestions] = useState<QRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('lesson_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order', { ascending: true });
    setQuestions(
      (data ?? []).map((r: LessonQuestion) => ({
        id: r.id,
        sort_order: r.sort_order,
        fraction1_numerator: r.fraction1_numerator,
        fraction1_denominator: r.fraction1_denominator,
        fraction2_numerator: r.fraction2_numerator,
        fraction2_denominator: r.fraction2_denominator,
        correct_numerator: r.correct_numerator,
        correct_denominator: r.correct_denominator,
        hint: r.hint ?? '',
      }))
    );
    setIsLoading(false);
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: { n1: number; d1: number; n2: number; d2: number; cn: number; cd: number; hint: string }) => {
    setIsSaving(true);
    const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 0;
    const { error } = await supabase.from('lesson_questions').insert({
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      sort_order: nextOrder,
      fraction1_numerator: data.n1,
      fraction1_denominator: data.d1,
      fraction2_numerator: data.n2,
      fraction2_denominator: data.d2,
      correct_numerator: data.cn,
      correct_denominator: data.cd,
      hint: data.hint,
    });
    setIsSaving(false);
    if (error) { showToast('Error adding question'); return; }
    showToast('Question added!');
    setShowForm(false);
    load();
  };

  const handleEdit = async (id: string, data: { n1: number; d1: number; n2: number; d2: number; cn: number; cd: number; hint: string }) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('lesson_questions')
      .update({
        fraction1_numerator: data.n1,
        fraction1_denominator: data.d1,
        fraction2_numerator: data.n2,
        fraction2_denominator: data.d2,
        correct_numerator: data.cn,
        correct_denominator: data.cd,
        hint: data.hint,
      })
      .eq('id', id);
    setIsSaving(false);
    if (error) { showToast('Error saving changes'); return; }
    showToast('Question updated!');
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lesson_questions').delete().eq('id', id);
    if (error) { showToast('Error deleting question'); return; }
    showToast('Question deleted.');
    setDeleteId(null);
    load();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= questions.length) return;
    const updated = [...questions];
    const tmpOrder = updated[index].sort_order;
    updated[index] = { ...updated[index], sort_order: updated[swapIndex].sort_order };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: tmpOrder };
    setQuestions(updated);
    await Promise.all([
      supabase.from('lesson_questions').update({ sort_order: updated[index].sort_order }).eq('id', updated[index].id),
      supabase.from('lesson_questions').update({ sort_order: updated[swapIndex].sort_order }).eq('id', updated[swapIndex].id),
    ]);
    load();
  };

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{lessonTitle}</h2>
              <p className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : questions.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <Hash className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No questions yet</p>
              <p className="text-gray-400 text-sm mt-1">Add the first question to this lesson.</p>
            </div>
          ) : (
            questions.map((q, i) =>
              editingId === q.id ? (
                <QuestionForm
                  key={q.id}
                  initial={editingQuestion}
                  onSave={(data) => handleEdit(q.id, data)}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                />
              ) : (
                <QuestionRow
                  key={q.id}
                  q={q}
                  index={i}
                  total={questions.length}
                  onEdit={() => { setShowForm(false); setEditingId(q.id); }}
                  onDelete={() => setDeleteId(q.id)}
                  onMoveUp={() => handleMove(i, 'up')}
                  onMoveDown={() => handleMove(i, 'down')}
                />
              )
            )
          )}

          {showForm && !editingId && (
            <QuestionForm
              onSave={handleAdd}
              onCancel={() => setShowForm(false)}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <DeleteDialog
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-semibold z-[60]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PracticeQuestionManager — manages the custom practice question pool
// for a class + difficulty combination
// ═══════════════════════════════════════════════════════════════════
interface PracticeQuestionManagerProps {
  teacherId: string;
  classCode: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner Island',
  intermediate: 'Intermediate Mountain',
  advanced: 'Advanced Castle',
};

export function PracticeQuestionManager({
  teacherId,
  classCode,
  difficulty,
  onClose,
}: PracticeQuestionManagerProps) {
  const [questions, setQuestions] = useState<QRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('class_code', classCode)
      .eq('difficulty', difficulty)
      .order('sort_order', { ascending: true });
    setQuestions(
      (data ?? []).map((r: PracticeQuestion) => ({
        id: r.id,
        sort_order: r.sort_order ?? 0,
        fraction1_numerator: r.fraction1_numerator,
        fraction1_denominator: r.fraction1_denominator,
        fraction2_numerator: r.fraction2_numerator,
        fraction2_denominator: r.fraction2_denominator,
        correct_numerator: r.correct_numerator,
        correct_denominator: r.correct_denominator,
        hint: r.hint ?? '',
      }))
    );
    setIsLoading(false);
  }, [classCode, difficulty]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: { n1: number; d1: number; n2: number; d2: number; cn: number; cd: number; hint: string }) => {
    setIsSaving(true);
    const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 0;
    const { error } = await supabase.from('practice_questions').insert({
      teacher_id: teacherId,
      class_code: classCode,
      difficulty,
      sort_order: nextOrder,
      fraction1_numerator: data.n1,
      fraction1_denominator: data.d1,
      fraction2_numerator: data.n2,
      fraction2_denominator: data.d2,
      correct_numerator: data.cn,
      correct_denominator: data.cd,
      hint: data.hint,
      is_active: true,
    });
    setIsSaving(false);
    if (error) { showToast('Error adding question'); return; }
    showToast('Question added!');
    setShowForm(false);
    load();
  };

  const handleEdit = async (id: string, data: { n1: number; d1: number; n2: number; d2: number; cn: number; cd: number; hint: string }) => {
    setIsSaving(true);
    const { error } = await supabase
      .from('practice_questions')
      .update({
        fraction1_numerator: data.n1,
        fraction1_denominator: data.d1,
        fraction2_numerator: data.n2,
        fraction2_denominator: data.d2,
        correct_numerator: data.cn,
        correct_denominator: data.cd,
        hint: data.hint,
      })
      .eq('id', id);
    setIsSaving(false);
    if (error) { showToast('Error saving changes'); return; }
    showToast('Question updated!');
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('practice_questions').delete().eq('id', id);
    if (error) { showToast('Error deleting question'); return; }
    showToast('Question deleted.');
    setDeleteId(null);
    load();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= questions.length) return;
    const updated = [...questions];
    const tmpOrder = updated[index].sort_order;
    updated[index] = { ...updated[index], sort_order: updated[swapIndex].sort_order };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: tmpOrder };
    setQuestions(updated);
    await Promise.all([
      supabase.from('practice_questions').update({ sort_order: updated[index].sort_order }).eq('id', updated[index].id),
      supabase.from('practice_questions').update({ sort_order: updated[swapIndex].sort_order }).eq('id', updated[swapIndex].id),
    ]);
    load();
  };

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : undefined;

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">
                {DIFFICULTY_LABELS[difficulty]} — Practice Questions
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${difficultyColors[difficulty]}`}>
                  {difficulty}
                </span>
                <span className="text-xs text-gray-400">{classCode} · {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : questions.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <Hash className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No custom questions yet</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                Add questions here to supplement the auto-generated pool for this difficulty.
              </p>
            </div>
          ) : (
            questions.map((q, i) =>
              editingId === q.id ? (
                <QuestionForm
                  key={q.id}
                  initial={editingQuestion}
                  onSave={(data) => handleEdit(q.id, data)}
                  onCancel={() => setEditingId(null)}
                  isSaving={isSaving}
                />
              ) : (
                <QuestionRow
                  key={q.id}
                  q={q}
                  index={i}
                  total={questions.length}
                  onEdit={() => { setShowForm(false); setEditingId(q.id); }}
                  onDelete={() => setDeleteId(q.id)}
                  onMoveUp={() => handleMove(i, 'up')}
                  onMoveDown={() => handleMove(i, 'down')}
                />
              )
            )
          )}

          {showForm && !editingId && (
            <QuestionForm
              onSave={handleAdd}
              onCancel={() => setShowForm(false)}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          )}
        </div>
      </div>

      {deleteId && (
        <DeleteDialog
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-semibold z-[60]">
          {toast}
        </div>
      )}
    </div>
  );
}
