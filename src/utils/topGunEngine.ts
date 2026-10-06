import { CrashRound } from '../types';

export interface TopGunEntradaRegra {
  posicao: 1 | 2 | 3 | 4;
  label: 'P1' | 'P2' | 'P3' | 'P4';
  nomeProtecao: string;
  offsetMinutos: number;
}

export interface TopGunFaixaConfig {
  id: string;
  label: string;
  minMult: number;
  maxMult: number;
  entradas: TopGunEntradaRegra[];
  observacao?: string;
}

export interface TopGunSettings {
  objetivoMultiplicador: number; // Ex: 2.00x, 5.00x ou 10.00x (alvo da conferência estatística)
  toleranciaJanelaSegundos: number; // Tolerância da janela em segundos (padrão: 60s)
  minimoAmostras: number; // Mínimo de sinais para considerar relevante (padrão: 10)
  timeframe: 'hoje' | '24h' | '7d' | '30d' | 'tudo';
}

export interface TopGunEntrada {
  id: string;
  signalId: string;
  faixaId: string;
  faixaLabel: string;
  posicao: 1 | 2 | 3 | 4;
  label: 'P1' | 'P2' | 'P3' | 'P4';
  nomeProtecao: string;
  horarioProgramadoMs: number;
  horarioProgramadoStr: string;
  dataProgramadaStr: string;
  velaGeradora: number;
  rodadaGeradora: string;
  horarioGeradoraStr: string;
  status: 'AGUARDANDO' | 'ENTRADA_PROXIMA' | 'ENTRADA_ATIVA' | 'AGUARDANDO_CONFERENCIA' | 'CONFERIDO';
  resultado: 'ACERTO' | 'ERRO' | 'PENDENTE';
  velaEncontrada?: number;
  rodadaEncontrada?: string;
  horarioEncontradoStr?: string;
  tempoAteResultadoSegs?: number;
  tempoRestanteSegs: number;
}

export interface TopGunSinal {
  id: string;
  faixaId: string;
  faixaLabel: string;
  rodadaGeradora: string;
  velaGeradora: number;
  horarioGeradoraMs: number;
  horarioGeradoraStr: string;
  dataGeradoraStr: string;
  entradas: TopGunEntrada[];
  statusFinal:
    | 'ACERTO_P1'
    | 'ACERTO_P2'
    | 'ACERTO_P3'
    | 'ACERTO_P4'
    | 'ERRO'
    | 'EM_ANDAMENTO'
    | 'AGUARDANDO';
  protecaoVencedora?: 'P1' | 'P2' | 'P3' | 'P4';
  velaVencedora?: number;
  rodadaVencedora?: string;
  horarioVencedorStr?: string;
  tempoTotalSegs?: number;
}

export interface TopGunFaixaStats {
  faixaId: string;
  faixaLabel: string;
  minMult: number;
  maxMult: number;
  totalSinais: number;
  acertos: number;
  erros: number;
  assertividade: number;
  acertosPorEntrada: { [key: string]: number };
  taxaPorEntrada: { [key: string]: number };
  maiorSequenciaAcertos: number;
  maiorSequenciaErros: number;
  ultimoResultado: 'ACERTO' | 'ERRO' | 'NENHUM';
  melhorProtecao: string;
  amostraPequena: boolean;
}

export interface TopGunStats {
  totalSinais: number;
  totalAcertos: number;
  totalErros: number;
  assertividade: number;
  entradasAtivasCount: number;
  statsPorFaixa: Record<string, TopGunFaixaStats>;
  distribuicaoProtecoes: {
    p1: { count: number; percent: number };
    p2: { count: number; percent: number };
    p3: { count: number; percent: number };
    p4: { count: number; percent: number };
  };
  desempenhoDoDia: {
    maiorAssertividadeObservada: { faixaLabel: string; taxa: number; sinais: number } | null;
    maiorQuantidadeAcertos: { faixaLabel: string; acertos: number; sinais: number } | null;
    maiorAmostra: { faixaLabel: string; sinais: number } | null;
    tabelaRanking: Array<{
      faixaId: string;
      faixaLabel: string;
      sinais: number;
      acertos: number;
      erros: number;
      assertividade: number;
      melhorEntrada: string;
      piorEntrada: string;
      ultimoResultado: string;
      amostraPequena: boolean;
    }>;
  };
  filaEntradas: TopGunEntrada[];
  sinais: TopGunSinal[];
}

