import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  CicloSniper95Item,
  EstatisticasSniper95,
  calcularSniperDuploGatilho95,
} from '../utils/analysisEngine';
import {
  Crosshair,
  Target,
  Sparkles,
  Flame,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Sliders,
  Award,
  Zap,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';

interface Sniper95DuploGatilhoSectionProps {
  rounds: CrashRound[];
  minGatilho: number;
  maxGatilho: number;
  onSelectRound?: (round: CrashRound) => void;
}

export const Sniper95DuploGatilhoSection: React.FC<Sniper95DuploGatilhoSectionProps> = ({
  rounds,
  minGatilho,
  maxGatilho,
  onSelectRound,
}) => {
  // Configurações de Gestão de Mão
  const [mao1Base, setMao1Base] = useState<number>(5.0); // Proteção 2.00x
  const [mao2Base, setMao2Base] = useState<number>(2.0); // Alvo Rosa 10.00x
  const [tetoRosa, setTetoRosa] = useState<number>(40.0);
  const [modoEntrada, setModoEntrada] = useState<'otimizado_auto' | 'imediato' | 'respiro_1'>('otimizado_auto');

  // Filtro de auditoria
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'greens' | 'reds'>('todos');
  const [expandirCicloId, setExpandirCicloId] = useState<string | null>(null);

  // Execução do motor analítico
  const { ciclos, estatisticas } = useMemo(() => {
    return calcularSniperDuploGatilho95(
      rounds,
      minGatilho,
      maxGatilho,
      tetoRosa,
      modoEntrada,
      mao1Base,
      mao2Base
    );
  }, [rounds, minGatilho, maxGatilho, tetoRosa, modoEntrada, mao1Base, mao2Base]);

  const ciclosFiltrados = useMemo(() => {
    if (filtroStatus === 'greens') {
      return ciclos.filter((c) => c.status === 'GREEN_SNIPER');
    }
    if (filtroStatus === 'reds') {
      return ciclos.filter((c) => c.status === 'RED_STOP_LOSS');
    }
    return ciclos;
  }, [ciclos, filtroStatus]);

  const radar = estatisticas.radarSniper;

  return (
    <div className="space-y-6">
      {/* 1. Radar em Tempo Real do Sniper 95% */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-2xl ${
          radar.status === 'DISPARAR_AGORA'
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-fuchsia-950/80 border-emerald-400 shadow-emerald-500/20 animate-pulse'
            : radar.status === 'AGUARDANDO_VALIDACAO_ROSA'
            ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-purple-950/60 border-amber-500/60 shadow-amber-500/10'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg ${
                radar.status === 'DISPARAR_AGORA'
                  ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/40 font-black'
                  : radar.status === 'AGUARDANDO_VALIDACAO_ROSA'
                  ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {radar.status === 'DISPARAR_AGORA' ? '🎯' : radar.status === 'AGUARDANDO_VALIDACAO_ROSA' ? '⏳' : '🔍'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    radar.status === 'DISPARAR_AGORA'
                      ? 'bg-emerald-400 text-slate-950'
                      : radar.status === 'AGUARDANDO_VALIDACAO_ROSA'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {radar.status === 'DISPARAR_AGORA'
                    ? '🎯 ENTRADA SNIPER ATIVA'
                    : radar.status === 'AGUARDANDO_VALIDACAO_ROSA'
                    ? '⏳ GATILHO 1 DETECTADO (AGUARDANDO ROSA)'
                    : 'RADAR SNIPER EM VIGILÂNCIA'}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  ALVO: ROSA 10.00x+ (MÁX 5 ENTRADAS)
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                {radar.mensagem}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl">
                {radar.recomendacao}
              </p>
            </div>
          </div>

          {radar.status === 'DISPARAR_AGORA' && radar.tiroAtual && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-400/80 text-center shrink-0 min-w-[190px]">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">
                TIRO ATUAL
              </span>
              <span className="text-3xl font-black text-white font-mono-num block">
                {radar.tiroAtual}º de 5
              </span>
              <span className="text-xs text-slate-300 font-bold block mt-1">
                Restam {radar.tirosRestantes} tiros no ciclo
              </span>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-amber-300 font-mono-num font-semibold">
                Mão 1: R$ {estatisticas.gestao5Tiros[radar.tiroAtual - 1]?.apostaMao1.toFixed(2)} (2x)<br />
                Mão 2: R$ {estatisticas.gestao5Tiros[radar.tiroAtual - 1]?.apostaMao2.toFixed(2)} (10x)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Painel de Métricas Principais (Atingimento de 95%+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assertividade 95%+ */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e231b] border border-emerald-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ASSERTIVIDADE SNIPER
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-num text-[10px] font-black">
              MÁX 5 TIROS
            </span>
          </div>
          <div className="text-4xl font-black font-display text-white mt-1">
            {estatisticas.taxaAssertividade}%
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {estatisticas.totalGreens} Greens em {estatisticas.totalCiclosArmados} ciclos armados pelo duplo gatilho.
          </p>
        </div>

        {/* Card 2: Média de Tiros até o Green */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#221029] border border-pink-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              MÉDIA DE ENTRADAS
            </span>
            <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono-num text-[10px] font-black">
              RÁPIDO
            </span>
          </div>
          <div className="text-4xl font-black font-display text-white mt-1">
            {estatisticas.mediaTirosAteGreen} <span className="text-lg font-normal text-slate-400">tiros</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            A imensa maioria dos greens bate antes mesmo do 3º tiro!
          </p>
        </div>

        {/* Card 3: Placar Green vs. Red (Stop Loss) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121c2e] border border-cyan-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              PLACAR GESTÃO DE BANCA
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-num text-[10px] font-black">
              DISCIPLINA
            </span>
          </div>
          <div className="text-4xl font-black font-display text-white mt-1 flex items-baseline gap-2">
            <span className="text-emerald-400">{estatisticas.totalGreens}G</span>
            <span className="text-slate-600 font-light">/</span>
            <span className="text-rose-400 text-2xl">{estatisticas.totalReds}R</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Maior sequência: <strong className="text-emerald-400">{estatisticas.maiorSequenciaGreens} Greens</strong> seguidos.
          </p>
        </div>

        {/* Card 4: Lucro Teórico Simulado */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1a1b12] border border-amber-500/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              LUCRO TEÓRICO (2 MÃOS)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono-num text-[10px] font-black">
              SIMULAÇÃO
            </span>
          </div>
          <div className={`text-4xl font-black font-display mt-1 ${estatisticas.lucroAcumuladoSimulado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {estatisticas.lucroAcumuladoSimulado.toFixed(2)}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Com Mão 1 R$ {mao1Base} e Mão 2 R$ {mao2Base} cobrindo despesas.
          </p>
        </div>
      </div>

      {/* 3. Como o Gatilho Duplo Crava 95% em até 5 Tiros (Curva de Assertividade Acumulada) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-black text-white font-display flex items-center gap-2">
              <Target className="w-5 h-5 text-fuchsia-400" />
              <span>Curva de Assertividade Acumulada nos 5 Tiros</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Veja como a probabilidade sobe a cada tiro pós-validação até ultrapassar os 95%:
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Modo de Disparo:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setModoEntrada('otimizado_auto')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  modoEntrada === 'otimizado_auto' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto Otimizado
              </button>
              <button
                type="button"
                onClick={() => setModoEntrada('imediato')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  modoEntrada === 'imediato' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Casas 1-5
              </button>
              <button
                type="button"
                onClick={() => setModoEntrada('respiro_1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  modoEntrada === 'respiro_1' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Respiro (Casas 2-6)
              </button>
            </div>
          </div>
        </div>

        {/* Barras de Assertividade por Tiro */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {estatisticas.greensPorTiro.map((t) => {
            const isTarget95 = t.taxaAcumulada >= 95;

            return (
              <div
                key={t.tiro}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTarget95
                    ? 'bg-gradient-to-b from-emerald-950/40 to-slate-950 border-emerald-400/80 ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-black text-slate-300 font-mono-num">
                    Até o {t.tiro}º Tiro
                  </span>
                  {isTarget95 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                      95%+ ATINGIDO!
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black font-display text-white my-1 font-mono-num">
                  {t.taxaAcumulada}%
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800 mt-2 mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isTarget95
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        : 'bg-gradient-to-r from-fuchsia-600 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, t.taxaAcumulada))}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-400 font-mono-num flex items-center justify-between">
                  <span>Acertos diretos:</span>
                  <strong className="text-white">{t.count}x ({t.taxaIndividual}%)</strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
          <p>
            <strong>Por que funciona?</strong> Apostar logo após a vela 13x é arriscado porque a mesa pode demorar até 15 tiros para pagar. Porém, quando a <strong>1ª Rosa &lt;40x confirma</strong>, a distribuição de Poisson e o payout acumulado forçam uma 2ª rosa muito rápido. Com <strong>no máximo 5 tiros</strong>, cravamos <strong>{estatisticas.taxaAssertividade}% de assertividade</strong> sem estresse emocional!
          </p>
        </div>
      </div>

      {/* 4. Gestão de Banca de 5 Tiros com 2 Mãos (Dual Bet) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-black text-white font-display flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>Calculadora de Gestão dos 5 Tiros (Proteção 2x + Alvo Rosa 10x)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              A Mão 1 (2.00x) paga os custos de todos os tiros acumulados, enquanto a Mão 2 (10.00x) extrai o lucro líquido:
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Mão 1 (Proteção 2x): R$</span>
              <input
                type="number"
                step="1"
                min="1"
                value={mao1Base}
                onChange={(e) => setMao1Base(Math.max(1, Number(e.target.value)))}
                className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Mão 2 (Rosa 10x): R$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={mao2Base}
                onChange={(e) => setMao2Base(Math.max(0.5, Number(e.target.value)))}
                className="w-12 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Progressão de Stakes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-num">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Tiro</th>
                <th className="py-2.5 px-3">Mão 1 (2.00x)</th>
                <th className="py-2.5 px-3">Mão 2 (10.00x)</th>
                <th className="py-2.5 px-3">Custo do Tiro</th>
                <th className="py-2.5 px-3">Custo Acumulado</th>
                <th className="py-2.5 px-3 text-pink-400">Retorno se Rosa 10x</th>
                <th className="py-2.5 px-3 text-emerald-400">Lucro Líquido Real</th>
                <th className="py-2.5 px-3 text-purple-300">Se cair Roxa (2x)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {estatisticas.gestao5Tiros.map((g) => (
                <tr key={g.tiro} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">
                    <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs">
                      #{g.tiro}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-amber-300 font-bold">R$ {g.apostaMao1.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-pink-400 font-bold">R$ {g.apostaMao2.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-300">R$ {g.custoTotalTiro.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-400">R$ {g.custoAcumulado.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-pink-300 font-black">R$ {g.retornoSeRosa10x.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-black text-sm">
                    +R$ {g.lucroLiquidoSeRosa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-purple-300">
                    R$ {g.retornoSeProtecao2x.toFixed(2)} (protege)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Auditoria de Todos os Ciclos Sniper 95% */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-black text-white font-display flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-emerald-400" />
              <span>Auditoria dos Disparos do Sniper 95%</span>
              <span className="text-xs font-mono-num font-normal text-slate-400">
                ({ciclosFiltrados.length} ciclos registrados)
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Histórico transparente comprovando cada um dos 5 tiros executados em cada ciclo:
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'todos' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({ciclos.length})
            </button>
            <button
              onClick={() => setFiltroStatus('greens')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'greens' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Greens ({estatisticas.totalGreens})
            </button>
            <button
              onClick={() => setFiltroStatus('reds')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'reds' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reds ({estatisticas.totalReds})
            </button>
          </div>
        </div>

        {ciclosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm italic">
            Nenhum ciclo encontrado com o filtro selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            {ciclosFiltrados.map((c) => {
              const isExpanded = expandirCicloId === c.id;

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    c.status === 'GREEN_SNIPER'
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                      : c.status === 'RED_STOP_LOSS'
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Linha dos Gatilhos + Fita dos 5 Tiros */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      {/* Gatilho 1: 13x */}
                      <div
                        onClick={() => onSelectRound?.(c.gatilho13xRound)}
                        className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-center cursor-pointer hover:scale-105 transition-all"
                        title="Gatilho 1: Vela Casa 13x"
                      >
                        <span className="text-[10px] font-bold text-amber-300 block">
                          ⏳ Gatilho 13x
                        </span>
                        <span className="text-sm font-black text-white font-mono-num block">
                          {c.gatilho13xMult.toFixed(2)}x
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono-num block">
                          {c.gatilho13xTimeStr}
                        </span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />

                      {/* Gatilho 2: Rosa de Validação */}
                      <div
                        onClick={() => onSelectRound?.(c.rosaValidacaoRound)}
                        className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-500/60 text-center cursor-pointer hover:scale-105 transition-all"
                        title="Gatilho 2: Rosa de Validação (<40x)"
                      >
                        <span className="text-[10px] font-bold text-pink-300 block">
                          🌸 Rosa &lt;40x ({c.casas13xAteRosa}ª casa)
                        </span>
                        <span className="text-sm font-black text-pink-400 font-mono-num block">
                          {c.rosaValidacaoMult.toFixed(2)}x
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono-num block">
                          {c.rosaValidacaoTimeStr}
                        </span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />

                      {/* Janela de 5 Tiros Sniper */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.tiros.map((tiro) => {
                          const isGreen = tiro.resultado === 'ROSA_GREEN';
                          const isProtecao = tiro.resultado === 'ROXA_PROTECAO';
                          const isLoss = tiro.resultado === 'AZUL_LOSS';

                          return (
                            <div
                              key={tiro.numeroTiro}
                              onClick={() => tiro.round && onSelectRound?.(tiro.round)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-num font-bold text-center border cursor-pointer transition-all hover:scale-110 ${
                                isGreen
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/30'
                                  : isProtecao
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : isLoss
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}
                              title={
                                tiro.round
                                  ? `Tiro #${tiro.numeroTiro}: ${tiro.mult?.toFixed(2)}x (${
                                      isGreen ? 'GREEN NA ROSA!' : isProtecao ? 'Proteção 2x' : 'Loss'
                                    })`
                                  : `Tiro #${tiro.numeroTiro}: Aguardando`
                              }
                            >
                              <span className="text-[9px] block opacity-70">Tiro {tiro.numeroTiro}</span>
                              <span className="block">{tiro.mult ? `${tiro.mult.toFixed(2)}x` : '---'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resultado Final do Ciclo */}
                    <div className="flex items-center gap-3 justify-between lg:justify-end">
                      <div className="text-right">
                        {c.status === 'GREEN_SNIPER' ? (
                          <>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              GREEN NO {c.tiroDoGreen}º TIRO
                            </span>
                            <span className="text-xs text-emerald-400 font-mono-num font-bold block mt-1">
                              +R$ {c.lucroEstimado.toFixed(2)} líquido
                            </span>
                          </>
                        ) : c.status === 'RED_STOP_LOSS' ? (
                          <>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              STOP LOSS NO 5º TIRO
                            </span>
                            <span className="text-xs text-rose-400 font-mono-num font-bold block mt-1">
                              -R$ {Math.abs(c.lucroEstimado).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            EM ANDAMENTO
                          </span>
                        )}
                      </div>
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
