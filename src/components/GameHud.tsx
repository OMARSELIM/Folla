import React from 'react';
import {
  Award,
  BookOpen,
  Brush,
  Coffee,
  Droplets,
  HeartHandshake,
  Moon,
  Palette,
  Pause,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BADGES, METER_INFO, getLevelProgress } from '../data/challenges';
import { CareNeeds, GrowthMeters, MeterKey, TimeOfDay } from '../types/game';

interface GameHudProps {
  day: number;
  stars: number;
  points: number;
  earnedBadgesCount: number;
  timeOfDay: TimeOfDay;
  meters: GrowthMeters;
  careNeeds: CareNeeds;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenKeepsakes: () => void;
  onOpenCustomizer: () => void;
  onOpenRewards: () => void;
  onOpenStudio: () => void;
}

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'الصباح',
  noon: 'الظهر',
  afternoon: 'العصر',
  evening: 'المساء',
};

const METER_ICONS: Record<MeterKey, React.ReactNode> = {
  purity: <Droplets className="h-3.5 w-3.5 text-[#0E7490]" />,
  faith: <Sparkles className="h-3.5 w-3.5 text-[#0F6B4E]" />,
  manners: <HeartHandshake className="h-3.5 w-3.5 text-[#C78318]" />,
  knowledge: <BookOpen className="h-3.5 w-3.5 text-[#6D4C9E]" />,
};

