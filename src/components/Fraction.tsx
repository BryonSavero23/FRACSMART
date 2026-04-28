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
  return (
    <span
      className={`inline-flex flex-col items-center font-bold leading-none ${className}`}
      aria-label={`${numerator} over ${denominator}`}
      role="math"
    >
      <span className={`${sizes[size]} ${color}`}>{numerator}</span>
      <span className={`block w-full border-t-2 border-current my-0.5 ${color}`} />
      <span className={`${sizes[size]} ${color}`}>{denominator}</span>
    </span>
  );
}
