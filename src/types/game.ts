export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'DAY_COMPLETE';

export type ChallengeId =
  | 'wudu'
  | 'charity_catch'
  | 'adhkar_cards'
  | 'values_story'
  | 'words_light'
  | 'recite_ayahs'
  | 'friends_race';

export type MeterKey = 'purity' | 'faith' | 'manners' | 'knowledge';

export interface GrowthMeters {
  purity: number;
  faith: number;
  manners: number;
  knowledge: number;
}

export interface CareNeeds {
  hunger: number; // 0-100 (الشبع)
  thirst: number; // 0-100 (الارتواء)
  energy: number; // 0-100 (النشاط)
  isSleeping: boolean;
}

export type FoodOptionId = 'dates' | 'fruit' | 'meal';

export type FollaActionType = 'idle' | 'eating' | 'drinking' | 'sleeping' | 'greeting';

export interface Folla3DAction {
  id: number;
  type: FollaActionType;
  foodId?: FoodOptionId;
}

export type CameraPresetId = 'overview' | 'dining' | 'sleep' | 'closeup';

export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening';

export type SkinToneId = 'fair' | 'warm' | 'wheat' | 'olive' | 'bronze';
export type HairStyleId =
  | 'hijab_classic'
  | 'hijab_floral'
  | 'hijab_gold'
  | 'braids'
  | 'bun_ribbon'
  | 'wavy_headband';
export type OutfitId =
  | 'mint_dress'
  | 'andalus_abaya'
  | 'jasmine_thobe'
  | 'fajr_kaftan';

export interface FollaAppearance {
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  outfit: OutfitId;
}

export interface WardrobeTheme {
  id: string;
  name: string;
  cost: number;
  ringColor: string;
  accentBg: string;
  accentText: string;
  frameTint: string;
}

export interface RoomKeepsake {
  id: string;
  name: string;
  meaning: string;
  cost: number;
  iconKey: 'lantern' | 'olive' | 'charity_box' | 'prayer_mat' | 'quran_stand' | 'books';
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  color: string;
  iconType:
    | 'droplet'
    | 'heart'
    | 'sparkle'
    | 'scale'
    | 'book'
    | 'star'
    | 'scroll'
    | 'palette'
    | 'mic'
    | 'brush'
    | 'zap'
    | 'utensils';
}

export interface FriendsQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export interface SurahRecitation {
  id: string;
  name: string;
  ayahs: string[];
  meaning: string;
}

export interface ProphetQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ProphetStory {
  id: string;
  prophetName: string;
  title: string;
  valueFocus: string;
  imagePath: string;
  chapters: string[];
  questions: ProphetQuestion[];
}

export interface FloatingFeedback {
  id: number;
  text: string;
  meter: MeterKey | 'stars' | 'points';
}

export interface SaveProgress {
  day: number;
  stars: number;
  points: number;
  totalChallengesWon: number;
  meters: GrowthMeters;
  careNeeds: CareNeeds;
  careActionsCompleted: {
    fed: boolean;
    drank: boolean;
    slept: boolean;
  };
  completedToday: ChallengeId[];
  unlockedWardrobes: string[];
  activeWardrobe: string;
  unlockedKeepsakes: string[];
  appearance: FollaAppearance;
  unlockedOutfits: OutfitId[];
  unlockedHairStyles: HairStyleId[];
  earnedBadges: string[];
  completedProphetStories: string[];
  hasCustomizedAppearance: boolean;
  drawings: SavedDrawing[];
  friendsBestScore: number;
  storyIndex: number;
  wordRoundIndex: number;
  adhkarRoundIndex: number;
}

export interface SavedDrawing {
  id: string;
  title: string;
  valueFocus: string;
  dataUrl: string;
  daySaved: number;
}
