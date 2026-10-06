import React, { useState, useMemo, useEffect } from 'react';
import { CrashRound } from '../types';
import { getRoundTime, formatBrTime } from '../utils/analysisEngine';
import {
  Clock,
  Trophy,
  Medal,
  Radio,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
  Zap,
  Target,
} from 'lucide-react';

interface PainelMaximasDoDiaProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

interface ItemConfig {
  target: number;
  label: string;
  badgeText: string;
  badgeClass: string;
  textClass: string;
}

const DEFAULT_TARGETS: ItemConfig[] = [
  {
    target: 1.5,
    label: '1.5x',
    badgeText: 'RUIM',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    textClass: 'text-slate-300',
  },
  {
    target: 2.0,
    label: '2x',
    badgeText: 'REGULAR',
    badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    textClass: 'text-cyan-400',
  },
  {
    target: 5.0,
    label: '5x',
    badgeText: 'BOA',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
    textClass: 'text-purple-400',
  },
  {
    target: 10.0,
    label: '10x',
    badgeText: 'MÉDIA',
    badgeClass: 'bg-pink-950/70 text-pink-300 border-pink-800/60',
    textClass: 'text-pink-400',
  },
  {
    target: 30.0,
    label: '30x',
    badgeText: 'ÓTIMA',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    textClass: 'text-amber-400',
  },
  {
    target: 50.0,
    label: '50x',
    badgeText: 'EXCELENTE',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    textClass: 'text-emerald-400',
  },
  {
    target: 70.0,
    label: '70x',
    badgeText: 'ÉPICA',
    badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
    textClass: 'text-indigo-400',
  },
  {
    target: 100.0,
    label: '100x',
    badgeText: 'RECOVERY',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    textClass: 'text-rose-400',
  },
];

const EXTRA_TARGETS: ItemConfig[] = [
  {
    target: 20.0,
    label: '20x',
    badgeText: 'ALTA',
    badgeClass: 'bg-pink-950/70 text-pink-300 border-pink-800/60',
    textClass: 'text-pink-400',
  },
  {
    target: 40.0,
    label: '40x',
    badgeText: 'TOP',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    textClass: 'text-amber-400',
  },
  {
    target: 60.0,
    label: '60x',
    badgeText: 'FORTE',
    badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
    textClass: 'text-indigo-400',
  },
  {
    target: 80.0,
    label: '80x',
    badgeText: 'SUPER',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    textClass: 'text-rose-400',
  },
  {
    target: 90.0,
    label: '90x',
    badgeText: 'MEGA',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    textClass: 'text-rose-400',
  },
  {
    target: 200.0,
    label: '200x',
    badgeText: 'LENDA',
    badgeClass: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60',
    textClass: 'text-yellow-400',
  },
];

function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface SecaRegistro {
  rodadas: number;
  duracaoMs: number;
  startStr: string;
  endStr: string;
  startTimeMs: number;
  endTimeMs: number;
  startRound?: CrashRound;
  endRound?: CrashRound;
}

interface TargetCalculado {
  config: ItemConfig;
  rodadasAtuais: number;
  tempoAtualMs: number;
  tempoAtualStr: string;
  ultimaVelaStr: string;
  ultimaVelaMult?: number;
  maior1: SecaRegistro | null;
  penultima: SecaRegistro | null;
}

