import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  Clock,
  Flame,
  Play,
  RotateCcw,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { FRIENDS_QUIZ_QUESTIONS } from '../../data/challenges';
import { FriendsQuizQuestion } from '../../types/game';
import { soundEngine } from '../../utils/sound';

interface FriendsRaceChallengeProps {
  bestScore: number;
  onComplete: (bonusStars: number, racePoints: number) => void;
  onCancel: () => void;
}

type RaceMode = 'rival' | 'solo';
type Phase = 'lobby' | 'playing' | 'finished';

const RACE_DURATION_SEC = 45;

function shuffleQuestions(arr: FriendsQuizQuestion[]): FriendsQuizQuestion[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const FriendsRaceChallenge: React.FC<FriendsRaceChallengeProps> = ({
  bestScore,
  onComplete,
  onCancel,
}) => {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [mode, setMode] = useState<RaceMode>('rival');
  const [questions, setQuestions] = useState<FriendsQuizQuestion[]>(() =>
    shuffleQuestions(FRIENDS_QUIZ_QUESTIONS)
  );
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RACE_DURATION_SEC);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const currentQuestion = questions[qIndex % questions.length];

  const startRace = (selectedMode: RaceMode) => {
    soundEngine.playChime(1.05);
    setMode(selectedMode);
    setQuestions(shuffleQuestions(FRIENDS_QUIZ_QUESTIONS));
    setQIndex(0);
    setTimeLeft(RACE_DURATION_SEC);
    setScore(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setStreak(0);
    setMaxStreak(0);
    setRivalScore(0);
    setPickedIndex(null);
    setPhase('playing');
  };

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          soundEngine.playCelebration();
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Offline friendly rival ("سلمى") paces steadily every ~4.2s
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'rival') return;
    const rivalTimer = window.setInterval(() => {
      setRivalScore((prev) => prev + (Math.random() < 0.8 ? 15 : 0));
    }, 4200);
    return () => window.clearInterval(rivalTimer);
  }, [phase, mode]);

  const handleAnswer = (optIdx: number) => {
    if (phase !== 'playing' || pickedIndex !== null) return;
    setPickedIndex(optIdx);
    setAnsweredCount((c) => c + 1);

    const isCorrect = optIdx === currentQuestion.correctIndex;
    if (isCorrect) {
      const nextStreak = streak + 1;
      const earned = 15 + Math.min(3, nextStreak - 1) * 5;
      soundEngine.playChime(1 + Math.min(0.35, nextStreak * 0.05));
      setStreak(nextStreak);
      setMaxStreak((m) => Math.max(m, nextStreak));
      setCorrectCount((c) => c + 1);
      setScore((s) => s + earned);
    } else {
      soundEngine.playOops();
      setStreak(0);
    }

    window.setTimeout(() => {
      setPickedIndex(null);
      setQIndex((idx) => idx + 1);
    }, 450);
  };

  // Keyboard 1 / 2 / 3 shortcuts for fast response
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') handleAnswer(0);
      if (e.key === '2') handleAnswer(1);
      if (e.key === '3') handleAnswer(2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const accuracyPct = useMemo(() => {
    if (answeredCount === 0) return 0;
    return Math.round((correctCount / answeredCount) * 100);
  }, [answeredCount, correctCount]);

  const wonAgainstRival = mode === 'rival' && score >= rivalScore && score > 0;
  const bonusStars = score >= 120 || wonAgainstRival ? 5 : score >= 60 ? 2 : 0;
  const levelPointsEarned = Math.max(25, Math.round(score * 0.65));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1C2A24]/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friends-race-title"
    >
      <div className="animate-pop-in flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#1C2A24]/15 bg-[#FAF6EE] shadow-xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2A24]/10 bg-[#FFFFFF] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C78318]/15 text-[#9A6008]">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 id="friends-race-title" className="text-lg font-bold text-[#1C2A24] sm:text-xl">
                تحدي الأصدقاء (غير متصل)
              </h2>
              <p className="text-xs font-medium text-[#52665C] tabular-nums">
                سباق أسئلة سريعة حول القيم الإسلامية · أفضل نتيجة: {bestScore} نقطة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق تحدي الأصدقاء"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE] text-[#1C2A24] hover:bg-[#EFE7D6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {phase === 'lobby' && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-[#1C2A24]/10 bg-[#FFFFFF] p-5 text-center">
                <h3 className="text-lg font-bold text-[#1C2A24]">
                  اختر نمط السباق السريع (45 ثانية)
                </h3>
                <p className="mt-1 text-sm text-[#475B51]">
                  كل إجابة صحيحة متتالية تمنحك نقاطاً مضاعفة وتقرّب فُلَّة من المستوى التالي!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => startRace('rival')}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-[#0F6B4E]/30 bg-[#FFFFFF] p-5 text-right shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#0F6B4E] focus-visible:outline-2 focus-visible:outline-[#0F6B4E]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F6B4E]/12 text-[#0F6B4E]">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#1C2A24]">
                      منافسة صديقة فُلَّة (سلمى)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#52665C]">
                      تسابق مع سلمى دون إنترنت في 45 ثانية واجب على أكبر عدد من أسئلة القيم.
                    </p>
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-[#0F6B4E]">
                    <Play className="h-4 w-4 fill-current" />
                    <span>بدء المنافسة</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => startRace('solo')}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-[#C78318]/30 bg-[#FFFFFF] p-5 text-right shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#C78318] focus-visible:outline-2 focus-visible:outline-[#C78318]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C78318]/15 text-[#9A6008]">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#1C2A24]">
                      سباق الوقت الفردي
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#52665C]">
                      ركّز على تحطيم رقمك القياسي الشخصي عبر سلسلة إجابات صحيحة متتابعة.
                    </p>
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-[#9A6008]">
                    <Play className="h-4 w-4 fill-current" />
                    <span>بدء السباق الفردي</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {phase === 'playing' && (
            <div className="flex flex-col gap-5">
              {/* Live Race Scoreboard & Timer */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1C2A24]/12 bg-[#FFFFFF] p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-base font-extrabold tabular-nums ${
                      timeLeft <= 10
                        ? 'bg-[#FCECE9] text-[#C2412D]'
                        : 'bg-[#FAF6EE] text-[#1C2A24]'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="font-mono-num">{timeLeft} ث</span>
                  </div>

                  <div className="text-sm font-bold text-[#0F6B4E] tabular-nums">
                    نقاطك: <span className="font-mono-num text-lg">{score}</span>
                  </div>

                  {streak > 1 && (
                    <div className="flex items-center gap-1 text-xs font-extrabold text-[#C78318] tabular-nums">
                      <Flame className="h-4 w-4 fill-[#C78318]" />
                      <span>تتابع {streak}×</span>
                    </div>
                  )}
                </div>

                {mode === 'rival' && (
                  <div className="text-sm font-bold text-[#6D4C9E] tabular-nums">
                    نقاط سلمى: <span className="font-mono-num text-lg">{rivalScore}</span>
                  </div>
                )}
              </div>

              {/* Rival Progress Comparison Track */}
              {mode === 'rival' && (
                <div className="space-y-2 rounded-xl border border-[#1C2A24]/10 bg-[#FFFFFF] p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-xs font-bold text-[#0F6B4E]">فُلَّة</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EFE7D6]">
                      <div
                        className="h-full rounded-full bg-[#0F6B4E] transition-transform duration-200 origin-right"
                        style={{
                          transform: `scaleX(${Math.min(1, Math.max(0.04, score / 180))})`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-xs font-bold text-[#6D4C9E]">سلمى</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EFE7D6]">
                      <div
                        className="h-full rounded-full bg-[#6D4C9E] transition-transform duration-200 origin-right"
                        style={{
                          transform: `scaleX(${Math.min(1, Math.max(0.04, rivalScore / 180))})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Current Question Card */}
              <div className="rounded-2xl border border-[#1C2A24]/12 bg-[#FFFFFF] p-5 sm:p-6">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#1E6B8A]">
                  <span>المجال: {currentQuestion.category}</span>
                  <span className="tabular-nums">السؤال {answeredCount + 1}</span>
                </div>

                <h3 className="text-lg font-bold leading-relaxed text-[#1C2A24] sm:text-xl">
                  {currentQuestion.question}
                </h3>

                <div className="mt-4 space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isPicked = pickedIndex === idx;
                    const isCorrectOpt = idx === currentQuestion.correctIndex;
                    const showCorrect = pickedIndex !== null && isCorrectOpt;
                    const showWrong = isPicked && !isCorrectOpt;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={pickedIndex !== null}
                        onClick={() => handleAnswer(idx)}
                        className={`flex min-h-13 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition-transform duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#0F6B4E] sm:text-base ${
                          showCorrect
                            ? 'border-[#0F6B4E] bg-[#E6F4EE] text-[#0F6B4E]'
                            : showWrong
                              ? 'border-[#C2412D] bg-[#FCECE9] text-[#9E2E1D]'
                              : 'border-[#1C2A24]/15 bg-[#FAF6EE] text-[#1C2A24] hover:border-[#0F6B4E] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="font-mono-num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFFFFF] text-xs font-bold text-[#475B51] border border-[#1C2A24]/10">
                            {idx + 1}
                          </span>
                          <span>{opt}</span>
                        </span>
                        {showCorrect && <Check className="h-5 w-5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {phase === 'finished' && (
            <div className="animate-pop-in flex flex-col items-center gap-4 rounded-2xl border border-[#0F6B4E]/25 bg-[#FFFFFF] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C78318]/15 text-[#C78318]">
                <Award className="h-9 w-9" />
              </div>

              <h3 className="text-2xl font-bold text-[#1C2A24]">
                {mode === 'rival'
                  ? wonAgainstRival
                    ? 'مبارك! فزتِ على سلمى في السباق!'
                    : 'أحسنتِ! منافسة جميلة وممتعة'
                  : 'انتهى السباق السريع بنجاح!'}
              </h3>

              <div className="grid w-full max-w-md grid-cols-3 gap-3 rounded-xl border border-[#1C2A24]/10 bg-[#FAF6EE] p-4">
                <div>
                  <div className="text-xs font-semibold text-[#52665C]">نتيجة السباق</div>
                  <div className="font-mono-num text-xl font-extrabold text-[#0F6B4E] tabular-nums">
                    {score}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#52665C]">الدقة</div>
                  <div className="font-mono-num text-xl font-extrabold text-[#1E6B8A] tabular-nums">
                    {accuracyPct}%
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#52665C]">أطول تتابع</div>
                  <div className="font-mono-num text-xl font-extrabold text-[#C78318] tabular-nums">
                    {maxStreak}×
                  </div>
                </div>
              </div>

              <p className="text-sm font-bold text-[#0F6B4E] tabular-nums">
                ستُضاف +{levelPointsEarned} نقطة إلى مستواك و +{15 + bonusStars} نجمة!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => startRace(mode)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-[#1C2A24]/15 bg-[#FAF6EE] px-5 py-2.5 text-sm font-bold text-[#1C2A24] hover:bg-[#EFE7D6]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>سباق جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => onComplete(bonusStars, levelPointsEarned)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-[#0F6B4E] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0B573F]"
                >
                  <Star className="h-4 w-4 fill-current" />
                  <span>استلام النقاط والنجوم</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
