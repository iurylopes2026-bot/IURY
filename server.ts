import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "2mb" }));

// Enable CORS for external applications
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Chave");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint for Cloud Run and monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MOSTRINHO",
    timestamp: new Date().toISOString(),
  });
});

// Default endpoints:
// Betfusion → GRAFICO 1 (Room 997b99e3)
// Betfusion → GRAFICO 2 (Room 48323e32)
const DEFAULT_HOUSES: Record<string, string> = {
  betfusion:
    "https://api.core.public.tipminer.com/v1/crash/rounds/997b99e3-4977-4fcf-ac6d-3834a384d141/history?limit=30000&timezone=America%2FBahia",
  betfusion_grafico1:
    "https://api.core.public.tipminer.com/v1/crash/rounds/997b99e3-4977-4fcf-ac6d-3834a384d141/history?limit=30000&timezone=America%2FBahia",
  grafico1:
    "https://api.core.public.tipminer.com/v1/crash/rounds/997b99e3-4977-4fcf-ac6d-3834a384d141/history?limit=30000&timezone=America%2FBahia",
  betfusion_grafico2:
    "https://api.core.public.tipminer.com/v1/crash/rounds/48323e32-3590-4e2f-b6fe-09d5fbc811c9/history?limit=30000&timezone=America%2FBahia",
  grafico2:
    "https://api.core.public.tipminer.com/v1/crash/rounds/48323e32-3590-4e2f-b6fe-09d5fbc811c9/history?limit=30000&timezone=America%2FBahia",
  bingo:
    "https://api.aviatorpro.io/api/v1/games/1/history?limit=1000",
  bingo_grafico1:
    "https://api.aviatorpro.io/api/v1/games/1/history?limit=1000",
  bingo_grafico2:
    "https://api.aviatorpro.io/api/v1/games/2/history?limit=1000",
  torre_bet:
    "https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
  torre_bet_grafico1:
    "https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
  torre_bet_grafico2:
    "https://aviator-rodadas.vorexhub.pro/grafico2?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
  torre:
    "https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
  betbrabo: "https://www.radar-aviator.com/api/historico.php",
  betbrabo_aviator1: "https://www.radar-aviator.com/api/historico.php",
  betbrabo_grafico1: "https://www.radar-aviator.com/api/historico.php",
  betbrabo_vip: "https://www.radar-aviator.com/api/historico2.php",
  betbrabo_grafico2: "https://www.radar-aviator.com/api/historico2.php",
  betbrabo_premium: "https://www.radar-aviator.com/api/historico3.php",
  betbrabo_grafico3: "https://www.radar-aviator.com/api/historico3.php",
};

const AVIATOR_ROOMS_MAP: Record<string, string> = {
  torre_bet: "997b99e3-4977-4fcf-ac6d-3834a384d141",
  torre_bet_grafico1: "997b99e3-4977-4fcf-ac6d-3834a384d141",
  torre_bet_grafico2: "48323e32-3590-4e2f-b6fe-09d5fbc811c9",
  betfusion_grafico1: "997b99e3-4977-4fcf-ac6d-3834a384d141",
  betfusion_grafico2: "48323e32-3590-4e2f-b6fe-09d5fbc811c9",
  grafico1: "997b99e3-4977-4fcf-ac6d-3834a384d141",
  grafico2: "48323e32-3590-4e2f-b6fe-09d5fbc811c9",
};

// In-memory short cache to avoid hammering if multiple tabs poll at the same microsecond
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000; // 1 second cache for ultra-responsive live rounds

// In-memory persistent day accumulator: stores up to 30,000 rounds across polls
interface CrashRoundItem {
  uuid?: string;
  externalId?: string;
  instant?: string;
  result?: number;
  type?: string;
  temperature?: number;
  [key: string]: unknown;
}
const dailyArchive = new Map<string, Map<string, CrashRoundItem>>();
const MAX_ARCHIVE_PER_ROOM = 30000;

// Disk persistence for full-day rounds across restarts
const ARCHIVE_CACHE_FILE = path.join(process.cwd(), ".cache_daily_archive.json");

