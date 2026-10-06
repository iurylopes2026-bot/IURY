import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  calcularEstrategia10xA50x,
  CicloEstrategia10xA50x,
} from '../utils/analysisEngine';
import {
  Flame,
  Clock,
  Target,
  Shield,
  Hourglass,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertTriangle,
  Zap,
  Sparkles,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
} from 'lucide-react';

interface Estrategia10xA50xViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const Estrategia10xA50xView: React.FC<Estrategia10xA50xViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<
    'TODOS' | 'GREENS' | 'LOSS' | 'PENDENTES'
  >('TODOS');
  const [cicloExpandidoId, setCicloExpandidoId] = useState<string | null>(null);

  // Gestão 2 Mãos da Estratégia
  const [apostaMao1, setApostaMao1] = useState<number>(5.0);
  const [alvoMao1, setAlvoMao1] = useState<number>(2.0);
  const [apostaMao2, setApostaMao2] = useState<number>(2.0);
  const [alvoMao2, setAlvoMao2] = useState<number>(15.0);

  const stats = useMemo(() => {
    return calcularEstrategia10xA50x(rounds);
  }, [rounds]);

  const ciclosFiltrados = useMemo(() => {
    if (filtroStatus === 'TODOS') return stats.ciclos;
    if (filtroStatus === 'GREENS') {
      return stats.ciclos.filter(
        (c) => c.status === 'GREEN_DIRETO' || c.status === 'GREEN_10M'
      );
    }
    if (filtroStatus === 'LOSS') {
      return stats.ciclos.filter((c) => c.status === 'LOSS');
    }
    return stats.ciclos.filter(
      (c) =>
        c.status === 'PENDENTE_ENTRADA_1' ||
        c.status === 'PENDENTE_ENTRADA_2' ||
        c.status === 'AO_VIVO_ENTRADA_1' ||
        c.status === 'AO_VIVO_ENTRADA_2'
    );
  }, [stats.ciclos, filtroStatus]);

  // Cálculos de Gestão
  const custoPorTiro = apostaMao1 + apostaMao2;
  const retornoProtecao = apostaMao1 * alvoMao1;
  const lucroAlvo = apostaMao2 * alvoMao2 + retornoProtecao - custoPorTiro;

  return (
    <div className="space-y-6">
      {/* 1. RADAR AO VIVO COM AMPULHETA (SE HOUVER ENTRADA ATIVA AGORA NO RADAR) */}
      {stats.temEntradaAtivaAgora && stats.cicloAtivoAgora && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] relative overflow-hidden animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
                <Hourglass className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                    ⏳ ENTRADA ATIVA AGORA NO RADAR
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    {stats.tipoEntradaAtiva === 'ENTRADA_1'
                      ? '1ª ENTRADA (HORÁRIO + MINUTO)'
                      : '2ª ENTRADA (RECUPERAÇÃO +10M)'}
                  </span>
                  <span className="text-xs text-slate-300 font-mono-num">
                    Vela Base: {stats.cicloAtivoAgora.mult100x.toFixed(2)}x ({stats.cicloAtivoAgora.time100xStr})
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  Janela Radar Aberta: {stats.tipoEntradaAtiva === 'ENTRADA_1' ? stats.cicloAtivoAgora.janela1Str : stats.cicloAtivoAgora.janela2Str} (±1 min)
                </h3>
                <p className="text-xs text-amber-200/90 mt-1 max-w-3xl leading-relaxed">
                  O horário programado pela regra <strong>{stats.cicloAtivoAgora.time100xStr} + {stats.cicloAtivoAgora.minutoDaVela}m {stats.tipoEntradaAtiva === 'ENTRADA_2' ? '+ 10m' : ''}</strong> está ativo agora! O radar cobre 1 minuto antes e 1 minuto depois.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-950/80 px-4 py-3 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tempo Restante no Radar:</span>
              <span className="text-xl font-black text-amber-300 font-mono-num">
                {Math.floor(stats.segundosRestantesJanela / 60)}m {stats.segundosRestantesJanela % 60}s
              </span>
              <span className="text-xs font-black text-emerald-400">
                Alvo Almejado: 10.00x a 50.00x
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANNER PRINCIPAL COM EXPLICAÇÃO DA ESTRATÉGIA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#130f24] to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white shadow-lg flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-200" />
                ESTRATÉGIA QUANTITATIVA
              </span>
              <span className="text-xs text-slate-400">
                Gatilho em Velas 100x+ • Alvo: Rosas de 10.00x a 50.00x
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Estratégia 10X a 50X
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Monitore todas as velas de 100x+, some o horário completo com o próprio minuto da vela (Entrada 1), com tolerância de 1 minuto antes e 1 minuto depois. Se não bater, tente na re-entrada com +10 minutos (Entrada 2).
            </p>
          </div>

          {/* Exemplo Didático em Destaque */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 max-w-sm space-y-1.5 text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Como a Regra Funciona:
            </span>
            <div className="font-mono-num text-[11px] text-slate-300 space-y-1">
              <p>
                • Vela 100x às <strong className="text-white">06:16</strong> (Minuto = 16)
              </p>
              <p>
                • <strong className="text-emerald-400">Entrada 1:</strong> 06:16 + 16m = <strong className="text-white">06:32</strong> (Radar: 06:31 às 06:33)
              </p>
              <p>
                • <strong className="text-purple-400">Entrada 2 (+10m):</strong> 06:32 + 10m = <strong className="text-white">06:42</strong> (Radar: 06:41 às 06:43)
              </p>
            </div>
          </div>
        </div>

        {/* 3. GRÁFICOS DE ASSERTIVIDADE (REQUISITO EXPLÍCITO) */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-black font-display text-white uppercase tracking-wider">
                Gráficos de Assertividade da Estratégia
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono-num">
              {stats.totalCiclosFinalizados} ciclos auditados hoje
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Assertividade Geral Combinada */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Assertividade Geral (Green Total)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 font-mono-num">
                    {stats.taxaGreenGeral}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono-num">
                    ({stats.totalGreenGeral} de {stats.totalCiclosFinalizados})
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.taxaGreenGeral}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Direto + Recuperação +10m
                </span>
              </div>
            </div>

            {/* Card 2: Green Direto (1ª Entrada) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Green Direto (1ª Entrada)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono-num">
                    {stats.taxaGreenDireto}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono-num">
                    ({stats.totalGreenDireto} ciclos)
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.taxaGreenDireto}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Bateu logo no Horário + Minuto
                </span>
              </div>
            </div>

            {/* Card 3: Green na Recuperação (+10m) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Green na Recuperação (+10m)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-400 font-mono-num">
                    {stats.taxaGreen10m}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono-num">
                    ({stats.totalGreen10m} ciclos)
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.taxaGreen10m}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Salvo pela re-entrada de 10 min
                </span>
              </div>
            </div>

            {/* Card 4: Taxa de Loss */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Taxa de Loss
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-400 font-mono-num">
                    {stats.taxaLoss}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono-num">
                    ({stats.totalLoss} perdas)
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.taxaLoss}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ciclos que não pagaram em 10m
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico Visual: Assertividade por Hora do Dia (SVG / Barras) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs font-bold text-white block">
                  Curva de Assertividade por Horário do Dia (00h às 23h):
                </span>
                <span className="text-[11px] text-slate-400">
                  Veja em quais horas a estratégia teve maior taxa de acerto de rosas (10x a 50x).
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono-num">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> &ge; 75% Alta
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> 50-74% Média
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> &lt; 50% Baixa
                </span>
              </div>
            </div>

            {stats.assertividadePorHora.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Aguardando mais ciclos finalizados para compilar o gráfico por hora.
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {stats.assertividadePorHora.map((h) => {
                    let barColor = 'bg-emerald-500 text-emerald-300 border-emerald-500/30';
                    if (h.taxa < 50) barColor = 'bg-rose-500 text-rose-300 border-rose-500/30';
                    else if (h.taxa < 75) barColor = 'bg-amber-500 text-amber-300 border-amber-500/30';

                    return (
                      <div
                        key={h.horaStr}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono-num mb-1.5">
                          <span className="font-bold text-slate-300">{h.horaStr}</span>
                          <span className="text-[10px] text-slate-500">{h.total} op.</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${h.taxa >= 75 ? 'bg-emerald-400' : h.taxa >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                              style={{ width: `${h.taxa}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono-num font-bold">
                            <span className="text-slate-400">{h.greens} Greens</span>
                            <span className={h.taxa >= 75 ? 'text-emerald-400' : h.taxa >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                              {h.taxa}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Gráfico 2: Distribuição dos Multiplicadores Batidos (10x a 50x+) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white block">
              Distribuição das Rosas Batidas no Radar:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-pink-400 uppercase font-bold block mb-1">
                  10.00x a 19.99x (Rosas Padrão)
                </span>
                <span className="text-xl font-black text-white">
                  {stats.distribuicaoRosas.faixa10x_19x}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">velas pagas</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-pink-300 uppercase font-bold block mb-1">
                  20.00x a 29.99x (Rosas Médias)
                </span>
                <span className="text-xl font-black text-white">
                  {stats.distribuicaoRosas.faixa20x_29x}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">velas pagas</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-purple-300 uppercase font-bold block mb-1">
                  30.00x a 49.99x (Rosas Altas)
                </span>
                <span className="text-xl font-black text-white">
                  {stats.distribuicaoRosas.faixa30x_49x}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">velas pagas</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-300 uppercase font-bold block mb-1">
                  &ge; 50.00x (Super Rosas)
                </span>
                <span className="text-xl font-black text-amber-400">
                  {stats.distribuicaoRosas.faixa50x_plus}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">velas pagas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRÓXIMAS ENTRADAS PROGRAMADAS */}
      {stats.proximasEntradas.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-black font-display text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Próximas Entradas no Radar ({stats.proximasEntradas.length} programadas)
            </h3>
            <span className="text-xs text-amber-300 font-mono-num">
              Fique atento ao minuto de entrada!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.proximasEntradas.slice(0, 6).map((c) => {
              const isEntrada1 = c.status === 'PENDENTE_ENTRADA_1';
              const horaAlvo = isEntrada1 ? c.alvo1TimeStr : c.alvo2TimeStr;
              const radarStr = isEntrada1 ? c.janela1Str : c.janela2Str;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {isEntrada1 ? '1ª ENTRADA (HORÁRIO + MINUTO)' : '2ª ENTRADA (+10M)'}
                    </span>
                    <span className="text-xs font-mono-num font-bold text-white">
                      {horaAlvo}
                    </span>
                  </div>

                  <div className="text-xs font-mono-num text-slate-300 space-y-1">
                    <p className="text-[11px] text-slate-400">
                      Vela Base: <strong className="text-white">{c.mult100x.toFixed(2)}x</strong> às {c.time100xStr}
                    </p>
                    <p className="text-[11px] text-amber-300">
                      Radar Ativo: <strong>{radarStr}</strong> (±1 min)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CALCULADORA DUAL BET DA ESTRATÉGIA 10X A 50X */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-black font-display text-white">
              Gestão de 2 Mãos para a Estratégia 10x a 50x
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Mão 1 cobre o custo | Mão 2 busca a rosa almejada ({alvoMao2.toFixed(0)}x)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">1ª Mão (Proteção 2x)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">R$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={apostaMao1}
                onChange={(e) => setApostaMao1(Math.max(0.5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Auto Cashout Mão 1</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="1.1"
                value={alvoMao1}
                onChange={(e) => setAlvoMao1(Math.max(1.1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-xs text-slate-400">x</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">2ª Mão (Alvo 10x-50x)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">R$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={apostaMao2}
                onChange={(e) => setApostaMao2(Math.max(0.5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-white focus:outline-none focus:border-pink-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Auto Cashout Mão 2</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                min="10"
                max="50"
                value={alvoMao2}
                onChange={(e) => setAlvoMao2(Math.max(10, Math.min(50, Number(e.target.value))))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-pink-400 font-bold focus:outline-none focus:border-pink-400"
              />
              <span className="text-xs text-slate-400">x</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-num">
          <div>
            <span className="text-slate-400 block">Custo por Tiro:</span>
            <span className="font-bold text-white">R$ {custoPorTiro.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Se bater a Proteção ({alvoMao1}x):</span>
            <span className={`font-bold ${retornoProtecao >= custoPorTiro ? 'text-emerald-400' : 'text-rose-400'}`}>
              Retorna R$ {retornoProtecao.toFixed(2)} (Saldo: {(retornoProtecao - custoPorTiro >= 0 ? '+' : '')}R$ {(retornoProtecao - custoPorTiro).toFixed(2)})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Lucro no Alvo ({alvoMao2}x):</span>
            <span className="font-black text-emerald-400 text-sm">
              + R$ {lucroAlvo.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. HISTÓRICO COMPLETO AUDITADO DE TODOS OS CICLOS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-pink-400" />
              Auditoria de Entradas ({ciclosFiltrados.length} ciclos listados)
            </h3>
            <p className="text-xs text-slate-400">
              Verifique rodada por rodada as entradas disparadas pelo cálculo de cada vela de 100x+.
            </p>
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {(['TODOS', 'GREENS', 'LOSS', 'PENDENTES'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroStatus === st
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {ciclosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Hourglass className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">Nenhum ciclo encontrado para o filtro selecionado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ciclosFiltrados.map((c) => {
              const isExpanded = cicloExpandidoId === c.id;

              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                >
                  {/* Linha Resumo do Ciclo */}
                  <div
                    onClick={() => setCicloExpandidoId(isExpanded ? null : c.id)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg font-mono-num font-black text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {c.mult100x.toFixed(2)}x
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono-num">
                            Vela às {c.time100xStr}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono-num">
                            • Minuto: {c.minutoDaVela}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num flex items-center gap-2 flex-wrap">
                          <span>
                            Entrada 1: <strong className="text-slate-200">{c.alvo1TimeStr}</strong> ({c.janela1Str})
                          </span>
                          <span>•</span>
                          <span>
                            Entrada 2 (+10m): <strong className="text-slate-200">{c.alvo2TimeStr}</strong> ({c.janela2Str})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                      {c.status === 'GREEN_DIRETO' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono-num">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            GREEN DIRETO ({c.rosaFinal?.result.toFixed(2)}x)
                          </span>
                        </div>
                      ) : c.status === 'GREEN_10M' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 font-mono-num">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            GREEN (+10M) ({c.rosaFinal?.result.toFixed(2)}x)
                          </span>
                        </div>
                      ) : c.status === 'LOSS' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono-num">
                          <XCircle className="w-3.5 h-3.5" />
                          LOSS
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono-num animate-pulse">
                          <Hourglass className="w-3.5 h-3.5" />
                          {c.status.includes('AO_VIVO') ? 'RADAR AO VIVO' : 'AGUARDANDO'}
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos: Rodadas Auditadas nas 2 Janelas */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-4 text-xs">
                      {/* Janela 1 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono-num">
                          <span className="font-bold text-slate-300 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-blue-400" />
                            1ª Janela (Alvo {c.alvo1TimeStr} • Radar {c.janela1Str}):
                          </span>
                          <span className={c.bateuNaEntrada1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {c.bateuNaEntrada1
                              ? `✅ Bateu Rosa: ${c.rosaEntrada1?.result.toFixed(2)}x`
                              : `${c.rodadasNaJanela1.length} rodadas auditadas (sem rosa)`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 font-mono-num">
                          {c.rodadasNaJanela1.length === 0 ? (
                            <span className="text-slate-500 text-[11px]">Nenhuma rodada no radar ou ainda não ocorrida.</span>
                          ) : (
                            c.rodadasNaJanela1.map((r, rIdx) => {
                              let cColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                              if (r.result >= 10.0) {
                                cColor = 'bg-pink-500/25 text-pink-200 border-pink-400 font-black shadow-sm';
                              } else if (r.result >= 2.0) {
                                cColor = 'bg-purple-500/20 text-purple-200 border-purple-500/40 font-bold';
                              }

                              return (
                                <div
                                  key={rIdx}
                                  className={`px-2 py-1 rounded-md border text-[11px] ${cColor}`}
                                >
                                  {r.result.toFixed(2)}x
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Janela 2 (+10m) */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px] font-mono-num">
                          <span className="font-bold text-slate-300 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-purple-400" />
                            2ª Janela (+10m • Alvo {c.alvo2TimeStr} • Radar {c.janela2Str}):
                          </span>
                          <span className={c.bateuNaEntrada2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {c.bateuNaEntrada2
                              ? `✅ Bateu Rosa: ${c.rosaEntrada2?.result.toFixed(2)}x`
                              : `${c.rodadasNaJanela2.length} rodadas auditadas (sem rosa)`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 font-mono-num">
                          {c.rodadasNaJanela2.length === 0 ? (
                            <span className="text-slate-500 text-[11px]">Nenhuma rodada no radar ou ainda não ocorrida.</span>
                          ) : (
                            c.rodadasNaJanela2.map((r, rIdx) => {
                              let cColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                              if (r.result >= 10.0) {
                                cColor = 'bg-pink-500/25 text-pink-200 border-pink-400 font-black shadow-sm';
                              } else if (r.result >= 2.0) {
                                cColor = 'bg-purple-500/20 text-purple-200 border-purple-500/40 font-bold';
                              }

                              return (
                                <div
                                  key={rIdx}
                                  className={`px-2 py-1 rounded-md border text-[11px] ${cColor}`}
                                >
                                  {r.result.toFixed(2)}x
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
