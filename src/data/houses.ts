import { BettingHouse } from '../types';

export const DEFAULT_HOUSES: BettingHouse[] = [
  {
    id: 'torre_bet_grafico1',
    name: 'Torre Bet → Gráfico 1',
    game: 'Aviator Torre 1',
    endpoint:
      'https://aviator-rodadas.vorexhub.pro/grafico1?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1',
    description: 'Torre Bet Aviator - Gráfico 1 (VorexHub Oficial)',
    badgeColor: 'from-amber-500 to-yellow-500',
    isDefault: true,
  },
  {
    id: 'torre_bet_grafico2',
    name: 'Torre Bet → Gráfico 2',
    game: 'Aviator Torre 2',
    endpoint:
      'https://aviator-rodadas.vorexhub.pro/grafico2?chave=f61f4fa7607539c4cb1220734438c5a2fe0c79e6fa72dcd1',
    description: 'Torre Bet Aviator - Gráfico 2 (VorexHub Oficial)',
    badgeColor: 'from-yellow-500 to-orange-500',
    isDefault: false,
  },
  {
    id: 'betbrabo_aviator1',
    name: 'BetBrabo → Aviator 1',
    game: 'Aviator 1 (BetBrabo)',
    endpoint: 'https://www.radar-aviator.com/api/historico.php',
    description: 'BetBrabo Gráfico 1 - Histórico Completo (00:00:00 até agora)',
    badgeColor: 'from-emerald-500 to-green-600',
    isDefault: false,
  },
  {
    id: 'betbrabo_vip',
    name: 'BetBrabo → VIP',
    game: 'Aviator VIP (BetBrabo)',
    endpoint: 'https://www.radar-aviator.com/api/historico2.php',
    description: 'BetBrabo Gráfico 2 VIP - Histórico Completo (00:00:00 até agora)',
    badgeColor: 'from-indigo-500 to-purple-600',
    isDefault: false,
  },
  {
    id: 'betbrabo_premium',
    name: 'BetBrabo → Premium',
    game: 'Aviator Premium (BetBrabo)',
    endpoint: 'https://www.radar-aviator.com/api/historico3.php',
    description: 'BetBrabo Gráfico 3 Premium - Histórico Completo (00:00:00 até agora)',
    badgeColor: 'from-amber-500 to-rose-600',
    isDefault: false,
  },
  {
    id: 'betfusion_grafico1',
    name: 'Betfusion → GRAFICO 1',
    game: 'Aviator',
    endpoint:
      'https://api.core.public.tipminer.com/v1/crash/rounds/997b99e3-4977-4fcf-ac6d-3834a384d141/history?limit=30000&timezone=America%2FBahia',
    description: 'Betfusion Aviator - Gráfico 1 (Sala TipMiner 997b99e3)',
    badgeColor: 'from-pink-500 to-purple-600',
    isDefault: false,
  },
  {
    id: 'betfusion_grafico2',
    name: 'Betfusion → GRAFICO 2',
    game: 'Aviator',
    endpoint:
      'https://api.core.public.tipminer.com/v1/crash/rounds/48323e32-3590-4e2f-b6fe-09d5fbc811c9/history?limit=30000&timezone=America%2FBahia',
    description: 'Betfusion Aviator - Gráfico 2 (Sala TipMiner 48323e32)',
    badgeColor: 'from-cyan-500 to-blue-600',
    isDefault: false,
  },
  {
    id: 'bingo_grafico1',
    name: 'bingo: GRAFICO 1',
    game: 'Aviator 1',
    endpoint: 'https://api.aviatorpro.io/api/v1/games/1/history?limit=1000',
    description: 'Bingo Aviator - Gráfico 1 (Aviator 1 - Óculos do Professor)',
    badgeColor: 'from-amber-500 to-orange-600',
    isDefault: false,
  },
  {
    id: 'bingo_grafico2',
    name: 'bingo: GRAFICO 2',
    game: 'Aviator 2',
    endpoint: 'https://api.aviatorpro.io/api/v1/games/2/history?limit=1000',
    description: 'Bingo Aviator - Gráfico 2 (Aviator 2 - Óculos do Professor)',
    badgeColor: 'from-emerald-500 to-teal-600',
    isDefault: false,
  },
];

const LOCAL_STORAGE_KEY = 'mostrinho_custom_houses_v17';

const OBSOLETE_HOUSE_IDS = new Set([
  'torre_bet_sala3',
  'torre_bet_sala4',
  'torre_bet_sala5',
  'torre_bet_sala6',
  'torre_bet_sala7',
]);

export function getSavedHouses(): BettingHouse[] {
  try {
    const raw =
      localStorage.getItem(LOCAL_STORAGE_KEY) ||
      localStorage.getItem('mostrinho_custom_houses_v13') ||
      localStorage.getItem('mostrinho_custom_houses_v12');
    if (!raw) return DEFAULT_HOUSES;
    const custom: BettingHouse[] = JSON.parse(raw);
    const merged = [...DEFAULT_HOUSES];
    custom.forEach((h) => {
      // Ignora salas obsoletas ou já incluídas
      if (OBSOLETE_HOUSE_IDS.has(h.id)) {
        return;
      }
      if (DEFAULT_HOUSES.some((d) => d.id === h.id)) {
        return;
      }
      if (!merged.some((m) => m.id === h.id)) {
        merged.push(h);
      }
    });
    return merged.filter((h) => !OBSOLETE_HOUSE_IDS.has(h.id));
  } catch {
    return DEFAULT_HOUSES;
  }
}

export function saveCustomHouse(house: BettingHouse): void {
  try {
    const current = getSavedHouses();
    const filtered = current.filter((h) => h.id !== house.id);
    const updated = [...filtered, house];
    const toSave = updated.filter((h) => !h.isDefault);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Falha ao salvar casa de aposta:', err);
  }
}

export function removeCustomHouse(id: string): void {
  try {
    const current = getSavedHouses();
    const updated = current.filter((h) => h.id !== id);
    const toSave = updated.filter((h) => !h.isDefault);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Falha ao remover casa de aposta:', err);
  }
}