export const GameHud: React.FC<GameHudProps> = ({
  day,
  stars,
  points,
  earnedBadgesCount,
  timeOfDay,
  meters,
  careNeeds,
  isMuted,
  onToggleMute,
  onPause,
  onOpenKeepsakes,
  onOpenCustomizer,
  onOpenRewards,
  onOpenStudio,
}) => {
  const meterKeys: MeterKey[] = ['purity', 'faith', 'manners', 'knowledge'];
  const { current } = getLevelProgress(points);

  const careItems = [
    {
      key: 'hunger',
      label: 'الشبع',
      value: Math.round(careNeeds.hunger),
      color: '#C78318',
      track: 'rgba(199, 131, 24, 0.16)',
      icon: <Utensils className="h-3.5 w-3.5 text-[#C78318]" />,
    },
    {
      key: 'thirst',
      label: 'الارتواء',
      value: Math.round(careNeeds.thirst),
      color: '#0E7490',
      track: 'rgba(14, 116, 144, 0.16)',
      icon: <Coffee className="h-3.5 w-3.5 text-[#0E7490]" />,
    },
    {
      key: 'energy',
      label: careNeeds.isSleeping ? 'نائمة' : 'النشاط',
      value: Math.round(careNeeds.energy),
      color: '#6D4C9E',
      track: 'rgba(109, 76, 158, 0.16)',
      icon: <Moon className="h-3.5 w-3.5 text-[#6D4C9E]" />,
    },
  ];

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-2.5 md:p-3.5">
      {/* Right (Start in RTL): Day, Level, Stars + Care Needs + 4 Growth Meters */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#1C2A24]/15 bg-[#FAF6EE]/95 px-3 py-2 shadow-sm">
        {/* Day, Level & Stars */}
        <div className="flex flex-wrap items-center gap-2 border-l border-[#1C2A24]/12 pl-2.5">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1C2A24]">
            <Sun className="h-4 w-4 text-[#C78318]" />
            <span className="tabular-nums whitespace-nowrap">اليوم {day}</span>
            <span className="text-[#6B7E74]" aria-hidden="true">·</span>
            <span className="text-xs font-semibold text-[#475B51] whitespace-nowrap">
              {careNeeds.isSleeping ? 'ليل هادئ' : TIME_LABELS[timeOfDay]}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenRewards}
            className="flex min-h-8 items-center gap-1 rounded-lg bg-[#0F6B4E]/10 px-2 py-1 text-xs font-bold text-[#0F6B4E] hover:bg-[#0F6B4E]/18 focus-visible:outline-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
          >
            <Award className="h-3.5 w-3.5" />
            <span className="tabular-nums">م{current.level}: {current.title}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num tabular-nums">{points} ن</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg bg-[#C78318]/12 px-2 py-1 text-xs sm:text-sm font-bold text-[#9A6008]">
            <Star className="h-3.5 w-3.5 fill-[#C78318] text-[#C78318]" />
            <span className="font-mono-num tabular-nums">{stars}</span>
          </div>
        </div>

        {/* 3 Daily Care Needs: Hunger, Thirst, Energy */}
        <div className="flex flex-wrap items-center gap-2.5 border-l border-[#1C2A24]/12 pl-2.5">
          {careItems.map((item) => (
            <div key={item.key} className="flex min-w-[66px] flex-col gap-0.5">
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-[#1C2A24]">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  {item.icon}
                  {item.label}
                </span>
                <span className="font-mono-num tabular-nums text-[10px] text-[#475B51]">
                  {item.value}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: item.track }}
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={item.label}
              >
                <div
                  className="h-full rounded-full transition-transform duration-200 origin-right"
                  style={{
                    backgroundColor: item.color,
                    transform: `scaleX(${Math.max(0.04, item.value / 100)})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 4 Islamic Growth Meters */}
        <div className="hidden xl:flex items-center gap-2.5">
          {meterKeys.map((key) => {
            const info = METER_INFO[key];
            const val = Math.round(meters[key]);
            return (
              <div key={key} className="flex min-w-[66px] flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-[#1C2A24]">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    {METER_ICONS[key]}
                    {info.label}
                  </span>
                  <span className="font-mono-num tabular-nums text-[10px] text-[#475B51]">
                    {val}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: info.trackBg }}
                  role="progressbar"
                  aria-valuenow={val}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={info.label}
                >
                  <div
                    className="h-full rounded-full transition-transform duration-200 origin-right"
                    style={{
                      backgroundColor: info.color,
                      transform: `scaleX(${Math.max(0.04, val / 100)})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Left (End in RTL): Customizer, Rewards, Keepsakes, Mute, Pause */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenCustomizer}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 px-3 text-xs sm:text-sm font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
        >
          <Palette className="h-4 w-4 text-[#0F6B4E]" />
          <span>مظهر فُلَّة</span>
        </button>

        <button
          type="button"
          onClick={onOpenStudio}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 px-3 text-xs sm:text-sm font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
        >
          <Brush className="h-4 w-4 text-[#B85D6F]" />
          <span>المرسم والمعرض</span>
        </button>

        <button
          type="button"
          onClick={onOpenRewards}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 px-3 text-xs sm:text-sm font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
        >
          <Award className="h-4 w-4 text-[#C78318]" />
          <span className="tabular-nums">الشارات ({earnedBadgesCount}/{BADGES.length})</span>
        </button>

        <button
          type="button"
          onClick={onOpenKeepsakes}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 px-3 text-xs sm:text-sm font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
        >
          <ShoppingBag className="h-4 w-4 text-[#B85D6F]" />
          <span className="hidden md:inline">خزانة الغرفة</span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.03] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E]"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-[#C2412D]" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#0F6B4E]" />
          )}
        </button>

        <button
          type="button"
          onClick={onPause}
          aria-label="إيقاف مؤقت"
          className="flex h-11 items-center gap-1.5 rounded-xl border border-[#1C2A24]/12 bg-[#FAF6EE]/95 px-3 text-xs sm:text-sm font-bold text-[#1C2A24] shadow-sm transition-transform duration-150 hover:scale-[1.02] hover:bg-[#EFE7D6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B4E] whitespace-nowrap shrink-0"
        >
          <Pause className="h-4 w-4 text-[#1C2A24]" />
          <span className="hidden sm:inline">إيقاف</span>
        </button>
      </div>
    </header>
  );
};
