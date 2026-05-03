import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressBarProps {
  currentStep: number; // 0=Pre-Test, 1=Lesson, 2=Practice, 3=Post-Test, 4=Summary
}

const STEPS = [
  { label: 'Pre-Test', sublabel: 'Diagnostic (No Hints)' },
  { label: 'Lesson', sublabel: 'Learn with Examples' },
  { label: 'Practice Mode', sublabel: 'Learn & Improve' },
  { label: 'Post-Test (Quiz Mode)', sublabel: 'Assessment (No Hints)' },
  { label: 'Summary', sublabel: 'See Your Improvement' },
];

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-center py-4 px-6 gap-0">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 ${
                  isCompleted
                    ? 'bg-white border-white text-indigo-600'
                    : isActive
                    ? 'bg-white border-white text-indigo-700 shadow-md'
                    : 'bg-transparent border-white/40 text-white/60'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <div className="text-center hidden lg:block">
                <div className={`text-xs font-bold whitespace-nowrap ${isActive ? 'text-white' : isCompleted ? 'text-white/90' : 'text-white/50'}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] whitespace-nowrap ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                  {step.sublabel}
                </div>
              </div>
            </div>

            {index < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${index < currentStep ? 'bg-white' : 'bg-white/30'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
