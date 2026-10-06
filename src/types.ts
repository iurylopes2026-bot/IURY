export type ActiveTab =
  | 'mosaico_maxima'
  | 'projecao_rapida'
  | 'projecao_longa'
  | 'velas_invertidas'
  | 'velas_100x_1000x'
  | 'gatilho_13x'
  | 'estrategia_10x_50x'
  | 'estrategia_7x_9x'
  | 'top_gun';

export type CandleCategory = 'blue' | 'purple' | 'pink';

export interface CrashRound {
  uuid: string;
  type: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  result: number;
  instant: string; // ISO string e.g. "2026-09-18T16:12:52.069Z"
  externalId: string; // Round number e.g. "4742367"
  temperature?: number;
}

export interface CandleInfo {
  category: CandleCategory;
  label: string;
  colorName: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  glowColor: string;
  bgGradient: string;
}

export interface BettingHouse {
  id: string;
  name: string;
  game: string;
  endpoint: string;
  description: string;
  badgeColor: string;
  isDefault?: boolean;
  token?: string;
}

export interface RoundStats {
  total: number;
  blueCount: number;
  purpleCount: number;
  pinkCount: number;
  bluePercent: number;
  purplePercent: number;
  pinkPercent: number;
  maxMultiplier: number;
  averageMultiplier: number;
  medianMultiplier: number;
  lastPinkDistance: number; // rounds since last pink
  lastPinkTimeAgo?: string;
  currentStreak: {
    category: CandleCategory;
    count: number;
  };
}

export interface MinuteStats {
  minute: number; // 0 to 59
  rounds: CrashRound[];
  pinkCount: number;
  purpleCount: number;
  blueCount: number;
  highestMultiplier: number;
}
