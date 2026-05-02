import React from 'react';

interface FractionProps {
  numerator: number | string;
  denominator: number | string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export function Fraction({
  numerator,
  denominator,
  color = 'text-blue-600',
  size = 'lg',
  className = '',
}: FractionProps) {

  // 👉 Convert to number (because props can be string)
  const num = Number(numerator);
  const den = Number(denominator);

  // ✅ If whole number → just show numerator
  if (den === 1) {
    return (
      <span
        className={`inline-flex items-center font-bold ${sizes[size]} ${color} ${className}`}
        aria-label={`${num}`}
        role="math"
      >
        {num}
      </span>
    );
  }

  // 👉 Normal fraction
  return (
    <span
      className={`inline-flex flex-col items-center font-bold leading-none ${className}`}
      aria-label={`${num} over ${den}`}
      role="math"
    >
      <span className={`${sizes[size]} ${color}`}>{num}</span>
      <span className={`block w-full border-t-2 border-current my-0.5 ${color}`} />
      <span className={`${sizes[size]} ${color}`}>{den}</span>
    </span>
  );
}