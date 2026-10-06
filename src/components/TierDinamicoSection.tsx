import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  calcularAnaliseTierDinamico,
  TierRosaId,
  TIERS_ROSA_CONFIG,
  VelaTierDinamicoItem,
} from '../utils/analysisEngine';
import {
  Hourglass,
  Clock,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface TierDinamicoSectionProps {
  rounds: CrashRound[];
  tierId: TierRosaId;
  onSelectRound?: (round: CrashRound) => void;
}

export const TierDinamicoSection: React.FC<TierDinamicoSectionProps> = ({
  rounds,
  tierId,
  onSelectRound,
}) => {
  const [velaExpandidaId, setVelaExpandidaId] = useState<string | null>(null);
  const [filtroStatusProjecao, setFiltroStatusProjecao] = useState<
    'todos' | 'green' | 'loss' | 'pendente'
  >('todos');

  const config = TIERS_ROSA_CONFIG[tierId] || TIERS_ROSA_CONFIG['20x'];

  // Gestão de 2 Mãos personalizada para este Tier
  const [apostaMao1, setApostaMao1] = useState<number>(5.0);
  const [alvoMao1, setAlvoMao1] = useState<number>(2.0);
  const [apostaMao2, setApostaMao2] = useState<number>(2.0);
  const [alvoMao2, setAlvoMao2] = useState<number>(config.alvoMult);

  const { velas, estatisticas } = useMemo(() => {
    return calcularAnaliseTierDinamico(rounds, tierId);
  }, [rounds, tierId]);

  // Filtro de velas por status da projeção
  const velasFiltradas = useMemo(() => {
    if (filtroStatusProjecao === 'todos') return velas;
    return velas.filter((v) => {
      if (filtroStatusProjecao === 'green') {
        return v.projecoes.some((p) => p.status === 'GREEN' || p.status === 'SUPER_GREEN');
      }
      if (filtroStatusProjecao === 'loss') {
        return v.projecoes.some((p) => p.status === 'LOSS');
      }
      if (filtroStatusProjecao === 'pendente') {
        return v.projecoes.some((p) => p.status === 'PENDENTE');
      }
      return true;
    });
  }, [velas, filtroStatusProjecao]);

  // Cores temáticas conforme o Tier
  const corBadgeTema = {
    amber: 'from-amber-500 to-yellow-600 text-amber-100 border-amber-500/40',
    pink: 'from-pink-500 to-rose-600 text-pink-100 border-pink-500/40',
    fuchsia: 'from-fuchsia-500 to-purple-600 text-fuchsia-100 border-fuchsia-500/40',
    purple: 'from-purple-500 to-indigo-600 text-purple-100 border-purple-500/40',
    rose: 'from-rose-500 to-pink-600 text-rose-100 border-rose-500/40',
    emerald: 'from-emerald-500 to-teal-600 text-emerald-100 border-emerald-500/40',
  }[config.temaCor];

  // Cálculos da Gestão Dual Bet
  const custoPorTiro = apostaMao1 + apostaMao2;
  const retornoProtecao = apostaMao1 * alvoMao1;
  const retornoAlvo = apostaMao2 * alvoMao2;
  const lucroAlvoBatido = retornoAlvo + retornoProtecao - custoPorTiro;

  return (
    <div className="space-y-6">
      {/* 1. RADAR DE ENTRADA ATIVA COM AMPULHETA (QUANDO PROGRAMADA/ATIVA) */}
      {estatisticas.temEntradaAtiva && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/70 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative overflow-hidden animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
                <Hourglass className="w-7 h-7 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                    ⏳ ENTRADA PROGRAMADA ATIVA
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    {config.label} ({config.badgeLabel})
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  Janela de Disparo Iminente Identificada pelo Algoritmo
                </h3>
                <p className="text-xs text-amber-200/90 mt-1 max-w-3xl leading-relaxed">
                  {estatisticas.motivoEntrada}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-950/80 px-4 py-3 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Recomendação Cirúrgica
              </span>
              <span className="text-xs font-black text-emerald-400">
                Máximo de {config.janelaCasas} Tiros
              </span>
              <span className="text-[11px] text-amber-300 font-mono-num">
                Mão 1: {alvoMao1.toFixed(2)}x | Mão 2: {alvoMao2.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANNER PRINCIPAL DO TIER: TERMÔMETRO DINÂMICO DE AUSÊNCIA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#100c1e] to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r ${corBadgeTema} shadow-lg flex items-center gap-1`}>
                <Target className="w-3.5 h-3.5" />
                {config.label}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {config.badgeLabel} — {config.sublabel}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Análise & Projeção Dinâmica ({config.badgeLabel})</span>
              {estatisticas.temEntradaAtiva && (
                <span className="text-amber-400 text-lg flex items-center gap-1 font-sans text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  <Hourglass className="w-3.5 h-3.5 animate-spin" />
                  Ampulheta Armada
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              {config.descricaoEstrategica} Os cálculos usam a média histórica real auditada no dia, sem valores fixos.
            </p>
          </div>

          {/* Status do Termômetro */}
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[11px] text-slate-400 mb-1">Status de Pressão do Tier:</span>
            <div className="flex items-center gap-2">
              {estatisticas.estadoRecovery === 'CRITICO' && (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ZONA CRÍTICA: ATRASO SEVERO (&gt;115%)
                </span>
              )}
              {estatisticas.estadoRecovery === 'ZONA_QUENTE' && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                  <Flame className="w-4 h-4 text-amber-400" />
                  ZONA QUENTE: DISPARAR ENTRADA (&gt;85%)
                </span>
              )}
              {estatisticas.estadoRecovery === 'AQUECENDO' && (
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  AQUECENDO (&gt;50% da média)
                </span>
              )}
              {estatisticas.estadoRecovery === 'NORMAL' && (
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  NORMAL (Paga Recentemente)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono-num mt-1">
              Ausência Atual: <strong>{estatisticas.ausenciaAtualRodadas} rodadas</strong> ({estatisticas.tempoDesdeUltimaStr})
            </span>
          </div>
        </div>

        {/* Barra do Termômetro Dinâmico */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num mb-1.5">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Termômetro Dinâmico de Ausência (vs. Média do Dia):
            </span>
            <span>
              {estatisticas.ausenciaAtualRodadas} / {estatisticas.mediaAusenciaRodadas} rodadas ({estatisticas.percentualTermometro}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                estatisticas.estadoRecovery === 'CRITICO'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse'
                  : estatisticas.estadoRecovery === 'ZONA_QUENTE'
                  ? 'bg-gradient-to-r from-purple-500 to-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${estatisticas.percentualTermometro}%` }}
            />
          </div>
        </div>

        {/* Grid de Métricas do Tier */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2">
          {/* Total de Velas */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Total no Dia ({config.badgeLabel})</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono-num">
                {estatisticas.total}
              </span>
              <span className="text-[10px] text-slate-400">ocorrências</span>
            </div>
          </div>

          {/* Média de Intervalo */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Intervalo Médio Real</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono-num">
                {estatisticas.mediaAusenciaRodadas}
              </span>
              <span className="text-[10px] text-slate-400">rodadas</span>
            </div>
          </div>

          {/* Maior Vela da Faixa */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Maior Multiplicador no Tier</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono-num">
                {estatisticas.maiorDoDia > 0 ? `${estatisticas.maiorDoDia.toFixed(2)}x` : '--'}
              </span>
              {estatisticas.horaMaiorDoDia !== '--:--' && (
                <span className="text-[10px] text-slate-400 font-mono-num">({estatisticas.horaMaiorDoDia})</span>
              )}
            </div>
          </div>

          {/* Maior Seca do Dia */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Maior Seca Registrada</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono-num">
                {estatisticas.maiorAusenciaRodadas}
              </span>
              <span className="text-[10px] text-slate-400">rodadas</span>
            </div>
          </div>
        </div>

        {/* Minutos Mais Frequentes */}
        {estatisticas.minutosMaisFrequentes.length > 0 && (
          <div className="pt-4 mt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-300 font-bold block mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Minutos do Relógio Mais Pagadores para {config.badgeLabel} Hoje:
            </span>
            <div className="flex flex-wrap gap-2">
              {estatisticas.minutosMaisFrequentes.map((m) => (
                <div
                  key={m.minuto}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 font-mono-num"
                >
                  <span className="text-xs font-bold text-amber-300">
                    Min :{m.minuto < 10 ? `0${m.minuto}` : m.minuto}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-bold">
                    {m.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. CALCULADORA DE GESTÃO DUAL BET PARA ESTE TIER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-black font-display text-white">
              Gestão das 2 Mãos Estratégica ({config.badgeLabel})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Mão 1 recupera o tiro no 2.00x | Mão 2 busca o alvo do Tier ({config.alvoMult.toFixed(0)}x+)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mão 1: Valor */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">1ª Aposta (Proteção 2x)</span>
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

          {/* Mão 1: Auto Cashout */}
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

          {/* Mão 2: Valor */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">2ª Aposta (Alvo {config.badgeLabel})</span>
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

          {/* Mão 2: Auto Cashout */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Auto Cashout Mão 2</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="1"
                min="5"
                value={alvoMao2}
                onChange={(e) => setAlvoMao2(Math.max(5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-pink-400 font-bold focus:outline-none focus:border-pink-400"
              />
              <span className="text-xs text-slate-400">x</span>
            </div>
          </div>
        </div>

        {/* Resumo da Gestão em 1 Tiro e com {config.janelaCasas} Tiros */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-num">
          <div>
            <span className="text-slate-400 block">Custo por Tiro:</span>
            <span className="font-bold text-white">R$ {custoPorTiro.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Se bater só a Proteção ({alvoMao1}x):</span>
            <span className={`font-bold ${retornoProtecao >= custoPorTiro ? 'text-emerald-400' : 'text-rose-400'}`}>
              Retorna R$ {retornoProtecao.toFixed(2)} (Saldo: {(retornoProtecao - custoPorTiro >= 0 ? '+' : '')}R$ {(retornoProtecao - custoPorTiro).toFixed(2)})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Lucro Líquido no Alvo ({alvoMao2}x):</span>
            <span className="font-black text-emerald-400 text-sm">
              + R$ {lucroAlvoBatido.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. LISTA AUDITADA DE TODAS AS VELAS DO TIER E PROJEÇÕES RÁPIDAS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" />
              Histórico de Velas {config.badgeLabel} e Projeções Rápidas
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer vela para expandir a anatomia dos 10 minutos anteriores e as projeções futuras de repetição.
            </p>
          </div>

          {/* Filtro de Status das Projeções */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['todos', 'green', 'loss', 'pendente'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatusProjecao(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                  filtroStatusProjecao === st
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {velasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Hourglass className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-sm font-semibold">Nenhuma vela da faixa {config.badgeLabel} encontrada com o filtro selecionado.</p>
            <p className="text-xs text-slate-400">O sistema monitora continuamente as próximas rodadas em tempo real.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {velasFiltradas.map((v) => {
              const isExpanded = velaExpandidaId === v.id;
              const totalGreens = v.projecoes.filter(
                (p) => p.status === 'GREEN' || p.status === 'SUPER_GREEN'
              ).length;

              return (
                <div
                  key={v.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                >
                  {/* Linha Resumo da Vela */}
                  <div
                    onClick={() => setVelaExpandidaId(isExpanded ? null : v.id)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg font-mono-num font-black text-sm bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {v.mult.toFixed(2)}x
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono-num">
                            {v.timeStr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-num">
                            • Ausência: {v.ausenciaRodadas} rodadas ({v.ausenciaTempoStr})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Pré-10m: {v.pre10m.totalRosas} rosas (Maior: {v.pre10m.maiorRosa > 0 ? `${v.pre10m.maiorRosa.toFixed(2)}x` : '--'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <div className="flex items-center gap-1">
                        {v.projecoes.map((p, idx) => (
                          <span
                            key={idx}
                            title={`+${p.offsetMin}m (${p.tempoAlvoStr}): ${p.status}`}
                            className={`w-6 h-6 rounded-md text-[10px] font-mono-num font-black flex items-center justify-center border ${
                              p.status === 'SUPER_GREEN'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : p.status === 'GREEN'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : p.status === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            {p.status === 'SUPER_GREEN'
                              ? 'SG'
                              : p.status === 'GREEN'
                              ? 'G'
                              : p.status === 'LOSS'
                              ? 'L'
                              : 'P'}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] font-bold text-emerald-400 font-mono-num px-2">
                        {totalGreens}/{v.projecoes.length} Green
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Painel Expandido */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Anatomia Prévia */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Anatomia Pré-10 Minutos
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            Total de Rosas: <strong className="text-pink-400">{v.pre10m.totalRosas}</strong> | Maior Rosa: <strong className="text-pink-400">{v.pre10m.maiorRosa > 0 ? `${v.pre10m.maiorRosa.toFixed(2)}x` : '--'}</strong> | Maior Roxa: <strong className="text-purple-400">{v.pre10m.maiorRoxa > 0 ? `${v.pre10m.maiorRoxa.toFixed(2)}x` : '--'}</strong>
                          </p>
                        </div>

                        {/* Detalhe da Vela */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                            Janela Estratégica Pós-Vela
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            Projeções calculadas em <strong className="text-amber-300">+{config.offsetsMinutos.join('m, +')}m</strong> pós-vela com {config.janelaCasas} tiros de auditoria.
                          </p>
                        </div>
                      </div>

                      {/* Lista de Projeções Detalhadas */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          Auditoria das Projeções Futuras (+Minutos):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                          {v.projecoes.map((p, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1 font-mono-num ${
                                p.status === 'SUPER_GREEN'
                                  ? 'bg-amber-500/10 border-amber-500/30'
                                  : p.status === 'GREEN'
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : p.status === 'LOSS'
                                  ? 'bg-rose-500/10 border-rose-500/30'
                                  : 'bg-slate-950 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-300">+{p.offsetMin} min</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                    p.status === 'SUPER_GREEN'
                                      ? 'bg-amber-500 text-slate-950'
                                      : p.status === 'GREEN'
                                      ? 'bg-emerald-500 text-slate-950'
                                      : p.status === 'LOSS'
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Horário: {p.tempoAlvoStr}
                              </span>
                              {p.maiorMult ? (
                                <span className="text-[10px] text-slate-300">
                                  Maior: <strong>{p.maiorMult.toFixed(2)}x</strong>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Aguardando</span>
                              )}
                            </div>
                          ))}
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
