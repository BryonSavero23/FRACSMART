-- Enforce canonical misconception type values on both answer tables.
-- New types: denominator_only, numerator_only replace partial_multiplication;
-- mixed_number_error is now actively detected for mixed-number questions.

ALTER TABLE session_answers
  ADD CONSTRAINT session_answers_misconception_type_check
  CHECK (
    misconception_type IS NULL OR
    misconception_type IN (
      'adding_fractions',
      'whole_number_bias',
      'denominator_only',
      'numerator_only',
      'mixed_number_error',
      'unsimplified',
      'other'
    )
  );

ALTER TABLE test_answers
  ADD CONSTRAINT test_answers_misconception_type_check
  CHECK (
    misconception_type IS NULL OR
    misconception_type IN (
      'adding_fractions',
      'whole_number_bias',
      'denominator_only',
      'numerator_only',
      'mixed_number_error',
      'unsimplified',
      'other'
    )
  );
