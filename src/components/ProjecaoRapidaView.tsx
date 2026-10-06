import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  processarProjecaoRapida,
  CicloProjecaoRapida,
  EntradaRapida,
  formatBrTime,
} from '../utils/analysisEngine';
import {
  Zap,
  Target,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Settings2,
  Sliders,
} from 'lucide-react';

interface ProjecaoRapidaViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const ProjecaoRapidaView: React.FC<ProjecaoRapidaViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  // Configuração dos 4 Intervalos
  const [intervalos, setIntervalos] = useState<number[]>([10, 20, 30, 40]);
  const [protecaoX, setProtecaoX] = useState<number>(2.0);
  const [alvoY, setAlvoY] = useState<number>(10.0);

  const { ciclos, ranking, top4Recomendados, taxaGeralAcerto } = useMemo(() => {
    return processarProjecaoRapida(rounds, intervalos, protecaoX, alvoY);
  }, [rounds, intervalos, protecaoX, alvoY]);

  const aplicarTop4 = () => {
    setIntervalos(top4Recomendados);
  };

  const resetarPadrao = () => {
    setIntervalos([10, 20, 30, 40]);
  };

  const isUsandoTop4 =
    intervalos.length === 4 &&
    intervalos.every((val, i) => val === top4Recomendados[i]);

  const ciclosFinalizados = ciclos.filter((c) => c.statusCiclo !== 'EM_ANDAMENTO');
  const totalGreens = ciclosFinalizados.filter((c) => c.statusCiclo === 'GREEN').length;
  const totalLosses = ciclosFinalizados.filter((c) => c.statusCiclo === 'LOSS').length;

  return (
    <div className="space-y-6">
      {/* Header Banner & Configuração Rápida */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                SISTEMA AUTOMÁTICO
              </span>
              <span className="text-xs text-slate-400">
                Pós-Quebra de Máxima do Dia (T0)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Projeção Rápida: 4 Entradas (T0 +10m a +40m)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Monitora quebras de máxima e dispara 4 janelas temporais com até 5 tentativas consecutivas cada. 
              Parada imediata ao bater o alvo. O ciclo é GREEN se ao menos 1 das 4 entradas pagar.
            </p>
          </div>

          {/* Cards de Resumo da Assertividade */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">TAXA DE GREEN</span>
              <span className="text-xl font-black text-emerald-400 font-mono-num">
                {taxaGeralAcerto}%
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">CICLOS GREEN</span>
              <span className="text-xl font-black text-white font-mono-num">
                {totalGreens} <span className="text-xs text-slate-500 font-normal">/ {ciclosFinalizados.length}</span>
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-rose-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">LOSS TOTAL</span>
              <span className="text-xl font-black text-rose-400 font-mono-num">
                {totalLosses}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Ajuste de Alvos e Intervalos */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <label htmlFor="protecao-x-input" className="text-slate-400 text-[11px]">1ª Mão (Proteção):</label>
              <select
                id="protecao-x-input"
                value={protecaoX}
                onChange={(e) => setProtecaoX(Number(e.target.value))}
                className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value={1.5} className="bg-slate-900">1.50x</option>
                <option value={2.0} className="bg-slate-900">2.00x</option>
                <option value={2.5} className="bg-slate-900">2.50x</option>
                <option value={3.0} className="bg-slate-900">3.00x</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Target className="w-3.5 h-3.5 text-pink-400" />
              <label htmlFor="alvo-y-input" className="text-slate-400 text-[11px]">2ª Mão (Alvo):</label>
              <select
                id="alvo-y-input"
                value={alvoY}
                onChange={(e) => setAlvoY(Number(e.target.value))}
                className="bg-transparent text-pink-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value={5.0} className="bg-slate-900">5.00x</option>
                <option value={10.0} className="bg-slate-900">10.00x (Padrão)</option>
                <option value={15.0} className="bg-slate-900">15.00x</option>
                <option value={20.0} className="bg-slate-900">20.00x</option>
                <option value={30.0} className="bg-slate-900">30.00x</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono-num">
              <span>Intervalos Ativos:</span>
              <strong className="text-white">
                +{intervalos[0]}m, +{intervalos[1]}m, +{intervalos[2]}m, +{intervalos[3]}m
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={aplicarTop4}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isUsandoTop4
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Usar Top 4 Recomendados (+{top4Recomendados.join('m, +')}m)</span>
            </button>

            {isUsandoTop4 && (
              <button
                type="button"
                onClick={resetarPadrao}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Voltar Padrão (+10m..+40m)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid com Ciclos Auditados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-pink-500" />
            Ciclos de Quebra de Máxima Auditados ({ciclos.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono-num">
            Critério 1 de 4: GREEN se ao menos 1 entrada pagar {alvoY.toFixed(2)}x
          </span>
        </div>

        {ciclos.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
            Nenhuma quebra de máxima detectada no histórico de hoje.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {ciclos.map((ciclo) => {
              const isCicloGreen = ciclo.statusCiclo === 'GREEN';
              const isCicloLoss = ciclo.statusCiclo === 'LOSS';
              return (
                <div
                  key={ciclo.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCicloGreen
                      ? 'bg-gradient-to-br from-slate-950 via-emerald-950/15 to-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : isCicloLoss
                      ? 'bg-gradient-to-br from-slate-950 via-rose-950/15 to-slate-950 border-rose-500/40'
                      : 'bg-slate-950/90 border-slate-800'
                  }`}
                >
                  {/* Cabeçalho do Ciclo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCicloGreen
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isCicloLoss
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {isCicloGreen ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCicloLoss ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300">
                            QUEBRA DE MÁXIMA:
                          </span>
                          <span className="text-base font-black text-pink-400 font-mono-num">
                            {ciclo.maxima.toFixed(2)}x
                          </span>
                          <span className="text-xs text-slate-500 font-mono-num">
                            às {ciclo.horarioQuebra}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Superou teto anterior de {ciclo.quebra.maxAnterior.toFixed(2)}x
                        </span>
                      </div>
                    </div>

                    {/* Status Badge do Ciclo */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                          isCicloGreen
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCicloLoss
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCicloGreen ? 'CICLO GREEN (1/4 PAGO)' : isCicloLoss ? 'CICLO LOSS' : 'EM ANDAMENTO'}
                      </span>
                    </div>
                  </div>

                  {/* As 4 Entradas do Ciclo (Grid 2x2: duas em cima, duas em baixo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    {ciclo.entradas.map((entrada) => {
                      const isGreen = entrada.status === 'GREEN';
                      const isLoss = entrada.status === 'LOSS';
                      const isAguardando = entrada.status === 'AGUARDANDO';

                      return (
                        <div
                          key={entrada.indice}
                          className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                            isGreen
                              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                              : isLoss
                              ? 'bg-rose-950/20 border-rose-500/30'
                              : 'bg-slate-900/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">
                              {entrada.indice}ª Entrada (+{entrada.minutoOffset}m)
                            </span>
                            <span className="font-mono-num text-[11px] text-slate-300 font-semibold">
                              Horário: {entrada.tempoAlvoStr}
                            </span>
                          </div>

                          {/* Status da Entrada */}
                          <div className="flex items-center justify-between pt-1">
                            <span
                              className={`font-extrabold text-[11px] px-2 py-0.5 rounded ${
                                isGreen
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isGreen
                                ? `GREEN (Tiro ${entrada.tiroGreen})`
                                : isLoss
                                ? `LOSS (${entrada.tiros.length || 5} tiros)`
                                : isAguardando
                                ? 'AGUARDANDO'
                                : 'PENDENTE'}
                            </span>

                            {entrada.bateuProtecao && (
                              <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-0.5 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                                <Shield className="w-3 h-3 text-purple-400" />
                                Prot. {protecaoX.toFixed(2)}x (Tiro {entrada.tiroProtecao})
                              </span>
                            )}
                          </div>

                          {/* Tiros executados (até 5 velas) */}
                          <div className="pt-2 border-t border-slate-800/60">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                              <span>Velas Auditadas ({entrada.tiros.length}/5):</span>
                              {isGreen && entrada.velaGreen && (
                                <span className="text-emerald-400 font-bold font-mono-num">
                                  Paga: {entrada.velaGreen.result.toFixed(2)}x
                                </span>
                              )}
                            </div>
                            {entrada.tiros.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {entrada.tiros.map((tiro, tIdx) => {
                                  const hitAlvo = tiro.result >= alvoY;
                                  const hitProt = tiro.result >= protecaoX;
                                  return (
                                    <span
                                      key={tiro.uuid || tIdx}
                                      onClick={() => onSelectRound?.(tiro)}
                                      className={`px-2 py-1 rounded-lg font-mono-num text-[11px] cursor-pointer font-bold transition-transform hover:scale-105 ${
                                        hitAlvo
                                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 ring-1 ring-white/50'
                                          : hitProt
                                          ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                                          : 'bg-slate-800/90 text-slate-300 border border-slate-700/50 hover:bg-slate-700'
                                      }`}
                                      title={`Tiro ${tIdx + 1}: ${tiro.result.toFixed(2)}x (${formatBrTime(tiro.instant)}) - Clique para detalhar`}
                                    >
                                      {tiro.result.toFixed(2)}x
                                    </span>
                                  );
                                })}
                              </div>
                            ) : isAguardando ? (
                              <span className="text-[10px] text-slate-500 italic block py-0.5">
                                Aguardando horário ({entrada.tempoAlvoStr})...
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic block py-0.5">
                                Sem velas registradas neste intervalo.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabela & Ranking dos Melhores Intervalos de 1 a 60 Minutos */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Ranking dos Melhores Intervalos (1m a 60m Pós-Quebra)
            </h3>
            <p className="text-xs text-slate-400">
              Taxa de assertividade real calculada para cada minuto de espera após uma quebra de máxima hoje.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Top 4 Recomendados:</span>
            <div className="flex items-center gap-1">
              {top4Recomendados.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono-num font-bold"
                >
                  +{m}m
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 scrollbar-thin">
          <table className="w-full text-left text-xs font-mono-num">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] sticky top-0">
              <tr>
                <th className="py-2 px-3">Posição</th>
                <th className="py-2 px-3">Intervalo</th>
                <th className="py-2 px-3">Testados</th>
                <th className="py-2 px-3">Greens (≥{alvoY.toFixed(2)}x)</th>
                <th className="py-2 px-3">Losses</th>
                <th className="py-2 px-3">Assertividade %</th>
                <th className="py-2 px-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {ranking.slice(0, 15).map((r, idx) => (
                <tr
                  key={r.minuto}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    top4Recomendados.includes(r.minuto) ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2 px-3 font-bold text-white">+{r.minuto} min</td>
                  <td className="py-2 px-3 text-slate-400">{r.totalTestados}</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">{r.greens}</td>
                  <td className="py-2 px-3 text-rose-400">{r.losses}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${r.assertividade}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-400">{r.assertividade}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...intervalos];
                        next[0] = r.minuto;
                        setIntervalos(next);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      Definir E1
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
