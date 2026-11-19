import React, { useState } from 'react';
import {
  BookHeart,
  BookOpen,
  Brush,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  Droplets,
  HeartHandshake,
  Mic,
  Moon,
  Palette,
  ScrollText,
  Smile,
  Sparkles,
  Star,
  Sun,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  CHALLENGES_META,
  FOOD_OPTIONS,
  PROPHET_STORIES,
} from '../data/challenges';
import { Folla3DViewport } from '../three/Folla3DViewport';
import { InteractiveTargetType } from '../three/sanctuaryEnvironment';
import {
  CameraPresetId,
  ChallengeId,
  FloatingFeedback,
  Folla3DAction,
  FoodOptionId,
  MeterKey,
  SaveProgress,
  TimeOfDay,
} from '../types/game';

interface FollaSanctuaryProps {
  save: SaveProgress;
  timeOfDay: TimeOfDay;
  dialogue: string;
  floatingItems: FloatingFeedback[];
  actionSignal: Folla3DAction;
  dockCollapsed: boolean;
  onToggleDock: () => void;
  onFeed: (foodId: FoodOptionId) => void;
  onDrink: () => void;
  onToggleSleep: () => void;
  onQuickCare: (action: 'smile' | 'dhikr') => void;
  onStartChallenge: (id: ChallengeId) => void;
  onOpenProphetsStories: () => void;
  onOpenCustomizer: () => void;
  onOpenStudio: () => void;
  onFinishDay: () => void;
}

const CHALLENGE_ICONS: Record<ChallengeId, React.ReactNode> = {
  wudu: <Droplets className="h-4 w-4 text-[#0E7490]" />,
  charity_catch: <HeartHandshake className="h-4 w-4 text-[#C78318]" />,
  adhkar_cards: <Sparkles className="h-4 w-4 text-[#0F6B4E]" />,
  values_story: <BookHeart className="h-4 w-4 text-[#B85D6F]" />,
  words_light: <BookOpen className="h-4 w-4 text-[#6D4C9E]" />,
  recite_ayahs: <Mic className="h-4 w-4 text-[#0F6B4E]" />,
  friends_race: <Zap className="h-4 w-4 text-[#C78318]" />,
};

const FEEDBACK_COLORS: Record<MeterKey | 'stars' | 'points', string> = {
  purity: 'text-[#0E7490]',
  faith: 'text-[#0F6B4E]',
  manners: 'text-[#9A6008]',
  knowledge: 'text-[#6D4C9E]',
  stars: 'text-[#C78318]',
  points: 'text-[#0F6B4E]',
};

const CAMERA_OPTIONS: Array<{ id: CameraPresetId; label: string }> = [
  { id: 'overview', label: 'الغرفة كاملة' },
  { id: 'dining', label: 'مائدة الطعام' },
  { id: 'sleep', label: 'ركن النوم' },
  { id: 'closeup', label: 'قريب من فُلَّة' },
];

