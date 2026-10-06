import { CandleCategory, CandleInfo, CrashRound, RoundStats, MinuteStats } from '../types';

/**
 * Retorna a categoria da vela de acordo com as regras solicitadas:
 * - Velas Azuis: de 1.00 até 1.99
 * - Velas Roxas: de 2.00 até 9.99
 * - Velas Rosa: de 10.00 até 999999.00
 */
export function getCandleCategory(result: number): CandleCategory {
  if (result >= 10.0) return 'pink';
  if (result >= 2.0) return 'purple';
  return 'blue';
}

export const CANDLE_INFO: Record<CandleCategory, CandleInfo> = {
  blue: {
    category: 'blue',
    label: 'Azul (1,00x - 1,99x)',
    colorName: 'Azul',
    badgeBg: 'bg-[#007ba2]',
    badgeBorder: 'border-[#0096c7]',
    textColor: 'text-white',
    glowColor: 'shadow-[0_4px_12px_rgba(0,123,162,0.35)]',
    bgGradient: 'from-[#007ba2] to-[#006687]',
  },
  purple: {
    category: 'purple',
    label: 'Roxo (2,00x - 9,99x)',
    colorName: 'Roxo',
    badgeBg: 'bg-[#7b1fa2]',
    badgeBorder: 'border-[#9c27b0]',
    textColor: 'text-white',
    glowColor: 'shadow-[0_4px_12px_rgba(123,31,162,0.35)]',
    bgGradient: 'from-[#7b1fa2] to-[#6a1b9a]',
  },
  pink: {
    category: 'pink',
    label: 'Rosa (10,00x+)',
    colorName: 'Rosa',
    badgeBg: 'bg-[#ba1b66]',
    badgeBorder: 'border-[#e91e63]',
    textColor: 'text-white',
    glowColor: 'shadow-[0_4px_16px_rgba(186,27,102,0.45)]',
    bgGradient: 'from-[#ba1b66] to-[#a01355]',
  },
};

/**
 * Formata o multiplicador com 2 casas decimais no padrão brasileiro (ex: 2,45x)
 */
export function formatMultiplier(result: number): string {
  if (isNaN(result)) return '1,00x';
  return `${result.toFixed(2).replace('.', ',')}x`;
}

/**
 * Formata o timestamp instantâneo para hora:minuto:segundo no fuso de Brasília/Bahia (UTC-3)
 */
export function formatInstantTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

/**
 * Extrai o minuto (0-59) e hora
 */
export function getMinuteAndSecond(isoString: string): { minute: number; second: number; label: string } {
  try {
    const d = new Date(isoString);
    const minute = d.getMinutes();
    const second = d.getSeconds();
    const padMin = String(minute).padStart(2, '0');
    const padSec = String(second).padStart(2, '0');
    return { minute, second, label: `${padMin}:${padSec}` };
  } catch {
    return { minute: 0, second: 0, label: '00:00' };
  }
}

/**
 * Calcula estatísticas gerais das rodadas
 */
export function calculateStats(rounds: CrashRound[]): RoundStats {
  if (!rounds || rounds.length === 0) {
    return {
      total: 0,
      blueCount: 0,
      purpleCount: 0,
      pinkCount: 0,
      bluePercent: 0,
      purplePercent: 0,
      pinkPercent: 0,
      maxMultiplier: 0,
      averageMultiplier: 0,
      medianMultiplier: 0,
      lastPinkDistance: 0,
      currentStreak: { category: 'blue', count: 0 },
    };
  }

  let blueCount = 0;
  let purpleCount = 0;
  let pinkCount = 0;
  let maxMultiplier = 0;
  let totalSum = 0;
  let lastPinkDistance = -1;

  rounds.forEach((round, index) => {
    const cat = getCandleCategory(round.result);
    if (cat === 'blue') blueCount++;
    else if (cat === 'purple') purpleCount++;
    else if (cat === 'pink') {
      pinkCount++;
      if (lastPinkDistance === -1) {
        lastPinkDistance = index;
      }
    }

    if (round.result > maxMultiplier) {
      maxMultiplier = round.result;
    }
    totalSum += round.result;
  });

  const total = rounds.length;
  const bluePercent = Number(((blueCount / total) * 100).toFixed(1));
  const purplePercent = Number(((purpleCount / total) * 100).toFixed(1));
  const pinkPercent = Number(((pinkCount / total) * 100).toFixed(1));
  const averageMultiplier = Number((totalSum / total).toFixed(2));

  // Median
  const sorted = [...rounds].map((r) => r.result).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMultiplier =
    sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

  // Current streak (consecutive same colors on latest rounds)
  const firstCat = rounds.length > 0 ? getCandleCategory(rounds[0].result) : 'blue';
  let streakCount = 0;
  for (const r of rounds) {
    if (getCandleCategory(r.result) === firstCat) {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    total,
    blueCount,
    purpleCount,
    pinkCount,
    bluePercent,
    purplePercent,
    pinkPercent,
    maxMultiplier,
    averageMultiplier,
    medianMultiplier,
    lastPinkDistance: lastPinkDistance === -1 ? total : lastPinkDistance,
    currentStreak: {
      category: firstCat,
      count: streakCount,
    },
  };
}

/**
 * Agrupa as rodadas por minuto (0..59) para o Mosaico TipMiner
 */
export function groupRoundsByMinute(rounds: CrashRound[]): MinuteStats[] {
  const map = new Map<number, CrashRound[]>();
  for (let i = 0; i < 60; i++) {
    map.set(i, []);
  }

  rounds.forEach((round) => {
    try {
      const d = new Date(round.instant);
      const min = d.getMinutes();
      const list = map.get(min) || [];
      list.push(round);
      map.set(min, list);
    } catch {
      // ignore date parse errors
    }
  });

  const result: MinuteStats[] = [];
  for (let min = 0; min < 60; min++) {
    const list = map.get(min) || [];
    let pink = 0;
    let purple = 0;
    let blue = 0;
    let max = 0;
    list.forEach((r) => {
      const c = getCandleCategory(r.result);
      if (c === 'pink') pink++;
      else if (c === 'purple') purple++;
      else blue++;
      if (r.result > max) max = r.result;
    });

    result.push({
      minute: min,
      rounds: list,
      pinkCount: pink,
      purpleCount: purple,
      blueCount: blue,
      highestMultiplier: max,
    });
  }

  return result;
}

/**
 * Toca um bipe sonoro suave sintetizado via Web Audio API para alertar Vela Rosa (10x+)
 */
export function playPinkAlertSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Audio might be blocked until first user interaction
  }
}
