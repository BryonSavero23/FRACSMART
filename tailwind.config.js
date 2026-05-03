/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Fredoka One', 'cursive'],
        'body': ['Nunito', 'sans-serif'],
      },
      colors: {
        'brand-purple': {
          DEFAULT: '#5C35A0',
          light: '#7B52C4',
          dark: '#3E2070',
        },
        'brand-orange': {
          DEFAULT: '#F5A623',
          light: '#F7B84B',
          dark: '#D4861B',
        },
        'navy': {
          DEFAULT: '#1E1A3C',
          light: '#2D2858',
          dark: '#140F2A',
        },
        'indigo': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        'amber': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
};
