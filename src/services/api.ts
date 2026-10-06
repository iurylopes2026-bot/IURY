import { CrashRound } from '../types';

export interface FetchRoundsResult {
  success: boolean;
  rounds: CrashRound[];
  source: 'live' | 'cache' | 'fallback';
  fetchedAt: string;
  error?: string;
}

export async function fetchCrashRounds(
  houseId: string,
  customUrl?: string,
  limit: number = 30000,
  fresh: boolean = false,
  allDay: boolean = true,
  date?: string,
  token?: string
): Promise<FetchRoundsResult> {
  const params = new URLSearchParams();
  if (customUrl) {
    params.set('customUrl', customUrl);
  } else {
    params.set('house', houseId);
  }
  params.set('limit', String(limit));
  if (fresh) {
    params.set('fresh', 'true');
  }
  if (allDay) {
    params.set('allDay', 'true');
  }
  if (date) {
    params.set('date', date);
  }
  if (token) {
    params.set('token', token);
  }
  params.set('_t', String(Date.now()));

  try {
    const response = await fetch(`/api/rounds?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    if (!payload.success || !Array.isArray(payload.data)) {
      throw new Error(payload.error || 'Formato de resposta inesperado');
    }

    return {
      success: true,
      rounds: payload.data,
      source: payload.source || 'live',
      fetchedAt: payload.fetchedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Falha no proxy local, tentando conexão direta...', err);

    // Fallback direct fetch (if accessible in current client environment)
    try {
      const isGrafico2 = houseId === 'betfusion_grafico2' || houseId === 'grafico2';
      const directUrl =
        customUrl ||
        (isGrafico2
          ? `https://api.core.public.tipminer.com/v1/crash/rounds/48323e32-3590-4e2f-b6fe-09d5fbc811c9/history?limit=200&timezone=America%2FBahia&_cb=${Date.now()}`
          : `https://api.core.public.tipminer.com/v1/crash/rounds/997b99e3-4977-4fcf-ac6d-3834a384d141/history?limit=200&timezone=America%2FBahia&_cb=${Date.now()}`);

      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (Array.isArray(directData)) {
          return {
            success: true,
            rounds: directData,
            source: 'fallback',
            fetchedAt: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Direct also failed
    }

    return {
      success: false,
      rounds: [],
      source: 'live',
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Erro ao buscar rodadas',
    };
  }
}

export async function testApiEndpoint(url: string): Promise<{
  success: boolean;
  latency?: number;
  count?: number;
  sample?: CrashRound;
  error?: string;
}> {
  try {
    const res = await fetch('/api/test-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro na requisição',
    };
  }
}