// ---------------------------------------------------------------------------
// REGRAS PADRÃO CONFORME O BRIEFING
// ---------------------------------------------------------------------------
export const REGRAS_PADRAO_TOP_GUN: TopGunFaixaConfig[] = [
  {
    id: 'faixa_10x',
    label: '10x',
    minMult: 10.0,
    maxMult: 10.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 33 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 43 },
    ],
  },
  {
    id: 'faixa_11x',
    label: '11x',
    minMult: 11.0,
    maxMult: 11.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 36 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 46 },
    ],
  },
  {
    id: 'faixa_12x',
    label: '12x',
    minMult: 12.0,
    maxMult: 12.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 39 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 49 },
    ],
  },
  {
    id: 'faixa_13x',
    label: '13x',
    minMult: 13.0,
    maxMult: 13.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 42 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 52 },
    ],
  },
  {
    id: 'faixa_14x',
    label: '14x',
    minMult: 14.0,
    maxMult: 14.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 45 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 55 },
    ],
  },
  {
    id: 'faixa_15x',
    label: '15x',
    minMult: 15.0,
    maxMult: 15.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 30 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 40 },
    ],
  },
  {
    id: 'faixa_16x',
    label: '16x',
    minMult: 16.0,
    maxMult: 16.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 33 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 43 },
    ],
  },
  {
    id: 'faixa_17x',
    label: '17x',
    minMult: 17.0,
    maxMult: 17.99,
    observacao: 'Pode ser reconfigurada pelo administrador sem modificar o código',
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 36 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 46 },
    ],
  },
  {
    id: 'faixa_18x',
    label: '18x',
    minMult: 18.0,
    maxMult: 18.99,
    observacao: 'Pode ser reconfigurada pelo administrador sem modificar o código',
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 39 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 49 },
    ],
  },
  {
    id: 'faixa_19x',
    label: '19x',
    minMult: 19.0,
    maxMult: 19.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 42 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 52 },
    ],
  },
  {
    id: 'faixa_20x',
    label: '20x',
    minMult: 20.0,
    maxMult: 20.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 6 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO (PROTEÇÃO)', offsetMinutos: 16 },
    ],
  },
  {
    id: 'faixa_21_300x',
    label: '21–300x',
    minMult: 21.0,
    maxMult: 300.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 36 },
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 46 },
    ],
  },
  {
    id: 'faixa_301_500x',
    label: '301–500x',
    minMult: 301.0,
    maxMult: 500.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 114 }, // +1:54:00
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 124 }, // +2:04:00
      { posicao: 3, label: 'P3', nomeProtecao: 'P3 — TERCEIRA PROTEÇÃO', offsetMinutos: 144 }, // +2:24:00
      { posicao: 4, label: 'P4', nomeProtecao: 'P4 — QUARTA PROTEÇÃO', offsetMinutos: 154 }, // +2:34:00
    ],
  },
  {
    id: 'faixa_501_899x',
    label: '501–899x',
    minMult: 501.0,
    maxMult: 899.99,
    entradas: [
      { posicao: 1, label: 'P1', nomeProtecao: 'P1 — PROTEÇÃO DE CAPITAL', offsetMinutos: 240 }, // +4:00:00
      { posicao: 2, label: 'P2', nomeProtecao: 'P2 — SEGUNDA PROTEÇÃO', offsetMinutos: 250 }, // +4:10:00
      { posicao: 3, label: 'P3', nomeProtecao: 'P3 — TERCEIRA PROTEÇÃO', offsetMinutos: 270 }, // +4:30:00
      { posicao: 4, label: 'P4', nomeProtecao: 'P4 — QUARTA PROTEÇÃO', offsetMinutos: 280 }, // +4:40:00
    ],
  },
];

