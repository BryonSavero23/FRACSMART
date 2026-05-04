import type { MisconceptionType } from '../lib/misconceptionTypes';
import { MISCONCEPTION_LABELS } from '../lib/misconceptionTypes';

export interface MockStudent {
  id: string;
  name: string;
  classCode: string;
  preScore: number;
  postScore: number;
  topMisconception: string;
  misconceptionCounts: Record<NonNullable<MisconceptionType>, number>;
  status: 'Improved' | 'Needs Attention' | 'Not Started';
  isAtRisk: boolean;
  teacherNote: string;
}

function getStatus(pre: number, post: number): MockStudent['status'] {
  if (pre === 0 || post === 0) return 'Not Started';
  if (post > pre) return 'Improved';
  return 'Needs Attention';
}

function getTopMisconception(counts: MockStudent['misconceptionCounts']): string {
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0
    ? (MISCONCEPTION_LABELS[top[0] as NonNullable<MisconceptionType>] ?? top[0])
    : '—';
}

const raw: Omit<MockStudent, 'status' | 'isAtRisk' | 'topMisconception' | 'teacherNote'>[] = [
  {
    id: '1', name: 'Amirah Binti Hassan', classCode: 'CLASS-A',
    preScore: 3, postScore: 6,
    misconceptionCounts: { adding_fractions: 2, whole_number_bias: 1, denominator_only: 1, numerator_only: 0, mixed_number_error: 0, unsimplified: 1, other: 0 },
  },
  {
    id: '2', name: 'Rajan Krishnamurthy', classCode: 'CLASS-A',
    preScore: 2, postScore: 5,
    misconceptionCounts: { adding_fractions: 3, whole_number_bias: 1, denominator_only: 0, numerator_only: 1, mixed_number_error: 1, unsimplified: 1, other: 1 },
  },
  {
    id: '3', name: 'Nur Aisyah Bt. Zakaria', classCode: 'CLASS-A',
    preScore: 5, postScore: 7,
    misconceptionCounts: { adding_fractions: 1, whole_number_bias: 0, denominator_only: 0, numerator_only: 0, mixed_number_error: 0, unsimplified: 2, other: 0 },
  },
  {
    id: '4', name: 'Chong Wei Lin', classCode: 'CLASS-A',
    preScore: 1, postScore: 3,
    misconceptionCounts: { adding_fractions: 4, whole_number_bias: 2, denominator_only: 1, numerator_only: 1, mixed_number_error: 1, unsimplified: 0, other: 1 },
  },
  {
    id: '5', name: 'Muhammad Haziq bin Azmi', classCode: 'CLASS-A',
    preScore: 4, postScore: 4,
    misconceptionCounts: { adding_fractions: 2, whole_number_bias: 0, denominator_only: 2, numerator_only: 0, mixed_number_error: 0, unsimplified: 1, other: 1 },
  },
  {
    id: '6', name: 'Priya Subramaniam', classCode: 'CLASS-A',
    preScore: 6, postScore: 8,
    misconceptionCounts: { adding_fractions: 0, whole_number_bias: 0, denominator_only: 0, numerator_only: 1, mixed_number_error: 1, unsimplified: 1, other: 0 },
  },
  {
    id: '7', name: 'Syazwan bin Mohd Noor', classCode: 'CLASS-A',
    preScore: 2, postScore: 2,
    misconceptionCounts: { adding_fractions: 3, whole_number_bias: 2, denominator_only: 1, numerator_only: 1, mixed_number_error: 0, unsimplified: 0, other: 2 },
  },
  {
    id: '8', name: 'Kavitha Pillai', classCode: 'CLASS-A',
    preScore: 3, postScore: 6,
    misconceptionCounts: { adding_fractions: 1, whole_number_bias: 1, denominator_only: 2, numerator_only: 0, mixed_number_error: 0, unsimplified: 1, other: 0 },
  },
  {
    id: '9', name: 'Azri bin Hamzah', classCode: 'CLASS-A',
    preScore: 0, postScore: 0,
    misconceptionCounts: { adding_fractions: 0, whole_number_bias: 0, denominator_only: 0, numerator_only: 0, mixed_number_error: 0, unsimplified: 0, other: 0 },
  },
  {
    id: '10', name: 'Liyana Binti Othman', classCode: 'CLASS-A',
    preScore: 4, postScore: 7,
    misconceptionCounts: { adding_fractions: 1, whole_number_bias: 0, denominator_only: 0, numerator_only: 2, mixed_number_error: 1, unsimplified: 1, other: 0 },
  },
  {
    id: '11', name: 'Darshan Singh', classCode: 'CLASS-A',
    preScore: 3, postScore: 3,
    misconceptionCounts: { adding_fractions: 2, whole_number_bias: 1, denominator_only: 1, numerator_only: 1, mixed_number_error: 0, unsimplified: 1, other: 1 },
  },
  {
    id: '12', name: 'Fatimah Bt. Yusoff', classCode: 'CLASS-A',
    preScore: 5, postScore: 8,
    misconceptionCounts: { adding_fractions: 0, whole_number_bias: 0, denominator_only: 1, numerator_only: 0, mixed_number_error: 0, unsimplified: 1, other: 0 },
  },
];

export const MOCK_STUDENTS: MockStudent[] = raw.map(s => ({
  ...s,
  status: getStatus(s.preScore, s.postScore),
  isAtRisk: s.postScore <= 4 || s.postScore <= s.preScore,
  topMisconception: getTopMisconception(s.misconceptionCounts),
  teacherNote: '',
}));
