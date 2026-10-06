import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  calcularAnalise100xA1000x,
  Vela100xItem,
  Faixa100x,
  TierRosaId,
  calcularStatusTodosTiers,
  TIERS_ROSA_CONFIG,
} from '../utils/analysisEngine';
import { TierDinamicoSection } from './TierDinamicoSection';
import { PosLimite100xSection } from './PosLimite100xSection';
import {
  Sparkles,
  Flame,
  Crown,
  Clock,
  Shield,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Filter,
  Hourglass,
} from 'lucide-react';

interface Velas100xA1000xViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const Velas100xA1000xView: React.FC<Velas100xA1000xViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [subAbaAtiva, setSubAbaAtiva] = useState<TierRosaId>('todas_100x');
  const [filtroFaixa, setFiltroFaixa] = useState<Faixa100x | 'todas'>('todas');
  const [velaExpandidaId, setVelaExpandidaId] = useState<string | null>(null);

  // Status de todos os Tiers em tempo real para indicar Ampulheta ⏳
  const statusTodosTiers = useMemo(() => {
    return calcularStatusTodosTiers(rounds);
  }, [rounds]);

  // Gestão de 2 Mãos configurável para 100x
  const [apostaMao1, setApostaMao1] = useState<number>(5.0);
  const [alvoMao1, setAlvoMao1] = useState<number>(2.0);
  const [apostaMao2, setApostaMao2] = useState<number>(2.0);
  const [alvoMao2, setAlvoMao2] = useState<number>(100.0);

  const { velas, estatisticas } = useMemo(() => {
    return calcularAnalise100xA1000x(rounds);
  }, [rounds]);

  const velasFiltradas = useMemo(() => {
    if (filtroFaixa === 'todas') return velas;
    return velas.filter((v) => v.faixa === filtroFaixa);
  }, [velas, filtroFaixa]);

  // Cálculos da Gestão de 2 Mãos
  const custoPorTiro = apostaMao1 + apostaMao2;
  const retornoProtecao = apostaMao1 * alvoMao1;
  const retornoAlvo = apostaMao2 * alvoMao2;
  const lucroAlvoBatido = retornoAlvo + retornoProtecao - custoPorTiro;

  return (
    <div className="space-y-6">
      {/* SELETOR DE SUB-ABAS DE TIERS (100x-1000x, 10x, 20x, 30x, 40x, 50x) COM AMPULHETA ⏳ */}
      <div className="p-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between gap-2 px-2 pb-2 mb-2 border-b border-slate-800 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-400" />
            Selecione a Faixa de Velas / Sub-Aba:
          </span>
          <span className="text-[11px] text-amber-300 font-mono-num flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5 animate-spin" />
            Ampulheta ⏳ = Entrada Programada / Janela Ativa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {(['todas_100x', 'pos_limite_100x', '10x', '20x', '30x', '40x', '50x'] as TierRosaId[]).map((tId) => {
            const st = statusTodosTiers[tId];
            const cfg = TIERS_ROSA_CONFIG[tId];
            const isSelected = subAbaAtiva === tId;
            const temEntrada = st?.temEntradaAtiva;

            return (
              <button
                key={tId}
                type="button"
                onClick={() => setSubAbaAtiva(tId)}
                className={`flex flex-col justify-between p-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border relative text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-600 via-purple-600 to-pink-600 text-white shadow-lg border-amber-400/60 ring-2 ring-amber-400/40'
                    : temEntrada
                    ? 'bg-amber-950/40 text-amber-200 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-extrabold truncate">{cfg.label}</span>
                  {temEntrada && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950 shadow-md">
                      <Hourglass className="w-2.5 h-2.5 animate-spin" />
                      ⏳ ENTRADA
                    </span>
                  )}
                </div>

                <div className="text-[10px] opacity-80 flex items-center justify-between font-mono-num mt-1">
                  <span className="truncate">{cfg.badgeLabel}</span>
                  <span className="font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                    {st?.total || 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL CONFORME A SUB-ABA SELECIONADA */}
      {subAbaAtiva === 'pos_limite_100x' ? (
        <PosLimite100xSection rounds={rounds} onSelectRound={onSelectRound} />
      ) : subAbaAtiva !== 'todas_100x' ? (
        <TierDinamicoSection
          rounds={rounds}
          tierId={subAbaAtiva}
          onSelectRound={onSelectRound}
        />
      ) : (
        /* CONTEÚDO ORIGINAL DA SUB-ABA 100x A 1000x */
        <>
          {/* Radar de Entrada Ativa 100x com Ampulheta ⏳ */}
          {statusTodosTiers['todas_100x']?.temEntradaAtiva && (
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
                        100x a 1000x (Centenas & Milhares)
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                      Momento de Recuperação e Retenção do Algoritmo Disparado
                    </h3>
                    <p className="text-xs text-amber-200/90 mt-1 max-w-3xl leading-relaxed">
                      {statusTodosTiers['todas_100x'].motivoEntrada}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-950/80 px-4 py-3 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Estratégia Recomendada
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    5 Tiros com Proteção em 2.00x
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono-num">
                    Alvo Mão 2: 100.00x+
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Banner Principal: 100X RECOVERY & Termômetro de Ausência */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#100c1e] to-slate-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                100X (RECOVERY & SUPER VELAS)
              </span>
              <span className="text-xs text-slate-400">
                Caçador de Velas 100.00x a 1000.00x+ (Centena e Milhar)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Análise e Projeção de Velas 100x a 1000x
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Monitore a ausência em tempo real, identifique o momento estatístico de recuperação
              (Recovery), analise a base dos 10 minutos anteriores e audite os ciclos de repetição.
            </p>
          </div>

          {/* Status do Termômetro de Recuperação */}
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[11px] text-slate-400 mb-1">Status de Recuperação Atual:</span>
            <div className="flex items-center gap-2">
              {estatisticas.estadoRecovery === 'CRITICO' && (
                <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ZONA CRÍTICA: RECOVERY MÁXIMO
                </span>
              )}
              {estatisticas.estadoRecovery === 'ZONA_QUENTE' && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                  <Flame className="w-4 h-4 text-amber-400" />
                  ZONA QUENTE: ALTA PROBABILIDADE
                </span>
              )}
              {estatisticas.estadoRecovery === 'AQUECENDO' && (
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  MERCADO AQUECENDO (&gt;60 rodadas)
                </span>
              )}
              {estatisticas.estadoRecovery === 'NORMAL' && (
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  MERCADO NORMAL (Recente)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono-num mt-1">
              Ausência: <strong>{estatisticas.ausenciaAtualRodadas} rodadas</strong> ({estatisticas.tempoDesdeUltimaStr})
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Termômetro */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num mb-1.5">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Termômetro de Pressão para Próxima 100x+:
            </span>
            <span>
              {estatisticas.ausenciaAtualRodadas} / 140 rodadas ({estatisticas.percentualTermometro}%)
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

        {/* Grid de Métricas Principais (Sem barra de rolagem) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2">
          {/* Maior do Dia */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30">
            <span className="text-[10px] text-slate-400 block mb-0.5">Maior Vela do Dia</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono-num">
                {estatisticas.maiorDoDia > 0 ? `${estatisticas.maiorDoDia.toFixed(2)}x` : '--'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono-num">
                ({estatisticas.horaMaiorDoDia})
              </span>
            </div>
          </div>

          {/* Total de 100x+ */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Total Velas ≥ 100x</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono-num">
                {estatisticas.total}
              </span>
              <span className="text-[10px] text-pink-400 font-semibold">
                no histórico carregado
              </span>
            </div>
          </div>

          {/* Média de Ausência */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Média entre 100x</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono-num">
                {estatisticas.mediaAusenciaRodadas}
              </span>
              <span className="text-[10px] text-slate-500">rodadas</span>
            </div>
          </div>

          {/* Maior Seca do Dia */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">Maior Seca do Dia</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono-num">
                {estatisticas.maiorAusenciaRodadas}
              </span>
              <span className="text-[10px] text-slate-500">rodadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Distribuição por Faixa & Minutos Mais Frequentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribuição por Faixas de Multiplicador */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 mb-3">
            <Target className="w-3.5 h-3.5 text-pink-400" />
            Distribuição de Super Velas por Categoria:
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-pink-500/30">
              <span className="text-[10px] text-slate-400 block">100x a 249x</span>
              <span className="text-lg font-black text-pink-400 font-mono-num">
                {estatisticas.total100x_249x}
              </span>
              <span className="text-[10px] text-slate-500 block">Centenas Iniciais</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/30">
              <span className="text-[10px] text-slate-400 block">250x a 499x</span>
              <span className="text-lg font-black text-rose-400 font-mono-num">
                {estatisticas.total250x_499x}
              </span>
              <span className="text-[10px] text-slate-500 block">Centenas Altas</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-fuchsia-500/30">
              <span className="text-[10px] text-slate-400 block">500x a 999x</span>
              <span className="text-lg font-black text-fuchsia-400 font-mono-num">
                {estatisticas.total500x_999x}
              </span>
              <span className="text-[10px] text-slate-500 block">Super Rosas</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/40">
              <span className="text-[10px] text-slate-400 block">1000x+ (Milhar)</span>
              <span className="text-lg font-black text-amber-400 font-mono-num">
                {estatisticas.total1000x_mais}
              </span>
              <span className="text-[10px] text-amber-500/80 block">Épicas do Dia</span>
            </div>
          </div>
        </div>

        {/* Minutos Mais Pagadores de 100x+ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Minutos Mais Frequentes (00-59):
          </h3>
          {estatisticas.minutosMaisFrequentes.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              Nenhuma vela ≥ 100x encontrada no dia até o momento.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {estatisticas.minutosMaisFrequentes.map((m) => (
                <div
                  key={m.minuto}
                  className="p-2 rounded-xl bg-slate-950 border border-amber-500/20 text-center"
                >
                  <span className="text-xs font-black text-amber-300 font-mono-num block">
                    :{String(m.minuto).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-num">
                    {m.count} {m.count === 1 ? 'vela' : 'velas'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seção 3: Calculadora de Gestão das 2 Mãos para 100x a 1000x */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Gestão Estratégica das 2 Mãos (Caçador de 100x a 1000x)
              </h3>
              <p className="text-[11px] text-slate-400">
                A 1ª mão protege o capital da rodada enquanto a 2ª mão busca o multiplicador épico.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mão 1: Proteção */}
          <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1 mb-2">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              1ª Aposta (Proteção)
            </span>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Valor (R$):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={apostaMao1}
                  onChange={(e) => setApostaMao1(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Auto-Retirada (x):</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="5.0"
                  value={alvoMao1}
                  onChange={(e) => setAlvoMao1(Math.max(1.1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Mão 2: Alvo 100x a 1000x */}
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              2ª Aposta (Alvo 100x+)
            </span>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Valor (R$):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={apostaMao2}
                  onChange={(e) => setApostaMao2(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Alvo Proposto (x):</label>
                <select
                  value={alvoMao2}
                  onChange={(e) => setAlvoMao2(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={50}>50.00x</option>
                  <option value={100}>100.00x</option>
                  <option value={200}>200.00x</option>
                  <option value={300}>300.00x</option>
                  <option value={500}>500.00x</option>
                  <option value={1000}>1000.00x</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resumo da Rodada */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">Custo & Retorno</span>
            <div className="space-y-1.5 text-[11px] font-mono-num">
              <div className="flex justify-between text-slate-400">
                <span>Custo por Tiro:</span>
                <strong className="text-white">R$ {custoPorTiro.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retorno Proteção:</span>
                <strong className="text-purple-400">R$ {retornoProtecao.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retorno Alvo ({alvoMao2}x):</span>
                <strong className="text-amber-400">R$ {retornoAlvo.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Lucro Potencial da Super Vela */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-pink-500/10 border border-amber-500/40 flex flex-col justify-between">
            <span className="text-xs font-black text-amber-300 block">Lucro Líquido no Alvo:</span>
            <div>
              <span className="text-2xl font-black text-emerald-400 font-mono-num block">
                +R$ {lucroAlvoBatido.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400">
                Retorno estimado com Proteção + Alvo {alvoMao2}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4: Lista Auditada de Todas as Velas 100x a 1000x */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase text-white">
              Velas Centenas e Milhares do Dia ({velasFiltradas.length}):
            </h3>
          </div>

          {/* Filtro de Faixa */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            {(['todas', '100x_249x', '250x_499x', '500x_999x', '1000x_mais'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltroFaixa(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filtroFaixa === f
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f === 'todas'
                  ? 'Todas'
                  : f === '100x_249x'
                  ? '100x-249x'
                  : f === '250x_499x'
                  ? '250x-499x'
                  : f === '500x_999x'
                  ? '500x-999x'
                  : '1000x+'}
              </button>
            ))}
          </div>
        </div>

        {velasFiltradas.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">Nenhuma vela nesta faixa encontrada hoje.</p>
            <p className="text-xs text-slate-500 mt-1">
              O sistema continua monitorando em tempo real as rodadas do dia desde as 00:00:01.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {velasFiltradas.map((v) => {
              const isExpanded = velaExpandidaId === v.id;
              return (
                <div
                  key={v.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg"
                >
                  {/* Linha Principal da Vela */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onSelectRound?.(v.round)}
                        className={`px-3 py-2 rounded-xl border text-xl font-black font-mono-num cursor-pointer hover:scale-105 transition-all ${v.faixaCor}`}
                        title="Clique para inspecionar rodada completa"
                      >
                        {v.mult.toFixed(2)}x
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {v.timeStr}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border bg-slate-950 text-slate-300 border-slate-800">
                            {v.faixaNome}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono-num mt-0.5">
                          Ausência anterior: <strong>{v.ausenciaRodadas} rodadas</strong> ({v.ausenciaTempoStr})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setVelaExpandidaId(isExpanded ? null : v.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Ocultar Projeções <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Ver Projeções & Pré-10m <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos: Pré-10 Minutos & Projeções de Repetição */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                      {/* Base de Teto dos 10 minutos anteriores */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                          Anatomia Prévia (10 minutos antes desta quebra):
                        </span>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono-num">
                          <span>
                            Rosas nos 10m: <strong className="text-pink-400">{v.pre10m.totalRosas}</strong>
                          </span>
                          <span>
                            Maior Rosa Prévia:{' '}
                            <strong className="text-white">
                              {v.pre10m.maiorRosa > 0 ? `${v.pre10m.maiorRosa.toFixed(2)}x` : 'Nenhuma'}
                            </strong>
                          </span>
                          <span>
                            Maior Roxa Prévia:{' '}
                            <strong className="text-purple-400">
                              {v.pre10m.maiorRoxa > 0 ? `${v.pre10m.maiorRoxa.toFixed(2)}x` : 'Nenhuma'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* As 5 Projeções Temporais (+15m, +30m, +45m, +60m, +90m) em Grade 2x2 ou 5 cols */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-2">
                          Ciclos de Projeção Pós-Super Vela (Auditoria de Repetição):
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {v.projecoes.map((p) => {
                            let statusClass = 'border-slate-800 bg-slate-950/60 text-slate-400';
                            let statusBadge = 'AGUARDANDO';

                            if (p.status === 'SUPER_GREEN') {
                              statusClass = 'border-amber-500/50 bg-amber-500/10 text-amber-300 animate-pulse';
                              statusBadge = `SUPER GREEN (${p.maiorMult?.toFixed(2)}x)`;
                            } else if (p.status === 'GREEN') {
                              statusClass = 'border-pink-500/40 bg-pink-500/10 text-pink-300';
                              statusBadge = `GREEN (${p.maiorMult?.toFixed(2)}x)`;
                            } else if (p.status === 'LOSS') {
                              statusClass = 'border-rose-500/30 bg-rose-500/5 text-rose-400';
                              statusBadge = 'LOSS';
                            }

                            return (
                              <div
                                key={p.offsetMin}
                                className={`p-2.5 rounded-xl border flex flex-col justify-between ${statusClass}`}
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold">+{p.offsetMin}m</span>
                                  <span className="font-mono-num">{p.tempoAlvoStr}</span>
                                </div>

                                <div className="mt-1">
                                  <span className="text-[10px] font-black uppercase block">
                                    {statusBadge}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono-num">
                                    {p.tiros.length} tiros executados
                                  </span>
                                </div>
                              </div>
                            );
                          })}
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
      </>
      )}
    </div>
  );
};