export const CONFIGURACAO_PADRAO_SETTINGS: TopGunSettings = {
  objetivoMultiplicador: 2.0, // Alvo padrão (>= 2.00x)
  toleranciaJanelaSegundos: 60, // Janela padrão de 1 minuto
  minimoAmostras: 10,
  timeframe: 'hoje',
};

const STORAGE_KEY_RULES = 'topgun_rules_config_v1';
const STORAGE_KEY_SETTINGS = 'topgun_settings_config_v1';

export function getSavedTopGunRules(): TopGunFaixaConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return REGRAS_PADRAO_TOP_GUN;
}

export function saveTopGunRules(rules: TopGunFaixaConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch {
    // ignore
  }
}

export function getSavedTopGunSettings(): TopGunSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...CONFIGURACAO_PADRAO_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return CONFIGURACAO_PADRAO_SETTINGS;
}

export function saveTopGunSettings(settings: TopGunSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// UTILITÁRIOS DE HORA E DATA
// ---------------------------------------------------------------------------
function formatHHMMSS(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatSecondsToCountdown(totalSecs: number): string {
  const abs = Math.abs(totalSecs);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// MOTOR DE PROCESSAMENTO E CONFERÊNCIA AUTOMÁTICA
// ---------------------------------------------------------------------------
export function processarTopGun(
  rounds: CrashRound[],
  regras: TopGunFaixaConfig[],
  settings: TopGunSettings,
  agoraMs: number = Date.now()
): TopGunStats {
  if (!rounds || rounds.length === 0) {
    return {
      totalSinais: 0,
      totalAcertos: 0,
      totalErros: 0,
      assertividade: 0,
      entradasAtivasCount: 0,
      statsPorFaixa: {},
      distribuicaoProtecoes: {
        p1: { count: 0, percent: 0 },
        p2: { count: 0, percent: 0 },
        p3: { count: 0, percent: 0 },
        p4: { count: 0, percent: 0 },
      },
      desempenhoDoDia: {
        maiorAssertividadeObservada: null,
        maiorQuantidadeAcertos: null,
        maiorAmostra: null,
        tabelaRanking: [],
      },
      filaEntradas: [],
      sinais: [],
    };
  }

  // Filtragem temporal se configurada
  let roundsFiltrados = [...rounds];
  if (settings.timeframe !== 'tudo') {
    const agoraDate = new Date(agoraMs);
    let corteMs = 0;
    if (settings.timeframe === 'hoje') {
      const inicioDia = new Date(agoraDate.getFullYear(), agoraDate.getMonth(), agoraDate.getDate(), 0, 0, 0);
      corteMs = inicioDia.getTime();
    } else if (settings.timeframe === '24h') {
      corteMs = agoraMs - 24 * 60 * 60 * 1000;
    } else if (settings.timeframe === '7d') {
      corteMs = agoraMs - 7 * 24 * 60 * 60 * 1000;
    } else if (settings.timeframe === '30d') {
      corteMs = agoraMs - 30 * 24 * 60 * 60 * 1000;
    }

    if (corteMs > 0) {
      roundsFiltrados = roundsFiltrados.filter((r) => {
        const t = new Date(r.instant).getTime();
        return !isNaN(t) && t >= corteMs;
      });
    }
  }

  // Ordenar cronologicamente do mais antigo para o mais novo para processar histórico
  const roundsCronologicos = [...roundsFiltrados].sort(
    (a, b) => new Date(a.instant).getTime() - new Date(b.instant).getTime()
  );

  // Mapa rápido de tempo para rodadas para conferência eficiente
  const roundsComTimestamp = roundsCronologicos.map((r) => ({
    round: r,
    ts: new Date(r.instant).getTime(),
  }));

  const sinais: TopGunSinal[] = [];
  const todasEntradas: TopGunEntrada[] = [];

  // Identificar velas geradoras
  for (const item of roundsComTimestamp) {
    const { round, ts: horarioGeradoraMs } = item;
    const mult = round.result;

    // Verificar se o multiplicador pertence a alguma das faixas
    for (const faixa of regras) {
      if (mult >= faixa.minMult && mult <= faixa.maxMult) {
        const signalId = `sig_${round.externalId || round.uuid}_${faixa.id}`;
        const dataGeradora = new Date(horarioGeradoraMs);

        // Gerar entradas conforme as regras da faixa
        const entradasDoSinal: TopGunEntrada[] = faixa.entradas.map((regra) => {
          const horarioProgramadoMs = horarioGeradoraMs + regra.offsetMinutos * 60 * 1000;
          const dataProgramada = new Date(horarioProgramadoMs);
          const tempoRestanteSegs = Math.floor((horarioProgramadoMs - agoraMs) / 1000);

          const entradaId = `${signalId}_${regra.label}`;

          // Conferência com histórico
          let status: TopGunEntrada['status'] = 'AGUARDANDO';
          let resultado: TopGunEntrada['resultado'] = 'PENDENTE';
          let velaEncontrada: number | undefined;
          let rodadaEncontrada: string | undefined;
          let horarioEncontradoStr: string | undefined;
          let tempoAteResultadoSegs: number | undefined;

          const toleranciaMs = (settings.toleranciaJanelaSegundos || 60) * 1000;
          const janelaInicioMs = horarioProgramadoMs;
          const janelaFimMs = horarioProgramadoMs + toleranciaMs;

          // Se já passou da janela ou temos rodadas posteriores no histórico
          const maiorTimestamp = roundsComTimestamp[roundsComTimestamp.length - 1]?.ts || 0;
          const janelaPassou = maiorTimestamp > janelaFimMs || agoraMs > janelaFimMs;

          if (janelaPassou) {
            // Buscar rodadas dentro da janela programada
            const rodadasNaJanela = roundsComTimestamp.filter(
              (r) => r.ts >= janelaInicioMs - 15000 && r.ts <= janelaFimMs + 15000
            );

            // Verificar se alguma atingiu o objetivo
            const rodadaVencedora = rodadasNaJanela.find(
              (r) => r.round.result >= settings.objetivoMultiplicador
            );

            if (rodadaVencedora) {
              status = 'CONFERIDO';
              resultado = 'ACERTO';
              velaEncontrada = rodadaVencedora.round.result;
              rodadaEncontrada = rodadaVencedora.round.externalId || rodadaVencedora.round.uuid;
              horarioEncontradoStr = formatHHMMSS(new Date(rodadaVencedora.ts));
              tempoAteResultadoSegs = Math.max(
                0,
                Math.floor((rodadaVencedora.ts - horarioGeradoraMs) / 1000)
              );
            } else {
              // Se a janela passou completamente e temos dados
              status = 'CONFERIDO';
              resultado = 'ERRO';
              const primeiraRodadaNaJanela = rodadasNaJanela[0];
              if (primeiraRodadaNaJanela) {
                velaEncontrada = primeiraRodadaNaJanela.round.result;
                rodadaEncontrada = primeiraRodadaNaJanela.round.externalId;
                horarioEncontradoStr = formatHHMMSS(new Date(primeiraRodadaNaJanela.ts));
              }
            }
          } else if (agoraMs >= janelaInicioMs && agoraMs <= janelaFimMs) {
            status = 'ENTRADA_ATIVA';
            // Verificar se já pagou durante a janela ativa
            const rodadasAteAgora = roundsComTimestamp.filter(
              (r) => r.ts >= janelaInicioMs && r.ts <= agoraMs
            );
            const vencedorAoVivo = rodadasAteAgora.find(
              (r) => r.round.result >= settings.objetivoMultiplicador
            );
            if (vencedorAoVivo) {
              status = 'CONFERIDO';
              resultado = 'ACERTO';
              velaEncontrada = vencedorAoVivo.round.result;
              rodadaEncontrada = vencedorAoVivo.round.externalId;
              horarioEncontradoStr = formatHHMMSS(new Date(vencedorAoVivo.ts));
              tempoAteResultadoSegs = Math.max(
                0,
                Math.floor((vencedorAoVivo.ts - horarioGeradoraMs) / 1000)
              );
            }
          } else if (tempoRestanteSegs <= 180 && tempoRestanteSegs > 0) {
            status = 'ENTRADA_PROXIMA';
          } else if (tempoRestanteSegs <= 0 && !janelaPassou) {
            status = 'AGUARDANDO_CONFERENCIA';
          }

          const entrada: TopGunEntrada = {
            id: entradaId,
            signalId,
            faixaId: faixa.id,
            faixaLabel: faixa.label,
            posicao: regra.posicao,
            label: regra.label,
            nomeProtecao: regra.nomeProtecao,
            horarioProgramadoMs,
            horarioProgramadoStr: formatHHMMSS(dataProgramada),
            dataProgramadaStr: formatDDMMYYYY(dataProgramada),
            velaGeradora: mult,
            rodadaGeradora: round.externalId || round.uuid,
            horarioGeradoraStr: formatHHMMSS(dataGeradora),
            status,
            resultado,
            velaEncontrada,
            rodadaEncontrada,
            horarioEncontradoStr,
            tempoAteResultadoSegs,
            tempoRestanteSegs,
          };

          todasEntradas.push(entrada);
          return entrada;
        });

        // Avaliar o status final do sinal com foco na SEGUNDA PROTEÇÃO (P2) e nas proteções
        let statusFinal: TopGunSinal['statusFinal'] = 'AGUARDANDO';
        let protecaoVencedora: 'P1' | 'P2' | 'P3' | 'P4' | undefined;
        let velaVencedora: number | undefined;
        let rodadaVencedora: string | undefined;
        let horarioVencedorStr: string | undefined;
        let tempoTotalSegs: number | undefined;

        // Se alguma entrada obteve acerto
        const entradaVencedora = entradasDoSinal.find((e) => e.resultado === 'ACERTO');
        if (entradaVencedora) {
          protecaoVencedora = entradaVencedora.label;
          statusFinal = `ACERTO_${entradaVencedora.label}` as TopGunSinal['statusFinal'];
          velaVencedora = entradaVencedora.velaEncontrada;
          rodadaVencedora = entradaVencedora.rodadaEncontrada;
          horarioVencedorStr = entradaVencedora.horarioEncontradoStr;
          tempoTotalSegs = entradaVencedora.tempoAteResultadoSegs;
        } else {
          // Verificar se todas as entradas foram conferidas e falharam
          const todasConferidas = entradasDoSinal.every((e) => e.status === 'CONFERIDO');
          const algumaAtivaOuProxima = entradasDoSinal.some(
            (e) => e.status === 'ENTRADA_ATIVA' || e.status === 'ENTRADA_PROXIMA'
          );

          if (todasConferidas) {
            statusFinal = 'ERRO';
          } else if (algumaAtivaOuProxima) {
            statusFinal = 'EM_ANDAMENTO';
          } else {
            statusFinal = 'AGUARDANDO';
          }
        }

        sinais.push({
          id: signalId,
          faixaId: faixa.id,
          faixaLabel: faixa.label,
          rodadaGeradora: round.externalId || round.uuid,
          velaGeradora: mult,
          horarioGeradoraMs,
          horarioGeradoraStr: formatHHMMSS(dataGeradora),
          dataGeradoraStr: formatDDMMYYYY(dataGeradora),
          entradas: entradasDoSinal,
          statusFinal,
          protecaoVencedora,
          velaVencedora,
          rodadaVencedora,
          horarioVencedorStr,
          tempoTotalSegs,
        });

        // Uma vela geradora cai apenas na sua faixa respectiva
        break;
      }
    }
  }

  // Fila de Entradas ordenada cronologicamente (horário mais próximo primeiro)
  const filaEntradas = [...todasEntradas].sort((a, b) => {
    // Entradas ativas primeiro, depois próximas, depois aguardando
    const prioridadeStatus: Record<TopGunEntrada['status'], number> = {
      ENTRADA_ATIVA: 1,
      ENTRADA_PROXIMA: 2,
      AGUARDANDO: 3,
      AGUARDANDO_CONFERENCIA: 4,
      CONFERIDO: 5,
    };
    if (prioridadeStatus[a.status] !== prioridadeStatus[b.status]) {
      return prioridadeStatus[a.status] - prioridadeStatus[b.status];
    }
    return a.horarioProgramadoMs - b.horarioProgramadoMs;
  });

  // Estatísticas Globais
  // Contar sinais já concluídos (acerto ou erro)
  const sinaisConcluidos = sinais.filter(
    (s) => s.statusFinal.startsWith('ACERTO') || s.statusFinal === 'ERRO'
  );
  const totalSinais = sinaisConcluidos.length;
  const totalAcertos = sinaisConcluidos.filter((s) => s.statusFinal.startsWith('ACERTO')).length;
  const totalErros = sinaisConcluidos.filter((s) => s.statusFinal === 'ERRO').length;
  const assertividade = totalSinais > 0 ? (totalAcertos / totalSinais) * 100 : 0;

  const entradasAtivasCount = todasEntradas.filter(
    (e) => e.status === 'ENTRADA_ATIVA' || e.status === 'ENTRADA_PROXIMA'
  ).length;

  // Estatísticas por Proteção (Onde os resultados foram encontrados?)
  const acertosP1 = sinaisConcluidos.filter((s) => s.protecaoVencedora === 'P1').length;
  const acertosP2 = sinaisConcluidos.filter((s) => s.protecaoVencedora === 'P2').length;
  const acertosP3 = sinaisConcluidos.filter((s) => s.protecaoVencedora === 'P3').length;
  const acertosP4 = sinaisConcluidos.filter((s) => s.protecaoVencedora === 'P4').length;

  const totalAcertosProtecoes = acertosP1 + acertosP2 + acertosP3 + acertosP4;

  const distribuicaoProtecoes = {
    p1: {
      count: acertosP1,
      percent: totalAcertosProtecoes > 0 ? (acertosP1 / totalAcertosProtecoes) * 100 : 0,
    },
    p2: {
      count: acertosP2,
      percent: totalAcertosProtecoes > 0 ? (acertosP2 / totalAcertosProtecoes) * 100 : 0,
    },
    p3: {
      count: acertosP3,
      percent: totalAcertosProtecoes > 0 ? (acertosP3 / totalAcertosProtecoes) * 100 : 0,
    },
    p4: {
      count: acertosP4,
      percent: totalAcertosProtecoes > 0 ? (acertosP4 / totalAcertosProtecoes) * 100 : 0,
    },
  };

  // Estatísticas Separadas por Faixa
  const statsPorFaixa: Record<string, TopGunFaixaStats> = {};

  for (const faixa of regras) {
    const sinaisDaFaixa = sinaisConcluidos.filter((s) => s.faixaId === faixa.id);
    const nSinais = sinaisDaFaixa.length;
    const nAcertos = sinaisDaFaixa.filter((s) => s.statusFinal.startsWith('ACERTO')).length;
    const nErros = sinaisDaFaixa.filter((s) => s.statusFinal === 'ERRO').length;
    const assertFaixa = nSinais > 0 ? (nAcertos / nSinais) * 100 : 0;

    // Contagem por entrada
    const acertosPorEntrada: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const s of sinaisDaFaixa) {
      if (s.protecaoVencedora && acertosPorEntrada[s.protecaoVencedora] !== undefined) {
        acertosPorEntrada[s.protecaoVencedora]++;
      }
    }

    const taxaPorEntrada: Record<string, number> = {};
    for (const p of ['P1', 'P2', 'P3', 'P4']) {
      taxaPorEntrada[p] = nSinais > 0 ? (acertosPorEntrada[p] / nSinais) * 100 : 0;
    }

    // Streaks de acertos e erros
    let maxStreakAcertos = 0;
    let maxStreakErros = 0;
    let streakAcertosAtual = 0;
    let streakErrosAtual = 0;

    for (const s of sinaisDaFaixa) {
      if (s.statusFinal.startsWith('ACERTO')) {
        streakAcertosAtual++;
        streakErrosAtual = 0;
        if (streakAcertosAtual > maxStreakAcertos) maxStreakAcertos = streakAcertosAtual;
      } else {
        streakErrosAtual++;
        streakAcertosAtual = 0;
        if (streakErrosAtual > maxStreakErros) maxStreakErros = streakErrosAtual;
      }
    }

    const ultimoSinal = sinaisDaFaixa[sinaisDaFaixa.length - 1];
    const ultimoResultado: 'ACERTO' | 'ERRO' | 'NENHUM' = ultimoSinal
      ? ultimoSinal.statusFinal.startsWith('ACERTO')
        ? 'ACERTO'
        : 'ERRO'
      : 'NENHUM';

    // Descobrir melhor proteção da faixa
    let melhorProtecao = 'P1';
    let maxAcertosProtecao = -1;
    for (const [p, val] of Object.entries(acertosPorEntrada)) {
      if (val > maxAcertosProtecao) {
        maxAcertosProtecao = val;
        melhorProtecao = p;
      }
    }

    statsPorFaixa[faixa.id] = {
      faixaId: faixa.id,
      faixaLabel: faixa.label,
      minMult: faixa.minMult,
      maxMult: faixa.maxMult,
      totalSinais: nSinais,
      acertos: nAcertos,
      erros: nErros,
      assertividade: assertFaixa,
      acertosPorEntrada,
      taxaPorEntrada,
      maiorSequenciaAcertos: maxStreakAcertos,
      maiorSequenciaErros: maxStreakErros,
      ultimoResultado,
      melhorProtecao: nAcertos > 0 ? melhorProtecao : 'N/A',
      amostraPequena: nSinais < (settings.minimoAmostras || 10),
    };
  }

  // Desempenho do Dia (Ranking estatístico respeitando as regras sem suposições falsas)
  const listaFaixasCompletas = Object.values(statsPorFaixa);

  // Filtrar apenas com amostra representativa para destaques, mas se nenhuma tiver, usa as disponíveis
  const faixasComAmostra = listaFaixasCompletas.filter((f) => !f.amostraPequena);
  const faixasParaDestaque = faixasComAmostra.length > 0 ? faixasComAmostra : listaFaixasCompletas;

  let maiorAssertividadeObservada: TopGunStats['desempenhoDoDia']['maiorAssertividadeObservada'] = null;
  let maiorQuantidadeAcertos: TopGunStats['desempenhoDoDia']['maiorQuantidadeAcertos'] = null;
  let maiorAmostra: TopGunStats['desempenhoDoDia']['maiorAmostra'] = null;

  if (faixasParaDestaque.length > 0) {
    const ordenadoAssertividade = [...faixasParaDestaque].sort((a, b) => b.assertividade - a.assertividade);
    if (ordenadoAssertividade[0] && ordenadoAssertividade[0].totalSinais > 0) {
      maiorAssertividadeObservada = {
        faixaLabel: ordenadoAssertividade[0].faixaLabel,
        taxa: ordenadoAssertividade[0].assertividade,
        sinais: ordenadoAssertividade[0].totalSinais,
      };
    }

    const ordenadoAcertos = [...faixasParaDestaque].sort((a, b) => b.acertos - a.acertos);
    if (ordenadoAcertos[0] && ordenadoAcertos[0].acertos > 0) {
      maiorQuantidadeAcertos = {
        faixaLabel: ordenadoAcertos[0].faixaLabel,
        acertos: ordenadoAcertos[0].acertos,
        sinais: ordenadoAcertos[0].totalSinais,
      };
    }

    const ordenadoSinais = [...listaFaixasCompletas].sort((a, b) => b.totalSinais - a.totalSinais);
    if (ordenadoSinais[0] && ordenadoSinais[0].totalSinais > 0) {
      maiorAmostra = {
        faixaLabel: ordenadoSinais[0].faixaLabel,
        sinais: ordenadoSinais[0].totalSinais,
      };
    }
  }

  const tabelaRanking = listaFaixasCompletas.map((f) => {
    // Determinar melhor e pior entrada estatística
    const entries = Object.entries(f.acertosPorEntrada);
    entries.sort((a, b) => b[1] - a[1]);
    const melhorEntrada = f.acertos > 0 ? `${entries[0][0]} (${f.taxaPorEntrada[entries[0][0]].toFixed(1)}%)` : '-';
    const piorEntrada = f.acertos > 0 ? `${entries[entries.length - 1][0]} (${f.taxaPorEntrada[entries[entries.length - 1][0]].toFixed(1)}%)` : '-';

    return {
      faixaId: f.faixaId,
      faixaLabel: f.faixaLabel,
      sinais: f.totalSinais,
      acertos: f.acertos,
      erros: f.erros,
      assertividade: f.assertividade,
      melhorEntrada,
      piorEntrada,
      ultimoResultado: f.ultimoResultado === 'ACERTO' ? 'Acerto' : f.ultimoResultado === 'ERRO' ? 'Erro' : '-',
      amostraPequena: f.amostraPequena,
    };
  });

  return {
    totalSinais,
    totalAcertos,
    totalErros,
    assertividade,
    entradasAtivasCount,
    statsPorFaixa,
    distribuicaoProtecoes,
    desempenhoDoDia: {
      maiorAssertividadeObservada,
      maiorQuantidadeAcertos,
      maiorAmostra,
      tabelaRanking,
    },
    filaEntradas,
    sinais,
  };
}

// ---------------------------------------------------------------------------
// IMPORTADOR DE DADOS MANUAL (Rodada, Multiplicador, Horário)
// ---------------------------------------------------------------------------
export function parseManualRoundsImport(text: string): CrashRound[] {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsedRounds: CrashRound[] = [];

  // Suporta dois formatos comuns:
  // Formato 1: Cada linha contém "Rodada Multiplicador Horário" (espaço ou tab)
  // Formato 2: Três linhas consecutivas: Linha 1 = Rodada, Linha 2 = Multiplicador, Linha 3 = Horário

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Verificar se a linha contém as 3 partes juntas
    const tokens = line.split(/[\t\s,;|]+/).filter(Boolean);
    if (tokens.length >= 3) {
      const externalId = tokens[0].replace(/[^0-9]/g, '');
      const rawMult = tokens[1].replace(',', '.').replace(/[^0-9.]/g, '');
      const mult = parseFloat(rawMult);
      const timeStr = tokens[2];

      if (!isNaN(mult) && externalId) {
        // Criar data com o horário fornecido
        const hoje = new Date();
        const [hh, mm, ss] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
        const instantDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), hh, mm, ss);

        parsedRounds.push({
          uuid: `manual_${externalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          externalId,
          result: mult,
          type: mult >= 10 ? 'HIGH' : mult >= 2 ? 'MEDIUM' : 'LOW',
          instant: instantDate.toISOString(),
        });
      }
      i++;
    } else if (i + 2 < lines.length) {
      // Tentar formato 3 linhas consecutivas
      const externalId = lines[i].replace(/[^0-9]/g, '');
      const rawMult = lines[i + 1].replace(',', '.').replace(/[^0-9.]/g, '');
      const mult = parseFloat(rawMult);
      const timeStr = lines[i + 2];

      if (!isNaN(mult) && externalId && timeStr.includes(':')) {
        const hoje = new Date();
        const [hh, mm, ss] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
        const instantDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), hh, mm, ss);

        parsedRounds.push({
          uuid: `manual_${externalId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          externalId,
          result: mult,
          type: mult >= 10 ? 'HIGH' : mult >= 2 ? 'MEDIUM' : 'LOW',
          instant: instantDate.toISOString(),
        });
        i += 3;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return parsedRounds;
}