export const PainelMaximasDoDia: React.FC<PainelMaximasDoDiaProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [showExtras, setShowExtras] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [selectedIntervalo, setSelectedIntervalo] = useState<{
    target: number;
    titulo: string;
    startMs: number;
    endMs: number;
    rodadas: number;
  } | null>(null);

  // Relógio ao vivo segundo a segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const targetsList = useMemo(() => {
    return showExtras ? [...DEFAULT_TARGETS, ...EXTRA_TARGETS] : DEFAULT_TARGETS;
  }, [showExtras]);

  // Ordenar cronologicamente do primeiro (00:00:01) até o mais recente
  const sorted = useMemo(() => {
    if (!rounds || rounds.length === 0) return [];
    return [...rounds].sort((a, b) => getRoundTime(a) - getRoundTime(b));
  }, [rounds]);

  // Calcular métricas para cada alvo
  const calculados: TargetCalculado[] = useMemo(() => {
    if (sorted.length === 0) return [];

    return targetsList.map((cfg) => {
      const hits: number[] = [];
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].result >= cfg.target) hits.push(i);
      }

      const secas: SecaRegistro[] = [];
      let lastIdx = -1;

      for (let h = 0; h < hits.length; h++) {
        const idx = hits[h];
        const rodadas = lastIdx >= 0 ? idx - lastIdx - 1 : idx;
        const startRound = lastIdx >= 0 ? sorted[lastIdx] : sorted[0];
        const endRound = sorted[idx];
        const startMs = getRoundTime(startRound);
        const endMs = getRoundTime(endRound);

        secas.push({
          rodadas,
          duracaoMs: Math.max(0, endMs - startMs),
          startStr: formatBrTime(startRound.instant),
          endStr: formatBrTime(endRound.instant),
          startTimeMs: startMs,
          endTimeMs: endMs,
          startRound,
          endRound,
        });

        lastIdx = idx;
      }

      // Tempo Atual (Ao Vivo)
      const lastHitIdx = hits.length > 0 ? hits[hits.length - 1] : -1;
      const rodadasAtuais = lastHitIdx >= 0 ? sorted.length - 1 - lastHitIdx : sorted.length;
      const lastHitRound = lastHitIdx >= 0 ? sorted[lastHitIdx] : sorted[0];
      const lastHitMs = lastHitRound ? getRoundTime(lastHitRound) : nowMs;
      const tempoAtualMs = Math.max(0, nowMs - lastHitMs);
      const tempoAtualStr = formatDurationMs(tempoAtualMs);
      const ultimaVelaStr = lastHitRound ? formatBrTime(lastHitRound.instant) : '--:--:--';
      const ultimaVelaMult = lastHitRound ? lastHitRound.result : undefined;

      // Ordenar secas por rodadas desc
      const secasOrdenadas = [...secas].sort(
        (a, b) => b.rodadas - a.rodadas || b.duracaoMs - a.duracaoMs
      );
      const maior1 = secasOrdenadas[0] || null;
      const penultima = secasOrdenadas[1] || null;

      return {
        config: cfg,
        rodadasAtuais,
        tempoAtualMs,
        tempoAtualStr,
        ultimaVelaStr,
        ultimaVelaMult,
        maior1,
        penultima,
      };
    });
  }, [sorted, targetsList, nowMs]);

  // Velas dentro do intervalo selecionado no modal
  const velasIntervalo = useMemo(() => {
    if (!selectedIntervalo || sorted.length === 0) return [];
    return sorted.filter((r) => {
      const t = getRoundTime(r);
      return t >= selectedIntervalo.startMs && t <= selectedIntervalo.endMs;
    });
  }, [sorted, selectedIntervalo]);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            PAINEL DE MÁXIMAS DO DIA
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30 flex items-center gap-1 font-mono-num">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              AO VIVO
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          <span>Tempo: <strong className="text-emerald-400">Tempo Atual</strong> / <strong className="text-amber-400">🏆 Maior Máxima</strong></span>
          <span>•</span>
          <span className="text-slate-500 hidden md:inline">Clique em 🔎 Ver Intervalo</span>
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-[10px] flex items-center gap-1 ml-1"
          >
            <span>{showExtras ? 'Menos Faixas' : '+ Mais Faixas'}</span>
            {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Grid de Cards dos Multiplicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {calculados.map((item) => {
          const { config, rodadasAtuais, tempoAtualStr, maior1, penultima } = item;
          const maxRodadas = maior1 ? maior1.rodadas : 0;
          const isPertoRecorde = maxRodadas > 0 && rodadasAtuais >= maxRodadas * 0.8;

          return (
            <div
              key={config.target}
              className={`rounded-2xl border bg-[#0b0f19]/95 p-3.5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-xl ${
                isPertoRecorde
                  ? 'border-amber-500/40 shadow-amber-950/20 ring-1 ring-amber-500/20'
                  : 'border-slate-800/80 shadow-slate-950/50'
              }`}
            >
              {/* Topo do Card: Alvo, Badge, Pill [atuais / máxima] e Ações */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black font-mono-num text-white">
                    {config.label}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${config.badgeClass}`}
                  >
                    {config.badgeText}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Pill [Atuais / Máxima] - Conforme Imagem */}
                  <div
                    title={`Rodadas sem sair ${config.label}: ${rodadasAtuais} rodadas atuais de ${maxRodadas} máxima do dia`}
                    className={`px-2 py-0.5 rounded-lg font-mono-num font-black text-xs border flex items-center gap-1 ${
                      isPertoRecorde
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 animate-pulse'
                        : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    <span>{rodadasAtuais}</span>
                    <span className="opacity-60 text-[10px]">/</span>
                    <span>{maxRodadas}</span>
                  </div>

                  {maior1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIntervalo({
                          target: config.target,
                          titulo: `🏆 1ª Maior do Dia (${config.label})`,
                          startMs: maior1.startTimeMs,
                          endMs: maior1.endTimeMs,
                          rodadas: maior1.rodadas,
                        })
                      }
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Ver todas as velas da 1ª Maior Máxima"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Colunas Internas: Tempo Atual | Penúltima Máxima | 1ª Maior do Dia */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
                {/* 1. TEMPO ATUAL (AO VIVO) */}
                <div className="flex flex-col justify-between p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    TEMPO ATUAL <span className="text-emerald-400">(AO VIVO)</span>
                  </span>
                  <div className="my-1">
                    <span className="text-sm sm:text-base font-black font-mono-num text-emerald-400 block leading-tight">
                      {tempoAtualStr}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono-num block">
                      {rodadasAtuais} rodadas
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono-num truncate" title={`Última saída às ${item.ultimaVelaStr}`}>
                    {item.ultimaVelaStr}
                  </span>
                </div>

                {/* 2. 🥈 PENÚLTIMA MÁXIMA */}
                <div
                  onClick={() =>
                    penultima &&
                    setSelectedIntervalo({
                      target: config.target,
                      titulo: `🥈 Penúltima Máxima (${config.label})`,
                      startMs: penultima.startTimeMs,
                      endMs: penultima.endTimeMs,
                      rodadas: penultima.rodadas,
                    })
                  }
                  className={`flex flex-col justify-between p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/60 transition-colors ${
                    penultima ? 'cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-950/20' : ''
                  }`}
                  title={penultima ? 'Clique para ver as velas deste intervalo' : 'Sem penúltima registrada'}
                >
                  <span className="text-[9px] font-extrabold uppercase text-indigo-300 block tracking-wider flex items-center justify-center gap-0.5">
                    <Medal className="w-2.5 h-2.5 text-indigo-400" />
                    PENÚLTIMA
                  </span>
                  <div className="my-1">
                    <span className="text-xs sm:text-sm font-black font-mono-num text-indigo-300 block leading-tight">
                      {penultima ? formatDurationMs(penultima.duracaoMs) : '--:--:--'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono-num block">
                      {penultima ? `${penultima.rodadas} rodadas` : '--'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono-num truncate" title={penultima ? `${penultima.startStr} - ${penultima.endStr}` : ''}>
                    {penultima ? `${penultima.startStr} - ${penultima.endStr}` : '--'}
                  </span>
                </div>

                {/* 3. 🏆 1ª MAIOR DO DIA (RECORDE) */}
                <div
                  onClick={() =>
                    maior1 &&
                    setSelectedIntervalo({
                      target: config.target,
                      titulo: `🏆 1ª Maior do Dia (Recorde ${config.label})`,
                      startMs: maior1.startTimeMs,
                      endMs: maior1.endTimeMs,
                      rodadas: maior1.rodadas,
                    })
                  }
                  className={`flex flex-col justify-between p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/60 transition-colors ${
                    maior1 ? 'cursor-pointer hover:border-amber-500/40 hover:bg-amber-950/20' : ''
                  }`}
                  title={maior1 ? 'Clique para ver as velas deste intervalo' : 'Sem máxima registrada'}
                >
                  <span className="text-[9px] font-extrabold uppercase text-amber-300 block tracking-wider flex items-center justify-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5 text-amber-400" />
                    1ª MAIOR
                  </span>
                  <div className="my-1">
                    <span className="text-xs sm:text-sm font-black font-mono-num text-amber-300 block leading-tight">
                      {maior1 ? formatDurationMs(maior1.duracaoMs) : '--:--:--'}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-mono-num font-bold block">
                      {maior1 ? `${maior1.rodadas} rodadas` : '--'}
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-500/80 font-mono-num truncate" title={maior1 ? `${maior1.startStr} - ${maior1.endStr}` : ''}>
                    {maior1 ? `${maior1.startStr} - ${maior1.endStr}` : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Inspecionar Velas do Intervalo de Seca */}
      {selectedIntervalo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    {selectedIntervalo.titulo}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono-num">
                    Intervalo de Seca: {selectedIntervalo.rodadas} rodadas sem sair ≥ {selectedIntervalo.target}x
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntervalo(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Velas registradas dentro deste intervalo ({velasIntervalo.length} rodadas):
              </span>
              <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 scrollbar-thin">
                {velasIntervalo.map((v, vIdx) => {
                  const isAlvo = v.result >= selectedIntervalo.target;
                  const isRosa = v.result >= 10.0;
                  const isRoxa = v.result >= 2.0 && v.result < 10.0;

                  return (
                    <div
                      key={v.uuid || vIdx}
                      onClick={() => {
                        onSelectRound?.(v);
                        setSelectedIntervalo(null);
                      }}
                      className={`p-1.5 rounded-xl text-center font-mono-num cursor-pointer transition-all hover:scale-105 ${
                        isAlvo
                          ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-slate-950 font-black ring-2 ring-white shadow-lg'
                          : isRosa
                          ? 'bg-pink-600 text-white font-black'
                          : isRoxa
                          ? 'bg-purple-900/90 text-purple-200 font-bold border border-purple-700/50'
                          : 'bg-slate-900 text-cyan-300 border border-slate-800'
                      }`}
                      title={`${v.result.toFixed(2)}x às ${formatBrTime(v.instant)}`}
                    >
                      <div className="text-xs leading-tight">{v.result.toFixed(2)}x</div>
                      <div className="text-[9px] opacity-75 mt-0.5 leading-none">
                        {v.instant ? formatBrTime(v.instant).slice(0, 5) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedIntervalo(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