function loadPersistedArchive() {
  try {
    if (fs.existsSync(ARCHIVE_CACHE_FILE)) {
      const raw = fs.readFileSync(ARCHIVE_CACHE_FILE, "utf-8");
      const json = JSON.parse(raw);
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bahia" });
      if (json.date === today && json.rooms) {
        for (const [room, items] of Object.entries(json.rooms)) {
          let store = dailyArchive.get(room);
          if (!store) {
            store = new Map<string, CrashRoundItem>();
            dailyArchive.set(room, store);
          }
          if (Array.isArray(items)) {
            for (const item of items) {
              const it = item as CrashRoundItem;
              if (it.uuid) store.set(it.uuid, it);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("Erro ao carregar cache de disco do dia:", e);
  }
}

function savePersistedArchive() {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bahia" });
    const roomsObj: Record<string, CrashRoundItem[]> = {};
    for (const [room, store] of dailyArchive.entries()) {
      roomsObj[room] = Array.from(store.values()).slice(0, 15000);
    }
    fs.writeFileSync(ARCHIVE_CACHE_FILE, JSON.stringify({ date: today, rooms: roomsObj }), "utf-8");
  } catch {
    // ignore
  }
}

// Inicializa cache em disco no arranque
loadPersistedArchive();

// Full day cache to avoid slamming TipMiner range-per-hour if polled every second
interface DayCacheEntry {
  rounds: CrashRoundItem[];
  timestamp: number;
}
const fullDayCache = new Map<string, DayCacheEntry>();

// Helper to record rounds in room archive
function recordRoundsInArchive(roomKey: string, rounds: CrashRoundItem[]) {
  let roomStore = dailyArchive.get(roomKey);
  if (!roomStore) {
    roomStore = new Map<string, CrashRoundItem>();
    dailyArchive.set(roomKey, roomStore);
  }
  for (const round of rounds) {
    const rawKey = round.uuid || round.externalId;
    const key = rawKey ? rawKey.replace(/^r-\d+-/, "") : "";
    if (key && !roomStore.has(key)) {
      roomStore.set(key, { ...round, uuid: key, externalId: round.externalId?.startsWith('r-') ? '' : round.externalId });
    }
  }
  // If exceeds 30,000, prune oldest
  if (roomStore.size > MAX_ARCHIVE_PER_ROOM) {
    const all = Array.from(roomStore.values());
    all.sort((a, b) => {
      const timeA = a.instant ? new Date(a.instant).getTime() : 0;
      const timeB = b.instant ? new Date(b.instant).getTime() : 0;
      return timeB - timeA;
    });
    roomStore.clear();
    for (const r of all.slice(0, MAX_ARCHIVE_PER_ROOM)) {
      const key = r.uuid || r.externalId;
      if (key) roomStore.set(key, r);
    }
  }
}

// Fetches ALL rounds of a date from 00:00:01 up to the current minute using TipMiner's range-per-hour API
async function getFullDayRounds(roomKey: string, targetDate?: string): Promise<CrashRoundItem[]> {
  const now = new Date();
  const todayBahia = now.toLocaleDateString("en-CA", { timeZone: "America/Bahia" });
  const dateStr = targetDate && targetDate.trim() ? targetDate.trim() : todayBahia;
  const isToday = dateStr === todayBahia;

  const cacheKey = `${roomKey}_${dateStr}`;
  const cached = fullDayCache.get(cacheKey);
  const nowMs = Date.now();
  // 3-second cache for today (to catch live rounds while being fast), 10 minutes for past dates
  const cacheTtl = isToday ? 3000 : 600000;

  if (cached && nowMs - cached.timestamp < cacheTtl) {
    return cached.rounds;
  }

  // Determine maximum hour to query (0 to current hour for today, or 0 to 23 for past dates)
  const maxHour = isToday
    ? parseInt(
        now.toLocaleTimeString("pt-BR", {
          timeZone: "America/Bahia",
          hour: "2-digit",
          hour12: false,
        }),
        10
      )
    : 23;

  // Query all hours from 0 up to maxHour in parallel
  const tipminerHeaders = {
    Accept: "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Origin: "https://www.tipminer.com",
    Referer: "https://www.tipminer.com/",
  };

  const hourPromises: Promise<unknown>[] = [];
  for (let h = 0; h <= maxHour; h++) {
    const hourUrl = `https://api.core.public.tipminer.com/v1/crash/rounds/${roomKey}/range-per-hour/${h}?date=${dateStr}&divisor=2&timezone=America%2FBahia&_cb=${crypto.randomUUID()}`;
    hourPromises.push(
      fetch(hourUrl, {
        headers: tipminerHeaders,
        signal: AbortSignal.timeout(8000),
      })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    );
  }

  // If querying today, also fetch live /history to capture any ongoing or freshly completed rounds in the current minute
  const livePromise: Promise<unknown> = isToday
    ? fetch(
        `https://api.core.public.tipminer.com/v1/crash/rounds/${roomKey}/history?limit=200&timezone=America%2FBahia&_cb=${crypto.randomUUID()}`,
        {
          headers: tipminerHeaders,
          signal: AbortSignal.timeout(8000),
        }
      )
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    : Promise.resolve([]);

  const [hourBatches, liveRounds] = await Promise.all([
    Promise.all(hourPromises),
    livePromise,
  ]);

  const map = new Map<string, CrashRoundItem>();

  function normalizeAndAdd(item: any) {
    if (!item) return;
    const key = item.uuid || item.externalId;
    if (!key) return;

    let num = 1.0;
    if (typeof item.result === "object" && item.result !== null && item.result.numeric !== undefined) {
      num = Number(item.result.numeric);
    } else if (item.result !== undefined && item.result !== null) {
      num = Number(item.result);
    }

    map.set(key, {
      uuid: item.uuid || key,
      result: isNaN(num) ? 1.0 : num,
      instant: item.instant,
      externalId: item.externalId,
      type: item.type || (num < 2 ? "LOW" : num < 10 ? "MEDIUM" : "HIGH"),
      temperature: item.temperature ?? 1,
    });
  }

  for (const batch of hourBatches) {
    if (Array.isArray(batch)) {
      for (const item of batch) {
        normalizeAndAdd(item);
      }
    }
  }

  if (Array.isArray(liveRounds)) {
    for (const item of liveRounds) {
      normalizeAndAdd(item);
    }
  }

  // Se range-per-hour não retornar nada (por ex. bloqueio de range de IP em datacenters), faz fallback para /history
  if (map.size === 0) {
    try {
      const fallbackUrl = `https://api.core.public.tipminer.com/v1/crash/rounds/${roomKey}/history?limit=200&timezone=America%2FBahia&_cb=${crypto.randomUUID()}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: tipminerHeaders,
        signal: AbortSignal.timeout(6000),
      });
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        if (Array.isArray(fallbackJson)) {
          for (const item of fallbackJson) {
            normalizeAndAdd(item);
          }
        }
      }
    } catch {}
  }

  const allRounds = Array.from(map.values());
  // Sort descending: newest round first
  allRounds.sort((a, b) => {
    const timeA = a.instant ? new Date(a.instant).getTime() : 0;
    const timeB = b.instant ? new Date(b.instant).getTime() : 0;
    return timeB - timeA;
  });

  fullDayCache.set(cacheKey, { rounds: allRounds, timestamp: nowMs });
  recordRoundsInArchive(roomKey, allRounds);

  return allRounds;
}

// AviatorPro Token, Cache and Auth Manager for bingo: GRAFICO 1 & GRAFICO 2 (Óculos do Professor)
let aviatorProToken: string | null = null;
let aviatorProRefreshToken: string | null = null;
let aviatorProTokenExpiresAt: number = 0;

interface AviatorProCacheEntry {
  rounds: CrashRoundItem[];
  timestamp: number;
}
const aviatorProCache = new Map<number, AviatorProCacheEntry>();
const AVIATORPRO_CACHE_TTL_MS = 3000;

async function getAviatorProToken(forcedNew = false): Promise<string> {
  const now = Date.now();
  if (!forcedNew && aviatorProToken && now < aviatorProTokenExpiresAt - 60000) {
    return aviatorProToken;
  }

  const username = (process.env.AVIATORPRO_USERNAME || "21978502885").replace(/\D/g, "");
  const password = process.env.AVIATORPRO_PASSWORD || "Liberada1@";
  const platform = "BINGO";

  // If forcedNew and we have a refresh token, try /api/v1/auth/refresh first
  if (forcedNew && aviatorProRefreshToken) {
    try {
      const refreshRes = await fetch("https://api.aviatorpro.io/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Origin": "https://oculosdoprofessor.com.br",
          Origin: "https://oculosdoprofessor.com.br",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ refresh_token: aviatorProRefreshToken }),
        signal: AbortSignal.timeout(8000),
      });

      if (refreshRes.ok) {
        const refreshJson = (await refreshRes.json()) as any;
        const newToken = refreshJson?.data?.access_token;
        if (newToken) {
          aviatorProToken = newToken;
          if (refreshJson?.data?.refresh_token) {
            aviatorProRefreshToken = refreshJson.data.refresh_token;
          }
          const expiresIn = Number(refreshJson?.data?.expires_in) || 900;
          aviatorProTokenExpiresAt = now + expiresIn * 1000;
          console.log(`[AviatorPro] Token renovado via refresh_token com sucesso (expira em ${expiresIn}s)`);
          return newToken;
        }
      }
    } catch (refreshErr) {
      console.warn("[AviatorPro] Tentativa de refresh falhou, realizando novo login...", refreshErr);
    }
  }

  // Full login
  const loginRes = await fetch("https://api.aviatorpro.io/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Origin": "https://oculosdoprofessor.com.br",
      Origin: "https://oculosdoprofessor.com.br",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      platform,
      username,
      password,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!loginRes.ok) {
    const errJson = (await loginRes.json().catch(() => null)) as any;
    throw new Error(
      errJson?.error?.message || `Falha na autenticação AviatorPro: HTTP ${loginRes.status}`
    );
  }

  const json = (await loginRes.json()) as any;
  const token = json?.data?.access_token;
  if (!token) {
    throw new Error("Token de acesso não retornado pela AviatorPro");
  }

  aviatorProToken = token;
  aviatorProRefreshToken = json?.data?.refresh_token || null;
  const expiresIn = Number(json?.data?.expires_in) || 900;
  aviatorProTokenExpiresAt = now + expiresIn * 1000;
  console.log(`[AviatorPro] Autenticado com sucesso como ${json?.data?.user?.name || username} (expira em ${expiresIn}s)`);
  return token;
}

// Fetch AviatorPro rounds (Game 1 = Aviator 1, Game 2 = Aviator 2)
async function getAviatorProRounds(gameId = 1, limit = 2000): Promise<CrashRoundItem[]> {
  const now = Date.now();
  const cached = aviatorProCache.get(gameId);
  if (cached && now - cached.timestamp < AVIATORPRO_CACHE_TTL_MS && cached.rounds.length > 0) {
    return cached.rounds;
  }

  let token = await getAviatorProToken();
  const archiveKey = gameId === 2 ? "bingo_grafico2" : "bingo_grafico1";

  // Light queries for background polling, moderate for user views to avoid 504 timeouts
  const fetchLimit = limit > 0 ? Math.min(limit, 3000) : 1000;
  const url = new URL(`https://api.aviatorpro.io/api/v1/games/${gameId}/history`);
  url.searchParams.set("limit", String(fetchLimit));

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-Origin": "https://oculosdoprofessor.com.br",
    Origin: "https://oculosdoprofessor.com.br",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(9000),
    });
  } catch (netErr) {
    console.warn(`[AviatorPro] Timeout/rede no fetch inicial (limit ${fetchLimit}):`, netErr);
    // Se estourou timeout na requisição pesada, tenta imediatamente com limite menor (200)
    const fallbackUrl = new URL(`https://api.aviatorpro.io/api/v1/games/${gameId}/history`);
    fallbackUrl.searchParams.set("limit", "200");
    try {
      res = await fetch(fallbackUrl.toString(), {
        headers,
        signal: AbortSignal.timeout(6000),
      });
    } catch {
      // Se ainda falhar, recupera dados do arquivo em memória se houver
      const roomStore = dailyArchive.get(archiveKey);
      if (roomStore && roomStore.size > 0) {
        const archivedRounds = Array.from(roomStore.values());
        archivedRounds.sort((a, b) => {
          const timeA = a.instant ? new Date(a.instant).getTime() : 0;
          const timeB = b.instant ? new Date(b.instant).getTime() : 0;
          return timeB - timeA;
        });
        return archivedRounds;
      }
      throw new Error(`AviatorPro inacessível no momento: ${netErr instanceof Error ? netErr.message : "Timeout"}`);
    }
  }

  if (res.status === 401) {
    token = await getAviatorProToken(true);
    headers.Authorization = `Bearer ${token}`;
    res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(9000),
    });
  }

  // Se AviatorPro retornou 504 (Gateway Timeout) ou 502/503
  if (res.status >= 500) {
    console.warn(`[AviatorPro] Servidor retornou HTTP ${res.status}. Tentando requisição leve com 200 rodadas...`);
    try {
      const retryUrl = new URL(`https://api.aviatorpro.io/api/v1/games/${gameId}/history`);
      retryUrl.searchParams.set("limit", "200");
      const retryRes = await fetch(retryUrl.toString(), {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      if (retryRes.ok) {
        res = retryRes;
      }
    } catch {
      // Ignora erro do retry
    }
  }

  if (!res.ok) {
    // Se tivermos rodadas arquivadas na memória, usa como fallback seguro
    const roomStore = dailyArchive.get(archiveKey);
    if (roomStore && roomStore.size > 0) {
      const archivedRounds = Array.from(roomStore.values());
      archivedRounds.sort((a, b) => {
        const timeA = a.instant ? new Date(a.instant).getTime() : 0;
        const timeB = b.instant ? new Date(b.instant).getTime() : 0;
        return timeB - timeA;
      });
      console.warn(`[AviatorPro] Retornando ${archivedRounds.length} rodadas em cache após HTTP ${res.status}`);
      return archivedRounds;
    }
    throw new Error(`AviatorPro retornou HTTP ${res.status}`);
  }

  const data = (await res.json()) as any;
  const rawRounds = Array.isArray(data?.data?.rounds) ? data.data.rounds : [];

  const mapped: CrashRoundItem[] = rawRounds.map((r: any) => {
    const mult = Number(r.multiplier || 1.0);
    return {
      uuid: String(r.round_id),
      externalId: String(r.round_id),
      result: mult,
      instant: r.occurred_at || new Date().toISOString(),
      type: mult < 2 ? "LOW" : mult < 10 ? "MEDIUM" : "HIGH",
      temperature: mult >= 10 ? 10 : mult >= 2 ? 2 : 1,
    };
  });

  // AviatorPro delivers chronological ascending (oldest first).
  // Reverse to sort descending (newest first) for our platform
  mapped.reverse();

  // Deduplicate and record in archive for this game room
  recordRoundsInArchive(archiveKey, mapped);
  aviatorProCache.set(gameId, { rounds: mapped, timestamp: now });
  return mapped;
}

// Cache and deduplication accumulator for Torre Bet (VorexHub - Gráfico 1 e Gráfico 2)
interface TorreBetCacheEntry {
  rounds: CrashRoundItem[];
  timestamp: number;
}
const torreBetCache = new Map<string, TorreBetCacheEntry>();
const TORRE_BET_CACHE_TTL_MS = 1500; // 1.5s cache for ultra-responsive live rounds

const VOREXHUB_ENDPOINTS: Record<string, string> = {
  torre_bet_grafico1:
    "https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1&quantidade=200",
  torre_bet_grafico2:
    "https://aviator-rodadas.vorexhub.pro/grafico2?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1&quantidade=200",
};

async function getVorexHubRounds(
  roomKey: "torre_bet_grafico1" | "torre_bet_grafico2",
  targetLimit = 30000,
  customUrl?: string
): Promise<CrashRoundItem[]> {
  const now = Date.now();
  const cached = torreBetCache.get(roomKey);
  if (cached && now - cached.timestamp < TORRE_BET_CACHE_TTL_MS && cached.rounds.length > 0) {
    return cached.rounds.slice(0, targetLimit);
  }

  let endpoint = VOREXHUB_ENDPOINTS[roomKey];
  if (customUrl && customUrl.startsWith("http")) {
    endpoint = customUrl.includes("quantidade=") ? customUrl : `${customUrl}&quantidade=200`;
  }

  let roomStore = dailyArchive.get(roomKey);
  if (!roomStore) {
    roomStore = new Map<string, CrashRoundItem>();
    dailyArchive.set(roomKey, roomStore);
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data: any = await res.json();
      const rawRounds = Array.isArray(data?.rodadas) ? data.rodadas : [];

      for (const r of rawRounds) {
        const rawRodada = String(r.rodada || "").trim();
        const numId = rawRodada.replace(/^r-?/i, "").trim();
        const mult = Number(r.multiplicador !== undefined ? r.multiplicador : r.result);
        if (isNaN(mult) || mult <= 0) continue;

        const instant = r.hora ? new Date(r.hora).toISOString() : new Date().toISOString();
        const timeMs = r.hora ? new Date(r.hora).getTime() : 0;

        // Canonical ID completely immune to duplicates
        const canonicalId = numId ? `vorex_${numId}` : `vorex_${timeMs}_${mult.toFixed(2)}`;

        const item: CrashRoundItem = {
          uuid: canonicalId,
          externalId: numId || canonicalId,
          result: Math.round(mult * 100) / 100,
          instant: instant,
          type: mult < 2 ? "LOW" : mult < 10 ? "MEDIUM" : "HIGH",
          temperature: mult >= 10 ? 10 : mult >= 2 ? 2 : 1,
        };

        roomStore.set(canonicalId, item);
      }
    }
  } catch (err) {
    console.warn(`[TorreBet] Erro ao buscar ${roomKey}:`, err);
  }

  // Para Gráfico 1: completa as rodadas anteriores a 11:30 (de 00:00:01 até o bloco do VorexHub)
  // Utiliza um cutoff estrito (zero sobreposição) para garantir que NUNCA haja duplicatas
  if (roomKey === "torre_bet_grafico1" && roomStore.size < 500) {
    let oldestVorexTime = Infinity;
    for (const r of roomStore.values()) {
      const t = r.instant ? new Date(r.instant).getTime() : Infinity;
      if (t < oldestVorexTime) oldestVorexTime = t;
    }

    if (isFinite(oldestVorexTime) && oldestVorexTime < Infinity) {
      try {
        const cutoff = oldestVorexTime - 70000;
        const pagePromises = [1, 2, 3, 4, 5, 6, 7, 8].map(async (page) => {
          try {
            const resp = await fetch(
              `https://app.torredecomando.vip/history_proxy.php?intervalo=1d&limit=500&page=${page}&_t=${Date.now()}`,
              { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) }
            );
            if (!resp.ok) return [];
            const data: any = await resp.json();
            return Array.isArray(data?.payouts) ? data.payouts : [];
          } catch {
            return [];
          }
        });
        const pageBatches = await Promise.all(pagePromises);
        for (const batch of pageBatches) {
          for (const p of batch) {
            const val = Number(p.multiplier !== undefined ? p.multiplier : p.value);
            if (isNaN(val) || val <= 0) continue;
            const rawCreatedAt = String(p.created_at || "").trim();
            if (!rawCreatedAt) continue;
            const dt = new Date(rawCreatedAt.replace(" ", "T") + "-03:00");
            // Se o horário for igual ou mais recente que o corte, ignora completamente para evitar duplicata
            if (isNaN(dt.getTime()) || dt.getTime() >= cutoff) continue;

            const instantIso = dt.toISOString();
            const id = `torre_hist_${dt.getTime()}`;
            if (!roomStore.has(id)) {
              roomStore.set(id, {
                uuid: id,
                externalId: String(p.id || id),
                result: Math.round(val * 100) / 100,
                instant: instantIso,
                type: val < 2 ? "LOW" : val < 10 ? "MEDIUM" : "HIGH",
                temperature: val >= 10 ? 10 : val >= 2 ? 2 : 1,
              });
            }
          }
        }
      } catch (histErr) {
        console.warn("[TorreBet G1] Falha ao pré-carregar histórico anterior:", histErr);
      }
    }
  }

  const allRounds = Array.from(roomStore.values());
  allRounds.sort((a, b) => {
    const timeA = a.instant ? new Date(a.instant).getTime() : 0;
    const timeB = b.instant ? new Date(b.instant).getTime() : 0;
    return timeB - timeA;
  });

  // Strict deduplication pass (garante ZERO duplicatas de instant + multiplicador)
  const deduped: CrashRoundItem[] = [];
  const seenKeys = new Set<string>();
  for (const item of allRounds) {
    const timeKey = `${item.instant}_${Number(item.result).toFixed(2)}`;
    if (!seenKeys.has(timeKey)) {
      seenKeys.add(timeKey);
      deduped.push(item);
    }
  }

  torreBetCache.set(roomKey, { rounds: deduped, timestamp: now });
  return deduped.slice(0, targetLimit);
}

// ----------------------------------------------------
// 3. Radar Aviator (BetBrabo: Aviator 1, VIP, Premium)
// ----------------------------------------------------
interface RadarAviatorCache {
  rounds: CrashRoundItem[];
  timestamp: number;
}
const radarAviatorCache = new Map<number, RadarAviatorCache>();
const RADAR_CACHE_TTL_MS = 2000;

async function getRadarAviatorRounds(
  graphNum: 1 | 2 | 3,
  targetLimit = 30000
): Promise<CrashRoundItem[]> {
  const now = Date.now();
  const cached = radarAviatorCache.get(graphNum);
  if (cached && now - cached.timestamp < RADAR_CACHE_TTL_MS && cached.rounds.length > 0) {
    return cached.rounds.slice(0, targetLimit);
  }

  const archiveKey = `betbrabo_grafico${graphNum}`;
  let roomStore = dailyArchive.get(archiveKey);
  if (!roomStore) {
    roomStore = new Map<string, CrashRoundItem>();
    dailyArchive.set(archiveKey, roomStore);
  }

  // Fuso horário do Brasil (America/Bahia) para chave do arquivo diário
  const d = new Date();
  const todayStr = d.toLocaleDateString("en-CA", { timeZone: "America/Bahia" });

  const histUrl = `https://www.radar-aviator.com/historico/data/graph-${graphNum}/${todayStr}.json`;
  const liveUrl =
    graphNum === 1
      ? "https://www.radar-aviator.com/api/historico.php"
      : `https://www.radar-aviator.com/api/historico${graphNum}.php`;

  try {
    const [histRes, liveRes] = await Promise.all([
      fetch(histUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
      fetch(liveUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null),
    ]);

    // 1. Processa histórico completo de 00:00:00
    if (histRes && histRes.ok) {
      const histData: any = await histRes.json();
      const items = Array.isArray(histData?.items) ? histData.items : [];
      for (const item of items) {
        const id = String(item.id || "").trim();
        const mult = Number(item.mult);
        if (!id || isNaN(mult) || mult <= 0) continue;

        let instant: string;
        if (item.ts) {
          instant = new Date(item.ts * 1000).toISOString();
        } else if (item.t) {
          instant = new Date(item.t.replace(" ", "T") + "-03:00").toISOString();
        } else {
          instant = new Date().toISOString();
        }

        const canonicalId = `brabo_${graphNum}_${id}`;
        if (!roomStore.has(canonicalId)) {
          roomStore.set(canonicalId, {
            uuid: canonicalId,
            externalId: id,
            result: Math.round(mult * 100) / 100,
            instant,
            type: mult < 2 ? "LOW" : mult < 10 ? "MEDIUM" : "HIGH",
            temperature: mult >= 10 ? 10 : mult >= 2 ? 2 : 1,
          });
        }
      }
    }

    // 2. Processa live endpoint em tempo real
    if (liveRes && liveRes.ok) {
      const liveData: any = await liveRes.json();
      const items = Array.isArray(liveData?.items) ? liveData.items : [];
      for (const item of items) {
        const id = String(item.id || item.rodada || "").trim();
        const mult = Number(item.mult);
        if (!id || isNaN(mult) || mult <= 0) continue;

        let instant: string;
        if (item.t) {
          instant = new Date(item.t.replace(" ", "T") + "-03:00").toISOString();
        } else {
          instant = new Date().toISOString();
        }

        const canonicalId = `brabo_${graphNum}_${id}`;
        if (!roomStore.has(canonicalId)) {
          roomStore.set(canonicalId, {
            uuid: canonicalId,
            externalId: id,
            result: Math.round(mult * 100) / 100,
            instant,
            type: mult < 2 ? "LOW" : mult < 10 ? "MEDIUM" : "HIGH",
            temperature: mult >= 10 ? 10 : mult >= 2 ? 2 : 1,
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[BetBrabo G${graphNum}] Erro ao carregar dados:`, err);
  }

  const allRounds = Array.from(roomStore.values());
  allRounds.sort((a, b) => {
    const timeA = a.instant ? new Date(a.instant).getTime() : 0;
    const timeB = b.instant ? new Date(b.instant).getTime() : 0;
    return timeB - timeA;
  });

  // Strict deduplication by externalId & uuid (garante ZERO duplicatas)
  const deduped: CrashRoundItem[] = [];
  const seenIds = new Set<string>();
  for (const item of allRounds) {
    const key = (item.externalId || item.uuid || "").trim();
    if (key && !seenIds.has(key)) {
      seenIds.add(key);
      deduped.push(item);
    }
  }

  radarAviatorCache.set(graphNum, { rounds: deduped, timestamp: now });
  return deduped.slice(0, targetLimit);
}

// Background auto-collector: collects TipMiner every 4s, AviatorPro every 10s, TorreBet Gráfico 1 & 2 every 3s, BetBrabo every 3s
let aviatorProBgCounter = 0;
let archivePersistCounter = 0;
setInterval(async () => {
  for (const roomKey of ["997b99e3-4977-4fcf-ac6d-3834a384d141", "48323e32-3590-4e2f-b6fe-09d5fbc811c9"]) {
    try {
      await getFullDayRounds(roomKey);
    } catch {}
  }

  // Auto-collect Torre Bet Gráfico 1 e Gráfico 2 (VorexHub com quantidade=200)
  try {
    await getVorexHubRounds("torre_bet_grafico1", 30000);
  } catch {}
  try {
    await getVorexHubRounds("torre_bet_grafico2", 30000);
  } catch {}

  // Auto-collect BetBrabo Gráfico 1 (Aviator 1), 2 (VIP), 3 (Premium)
  try {
    await getRadarAviatorRounds(1, 30000);
  } catch {}
  try {
    await getRadarAviatorRounds(2, 30000);
  } catch {}
  try {
    await getRadarAviatorRounds(3, 30000);
  } catch {}

  // Salva no disco periodicamente a cada ~30s
  archivePersistCounter++;
  if (archivePersistCounter % 10 === 0) {
    savePersistedArchive();
  }

  // Executa AviatorPro periodicamente
  aviatorProBgCounter++;
  if (aviatorProBgCounter % 3 === 0) {
    try {
      await getAviatorProRounds(1, 50);
    } catch {}
    try {
      await getAviatorProRounds(2, 50);
    } catch {}
  }
}, 3000);

// Rotas diretas e limpas para consumo em outros aplicativos
app.get("/api/torre/grafico1", async (req, res) => {
  try {
    const rounds = await getVorexHubRounds("torre_bet_grafico1", 30000);
    return res.json({
      success: true,
      grafico: 1,
      total: rounds.length,
      data: rounds,
      rodadas: rounds.map((r) => ({
        rodada: r.uuid,
        multiplicador: r.result,
        hora: r.instant,
      })),
      atualizado_em: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/torre/grafico2", async (req, res) => {
  try {
    const rounds = await getVorexHubRounds("torre_bet_grafico2", 30000);
    return res.json({
      success: true,
      grafico: 2,
      total: rounds.length,
      data: rounds,
      rodadas: rounds.map((r) => ({
        rodada: r.uuid,
        multiplicador: r.result,
        hora: r.instant,
      })),
      atualizado_em: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Rotas diretas BetBrabo (Radar Aviator: 1 = Aviator 1, 2 = VIP, 3 = Premium)
app.get("/api/betbrabo/aviator1", async (req, res) => {
  try {
    const rounds = await getRadarAviatorRounds(1, 30000);
    return res.json({
      success: true,
      grafico: 1,
      name: "Aviator 1",
      house: "BetBrabo",
      total: rounds.length,
      data: rounds,
      rodadas: rounds.map((r) => ({
        rodada: r.externalId || r.uuid,
        multiplicador: r.result,
        hora: r.instant,
      })),
      atualizado_em: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/betbrabo/grafico1", (req, res) => res.redirect("/api/betbrabo/aviator1"));

app.get("/api/betbrabo/vip", async (req, res) => {
  try {
    const rounds = await getRadarAviatorRounds(2, 30000);
    return res.json({
      success: true,
      grafico: 2,
      name: "VIP",
      house: "BetBrabo",
      total: rounds.length,
      data: rounds,
      rodadas: rounds.map((r) => ({
        rodada: r.externalId || r.uuid,
        multiplicador: r.result,
        hora: r.instant,
      })),
      atualizado_em: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/betbrabo/grafico2", (req, res) => res.redirect("/api/betbrabo/vip"));

app.get("/api/betbrabo/premium", async (req, res) => {
  try {
    const rounds = await getRadarAviatorRounds(3, 30000);
    return res.json({
      success: true,
      grafico: 3,
      name: "Premium",
      house: "BetBrabo",
      total: rounds.length,
      data: rounds,
      rodadas: rounds.map((r) => ({
        rodada: r.externalId || r.uuid,
        multiplicador: r.result,
        hora: r.instant,
      })),
      atualizado_em: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/betbrabo/grafico3", (req, res) => res.redirect("/api/betbrabo/premium"));

// API route to fetch crash rounds for any betting house or custom URL
app.get("/api/rounds", async (req, res) => {
  try {
    const { house, customUrl, limit, fresh, allDay, date } = req.query;
    let baseTargetUrl = "";

    if (customUrl && typeof customUrl === "string" && customUrl.startsWith("http")) {
      baseTargetUrl = customUrl;
    } else if (house && typeof house === "string" && DEFAULT_HOUSES[house]) {
      baseTargetUrl = DEFAULT_HOUSES[house];
    } else {
      // Default to Torre Bet → Gráfico 1
      baseTargetUrl = DEFAULT_HOUSES.torre_bet_grafico1;
    }

    if (
      baseTargetUrl.includes("aviatorpro.io") ||
      house === "bingo" ||
      house === "bingo_grafico1" ||
      house === "bingo_grafico2"
    ) {
      const targetLimit = Math.max(100, Math.min(Number(limit) || 2000, 3000));
      const gameId = house === "bingo_grafico2" || baseTargetUrl.includes("/games/2/") ? 2 : 1;
      const archiveKey = gameId === 2 ? "bingo_grafico2" : "bingo_grafico1";

      try {
        const rounds = await getAviatorProRounds(gameId, targetLimit);
        return res.json({
          success: true,
          source: "aviatorpro",
          gameId,
          data: rounds,
          totalDayRounds: rounds.length,
          limitRequested: targetLimit,
          fetchedAt: new Date().toISOString(),
        });
      } catch (apErr) {
        console.warn("AviatorPro fetch error (recuperando dados em cache):", apErr);
        const roomStore = dailyArchive.get(archiveKey);
        if (roomStore && roomStore.size > 0) {
          const archived = Array.from(roomStore.values());
          archived.sort((a, b) => {
            const timeA = a.instant ? new Date(a.instant).getTime() : 0;
            const timeB = b.instant ? new Date(b.instant).getTime() : 0;
            return timeB - timeA;
          });
          return res.json({
            success: true,
            source: "aviatorpro_cache_archive",
            gameId,
            data: archived,
            totalDayRounds: archived.length,
            limitRequested: targetLimit,
            warning: "AviatorPro temporariamente lento (HTTP 504). Exibindo dados acumulados em memória.",
            fetchedAt: new Date().toISOString(),
          });
        }

        return res.status(200).json({
          success: true,
          source: "aviatorpro_temporary_fallback",
          gameId,
          data: [],
          totalDayRounds: 0,
          limitRequested: targetLimit,
          warning: "AviatorPro retornou HTTP 504 temporário. Sincronizando novas rodadas...",
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Torre Bet (VorexHub Oficial - Gráfico 1 e Gráfico 2)
    const isTorreG1 =
      house === "torre_bet" ||
      house === "torre_bet_grafico1" ||
      house === "torre" ||
      (baseTargetUrl && (baseTargetUrl.includes("/grafico1") || baseTargetUrl.includes("torredecomando.vip")));

    const isTorreG2 =
      house === "torre_bet_grafico2" ||
      (baseTargetUrl && baseTargetUrl.includes("/grafico2"));

    if (isTorreG1 || isTorreG2) {
      const roomKey: "torre_bet_grafico1" | "torre_bet_grafico2" = isTorreG2
        ? "torre_bet_grafico2"
        : "torre_bet_grafico1";
      const targetLimit = Math.max(50, Math.min(Number(limit) || 30000, 30000));
      try {
        const rounds = await getVorexHubRounds(roomKey, targetLimit, baseTargetUrl);
        return res.json({
          success: true,
          source: "vorexhub_oficial",
          house: roomKey,
          data: rounds,
          totalDayRounds: rounds.length,
          limitRequested: targetLimit,
          fetchedAt: new Date().toISOString(),
        });
      } catch (tbErr) {
        console.warn(`[TorreBet] Erro ao buscar ${roomKey}:`, tbErr);
        const roomStore = dailyArchive.get(roomKey);
        const archived = roomStore ? Array.from(roomStore.values()) : [];
        archived.sort((a, b) => {
          const timeA = a.instant ? new Date(a.instant).getTime() : 0;
          const timeB = b.instant ? new Date(b.instant).getTime() : 0;
          return timeB - timeA;
        });
        return res.json({
          success: true,
          source: "vorexhub_archive",
          house: roomKey,
          data: archived.slice(0, targetLimit),
          totalDayRounds: archived.length,
          limitRequested: targetLimit,
          warning: "Erro temporário ao conectar com Torre Bet. Exibindo dados acumulados.",
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    // 3. BetBrabo (Radar Aviator - Gráfico 1 Aviator 1, Gráfico 2 VIP, Gráfico 3 Premium)
    const isBetBraboG1 =
      house === "betbrabo_aviator1" ||
      house === "betbrabo_grafico1" ||
      house === "betbrabo" ||
      (baseTargetUrl &&
        baseTargetUrl.includes("radar-aviator.com") &&
        (baseTargetUrl.includes("historico.php") || baseTargetUrl.includes("graph-1")));

    const isBetBraboG2 =
      house === "betbrabo_vip" ||
      house === "betbrabo_grafico2" ||
      (baseTargetUrl &&
        baseTargetUrl.includes("radar-aviator.com") &&
        (baseTargetUrl.includes("historico2.php") || baseTargetUrl.includes("graph-2")));

    const isBetBraboG3 =
      house === "betbrabo_premium" ||
      house === "betbrabo_grafico3" ||
      (baseTargetUrl &&
        baseTargetUrl.includes("radar-aviator.com") &&
        (baseTargetUrl.includes("historico3.php") || baseTargetUrl.includes("graph-3")));

    if (isBetBraboG1 || isBetBraboG2 || isBetBraboG3) {
      const graphNum: 1 | 2 | 3 = isBetBraboG3 ? 3 : isBetBraboG2 ? 2 : 1;
      const graphLabel = graphNum === 1 ? "Aviator 1" : graphNum === 2 ? "VIP" : "Premium";
      const targetLimit = Math.max(50, Math.min(Number(limit) || 30000, 30000));
      try {
        const rounds = await getRadarAviatorRounds(graphNum, targetLimit);
        return res.json({
          success: true,
          source: "radar_aviator_betbrabo",
          house: `betbrabo_grafico${graphNum}`,
          graphLabel,
          data: rounds,
          totalDayRounds: rounds.length,
          limitRequested: targetLimit,
          fetchedAt: new Date().toISOString(),
        });
      } catch (bbErr: any) {
        console.warn(`[BetBrabo G${graphNum}] Erro ao buscar:`, bbErr);
        const archiveKey = `betbrabo_grafico${graphNum}`;
        const roomStore = dailyArchive.get(archiveKey);
        const archived = roomStore ? Array.from(roomStore.values()) : [];
        archived.sort((a, b) => {
          const timeA = a.instant ? new Date(a.instant).getTime() : 0;
          const timeB = b.instant ? new Date(b.instant).getTime() : 0;
          return timeB - timeA;
        });
        return res.json({
          success: true,
          source: "radar_aviator_archive",
          house: archiveKey,
          graphLabel,
          data: archived.slice(0, targetLimit),
          totalDayRounds: archived.length,
          limitRequested: targetLimit,
          warning: "Erro temporário ao conectar com Radar Aviator. Exibindo dados acumulados.",
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    // Identify room key
    let roomKey = "997b99e3-4977-4fcf-ac6d-3834a384d141";
    if (typeof house === "string" && AVIATOR_ROOMS_MAP[house]) {
      roomKey = AVIATOR_ROOMS_MAP[house];
    } else if (
      house === "betfusion_grafico2" ||
      house === "torre_bet_grafico2" ||
      house === "grafico2" ||
      baseTargetUrl.includes("48323e32")
    ) {
      roomKey = "48323e32-3590-4e2f-b6fe-09d5fbc811c9";
    } else if (
      house === "torre_bet_grafico1" ||
      house === "torre_bet" ||
      house === "torre" ||
      house === "betfusion_grafico1" ||
      house === "grafico1" ||
      baseTargetUrl.includes("997b99e3") ||
      baseTargetUrl.includes("torredecomando.vip")
    ) {
      roomKey = "997b99e3-4977-4fcf-ac6d-3834a384d141";
    } else if (baseTargetUrl.includes("/rounds/")) {
      roomKey = baseTargetUrl.split("/rounds/")[1]?.split("/")[0] || roomKey;
    }

    const targetLimit = Math.min(30000, Number(limit) || 30000);
    const dateStr = typeof date === "string" && date.trim() ? date.trim() : undefined;

    // Fetch full day history from 00:00:00 up to current minute
    const fullDayRounds = await getFullDayRounds(roomKey, dateStr);

    let returnedData = fullDayRounds;
    if (limit && Number(limit) < fullDayRounds.length && allDay === "false") {
      returnedData = fullDayRounds.slice(0, Number(limit));
    }

    return res.json({
      success: true,
      source: typeof house === "string" && house.startsWith("torre") ? "live_torre_bet" : "full_day_tipminer",
      house: typeof house === "string" ? house : "torre_bet_grafico1",
      data: returnedData,
      totalDayRounds: fullDayRounds.length,
      limitRequested: targetLimit,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error proxying crash rounds:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
});

// Endpoint to get live previews of all Aviator rooms so the user can easily find their exact room
app.get("/api/rooms-status", async (_req, res) => {
  const rooms = [
    {
      id: "torre_bet_grafico1",
      name: "Torre Bet → Gráfico 1",
      url: "https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
    },
    {
      id: "torre_bet_grafico2",
      name: "Torre Bet → Gráfico 2",
      url: "https://aviator-rodadas.vorexhub.pro/grafico2?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1",
    },
  ];

  try {
    const statuses = await Promise.all(
      rooms.map(async (r) => {
        try {
          if (r.id === "torre_bet_grafico1" || r.id === "torre_bet_grafico2") {
            const fetchRes = await fetch(r.url, {
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(3500),
            });
            if (!fetchRes.ok) return { ...r, recentMultipliers: [] };
            const data: any = await fetchRes.json();
            const clean = Array.isArray(data?.rodadas)
              ? data.rodadas.slice(0, 4).map((p: any) => ({
                  uuid: String(p.rodada || ""),
                  result: Number(p.multiplicador !== undefined ? p.multiplicador : p.result),
                  instant: p.hora ? new Date(p.hora).toISOString() : new Date().toISOString(),
                }))
              : [];
            return { ...r, recentMultipliers: clean };
          }

          return { ...r, recentMultipliers: [] };
        } catch {
          return { ...r, recentMultipliers: [] };
        }
      })
    );
    return res.json({ success: true, rooms: statuses });
  } catch {
    return res.status(500).json({ success: false, error: "Erro ao consultar salas" });
  }
});

// Endpoint to validate a custom TipMiner or crash API
app.post("/api/test-endpoint", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).json({ success: false, error: "URL inválida fornecida" });
    }

    let testUrl = url;
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("_cb", crypto.randomUUID());
      testUrl = parsed.toString();
    } catch {
      // ignore
    }

    const start = Date.now();
    const response = await fetch(testUrl, {
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const latency = Date.now() - start;

    if (!response.ok) {
      return res.json({
        success: false,
        status: response.status,
        latency,
        error: `Falha ao conectar: HTTP ${response.status}`,
      });
    }

    const data: any = await response.json();
    const isArray = Array.isArray(data);
    const count = isArray ? data.length : Array.isArray(data?.payouts) ? data.payouts.length : 0;
    const sample = isArray && data.length > 0 ? data[0] : (Array.isArray(data?.payouts) && data.payouts.length > 0 ? {
      result: data.payouts[0].multiplier || data.payouts[0].value,
      instant: data.payouts[0].created_at || new Date(data.payouts[0].timestamp).toISOString(),
      id: data.payouts[0].id
    } : null);

    return res.json({
      success: true,
      status: response.status,
      latency,
      count,
      sample,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Erro ao testar endpoint",
    });
  }
});

// Statistical Analysis Engine for Gatilho 13x (used as standalone or zero-downtime fallback when AI has 503 spikes)
function buildStatisticalAnalysis(
  estatisticas: any,
  minGatilho = 13.0,
  maxGatilho = 13.99,
  alvoMin = 50.0
) {
  const topCasa = estatisticas?.rankingCasasExatas?.[0]?.casa || 7;
  const mediaRosas = estatisticas?.mediaRosasIntermediarias || 2.1;
  const taxaAte20 = estatisticas?.taxaEmAte20Casas || 65;
  const totalGatilhos = estatisticas?.totalGatilhos || 0;
  const taxaRosaOuAlvo = Math.min(95, Math.max(60, taxaAte20 + 15));

  const startCasa = Math.max(1, topCasa - 2);
  const endCasa = topCasa + 2;

  return {
    momentoIdeal: `Esperar o rompimento pós-${minGatilho.toFixed(0)}x e armar entrada entre a ${startCasa}ª e a ${endCasa}ª casa após o gatilho.`,
    quantidadeEntradasIdeal: 4,
    faixaCasasRecomendada: `Casas ${startCasa} a ${endCasa} pós-gatilho (${minGatilho.toFixed(2)}x-${maxGatilho.toFixed(2)}x)`,
    protecaoMao1: {
      valorSugerido: "60% da aposta total (Ex: R$ 6,00 de R$ 10,00)",
      autoCashout: 2.0,
      funcao: "Recuperar 100% do custo de ambas as mãos com 1 único tiro ganho",
    },
    protecaoMao2: {
      valorSugerido: "40% da aposta total (Ex: R$ 4,00 de R$ 10,00)",
      autoCashout: 10.0,
      funcao: `Garantir o lucro alto da rosa intermediária (≥10.00x) enquanto busca o alvo de ${alvoMin.toFixed(0)}x`,
    },
    estrategiaProtecao10x: {
      viavel: true,
      comoExecutar: `Em média saem ${mediaRosas} velas rosas (≥10x) antes do estouro de ${alvoMin.toFixed(0)}x. Se você travar a 2ª mão em 10.00x, você tem cerca de ${taxaRosaOuAlvo}% de probabilidade de colher lucro rosa sem sofrer o risco de esperar velas extremas.`,
      alvoPrimario: 10.0,
      taxaEsperada: `${taxaRosaOuAlvo}% de probabilidade estimada`,
    },
    termometroMomento: taxaAte20 >= 60 ? "QUENTE" : "MODERADO",
    nivelConfiancaPercent: Math.min(94, Math.max(58, taxaAte20 + 8)),
    justificativa: `Com base em ${totalGatilhos} ciclos auditados da Casa ${minGatilho.toFixed(0)}x hoje, a maior concentração de pagamentos se deu na casa ${topCasa}. Operar com limite estrito de 4 tiros preserva o capital em eventuais correções do algoritmo.`,
    stopLossAlert: "Se após 4 tiros consecutivos não sair nenhuma vela ≥ 2.00x, aborte as entradas do ciclo e aguarde a próxima 13.x.",
    dicaDeOuro: `Assim que a 2ª mão pagar 10.00x, embolse 80% do lucro e arrisque apenas o residual na busca do alvo estendido de ${alvoMin.toFixed(0)}x+.`,
  };
}

const advisorResponseSchema = {
  type: Type.OBJECT,
  properties: {
    momentoIdeal: {
      type: Type.STRING,
      description: "Momento exato ideal para iniciar as entradas pós-13x",
    },
    quantidadeEntradasIdeal: {
      type: Type.INTEGER,
      description: "Número ideal de tiros/entradas consecutivas (ex: 3, 4 ou 5)",
    },
    faixaCasasRecomendada: {
      type: Type.STRING,
      description: "Faixa de casas recomendada para operar (ex: Casas 5 a 8 pós-gatilho)",
    },
    protecaoMao1: {
      type: Type.OBJECT,
      properties: {
        valorSugerido: { type: Type.STRING },
        autoCashout: { type: Type.NUMBER },
        funcao: { type: Type.STRING },
      },
      required: ["valorSugerido", "autoCashout", "funcao"],
    },
    protecaoMao2: {
      type: Type.OBJECT,
      properties: {
        valorSugerido: { type: Type.STRING },
        autoCashout: { type: Type.NUMBER },
        funcao: { type: Type.STRING },
      },
      required: ["valorSugerido", "autoCashout", "funcao"],
    },
    estrategiaProtecao10x: {
      type: Type.OBJECT,
      properties: {
        viavel: { type: Type.BOOLEAN },
        comoExecutar: { type: Type.STRING },
        alvoPrimario: { type: Type.NUMBER },
        taxaEsperada: { type: Type.STRING },
      },
      required: ["viavel", "comoExecutar", "alvoPrimario", "taxaEsperada"],
    },
    termometroMomento: {
      type: Type.STRING,
      description: "MUITO_QUENTE, QUENTE, MODERADO ou FRIO_AGUARDAR",
    },
    nivelConfiancaPercent: {
      type: Type.INTEGER,
      description: "Nível de confiança da estratégia (de 0 a 100)",
    },
    justificativa: {
      type: Type.STRING,
      description: "Explicação técnica matemática da estratégia",
    },
    stopLossAlert: {
      type: Type.STRING,
      description: "Regra estrita de parada para proteger a banca",
    },
    dicaDeOuro: {
      type: Type.STRING,
      description: "Dica valiosa para maximizar lucros e evitar armadilhas",
    },
  },
  required: [
    "momentoIdeal",
    "quantidadeEntradasIdeal",
    "faixaCasasRecomendada",
    "protecaoMao1",
    "protecaoMao2",
    "estrategiaProtecao10x",
    "termometroMomento",
    "nivelConfiancaPercent",
    "justificativa",
    "stopLossAlert",
    "dicaDeOuro",
  ],
};

// Endpoint de Consultoria e IA com Tolerância a Falhas e Alta Resiliência
// In-memory cache and cooldown manager to protect against quota limits (429) and high demand (503)
interface CachedAdvisorResponse {
  timestamp: number;
  analysis: any;
  isAiGenerated: boolean;
  source: string;
}

let cachedAdvisorAnalysis: CachedAdvisorResponse | null = null;
const ADVISOR_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de cache inteligente
const modelCooldowns = new Map<string, number>();

app.post("/api/ai/advisor", async (req, res) => {
  const {
    minGatilho = 13.0,
    maxGatilho = 13.99,
    alvoMin = 50.0,
    estatisticas,
    recentRounds = [],
    forceRefresh = false,
  } = req.body || {};

  try {
    const now = Date.now();

    // Se temos um cache recente e não foi solicitado refresh explícito, retorna do cache
    if (
      !forceRefresh &&
      cachedAdvisorAnalysis &&
      now - cachedAdvisorAnalysis.timestamp < ADVISOR_CACHE_TTL_MS
    ) {
      return res.json({
        success: true,
        isAiGenerated: cachedAdvisorAnalysis.isAiGenerated,
        source: cachedAdvisorAnalysis.source,
        analysis: cachedAdvisorAnalysis.analysis,
        fromCache: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = buildStatisticalAnalysis(estatisticas, minGatilho, maxGatilho, alvoMin);
      cachedAdvisorAnalysis = {
        timestamp: now,
        analysis: fallback,
        isAiGenerated: false,
        source: "motor_estatistico",
      };
      return res.json({
        success: true,
        isAiGenerated: false,
        source: "motor_estatistico",
        analysis: fallback,
      });
    }

    const prompt = `Você é o analista sênior de probabilidade e estatística do sistema MOSTRINHO para o jogo Aviator.
O usuário quer melhorar as entradas após o gatilho da Casa 13x (13.00x a 13.99x).
Ele quer saber:
1. Qual o MELHOR MOMENTO para pegar pelo menos uma rosa (>= 10.00x) ou a vela alvo de 50.00x?
2. QUANTAS ENTRADAS (tiros consecutivos) seriam o número IDEAL para não sangrar banca?
3. Como montar uma GESTÃO DE 2 PROTEÇÕES:
   - Uma proteção buscando garantir retorno rápido (ex: 2.00x ou 10.00x).
   - A outra mão buscando o alvo alto (10.00x ou 50.00x).

DADOS ESTATÍSTICOS AUDITADOS HOJE:
- Intervalo do Gatilho: ${minGatilho}x a ${maxGatilho}x
- Alvo Estendido: >= ${alvoMin}x
- Total de Gatilhos 13x hoje: ${estatisticas?.totalGatilhos || 0}
- Taxa que atingiu o alvo em até 20 casas: ${estatisticas?.taxaEmAte20Casas || 0}%
- Média de casas até a 50x: ${estatisticas?.mediaCasasAteAlvo || 0}
- Média de rosas intermediárias antes do alvo: ${estatisticas?.mediaRosasIntermediarias || 0} rosas
- Casas mais assertivas hoje: ${JSON.stringify(estatisticas?.rankingCasasExatas?.slice(0, 3) || [])}
- Minutos mais assertivos: ${JSON.stringify(estatisticas?.rankingMinutosRelativos?.slice(0, 3) || [])}
- Últimas 10 velas do mercado: ${JSON.stringify(recentRounds.slice(0, 10).map((r: any) => r.result))}

Responda no formato JSON estrito conforme o schema. Seja cirúrgico, matemático, realista e focado em preservação de capital.`;

    // Modelos independentes suportados pela skill
    const AI_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let aiParsedAnalysis: any = null;
    let successfulModel = "";

    for (const modelName of AI_MODELS) {
      // Se o modelo estiver sob cooldown (por 429 ou 503 recente), pula para o próximo
      const cooldownUntil = modelCooldowns.get(modelName) || 0;
      if (now < cooldownUntil) {
        continue;
      }

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              "Você é um consultor quantitativo especialista em padrões estatísticos e gestão de risco para jogos de crash (Aviator). Responda sempre em JSON válido, com conselhos diretos, realistas e focados em preservação de banca com 2 mãos.",
            responseMimeType: "application/json",
            responseSchema: advisorResponseSchema,
          },
        });

        const text = response.text?.trim() || "";
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed && parsed.momentoIdeal) {
            aiParsedAnalysis = parsed;
            successfulModel = modelName;
            break;
          }
        }
      } catch (genErr: any) {
        const errMsg = genErr?.message || String(genErr);
        const errStatus = genErr?.status || "";
        const isQuotaExceeded =
          errMsg.includes("429") ||
          errMsg.includes("quota") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errStatus === "RESOURCE_EXHAUSTED";
        const isUnavailable =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errStatus === "UNAVAILABLE";

        if (isQuotaExceeded) {
          // 5 minutos de cooldown para poupar cotas sem lançar logs de erro ruidosos
          modelCooldowns.set(modelName, Date.now() + 5 * 60 * 1000);
          console.info(`[AI Advisor] Modelo ${modelName} atingiu cota temporária (429). Ativando motor quantitativo.`);
        } else if (isUnavailable) {
          // 1 minuto de cooldown para picos momentâneos 503
          modelCooldowns.set(modelName, Date.now() + 60 * 1000);
          console.info(`[AI Advisor] Modelo ${modelName} sob alta demanda temporária (503).`);
        } else {
          modelCooldowns.set(modelName, Date.now() + 30 * 1000);
          console.info(`[AI Advisor] Modelo ${modelName} indisponível no momento.`);
        }
      }
    }

    if (aiParsedAnalysis) {
      cachedAdvisorAnalysis = {
        timestamp: Date.now(),
        analysis: aiParsedAnalysis,
        isAiGenerated: true,
        source: successfulModel,
      };

      return res.json({
        success: true,
        isAiGenerated: true,
        source: successfulModel,
        analysis: aiParsedAnalysis,
      });
    }

    // Se a IA atingiu limite de cota (429) ou pico de demanda (503),
    // o motor estatístico entrega a análise de forma suave e instantânea
    const statisticalFallback = buildStatisticalAnalysis(estatisticas, minGatilho, maxGatilho, alvoMin);
    cachedAdvisorAnalysis = {
      timestamp: Date.now(),
      analysis: statisticalFallback,
      isAiGenerated: false,
      source: "motor_estatistico_precisao",
    };

    return res.json({
      success: true,
      isAiGenerated: false,
      source: "motor_estatistico_precisao",
      fallbackReason: "Análise quantitativa processada pelo motor estatístico auditado em tempo real.",
      analysis: statisticalFallback,
    });
  } catch (err: any) {
    const fallback = buildStatisticalAnalysis(estatisticas, minGatilho, maxGatilho, alvoMin);
    return res.json({
      success: true,
      isAiGenerated: false,
      source: "motor_estatistico_fallback",
      analysis: fallback,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: "index.html" }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err && !res.headersSent) {
          res.status(200).send("Carregando aplicação...");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MOSTRINHO Server rodando na porta ${PORT}`);
  });
}

startServer();
