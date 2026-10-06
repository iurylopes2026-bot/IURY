import React, { useState, useMemo, useEffect } from 'react';
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
  Hourglass,
  Bell,
  Play,
  Award,
  Calendar,
} from 'lucide-react';

interface ProjecaoRapidaViewProps {
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

export const ProjecaoRapidaView: React.FC<ProjecaoRapidaViewProps> = ({
  rounds,
  onSelectRound,
  houseName = 'TORRE BET',
}) => {
  // Configuração dos 4 Intervalos
  const [intervalos, setIntervalos] = useState<number[]>([10, 20, 30, 40]);
  const [protecaoX, setProtecaoX] = useState<number>(2.0);
  const [alvoY, setAlvoY] = useState<number>(10.0);

  // Relógio em tempo real para contagem regressiva a cada 1 segundo
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
                Pós-Rompimento de Maior Seca / Quebra de Máxima (T0)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Projeção Rápida: 4 Entradas (T0 +10m a +40m)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Rastreia períodos de seca (ausência de velas rosas), monitora a base de teto pré-quebra e dispara as 4 janelas temporais com contagem regressiva ao vivo e tolerância de ±2 min.
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-pink-500" />
            Ciclos de Quebra de Máxima e Seca Auditados ({ciclos.length})
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
          <div className="space-y-8">
            {ciclos.map((ciclo) => {
              const isCicloGreen = ciclo.statusCiclo === 'GREEN';
              const isCicloLoss = ciclo.statusCiclo === 'LOSS';
              const { quebra } = ciclo;

              return (
                <div
                  key={ciclo.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCicloGreen
                      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
                      : isCicloLoss
                      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-rose-500/40'
                      : 'bg-slate-950/90 border-slate-800'
                  }`}
                >
                  {/* Cabeçalho do Ciclo: Quebra de Máxima e Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-300">
                            QUEBRA DE MÁXIMA:
                          </span>
                          <span className="text-xl font-black text-pink-400 font-mono-num">
                            {ciclo.maxima.toFixed(2)}x
                          </span>
                          <span className="text-xs text-slate-400 font-mono-num">
                            às {ciclo.horarioQuebra}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Superou teto anterior de {quebra.maxAnterior.toFixed(2)}x
                        </span>
                      </div>
                    </div>

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
                        {isCicloGreen
                          ? `CICLO GREEN (${ciclo.totalGreens}/4 PAGO)`
                          : isCicloLoss
                          ? 'CICLO LOSS'
                          : 'EM ANDAMENTO'}
                      </span>
                    </div>
                  </div>

                  {/* PAINEL PROEMINENTE: ONDE COMEÇOU, ONDE TERMINOU E QUANTIDADE DA SECA */}
                  <div className="my-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* 1. Onde Começou a Seca */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/40 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-purple-400 tracking-wider">
                        <span>🛑 INÍCIO DA SECA</span>
                        <span className="text-slate-500">Última Rosa</span>
                      </div>
                      <div className="my-1.5 flex items-baseline gap-2">
                        <strong className="text-lg font-black text-white font-mono-num">
                          {quebra.multInicioSeca > 0 ? `${quebra.multInicioSeca.toFixed(2)}x` : '00:00:01'}
                        </strong>
                        <span className="text-xs text-purple-300 font-mono-num">
                          às {quebra.horarioInicioSeca}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Vela onde a casa travou as rosas
                      </span>
                    </div>

                    {/* 2. Onde Terminou a Seca */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-pink-500/40 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-pink-400 tracking-wider">
                        <span>⚡ FIM DA SECA</span>
                        <span className="text-pink-400/80 font-bold">Gatilho T0</span>
                      </div>
                      <div className="my-1.5 flex items-baseline gap-2">
                        <strong className="text-lg font-black text-pink-400 font-mono-num">
                          {quebra.multFimSeca.toFixed(2)}x
                        </strong>
                        <span className="text-xs text-pink-300 font-mono-num">
                          às {quebra.horarioFimSeca}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Vela que rompeu a retenção
                      </span>
                    </div>

                    {/* 3. Quantidade da Seca */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        <span>⏳ QUANTIDADE DA SECA</span>
                        <span className="text-amber-400/80">Retenção</span>
                      </div>
                      <div className="my-1.5 flex items-baseline gap-2">
                        <strong className="text-lg font-black text-amber-300 font-mono-num">
                          {quebra.secaRodadas} Rodadas
                        </strong>
                        <span className="text-xs text-amber-400/80 font-mono-num">
                          ({quebra.secaMinutos} min)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Tempo total que a casa segurou
                      </span>
                    </div>

                    {/* 4. Superação do Recorde Anterior do Dia */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                        <span>🏆 STATUS DO DIA</span>
                        {quebra.isMaiorSecaDoDia && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            RECORDE
                          </span>
                        )}
                      </div>
                      <div className="my-1.5">
                        {quebra.isMaiorSecaDoDia ? (
                          <span className="text-sm font-black text-emerald-400 block">
                            MAIOR SECA DO DIA!
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-200 block">
                            Seca Monitorada
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono-num">
                          Seca anterior: {quebra.maiorSecaAnteriorRodadas} rodadas
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Comparativo com maior seca do dia
                      </span>
                    </div>
                  </div>

                  {/* BANNER DA BASE DE TETO (10 MIN ANTES DA QUEBRA) + TODAS AS ROSAS */}
                  <div className="my-4 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] tracking-wide border border-cyan-500/40 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          BASE DE TETO (10 MIN ANTES DA QUEBRA)
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Velas anteriores ao fim da seca ({ciclo.horarioQuebra}):
                        </span>
                      </div>

                      {/* Teto de Roxa (5m antes) */}
                      <div className="flex items-center gap-2 text-xs font-mono-num">
                        <span className="text-slate-400">Previsão Proteção (Roxa 4x-9.99x até 5m antes):</span>
                        <strong className="text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                          {quebra.valorProtecaoRoxa > 0
                            ? `${quebra.valorProtecaoRoxa.toFixed(2)}x ${
                                quebra.horarioProtecaoRoxa ? `(${quebra.horarioProtecaoRoxa})` : ''
                              }`
                            : 'Sem roxa nos 5m'}
                        </strong>
                      </div>
                    </div>

                    {/* BLOCO DEDICADO: TODAS AS VELAS ROSAS QUE SAÍRAM 10 MINUTOS ANTES DO FIM DA SECA */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-pink-500/40 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase text-pink-300 tracking-wide flex items-center gap-1.5">
                          🌸 TETO DE ROSA: TODAS AS VELAS ROSAS QUE SAÍRAM 10 MINUTOS ANTES DO FIM DA SECA ({ciclo.horarioQuebra})
                        </span>
                        {quebra.valorTetoRosa > 0 && (
                          <span className="text-xs text-slate-300 font-mono-num">
                            Maior Rosa de Teto:{' '}
                            <strong className="text-pink-400 text-sm font-black">
                              {quebra.valorTetoRosa.toFixed(2)}x
                            </strong>
                          </span>
                        )}
                      </div>

                      {quebra.rosas10m.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap font-mono-num pt-1">
                          {quebra.rosas10m.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="px-2.5 py-1 rounded-lg bg-pink-950/80 border border-pink-500/50 text-pink-200 font-bold flex items-center gap-1.5 text-xs shadow-sm hover:scale-105 transition-transform"
                            >
                              <span className="text-white font-black">{r.mult.toFixed(2)}x</span>
                              <span className="text-[10px] text-pink-400 opacity-80">às {r.timeStr}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                          <p className="text-slate-300 font-semibold">
                            ⚠️ Nenhuma vela rosa saiu nos 10 minutos anteriores ao rompimento devido à retenção da seca contínua de {quebra.secaRodadas} rodadas ({quebra.secaMinutos} min).
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 pt-0.5">
                            <span>Vela rosa que iniciou esta seca:</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold font-mono-num">
                              {quebra.multInicioSeca > 0 ? `${quebra.multInicioSeca.toFixed(2)}x às ${quebra.horarioInicioSeca}` : '00:00:01'}
                            </span>
                            {quebra.rosasInicio10m.length > 0 && (
                              <>
                                <span>• Rosas antes do início da seca:</span>
                                {quebra.rosasInicio10m.map((ri, riIdx) => (
                                  <span
                                    key={riIdx}
                                    className="px-1.5 py-0.5 rounded bg-pink-950/60 border border-pink-500/30 text-pink-300 font-bold font-mono-num text-[10px]"
                                  >
                                    {ri.mult.toFixed(2)}x ({ri.timeStr})
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AS 4 COLUNAS VERTICAIS DE ENTRADA (Estilo Imagem 2 TopGun) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {ciclo.entradas.map((entrada) => {
                      const isGreen = entrada.status === 'GREEN';
                      const isLoss = entrada.status === 'LOSS';
                      const isAguardando = nowMs < entrada.janelaEntrarMs;
                      const isJanelaAberta =
                        nowMs >= entrada.janelaEntrarMs && nowMs <= entrada.janelaPararMs;
                      const isEncerrada = nowMs > entrada.janelaPararMs;

                      // Contagem regressiva
                      const contagemTexto = isAguardando
                        ? `Inicia em: ${formatCountdown(entrada.janelaEntrarMs, nowMs)}`
                        : isJanelaAberta
                        ? `Janela Aberta (${formatCountdown(entrada.janelaPararMs, nowMs)} restantes)`
                        : `Encerrada às ${entrada.janelaPararStr}`;

                      return (
                        <div
                          key={entrada.indice}
                          className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all shadow-lg ${
                            isGreen
                              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-emerald-500/60 shadow-emerald-950/30'
                              : isJanelaAberta
                              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-cyan-500/60 shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                              : isLoss
                              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-rose-500/40'
                              : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800'
                          }`}
                        >
                          {/* Topo do Card: Badge da Entrada e Casa */}
                          <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Zap className="w-3 h-3 text-cyan-400" />
                              {houseName.toUpperCase()} ENTRADA {entrada.indice} (+{entrada.minutoOffset}m)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-num">
                              ±2 min tol.
                            </span>
                          </div>

                          {/* Relógio Central Gigante com Ícone */}
                          <div className="p-4 text-center border-b border-slate-800/60 bg-slate-950/40">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                              <span className="text-2xl sm:text-3xl font-black font-mono-num text-cyan-300 tracking-wider">
                                {entrada.tempoAlvoStr}
                              </span>
                            </div>

                            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest block mb-2">
                              {houseName.toUpperCase()}
                            </span>

                            {/* Janela de Tolerância: Entrar e Parar */}
                            <div className="text-[10px] text-slate-300 font-mono-num flex items-center justify-center gap-1.5 bg-slate-900/90 py-1 px-2 rounded-lg border border-slate-800">
                              <span>Entrar: <strong className="text-emerald-400">{entrada.janelaEntrarStr}</strong></span>
                              <span>•</span>
                              <span>Parar: <strong className="text-rose-400">{entrada.janelaPararStr}</strong></span>
                            </div>
                          </div>

                          {/* Faixa de Status / Contagem Regressiva em Tempo Real */}
                          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800/80">
                            {isGreen ? (
                              <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>BATEU ({entrada.velaGreen?.result.toFixed(2)}x)</span>
                              </div>
                            ) : isJanelaAberta ? (
                              <div className="py-1 px-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 font-black text-xs text-center flex items-center justify-center gap-1.5 animate-pulse">
                                <Play className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{contagemTexto}</span>
                              </div>
                            ) : isAguardando ? (
                              <div className="py-1 px-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs text-center flex items-center justify-center gap-1.5 font-mono-num">
                                <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{contagemTexto}</span>
                              </div>
                            ) : (
                              <div className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[11px] text-center flex items-center justify-center gap-1">
                                <span>PAROU DE PEGAR VELAS ({entrada.janelaPararStr})</span>
                              </div>
                            )}
                          </div>

                          {/* Seção Teto da Entrada */}
                          <div className="p-3 border-b border-slate-800/60 bg-slate-950/30 text-[11px] space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                              TETO DA ENTRADA (10m pré-quebra)
                            </span>
                            <div className="flex items-center justify-between text-slate-300 font-mono-num">
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-purple-400" />
                                Proteção (4x-9.99x):
                              </span>
                              <strong className="text-purple-300">
                                {quebra.valorProtecaoRoxa > 0 ? `${quebra.valorProtecaoRoxa.toFixed(2)}x` : '--'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between text-slate-300 font-mono-num">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-pink-400" />
                                Teto Alto (≥10x):
                              </span>
                              <strong className="text-pink-300">
                                {quebra.valorTetoRosa > 0 ? `${quebra.valorTetoRosa.toFixed(2)}x` : '10.00x'}
                              </strong>
                            </div>

                            {/* Badges de Teto Batido / Proteção Atingida */}
                            <div className="pt-1 flex flex-col gap-1">
                              {entrada.tetoAltoBatido && (
                                <span className="py-0.5 px-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] text-center flex items-center justify-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  TETO ALTO BATIDO ({entrada.maiorVelaNaJanela?.toFixed(2)}x)
                                </span>
                              )}

                              {entrada.bateuProtecao && (
                                <span className="py-0.5 px-2 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-[10px] text-center flex items-center justify-center gap-1">
                                  <Shield className="w-3 h-3 text-purple-400" />
                                  PROTEÇÃO ATINGIDA ({entrada.maiorVelaNaJanela?.toFixed(2)}x)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Seção VELAS NA JANELA (Grid com velas e horários) */}
                          <div className="p-3 bg-slate-950/80 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                                <span>VELAS NA JANELA ({entrada.velasNaJanela.length}):</span>
                                {isGreen && (
                                  <span className="text-emerald-400 font-extrabold text-[10px]">
                                    ✔ BATEU
                                  </span>
                                )}
                              </div>

                              {entrada.velasNaJanela.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                                  {entrada.velasNaJanela.map((vela, vIdx) => {
                                    const isRosa = vela.result >= 10.0;
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
                                  Aguardando horário da janela ({entrada.janelaEntrarStr})...
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
