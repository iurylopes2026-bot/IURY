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
  Flame,
  Shield,
  Zap,
  Play,
} from 'lucide-react';

interface ProjecaoLongaViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
  houseName?: string;
}

function formatCountdown(targetMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ProjecaoLongaView: React.FC<ProjecaoLongaViewProps> = ({
  rounds,
  onSelectRound,
  houseName = 'TORRE BET',
}) => {
  const [estrategiaAtiva, setEstrategiaAtiva] = useState<string>('A5'); // Default: A5 (>= 50x)
  const [alvoMult, setAlvoMult] = useState<number>(10.0);
  const [toleranciaMin, setToleranciaMin] = useState<number>(1);
  const [gradeSelecionada, setGradeSelecionada] = useState<number[]>([
    45, 60, 75, 90, 105, 120,
  ]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'SINAL_ATIVO' | 'GREEN' | 'LOSS'>('todos');

  // Relógio de contagem regressiva em tempo real
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
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
              Rastreia velas gatilhos de referência pós-seca e calcula projeções temporais futuras com contagem regressiva ao vivo e tolerância de ±{toleranciaMin}m.
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
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">GREENS</span>
              <span className="text-xl font-black text-emerald-400 font-mono-num">
                {totalGreens}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">SINAIS ATIVOS</span>
              <span className="text-xl font-black text-amber-400 font-mono-num">
                {totalAtivos}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">LOSS</span>
              <span className="text-xl font-black text-rose-400 font-mono-num">
                {totalLosses}
              </span>
            </div>
          </div>
        </div>

        {/* Destaque Próximo Sinal Ativo */}
        {proximoSinalAtivo && (
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-300 block">
                  PRÓXIMO SINAL ATIVO PROGRAMADO
                </span>
                <div className="flex items-center gap-2 flex-wrap">
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
                {formatCountdown(proximoSinalAtivo.tempoProjetadoMs, nowMs)}
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
                <span className="text-[10px] text-slate-500">{rank.totalGatilhos} disparos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Sinais de Longo Alcance */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            Sinais Programados & Auditados (+45m a +120m)
          </h3>

          <div className="flex items-center gap-1.5 text-xs">
            {(['todos', 'SINAL_ATIVO', 'GREEN', 'LOSS'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                  filtroStatus === st
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st === 'todos'
                  ? 'Todos'
                  : st === 'SINAL_ATIVO'
                  ? 'Ativos'
                  : st === 'GREEN'
                  ? 'Greens'
                  : 'Losses'}
              </button>
            ))}
          </div>
        </div>

        {sinaisFiltrados.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
            Nenhum sinal encontrado para o filtro selecionado com gatilhos de {estrategiaObj.nome}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sinaisFiltrados.map((sinal) => {
              const isGreen = sinal.status === 'GREEN';
              const isLoss = sinal.status === 'LOSS';
              const isAguardando = nowMs < sinal.janelaEntrarMs;
              const isJanelaAberta = nowMs >= sinal.janelaEntrarMs && nowMs <= sinal.janelaPararMs;

              return (
                <div
                  key={sinal.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all shadow-lg ${
                    isGreen
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-emerald-500/60 shadow-emerald-950/20'
                      : isJanelaAberta
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-cyan-500/60 shadow-cyan-950/20 ring-1 ring-cyan-500/40'
                      : isLoss
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-rose-500/40'
                      : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800'
                  }`}
                >
                  {/* Topo do Card */}
                  <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      {houseName.toUpperCase()} • SINAL +{sinal.minutoOffset}m
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-num">
                      ±{toleranciaMin}m tol.
                    </span>
                  </div>

                  {/* Relógio Central com Ícone */}
                  <div className="p-4 text-center border-b border-slate-800/60 bg-slate-950/40">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="w-5 h-5 text-purple-400 animate-pulse" />
                      <span className="text-2xl sm:text-3xl font-black font-mono-num text-purple-300 tracking-wider">
                        {sinal.tempoProjetadoStr}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-300 font-mono-num flex items-center justify-center gap-1.5 bg-slate-900/90 py-1 px-2 rounded-lg border border-slate-800 mt-2">
                      <span>Entrar: <strong className="text-emerald-400">{sinal.janelaEntrarStr}</strong></span>
                      <span>•</span>
                      <span>Parar: <strong className="text-rose-400">{sinal.janelaPararStr}</strong></span>
                    </div>
                  </div>

                  {/* Faixa de Status / Contagem Regressiva */}
                  <div className="px-3 py-2 bg-slate-950 border-b border-slate-800/80">
                    {isGreen ? (
                      <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>BATEU ({sinal.velaGreen?.result.toFixed(2)}x)</span>
                      </div>
                    ) : isJanelaAberta ? (
                      <div className="py-1 px-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 font-black text-xs text-center flex items-center justify-center gap-1.5 animate-pulse">
                        <Play className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Janela Aberta ({formatCountdown(sinal.janelaPararMs, nowMs)} restantes)</span>
                      </div>
                    ) : isAguardando ? (
                      <div className="py-1 px-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs text-center flex items-center justify-center gap-1.5 font-mono-num">
                        <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Inicia em: {formatCountdown(sinal.janelaEntrarMs, nowMs)}</span>
                      </div>
                    ) : (
                      <div className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[11px] text-center flex items-center justify-center gap-1">
                        <span>Encerrada às {sinal.janelaPararStr}</span>
                      </div>
                    )}
                  </div>

                  {/* Informações da Vela Gatilho e Seca Pré-Gatilho */}
                  <div className="p-3 border-b border-slate-800/60 bg-slate-950/30 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        🎯 Vela Gatilho (Fim da Seca):
                      </span>
                      <strong className="text-pink-400 font-mono-num text-xs">
                        {sinal.gatilhoMult.toFixed(2)}x às {sinal.gatilhoTimeStr}
                      </strong>
                    </div>

                    <div className="text-[10px] text-slate-300 font-mono-num bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Início da Seca:</span>
                        <strong className="text-purple-300">às {sinal.secaInicioTimeStr}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Duração da Seca:</span>
                        <strong className="text-amber-300">
                          {sinal.secaRodadas} rodadas ({sinal.secaMinutos} min)
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Velas na Janela */}
                  <div className="p-3 bg-slate-950/80 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                        <span>VELAS NA JANELA ({sinal.velasNaJanela.length}):</span>
                        {isGreen && (
                          <span className="text-emerald-400 font-extrabold text-[10px]">
                            ✔ BATEU
                          </span>
                        )}
                      </div>

                      {sinal.velasNaJanela.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                          {sinal.velasNaJanela.map((vela, vIdx) => {
                            const isRosa = vela.result >= alvoMult;
                            const isRoxa = vela.result >= 2.0 && vela.result < 10.0;
                            const horaStr = vela.instant
                              ? formatBrTime(vela.instant).slice(0, 5)
                              : '--:--';

                            return (
                              <div
                                key={vela.uuid || vIdx}
                                onClick={() => onSelectRound?.(vela)}
                                className={`p-1 rounded-lg text-center font-mono-num cursor-pointer transition-transform hover:scale-105 ${
                                  isRosa
                                    ? 'bg-pink-600/90 text-white font-black shadow-md shadow-pink-600/30 border border-pink-400 ring-1 ring-white/50'
                                    : isRoxa
                                    ? 'bg-purple-900/80 text-purple-200 font-bold border border-purple-600/50'
                                    : 'bg-slate-900 text-cyan-300 font-semibold border border-slate-800'
                                }`}
                                title={`${vela.result.toFixed(2)}x às ${formatBrTime(vela.instant)}`}
                              >
                                <div className="text-[11px] leading-tight">
                                  {vela.result.toFixed(2)}x
                                </div>
                                <div className="text-[9px] opacity-75 text-slate-300 leading-none mt-0.5">
                                  {horaStr}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : isAguardando ? (
                        <div className="py-4 text-center text-slate-500 italic text-xs">
                          Aguardando início da janela ({sinal.janelaEntrarStr})...
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-500 italic text-xs">
                          Sem velas registradas nesta janela.
                        </div>
                      )}
                    </div>
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
