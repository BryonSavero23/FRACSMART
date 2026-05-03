import { create } from 'zustand';
import type { MisconceptionType } from '../lib/misconceptionDetection';

export interface QuizAnswer {
  questionId: number;
  studentNumerator: number | null;
  studentDenominator: number | null;
  isCorrect: boolean;
  misconceptionType: MisconceptionType;
  timeTakenMs: number;
}

export interface QuizRun {
  answers: QuizAnswer[];
  score: number;
  startTime: number;
  endTime: number | null;
}

interface QuizStore {
  preTest: QuizRun | null;
  postTest: QuizRun | null;
  currentQuestionStart: number | null;

  startPreTest: () => void;
  startPostTest: () => void;
  recordAnswer: (mode: 'pre' | 'post', answer: Omit<QuizAnswer, 'timeTakenMs'>) => void;
  finalizeRun: (mode: 'pre' | 'post') => void;
  resetAll: () => void;
}

const makeRun = (): QuizRun => ({
  answers: [],
  score: 0,
  startTime: Date.now(),
  endTime: null,
});

export const useQuizStore = create<QuizStore>((set, get) => ({
  preTest: null,
  postTest: null,
  currentQuestionStart: null,

  startPreTest: () => set({ preTest: makeRun(), currentQuestionStart: Date.now() }),

  startPostTest: () => set({ postTest: makeRun(), currentQuestionStart: Date.now() }),

  recordAnswer: (mode, answer) => {
    const now = Date.now();
    const start = get().currentQuestionStart ?? now;
    const fullAnswer: QuizAnswer = { ...answer, timeTakenMs: now - start };

    set(state => {
      const run = mode === 'pre' ? state.preTest : state.postTest;
      if (!run) return {};
      const updatedRun: QuizRun = {
        ...run,
        answers: [...run.answers, fullAnswer],
        score: run.score + (answer.isCorrect ? 1 : 0),
      };
      return {
        ...(mode === 'pre' ? { preTest: updatedRun } : { postTest: updatedRun }),
        currentQuestionStart: Date.now(),
      };
    });
  },

  finalizeRun: (mode) => {
    set(state => {
      const run = mode === 'pre' ? state.preTest : state.postTest;
      if (!run) return {};
      const finalized = { ...run, endTime: Date.now() };
      return mode === 'pre' ? { preTest: finalized } : { postTest: finalized };
    });
  },

  resetAll: () => set({ preTest: null, postTest: null, currentQuestionStart: null }),
}));