export const FollaSanctuary: React.FC<FollaSanctuaryProps> = ({
  save,
  timeOfDay,
  dialogue,
  floatingItems,
  actionSignal,
  dockCollapsed,
  onToggleDock,
  onFeed,
  onDrink,
  onToggleSleep,
  onQuickCare,
  onStartChallenge,
  onOpenProphetsStories,
  onOpenCustomizer,
  onOpenStudio,
  onFinishDay,
}) => {
  const [dockTab, setDockTab] = useState<'care' | 'challenges'>('care');
  const [foodMenuOpen, setFoodMenuOpen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [cameraTrigger, setCameraTrigger] = useState(0);

  const dayGoalMet = save.completedToday.length >= 3;

  const selectCameraPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    setCameraTrigger((n) => n + 1);
  };

  const handle3DTargetClick = (target: InteractiveTargetType) => {
    if (target === 'food_table') {
      selectCameraPreset('dining');
      setFoodMenuOpen(true);
    } else if (target === 'water_pitcher') {
      setFoodMenuOpen(false);
      selectCameraPreset('dining');
      onDrink();
    } else if (target === 'bed') {
      setFoodMenuOpen(false);
      selectCameraPreset('sleep');
      onToggleSleep();
    } else if (target === 'bookshelf') {
      onOpenProphetsStories();
    } else if (target === 'folla') {
      if (save.careNeeds.isSleeping) {
        onToggleSleep();
      } else {
        onQuickCare('smile');
      }
    }
  };

  const handleChooseFood = (foodId: FoodOptionId) => {
    setFoodMenuOpen(false);
    selectCameraPreset('dining');
    onFeed(foodId);
  };

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#DFEEF5] select-none">
      {/* Full-Viewport 3D Interactive World */}
      <Folla3DViewport
        appearance={save.appearance}
        timeOfDay={timeOfDay}
        isSleeping={save.careNeeds.isSleeping}
        unlockedKeepsakes={save.unlockedKeepsakes}
        actionSignal={actionSignal}
        cameraPreset={cameraPreset}
        cameraPresetTrigger={cameraTrigger}
        onInteractTarget={handle3DTargetClick}
      />

      {/* Top-Center Dialogue Toast & Finish Day Action (Positioned below HUD, leaves 3D center unobstructed) */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex flex-col items-center gap-2 px-3 sm:top-20">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="max-w-lg rounded-2xl border border-[#1C2A24]/15 bg-[#FAF6EE]/94 px-4 py-2 text-center shadow-sm">
            <p className="text-xs font-bold leading-relaxed text-[#1C2A24] sm:text-sm">
              {dialogue}
            </p>
          </div>

          {dayGoalMet && (
            <button
              type="button"
              onClick={onFinishDay}
              className="pointer-events-auto animate-pop-in flex min-h-10 items-center gap-1.5 rounded-xl bg-[#C78318] px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-md transition-transform duration-150 hover:scale-[1.03] hover:bg-[#AD7011] focus-visible:outline-2 focus-visible:outline-white whitespace-nowrap shrink-0"
            >
              <Star className="h-4 w-4 fill-current" />
              <span>إنهاء اليوم {save.day}</span>
            </button>
          )}
        </div>

        {/* Floating Positive Feedback Text */}
        <div className="relative h-5 flex justify-center">
          {floatingItems.map((item) => (
            <span
              key={item.id}
              className={`animate-pop-in rounded-lg bg-[#FAF6EE]/95 px-2.5 py-0.5 text-xs sm:text-sm font-extrabold shadow-sm ${FEEDBACK_COLORS[item.meter]}`}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex flex-col items-center px-3 transition-transform duration-200"
        style={{
          transform: dockCollapsed ? 'translateY(calc(100% - 40px))' : 'translateY(0)',
        }}
      >
        {/* Collapse / Expand Handle */}
        <button
          type="button"
          onClick={onToggleDock}
          className="pointer-events-auto mb-1.5 flex h-9 items-center gap-1.5 rounded-xl border border-[#1C2A24]/15 bg-[#FAF6EE]/96 px-4 text-xs font-bold text-[#1C2A24] shadow-sm transition-colors hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-4 w-4 text-[#0F6B4E]" />
              <span>إظهار أدوات العناية والتحديات (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 text-[#0F6B4E]" />
              <span>إخفاء اللوحة للاستمتاع بالمشهد (H)</span>
            </>
          )}
        </button>

        {/* Main Dock Panel */}
        <section
          aria-label="لوحة العناية والتحديات"
          className="pointer-events-auto w-full max-w-[min(960px,96vw)] rounded-2xl border border-[#1C2A24]/15 bg-[#FAF6EE]/96 p-3 shadow-xl"
        >
          {/* Food Selector Tray (when feeding) */}
          {foodMenuOpen && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#C78318]/30 bg-[#FFFFFF] p-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1C2A24]">
                <Utensils className="h-4 w-4 text-[#C78318]" />
                <span>اختر وجبة طيبة لفُلَّة (تبدأ ببسم الله):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {FOOD_OPTIONS.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleChooseFood(food.id)}
                    className="flex min-h-10 items-center gap-2 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE] px-3 py-1.5 text-xs font-bold text-[#1C2A24] transition-transform hover:scale-[1.02] hover:border-[#0F6B4E] hover:bg-[#E6F4EE] whitespace-nowrap shrink-0"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: food.color }}
                    />
                    <span>{food.name}</span>
                    <span className="font-mono-num text-[11px] text-[#0F6B4E]">
                      +{food.hungerBoost}%
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFoodMenuOpen(false)}
                  className="min-h-10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#52665C] hover:bg-[#EFE7D6] whitespace-nowrap"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}

          {/* Top Bar of Dock: Segmented Tab Switcher + Camera Presets */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2A24]/10 pb-2">
            {/* Segmented Mode Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-[#EFE7D6] p-1">
              <button
                type="button"
                onClick={() => setDockTab('care')}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  dockTab === 'care'
                    ? 'bg-[#0F6B4E] text-white shadow-sm'
                    : 'text-[#475B51] hover:text-[#1C2A24]'
                }`}
              >
                العناية بفُلَّة (أكل · شرب · نوم)
              </button>
              <button
                type="button"
                onClick={() => setDockTab('challenges')}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  dockTab === 'challenges'
                    ? 'bg-[#0F6B4E] text-white shadow-sm'
                    : 'text-[#475B51] hover:text-[#1C2A24]'
                }`}
              >
                التحديات والقصص ({save.completedToday.length}/3)
              </button>
            </div>

            {/* 3D Camera Angles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#52665C] ml-1">
                <Camera className="h-3.5 w-3.5" />
                <span>الكاميرا:</span>
              </span>
              {CAMERA_OPTIONS.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => selectCameraPreset(cam.id)}
                  className={`min-h-8 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                    cameraPreset === cam.id
                      ? 'border-[#0F6B4E] bg-[#E6F4EE] text-[#0F6B4E]'
                      : 'border-[#1C2A24]/12 bg-[#FFFFFF] text-[#475B51] hover:bg-[#EFE7D6]'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Nurturing Actions (Feed, Drink, Sleep, Greet, Dhikr, Style, Studio) */}
          {dockTab === 'care' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Feed Folla */}
                <button
                  type="button"
                  onClick={() => setFoodMenuOpen((v) => !v)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-[#C78318]/40 bg-[#FEF7E6] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#9A6008] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FDECC8] active:scale-95 whitespace-nowrap shrink-0"
                >
                  <Utensils className="h-4 w-4 text-[#C78318]" />
                  <span>إطعام فُلَّة</span>
                </button>

                {/* Give Water */}
                <button
                  type="button"
                  onClick={() => {
                    setFoodMenuOpen(false);
                    selectCameraPreset('dining');
                    onDrink();
                  }}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-[#0E7490]/35 bg-[#E8F6FA] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0E7490] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#D5EEF6] active:scale-95 whitespace-nowrap shrink-0"
                >
                  <Coffee className="h-4 w-4 text-[#0E7490]" />
                  <span>سقي الماء</span>
                </button>

                {/* Sleep / Wake */}
                <button
                  type="button"
                  onClick={() => {
                    setFoodMenuOpen(false);
                    selectCameraPreset(save.careNeeds.isSleeping ? 'overview' : 'sleep');
                    onToggleSleep();
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-95 whitespace-nowrap shrink-0 ${
                    save.careNeeds.isSleeping
                      ? 'border-[#C78318]/45 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
                      : 'border-[#6D4C9E]/35 bg-[#F2ECFA] text-[#5B3A8C] hover:bg-[#E7DCF7]'
                  }`}
                >
                  {save.careNeeds.isSleeping ? (
                    <>
                      <Sun className="h-4 w-4 text-[#C78318]" />
                      <span>إيقاظ فُلَّة</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-[#6D4C9E]" />
                      <span>نوم فُلَّة</span>
                    </>
                  )}
                </button>

                {/* Greet */}
                <button
                  type="button"
                  onClick={() => {
                    selectCameraPreset('closeup');
                    onQuickCare('smile');
                  }}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/15 bg-[#FFFFFF] px-3 py-2 text-xs font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] active:scale-95 whitespace-nowrap shrink-0"
                >
                  <Smile className="h-4 w-4 text-[#C78318]" />
                  <span>إلقاء السلام</span>
                </button>

                {/* Dhikr */}
                <button
                  type="button"
                  onClick={() => {
                    selectCameraPreset('closeup');
                    onQuickCare('dhikr');
                  }}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/15 bg-[#FFFFFF] px-3 py-2 text-xs font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] active:scale-95 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-[#0F6B4E]" />
                  <span>تسبيح وذكر</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCustomizer}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-[#0F6B4E]/30 bg-[#E6F4EE] px-3 py-1.5 text-xs font-bold text-[#0F6B4E] hover:bg-[#D5ECE1] whitespace-nowrap shrink-0"
                >
                  <Palette className="h-4 w-4" />
                  <span>المظهر</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenStudio}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-[#B85D6F]/30 bg-[#FDF0F3] px-3 py-1.5 text-xs font-bold text-[#9E3E52] hover:bg-[#FAE1E7] whitespace-nowrap shrink-0"
                >
                  <Brush className="h-4 w-4" />
                  <span>المرسم</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: 7 Islamic Challenges + Prophets' Stories */}
          {dockTab === 'challenges' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {CHALLENGES_META.map((ch) => {
                const isDone = save.completedToday.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onStartChallenge(ch.id)}
                    className={`flex min-h-14 flex-col items-start justify-between gap-1 rounded-xl border p-2 text-right transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#0F6B4E] ${
                      isDone
                        ? 'border-[#0F6B4E]/35 bg-[#E6F4EE]'
                        : 'border-[#1C2A24]/12 bg-[#FFFFFF] hover:border-[#0F6B4E]/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FAF6EE] border border-[#1C2A24]/10">
                        {CHALLENGE_ICONS[ch.id]}
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#0F6B4E]">
                          <Check className="h-3 w-3" />
                          <span>مكتمل</span>
                        </span>
                      ) : (
                        <span className="font-mono-num text-[10px] font-bold text-[#9A6008] tabular-nums">
                          +{ch.rewardStars} ★
                        </span>
                      )}
                    </div>
                    <div className="w-full truncate text-[11px] font-bold text-[#1C2A24]">
                      {ch.title}
                    </div>
                  </button>
                );
              })}

              {/* Prophets' Stories Station */}
              <button
                type="button"
                onClick={onOpenProphetsStories}
                className="flex min-h-14 flex-col items-start justify-between gap-1 rounded-xl border border-[#1E6B8A]/35 bg-[#EDF6FA] p-2 text-right transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#1E6B8A] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#1E6B8A]"
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFFFFF] border border-[#1E6B8A]/20">
                    <ScrollText className="h-4 w-4 text-[#1E6B8A]" />
                  </span>
                  <span className="font-mono-num text-[10px] font-bold text-[#1E6B8A] tabular-nums">
                    {save.completedProphetStories.length}/{PROPHET_STORIES.length}
                  </span>
                </div>
                <div className="w-full truncate text-[11px] font-bold text-[#1C2A24]">
                  قصص الأنبياء
                </div>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
