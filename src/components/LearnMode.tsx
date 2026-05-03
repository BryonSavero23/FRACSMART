import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, Eye, Calculator } from 'lucide-react';
import { Fraction } from './Fraction';
import { supabase } from '../lib/supabase';

export interface LessonModule {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

// ─── Types for content_json per lesson ────────────────────────────────────────

export interface BasicsContent {
  sectionTitle: string;
  introParagraph: string;
  exampleTitle: string;
  rememberTitle: string;
  bullets: string[];
}

export interface AreaModelContent {
  sectionTitle: string;
  introParagraph: string;
  howToTitle: string;
  lightBlueLabel: string;
  lightBlueDesc: string;
  yellowLabel: string;
  yellowDesc: string;
  tryTitle: string;
}

export interface ExamplesContent {
  example1Title: string;
  example1Para: string;
  example1Steps: string[];
  example2Title: string;
  example2Para: string;
  example2Steps: string[];
  example3Title: string;
  example3Para: string;
  example3Steps: string[];
}

export interface MistakesContent {
  mistake1Title: string;
  mistake2Title: string;
  mistake3Title: string;
  mistake4Title: string;
  tipsTitle: string;
  tips: string[];
}

export type CurriculumContent = BasicsContent | AreaModelContent | ExamplesContent | MistakesContent;

export interface CurriculumLesson {
  id: string;
  lesson_number: number;
  title: string;
  content_json: CurriculumContent;
}

// ─── Default content ───────────────────────────────────────────────────────────

export const defaultContent: Record<string, CurriculumContent> = {
  basics: {
    sectionTitle: 'The Golden Rule',
    introParagraph: 'When we multiply two fractions, we follow a simple pattern:',
    exampleTitle: "Let's See an Example",
    rememberTitle: 'Remember',
    bullets: [
      'Multiply the numerators (top numbers) together',
      'Multiply the denominators (bottom numbers) together',
      'Simplify if possible',
    ],
  } as BasicsContent,
  'area-model': {
    sectionTitle: 'What is an Area Model?',
    introParagraph: 'An area model helps us SEE fraction multiplication! We draw a rectangle and shade parts of it.',
    howToTitle: 'How to Read the Area Model',
    lightBlueLabel: 'Light Blue Areas',
    lightBlueDesc: 'Show each fraction separately',
    yellowLabel: 'Yellow Area (Overlap)',
    yellowDesc: 'Shows the answer! This is where both fractions meet.',
    tryTitle: 'Try Another Example',
  } as AreaModelContent,
  examples: {
    example1Title: "Example 1: Amirah's Pizza",
    example1Para: "Amirah has a pizza. She eats \u00bd of it. Then she gives \u2153 of what's left to her brother. What fraction did her brother get?",
    example1Steps: [
      'We need to multiply: \u00b9\u2044\u2082 \u00d7 \u00b9\u2044\u2083',
      'Multiply the tops: 1 \u00d7 1 = 1',
      'Multiply the bottoms: 2 \u00d7 3 = 6',
      'The answer is \u00b9\u2044\u2086 of the original pizza!',
    ],
    example2Title: "Example 2: Hafiz's Nasi Lemak",
    example2Para: "Hafiz bought nasi lemak. He ate \u2154 of it. Then he shared \u00bd of the remaining portion with Siti. How much did Siti get?",
    example2Steps: [
      'We need to multiply: \u00b2\u2044\u2083 \u00d7 \u00b9\u2044\u2082',
      'Multiply the tops: 2 \u00d7 1 = 2',
      'Multiply the bottoms: 3 \u00d7 2 = 6',
      "The answer is \u00b2\u2044\u2086, which simplifies to \u00b9\u2044\u2083!",
    ],
    example3Title: "Example 3: Siti's Cookies",
    example3Para: "Siti baked cookies. She gave \u00be to her friends. Then she gave \u2154 of the remaining cookies to her teacher. What fraction of the original cookies did the teacher receive?",
    example3Steps: [
      'We need to multiply: \u00b3\u2044\u2084 \u00d7 \u00b2\u2044\u2083',
      'Multiply the tops: 3 \u00d7 2 = 6',
      'Multiply the bottoms: 4 \u00d7 3 = 12',
      "The answer is \u2076\u2044\u2081\u2082, which simplifies to \u00b9\u2044\u2082!",
    ],
  } as ExamplesContent,
  mistakes: {
    mistake1Title: 'Mistake 1: Adding Instead of Multiplying',
    mistake2Title: 'Mistake 2: Only Multiplying Denominators',
    mistake3Title: 'Mistake 3: Only Multiplying Numerators',
    mistake4Title: 'Mistake 4: Forgetting to Simplify',
    tipsTitle: 'Remember These Tips!',
    tips: [
      "Always MULTIPLY both tops and bottoms \u2014 never add them!",
      'Check if your answer can be simplified by dividing both numbers by the same value',
      'Use the area model to visualize and check your work',
    ],
  } as MistakesContent,
};

// ─── Visual sub-components ─────────────────────────────────────────────────────

function AreaModel({ f1Num, f1Den, f2Num, f2Den }: { f1Num: number; f1Den: number; f2Num: number; f2Den: number }) {
  const cells = [];
  for (let row = 0; row < f1Den; row++) {
    for (let col = 0; col < f2Den; col++) {
      const isInFirstFraction = row < f1Num;
      const isInSecondFraction = col < f2Num;
      const isOverlap = isInFirstFraction && isInSecondFraction;
      cells.push(
        <div
          key={`${row}-${col}`}
          className={`w-12 h-12 border-2 border-gray-400 transition-all duration-300 ${
            isOverlap ? 'bg-amber-400' : isInFirstFraction ? 'bg-indigo-200' : isInSecondFraction ? 'bg-indigo-200' : 'bg-white'
          }`}
        />
      );
    }
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${f2Den}, 1fr)` }}>
        {cells}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Shaded area = <span className="font-bold text-amber-600">{f1Num * f2Num}</span> out of{' '}
          <span className="font-bold text-indigo-600">{f1Den * f2Den}</span> squares
        </p>
      </div>
    </div>
  );
}

function StepReveal({ steps }: { steps: React.ReactNode[] }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-4">

      {steps.map((step, index) => (
        <div
          key={index}
          className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
            index <= currentStep
              ? "bg-indigo-50 border-indigo-300 opacity-100"
              : "bg-gray-50 border-gray-200 opacity-60"
          }`}
        >
          <div className="flex items-center gap-4">

