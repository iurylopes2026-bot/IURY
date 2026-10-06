import React, { useState, useMemo, useEffect } from 'react';
import { CrashRound } from '../types';
import {
  processarProjecaoLonga,
  ESTRATEGIAS_LONGA,
  SinalLongoItem,
  formatBrTime,
} from '../utils/analysisEngine';
import {
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  Radio,
  CheckCircle2,
  XCircle,
  Hourglass,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface ProjecaoLongaViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const ProjecaoLongaView: React.FC<ProjecaoLongaViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [estrategiaAtiva, setEstrategiaAtiva] = useState<string>('A5'); // Default: A5 (>= 50x)
  const [alvoMult, setAlvoMult] = useState<number>(10.0);
  const [toleranciaMin, setToleranciaMin] = useState<number>(1);
  const [gradeSelecionada, setGradeSelecionada] = useState<number[]>([
    45, 60, 75, 90, 105, 120,
  ]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'SINAL_ATIVO' | 'GREEN' | 'LOSS'>('todos');

  // Relógio de contagem regressiva para os sinais ativos
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const estrategiaObj =
    ESTRATEGIAS_LONGA.find((e) => e.id === estrategiaAtiva) || ESTRATEGIAS_LONGA[4];

  const { sinais, rankingTempos, proximoSinalAtivo, taxaAcertoGeral } = useMemo(() => {
    return processarProjecaoLonga(
      rounds,
      estrategiaObj.minTrigger,
      alvoMult,
      toleranciaMin,
      gradeSelecionada
    );
  }, [rounds, estrategiaObj.minTrigger, alvoMult, toleranciaMin, gradeSelecionada]);

  const sinaisFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return sinais;
    return sinais.filter((s) => s.status === filtroStatus);
  }, [sinais, filtroStatus]);

  const totalAtivos = sinais.filter((s) => s.status === 'SINAL_ATIVO').length;
  const totalGreens = sinais.filter((s) => s.status === 'GREEN').length;
  const totalLosses = sinais.filter((s) => s.status === 'LOSS').length;

  return (
    <div className="space-y-6">
      {/* Top Banner VIP */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                MÓDULO VIP
              </span>
              <span className="text-xs text-slate-400">Ciclos de Longo Alcance (+45m a +120m)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Projeção Longa VIP: Gatilhos de {estrategiaObj.nome}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Rastreia velas gatilhos de referência e calcula projeções temporais futuras com tolerância.
              Monitore os sinais ativos com contador em tempo real até o minuto do tiro.
            </p>
          </div>

          {/* Cards de Resumo */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-purple-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">ASSERTIVIDADE</span>
              <span className="text-xl font-black text-purple-400 font-mono-num">
                {taxaAcertoGeral}%
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">SINAIS ATIVOS</span>
              <span className="text-xl font-black text-amber-400 font-mono-num flex items-center justify-center gap-1">
                <Radio className="w-4 h-4 animate-pulse text-amber-400" />
                {totalAtivos}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">GREENS</span>
              <span className="text-xl font-black text-emerald-400 font-mono-num">
                {totalGreens}
              </span>
            </div>
          </div>
        </div>

        {/* Card Destaque de Próximo Sinal Ativo */}
        {proximoSinalAtivo && (
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-300 block">
                  PRÓXIMO SINAL ATIVO PROGRAMADO
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">
                    Gatilho: {proximoSinalAtivo.gatilhoMult.toFixed(2)}x ({proximoSinalAtivo.gatilhoTimeStr})
                  </span>
                  <span className="text-purple-300 font-mono-num">
                    ➔ Projeção +{proximoSinalAtivo.minutoOffset}m às <strong>{proximoSinalAtivo.tempoProjetadoStr}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] text-slate-400 block">Tempo Restante:</span>
              <span className="text-base font-black text-amber-300 font-mono-num">
                {proximoSinalAtivo.tempoRestanteSeg !== undefined && proximoSinalAtivo.tempoRestanteSeg > 0
                  ? `${Math.floor(proximoSinalAtivo.tempoRestanteSeg / 60)}m ${proximoSinalAtivo.tempoRestanteSeg % 60}s`
                  : 'HORÁRIO DO TIRO ATIVO!'}
              </span>
            </div>
          </div>
        )}

        {/* Seletor de Estratégias A1 a A10 */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-300">
              Escolha a Estratégia de Gatilho de Referência:
            </span>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-pink-400" />
                <label htmlFor="alvo-mult-select" className="text-slate-400 text-[11px]">Alvo:</label>
                <select
                  id="alvo-mult-select"
                  value={alvoMult}
                  onChange={(e) => setAlvoMult(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-pink-300 font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value={5}>≥ 5.00x</option>
                  <option value={10}>≥ 10.00x (Padrão)</option>
                  <option value={20}>≥ 20.00x</option>
                  <option value={30}>≥ 30.00x</option>
                  <option value={50}>≥ 50.00x</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <label htmlFor="tolerancia-select" className="text-slate-400 text-[11px]">Tolerância:</label>
                <select
                  id="tolerancia-select"
                  value={toleranciaMin}
                  onChange={(e) => setToleranciaMin(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value={0}>Exato (0m)</option>
                  <option value={1}>± 1 minuto</option>
                  <option value={2}>± 2 minutos</option>
                  <option value={3}>± 3 minutos</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 w-full">
            {ESTRATEGIAS_LONGA.map((est) => {
              const isSelected = est.id === estrategiaAtiva;
              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setEstrategiaAtiva(est.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span className="truncate">{est.nome}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grade de Ranking dos Intervalos Longos (45m a 120m) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Ranking de Assertividade dos Intervalos Longos (+45m a +120m)
          </h3>
          <span className="text-xs text-slate-400">
            Baseado nos gatilhos de {estrategiaObj.nome}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {rankingTempos.slice(0, 6).map((rank) => (
            <div
              key={rank.minutos}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white">+{rank.minutos} min</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    rank.assertividade >= 70
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : rank.assertividade >= 50
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {rank.assertividade}% Acerto
                </span>
              </div>

              <div className="flex items-baseline justify-between text-[11px] font-mono-num text-slate-400">
                <span>
                  <strong className="text-emerald-400">{rank.greens}G</strong> /{' '}
                  <strong className="text-rose-400">{rank.losses}L</strong>
                </span>
                <span className="text-[10px] text-purple-300">
                  ROI: {rank.roiEstimado > 0 ? `+${rank.roiEstimado}%` : `${rank.roiEstimado}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Sinais Longos Gerados & Auditados */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            Sinais de Longo Alcance Auditados ({sinaisFiltrados.length})
          </h3>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {(['todos', 'SINAL_ATIVO', 'GREEN', 'LOSS'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                  filtroStatus === st
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st === 'todos'
                  ? 'Todos'
                  : st === 'SINAL_ATIVO'
                  ? `Ativos (${totalAtivos})`
                  : st === 'GREEN'
                  ? `Green (${totalGreens})`
                  : `Loss (${totalLosses})`}
              </button>
            ))}
          </div>
        </div>

        {sinaisFiltrados.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
            Nenhum sinal encontrado para o filtro selecionado com gatilhos de {estrategiaObj.nome}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sinaisFiltrados.map((sinal) => {
              const isGreen = sinal.status === 'GREEN';
              const isLoss = sinal.status === 'LOSS';
              const isAtivo = sinal.status === 'SINAL_ATIVO';

              return (
                <div
                  key={sinal.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-3 transition-all ${
                    isGreen
                      ? 'bg-slate-950/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                      : isLoss
                      ? 'bg-slate-950/90 border-rose-500/30'
                      : 'bg-gradient-to-b from-amber-950/20 to-slate-950 border-amber-500/40 shadow-sm shadow-amber-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">
                        +{sinal.minutoOffset} min
                      </span>
                      <span className="font-mono-num text-slate-400 text-[11px]">
                        Previsto: <strong className="text-slate-200">{sinal.tempoProjetadoStr}</strong>
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                        isGreen
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {isGreen ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          GREEN (Tiro {sinal.tiroGreen})
                        </>
                      ) : isLoss ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          LOSS
                        </>
                      ) : (
                        <>
                          <Radio className="w-3 h-3 text-amber-400" />
                          SINAL ATIVO
                        </>
                      )}
                    </span>
                  </div>

                  {/* Detalhes do Gatilho */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vela Gatilho:</span>
                      <span className="text-pink-400 font-extrabold font-mono-num">
                        {sinal.gatilhoMult.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Horário Gatilho:</span>
                      <span className="text-slate-200 font-mono-num">{sinal.gatilhoTimeStr}</span>
                    </div>
                  </div>

                  {/* Tiros ou Contagem Regressiva */}
                  <div>
                    {isAtivo ? (
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-mono-num bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20">
                        <span>Aguardando execução...</span>
                        <strong className="font-extrabold">
                          {sinal.tempoRestanteSeg !== undefined && sinal.tempoRestanteSeg > 0
                            ? `Faltam ${Math.floor(sinal.tempoRestanteSeg / 60)}m ${sinal.tempoRestanteSeg % 60}s`
                            : 'Momento do Tiro!'}
                        </strong>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span>Velas Auditadas na Janela ({sinal.tiros.length}):</span>
                          {isGreen && sinal.velaGreen && (
                            <span className="text-emerald-400 font-bold font-mono-num">
                              Paga: {sinal.velaGreen.result.toFixed(2)}x
                            </span>
                          )}
                        </div>
                        {sinal.tiros.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sinal.tiros.map((tiro, idx) => {
                              const hit = tiro.result >= alvoMult;
                              return (
                                <span
                                  key={tiro.uuid || idx}
                                  onClick={() => onSelectRound?.(tiro)}
                                  className={`px-2 py-1 rounded-lg font-mono-num text-[11px] cursor-pointer font-bold transition-transform hover:scale-105 ${
                                    hit
                                      ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 ring-1 ring-white/50'
                                      : 'bg-slate-800/90 text-slate-300 border border-slate-700/50 hover:bg-slate-700'
                                  }`}
                                  title={`Tiro ${idx + 1}: ${tiro.result.toFixed(2)}x (${formatBrTime(tiro.instant)}) - Clique para detalhar`}
                                >
                                  {tiro.result.toFixed(2)}x
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic block py-0.5">
                            Sem velas registradas na janela deste sinal.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
