import { CrashRound } from '../types';

/**
 * Utilitário de Armazenamento e Filtragem de Velas por Data e Horário (00:00:00 até o momento atual)
 */

function getStorageKey(roomKey: string, dateStr: string): string {
  return `mostrinho_archive_v5_${dateStr}_${roomKey}`;
}

export function cleanCanonicalId(round: CrashRound): string {
  const raw = (round.uuid || round.externalId || '').replace(/^r-\d+-/, '').trim();
  if (raw) return raw;
  return `${round.instant}_${round.result}`;
}

// Limpa caches antigos corrompidos por duplicatas de transição
try {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (
      k &&
      (k.startsWith('mostrinho_archive_202') ||
        k.startsWith('mostrinho_archive_v2_') ||
        k.startsWith('mostrinho_archive_v3_') ||
        k.startsWith('mostrinho_archive_v4_'))
    ) {
      localStorage.removeItem(k);
    }
  }
} catch {}

export function getTodayDateString(): string {
  const d = new Date();
  // Formato YYYY-MM-DD no fuso do Brasil (Bahia)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
}

/**
 * Salva e mescla novas rodadas no histórico do dia no localStorage
 */
export function archiveRoundsForToday(roomKey: string, incomingRounds: CrashRound[]): CrashRound[] {
  try {
    const today = getTodayDateString();
    const key = getStorageKey(roomKey, today);
    const existingRaw = localStorage.getItem(key);
    const existing: CrashRound[] = existingRaw ? JSON.parse(existingRaw) : [];

    const map = new Map<string, CrashRound>();
    const seenTimes = new Set<string>();

    const addRound = (r: CrashRound) => {
      const id = cleanCanonicalId(r);
      if (!id) return;
      if (r.instant) {
        const d = new Date(r.instant);
        if (!isNaN(d.getTime())) {
          const brDate = d.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
          if (brDate !== today) return;
        }
      }
      const timeKey = `${r.instant}_${Number(r.result).toFixed(2)}`;
      if (map.has(id) || seenTimes.has(timeKey)) return;
      seenTimes.add(timeKey);
      map.set(id, { ...r, uuid: id, externalId: r.externalId?.startsWith('r-') ? '' : r.externalId });
    };

    // Preenche com existentes e mescla com novos de hoje
    for (const r of existing) addRound(r);
    for (const r of incomingRounds) addRound(r);

    const merged = Array.from(map.values());
    // Ordena do mais recente para o mais antigo
    merged.sort((a, b) => {
      const timeA = a.instant ? new Date(a.instant).getTime() : 0;
      const timeB = b.instant ? new Date(b.instant).getTime() : 0;
      return timeB - timeA;
    });

    // Salva cópia local (até 5000 para acomodar todo o histórico diário)
    try {
      localStorage.setItem(key, JSON.stringify(merged.slice(0, 5000)));
    } catch {
      // Ignora erro de cota e mantém na memória
    }
    return merged;
  } catch (err) {
    console.warn('Erro ao salvar no arquivo local:', err);
    return incomingRounds;
  }
}

/**
 * Obtém todas as rodadas acumuladas do dia
 */
export function getArchivedRounds(roomKey: string, dateStr?: string): CrashRound[] {
  try {
    const date = dateStr || getTodayDateString();
    const key = getStorageKey(roomKey, date);
    const existingRaw = localStorage.getItem(key);
    if (!existingRaw) return [];
    return JSON.parse(existingRaw);
  } catch {
    return [];
  }
}

export interface TimeFilterOptions {
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm:ss ou HH:mm (ex: "00:00:00")
  endTime?: string; // HH:mm:ss ou HH:mm (ex: "13:30:00")
  minuteExact?: number | null; // 0-59
  minMultiplier?: number | null;
  maxMultiplier?: number | null;
}

/**
 * Filtra as rodadas por faixa de horário e data no fuso de Brasília/Bahia (UTC-3)
 * Garante que somente o dia selecionado (padrão HOJE de 00:00:00 até agora) seja exibido
 */
export function filterRoundsByDateTime(
  rounds: CrashRound[],
  options: TimeFilterOptions
): CrashRound[] {
  const targetDate = options.date && options.date.trim() ? options.date.trim() : getTodayDateString();

  return rounds.filter((r) => {
    if (!r.instant) return true;
    const dateObj = new Date(r.instant);
    if (isNaN(dateObj.getTime())) return true;

    // Fuso do Brasil (Bahia / Brasília)
    const brTimeStr = dateObj.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Bahia',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }); // "HH:mm:ss"

    const brDateStr = dateObj.toLocaleDateString('en-CA', {
      timeZone: 'America/Bahia',
    }); // "YYYY-MM-DD"

    // Filtro por Data (garante que estamos vendo apenas o dia selecionado, padrão HOJE)
    if (targetDate && brDateStr !== targetDate) {
      return false;
    }

    // Filtro por Hora Inicial (ex: >= 00:00:00 ou 00:00:01)
    if (options.startTime && options.startTime.trim()) {
      const rawStart = options.startTime.trim();
      const start = rawStart.length === 5 ? `${rawStart}:00` : rawStart;
      // Se for 00:00:00 ou 00:00:01, aceita tudo desde o começo do dia
      if (start !== '00:00:00' && start !== '00:00:01') {
        if (brTimeStr < start) return false;
      }
    }

    // Filtro por Hora Final (ex: <= 13:45:00)
    if (options.endTime && options.endTime.trim()) {
      const rawEnd = options.endTime.trim();
      const end = rawEnd.length === 5 ? `${rawEnd}:59` : rawEnd;
      if (brTimeStr > end) return false;
    }

    // Filtro por Minuto Exato (00 a 59)
    if (options.minuteExact !== null && options.minuteExact !== undefined) {
      const minute = parseInt(brTimeStr.split(':')[1], 10);
      if (minute !== options.minuteExact) return false;
    }

    // Filtro por Multiplicador
    if (options.minMultiplier !== null && options.minMultiplier !== undefined) {
      if (r.result < options.minMultiplier) return false;
    }
    if (options.maxMultiplier !== null && options.maxMultiplier !== undefined) {
      if (r.result > options.maxMultiplier) return false;
    }

    return true;
  });
}