            {/* Number Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index <= currentStep
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              {index + 1}
            </div>

            {/* Step Content */}
            <div className="flex-1 text-gray-700 text-lg flex flex-wrap items-center gap-2">
              {step}
            </div>

          </div>
        </div>
      ))}

      {/* Button */}
      {currentStep < steps.length - 1 && (
        <button
          onClick={() => setCurrentStep(currentStep + 1)}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-4 rounded-2xl text-lg transition"
        >
          Show Next Step
        </button>
      )}

      {/* Completed */}
      {currentStep === steps.length - 1 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center font-bold text-green-700 text-lg">
          ✅ All steps complete!
        </div>
      )}

    </div>
  );
}

// ─── Build module JSX from data ────────────────────────────────────────────────

function buildBasicsContent(c: BasicsContent): React.ReactNode {
  return (
    <div className="space-y-8 w-full">

      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold text-indigo-700 flex items-center gap-3">
          ⭐ {c.sectionTitle}
        </h2>

        <p className="text-gray-600 text-lg mt-2">
          Learn the simple pattern to multiply two fractions!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 w-full">

        {/* LEFT IMAGE SECTION */}
        <div className="xl:col-span-4 bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100">

          <div className="relative h-[520px] w-full">

            <img
              src="/golden-rule-slide2.png"
              alt="The Golden Rule"
              className="w-full h-full object-contain bg-white"
            />

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">

          {/* Key Points */}
          <div className="bg-white rounded-3xl shadow-md p-6 border border-gray-100">

            <h3 className="text-2xl font-bold text-indigo-700 mb-6">
              📋 Key Points
            </h3>

            <div className="space-y-5">

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  🟢
                </div>

                <div>
                  <p className="font-bold text-green-600">
                    Top × Top
                  </p>

                  <p className="text-sm text-gray-500">
                    Multiply numerators to get new top.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  🔵
                </div>

                <div>
                  <p className="font-bold text-blue-600">
                    Bottom × Bottom
                  </p>

                  <p className="text-sm text-gray-500">
                    Multiply denominators to get new bottom.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  🟣
                </div>

                <div>
                  <p className="font-bold text-purple-600">
                    Then Simplify!
                  </p>

                  <p className="text-sm text-gray-500">
                    Reduce your answer if possible.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Remember */}
          <div className="bg-blue-50 rounded-3xl p-5 shadow-md border border-blue-100">

            <p className="font-bold text-indigo-700 mb-2">
              Remember:
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">
              Top with top,
              <br />
              bottom with bottom,
              <br />
              and simplify!
            </p>

          </div>

        </div>
      </div>

      {/* Example Section */}
      <div className="bg-yellow-50 rounded-3xl p-8 border border-yellow-100 shadow-sm w-full">

        <h3 className="text-2xl font-bold text-orange-500 mb-8">
          ✨ Let’s See an Example
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-center">

          {/* Fraction Question */}
          <div className="flex items-center justify-center gap-4">

            <Fraction
              numerator={2}
              denominator={3}
              color="text-indigo-600"
              size="xl"
            />

            <span className="text-4xl text-gray-400">×</span>

            <Fraction
              numerator={2}
              denominator={12}
              color="text-orange-500"
              size="xl"
            />

          </div>

          {/* Step 1 */}
          <div className="bg-blue-100 rounded-2xl p-5 text-center min-h-[120px] flex flex-col justify-center">

            <p className="font-bold text-blue-700">
              Step 1
            </p>

            <p className="text-sm">
              Top × Top
            </p>

            <p className="font-bold mt-2">
              2 × 2 = 4
            </p>

          </div>

          {/* Step 2 */}
          <div className="bg-orange-100 rounded-2xl p-5 text-center min-h-[120px] flex flex-col justify-center">

            <p className="font-bold text-orange-700">
              Step 2
            </p>

            <p className="text-sm">
              Bottom × Bottom
            </p>

            <p className="font-bold mt-2">
              3 × 12 = 36
            </p>

          </div>

          {/* Step 3 */}
          <div className="bg-green-100 rounded-2xl p-5 text-center min-h-[120px] flex flex-col justify-center">

            <p className="font-bold text-green-700">
              Step 3
            </p>

            <p className="text-sm">
              Simplify
            </p>

            <div className="flex items-center justify-center gap-2 mt-2">

              <Fraction
                numerator={4}
                denominator={36}
                color="text-green-700"
                size="sm"
              />

              <span>=</span>

              <Fraction
                numerator={1}
                denominator={9}
                color="text-green-700"
                size="sm"
              />

            </div>

          </div>

          {/* Answer */}
          <div className="bg-white rounded-2xl shadow-md p-5 text-center min-h-[120px] flex flex-col justify-center border">

            <p className="text-lg font-bold text-gray-700">
              Answer:
            </p>

            <div className="flex flex-col items-center mt-2">

              <Fraction
                numerator={1}
                denominator={9}
                color="text-green-600"
                size="xl"
              />

              <span className="text-2xl mt-1">
                ✅
              </span>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

function buildAreaModelContent(_c: AreaModelContent): React.ReactNode {
  return (
    <div className="w-full">
      <img
        src="/lesson2.png"
        alt="Area Model Visuals"
        style={{ aspectRatio: '1024 / 683' }}
        className="w-full rounded-2xl shadow-md object-cover"
      />
    </div>
  );
}

function buildExamplesContent(c: ExamplesContent): React.ReactNode {
  return (
    <div className="space-y-6 w-full">

      {/* HEADER */}
      <div>
        <h2 className="text-4xl font-bold text-indigo-700 flex items-center gap-3">
          💡 Worked Examples
        </h2>

        <p className="text-gray-600 text-lg mt-2">
          Let’s solve 5 fraction multiplication questions step by step!
        </p>
      </div>

      {/* EXAMPLE 1 */}
      <div className="bg-indigo-50 rounded-3xl p-6 border shadow-sm">

        <h3 className="text-2xl font-bold text-indigo-700 mb-5">
          Example 1
        </h3>

        <div className="flex items-center gap-4 mb-5">

          <Fraction numerator={2} denominator={3} color="text-indigo-600" size="xl" />

          <span className="text-3xl">×</span>

          <Fraction numerator={1} denominator={4} color="text-orange-500" size="xl" />

        </div>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-blue-600">Step 1</p>
            <p>2 × 1 = 2</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-orange-600">Step 2</p>
            <p>3 × 4 = 12</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-green-600">Answer</p>

            <Fraction numerator={1} denominator={6} color="text-green-600" size="lg" />
          </div>

        </div>
      </div>

      {/* EXAMPLE 2 */}
      <div className="bg-orange-50 rounded-3xl p-6 border shadow-sm">

        <h3 className="text-2xl font-bold text-orange-700 mb-5">
          Example 2
        </h3>

        <div className="flex items-center gap-4 mb-5">

          <Fraction numerator={3} denominator={5} color="text-indigo-600" size="xl" />

          <span className="text-3xl">×</span>

          <Fraction numerator={2} denominator={7} color="text-orange-500" size="xl" />

        </div>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-blue-600">Step 1</p>
            <p>3 × 2 = 6</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-orange-600">Step 2</p>
            <p>5 × 7 = 35</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-green-600">Answer</p>

            <Fraction numerator={6} denominator={35} color="text-green-600" size="lg" />
          </div>

        </div>
      </div>

      {/* EXAMPLE 3 */}
      <div className="bg-green-50 rounded-3xl p-6 border shadow-sm">

        <h3 className="text-2xl font-bold text-green-700 mb-5">
          Example 3
        </h3>

        <div className="flex items-center gap-4 mb-5">

          <span className="text-3xl font-bold">2</span>

          <span className="text-3xl">×</span>

          <Fraction numerator={3} denominator={4} color="text-indigo-600" size="xl" />

        </div>

        <div className="grid md:grid-cols-4 gap-4">

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-blue-600">Convert</p>

            <Fraction numerator={2} denominator={1} color="text-blue-600" size="lg" />
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-indigo-600">Step 1</p>
            <p>2 × 3 = 6</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-orange-600">Step 2</p>
            <p>1 × 4 = 4</p>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="font-bold text-green-600">Answer</p>

            <div className="flex items-center justify-center gap-2 flex-wrap">

              <Fraction numerator={3} denominator={2} color="text-green-600" size="lg" />

              <span>=</span>

              <span className="font-bold">1</span>

              <Fraction numerator={1} denominator={2} color="text-green-600" size="sm" />

            </div>

          </div>

        </div>
      </div>

      {/* EXAMPLE 4 */}
<div className="bg-blue-50 rounded-3xl p-6 border shadow-sm">

  <h3 className="text-2xl font-bold text-blue-700 mb-5">
    Example 4: Amirah's Pizza
  </h3>

  {/* Question Sentence */}
  <p className="text-lg text-gray-700 leading-relaxed mb-6">
    Amirah has a pizza. She gives{" "}
    <Fraction numerator={1} denominator={2} color="text-indigo-600" size="sm" />{" "}
    of it to her friend. Her friend eats{" "}
    <Fraction numerator={1} denominator={3} color="text-orange-500" size="sm" />{" "}
    of that share. What fraction of the whole pizza was eaten?
  </p>

  {/* Steps */}
  <StepReveal
    steps={[
      <>
        We need to multiply:
        <Fraction numerator={1} denominator={2} color="text-indigo-600" size="sm" />
        <span>×</span>
        <Fraction numerator={1} denominator={3} color="text-orange-500" size="sm" />
      </>,

      <>Multiply the tops: 1 × 1 = 1</>,

      <>Multiply the bottoms: 2 × 3 = 6</>,

      <>
        The answer is{" "}
        <Fraction numerator={1} denominator={6} color="text-green-600" size="sm" />{" "}
        of the original pizza!
      </>,
    ]}
  />

</div>


{/* EXAMPLE 5 */}
<div className="bg-purple-50 rounded-3xl p-6 border shadow-sm">

  <h3 className="text-2xl font-bold text-purple-700 mb-5">
    Example 5: Hafiz's Water Bottle
  </h3>

  {/* Question Sentence */}
  <p className="text-lg text-gray-700 leading-relaxed mb-6">
    Hafiz filled{" "}
    <Fraction numerator={3} denominator={4} color="text-indigo-600" size="sm" />{" "}
    of a bottle. He drank{" "}
    <Fraction numerator={2} denominator={3} color="text-orange-500" size="sm" />{" "}
    of the filled water. How much of the whole bottle did he drink?
  </p>

  {/* Steps */}
  <StepReveal
    steps={[
      <>
        We need to multiply:
        <Fraction numerator={3} denominator={4} color="text-indigo-600" size="sm" />
        <span>×</span>
        <Fraction numerator={2} denominator={3} color="text-orange-500" size="sm" />
      </>,

      <>Multiply the tops: 3 × 2 = 6</>,

      <>Multiply the bottoms: 4 × 3 = 12</>,

      <>
        Simplify:
        <Fraction numerator={6} denominator={12} color="text-green-600" size="sm" />
        <span>=</span>
        <Fraction numerator={1} denominator={2} color="text-green-600" size="sm" />
      </>,

      <>
        The answer is{" "}
        <Fraction numerator={1} denominator={2} color="text-green-600" size="sm" />{" "}
        of the whole bottle!
      </>,
    ]}
  />

</div>

    </div>
  );
}

function buildMistakesContent(_c: MistakesContent): React.ReactNode {
  return (
    <div className="flex justify-center">
      <img
        src="/common-mistakes.png"
        alt="5 Common Mistakes in Multiplying Fractions"
        className="w-full max-w-2xl rounded-2xl shadow-md"
      />
    </div>
  );
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  basics: <Calculator className="w-6 h-6" />,
  'area-model': <Eye className="w-6 h-6" />,
  examples: <Lightbulb className="w-6 h-6" />,
  mistakes: <AlertTriangle className="w-6 h-6" />,
};

export function buildModules(lessons: CurriculumLesson[]): LessonModule[] {
  return lessons.map((lesson) => {
    const c = lesson.content_json;
    let content: React.ReactNode;
    if (lesson.id === 'basics') content = buildBasicsContent(c as BasicsContent);
    else if (lesson.id === 'area-model') content = buildAreaModelContent(c as AreaModelContent);
    else if (lesson.id === 'examples') content = buildExamplesContent(c as ExamplesContent);
    else content = buildMistakesContent(c as MistakesContent);
    return { id: lesson.id, title: lesson.title, icon: MODULE_ICONS[lesson.id], color: 'indigo', content };
  });
}

export async function fetchCurriculumLessons(): Promise<CurriculumLesson[]> {
  const { data, error } = await supabase
    .from('curriculum_lessons')
    .select('id, lesson_number, title, content_json')
    .order('lesson_number', { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      { id: 'basics', lesson_number: 1, title: 'What is Fraction Multiplication?', content_json: defaultContent.basics },
      { id: 'area-model', lesson_number: 2, title: 'Area Model Visuals', content_json: defaultContent['area-model'] },
      { id: 'examples', lesson_number: 3, title: 'Worked Examples', content_json: defaultContent.examples },
      { id: 'mistakes', lesson_number: 4, title: 'Common Mistakes to Avoid', content_json: defaultContent.mistakes },
    ];
  }
  return data as CurriculumLesson[];
}

// Static export kept for backwards-compat (TeacherDashboard imports it)
export const modules: LessonModule[] = buildModules([
  { id: 'basics', lesson_number: 1, title: 'What is Fraction Multiplication?', content_json: defaultContent.basics },
  { id: 'area-model', lesson_number: 2, title: 'Area Model Visuals', content_json: defaultContent['area-model'] },
  { id: 'examples', lesson_number: 3, title: 'Worked Examples', content_json: defaultContent.examples },
  { id: 'mistakes', lesson_number: 4, title: 'Common Mistakes to Avoid', content_json: defaultContent.mistakes },
]);

// ─── LearnMode component ───────────────────────────────────────────────────────

interface LearnModeProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function LearnMode({ onBack, onNext }: LearnModeProps = {}) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [lessonModules, setLessonModules] = useState<LessonModule[]>(modules);

  useEffect(() => {
    fetchCurriculumLessons().then((lessons) => {
      setLessonModules(buildModules(lessons));
    });
  }, []);

  return (
   <div className="max-w-7xl mx-auto p-4">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-semibold"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          Back to Home
        </button>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl text-indigo-700 mb-2">Learn Fraction Multiplication</h1>
        <p className="text-gray-600">Tap each lesson to explore and learn!</p>
      </div>
      <div className="space-y-4">
        {lessonModules.map((module, index) => (
          <div key={module.id} className="card card-hover overflow-hidden">
            <button
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${expandedModule === module.id ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                  {module.icon}
                </div>
                <div>
                  <h2 className="text-xl text-gray-800">Lesson {index + 1}</h2>
                  <p className="text-gray-600">{module.title}</p>
                </div>
              </div>
              {expandedModule === module.id ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>
            {expandedModule === module.id && (
              <div className="px-4 pb-4 animate-fadeIn">
                <div className="border-t-2 border-gray-100 pt-4">
                  {module.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Continue to Practice button */}
      {onNext && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: '#5C35A0' }}
          >
            Continue to Practice
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      )}
    </div>
  );
}
