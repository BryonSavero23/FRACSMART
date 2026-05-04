export type MisconceptionType =
  | 'adding_fractions'
  | 'whole_number_bias'
  | 'denominator_only'
  | 'numerator_only'
  | 'mixed_number_error'
  | 'unsimplified'
  | 'other'
  | null;

export const MISCONCEPTION_LABELS: Record<NonNullable<MisconceptionType>, string> = {
  adding_fractions:  'Additive Interference',
  whole_number_bias: 'Whole Number Bias',
  denominator_only:  'Only Multiplied Denominators',
  numerator_only:    'Only Multiplied Numerators',
  mixed_number_error:'Mixed Number Error',
  unsimplified:      'Simplification Confusion',
  other:             'Other Errors',
};

export const MISCONCEPTION_COLORS: Record<NonNullable<MisconceptionType>, string> = {
  adding_fractions:  '#ef4444',
  whole_number_bias: '#f97316',
  denominator_only:  '#eab308',
  numerator_only:    '#22c55e',
  mixed_number_error:'#3b82f6',
  unsimplified:      '#8b5cf6',
  other:             '#6b7280',
};

const MISCONCEPTION_SHORT: Record<NonNullable<MisconceptionType>, string> = {
  adding_fractions:  'Additive',
  whole_number_bias: 'Whole #',
  denominator_only:  'Denom.',
  numerator_only:    'Numer.',
  mixed_number_error:'Mixed #',
  unsimplified:      'Simplify',
  other:             'Other',
};

export const MISCONCEPTION_ORDER: NonNullable<MisconceptionType>[] = [
  'adding_fractions',
  'whole_number_bias',
  'denominator_only',
  'numerator_only',
  'mixed_number_error',
  'unsimplified',
  'other',
];

export const MISCONCEPTION_TYPES_LIST: Array<{
  key: NonNullable<MisconceptionType>;
  label: string;
  color: string;
  short: string;
}> = MISCONCEPTION_ORDER.map(key => ({
  key,
  label: MISCONCEPTION_LABELS[key],
  color: MISCONCEPTION_COLORS[key],
  short: MISCONCEPTION_SHORT[key],
}));
