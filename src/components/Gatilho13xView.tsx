import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CrashRound } from '../types';
import {
  calcularAnaliseGatilho13x,
  calcularDuploGatilho13x,
  CicloGatilho13xItem,
  RosaIntermediariaItem,
  PontoCurvaAssertividade,
} from '../utils/analysisEngine';
import { MonitorDuploGatilhoSection } from './MonitorDuploGatilhoSection';
import { Sniper95DuploGatilhoSection } from './Sniper95DuploGatilhoSection';
import {
  Crosshair,
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Award,
  Layers,
  BarChart3,
  BarChart2,
  Sliders,
  DollarSign,
  Shield,
  ArrowRight,
  Bot,
  Brain,
  RefreshCw,
  Zap,
  TrendingUp,
  Check,
  Activity,
  Filter,
  Eye,
} from 'lucide-react';

interface AiAdvisorResult {
  momentoIdeal: string;
  quantidadeEntradasIdeal: number;
  faixaCasasRecomendada: string;
  protecaoMao1: {
    valorSugerido: string;
    autoCashout: number;
    funcao: string;
  };
  protecaoMao2: {
    valorSugerido: string;
    autoCashout: number;
    funcao: string;
  };
  estrategiaProtecao10x: {
    viavel: boolean;
    comoExecutar: string;
    alvoPrimario: number;
    taxaEsperada: string;
  };
  termometroMomento: string;
  nivelConfiancaPercent: number;
  justificativa: string;
  stopLossAlert: string;
  dicaDeOuro: string;
}

interface Gatilho13xViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const Gatilho13xView: React.FC<Gatilho13xViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  // Parâmetros do Gatilho
  const [minGatilho, setMinGatilho] = useState<number>(13.0);
  const [maxGatilho, setMaxGatilho] = useState<number>(13.99);
  const [alvoMin, setAlvoMin] = useState<number>(50.0);
  const [limiteCasas, setLimiteCasas] = useState<number>(45);

  const [cicloExpandidoId, setCicloExpandidoId] = useState<string | null>(null);

  // Sub-aba Ativa: Sniper 95% vs Monitor Duplo vs Estratégia Padrão
  const [subAbaAtiva, setSubAbaAtiva] = useState<'sniper_95' | 'monitor_duplo' | 'estrategia_padrao'>('sniper_95');

  // Gestão das 2 mãos & Simulador de Entradas
  const [apostaMao1, setApostaMao1] = useState<number>(5.0);
  const [alvoMao1, setAlvoMao1] = useState<number>(2.0); // Proteção que cobre custos
  const [apostaMao2, setApostaMao2] = useState<number>(2.0);
  const [alvoMao2, setAlvoMao2] = useState<number>(10.0); // Proteção em 10x sugerida pelo usuário!
  const [tirosSimulados, setTirosSimulados] = useState<number>(4);

  // Estado da Inteligência Artificial (Gemini 3.8 Flash)
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAdvisorResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);

  // Estados de visualização do Gráfico de Assertividade & Auditoria de Velas
  const [modoGrafico, setModoGrafico] = useState<'linha_temporal' | 'por_tiro' | 'top_velas'>('linha_temporal');
  const [pontoGraficoSelecionadoId, setPontoGraficoSelecionadoId] = useState<string | null>(null);
  const [filtroCiclos, setFiltroCiclos] = useState<'todos' | 'com_rosa_4_tiros' | 'super_rosa_50x' | 'sem_rosa'>('todos');

  const { ciclos, estatisticas } = useMemo(() => {
    return calcularAnaliseGatilho13x(
      rounds,
      minGatilho,
      maxGatilho,
      alvoMin,
      limiteCasas
    );
  }, [rounds, minGatilho, maxGatilho, alvoMin, limiteCasas]);

  const { ciclos: ciclosDuplo, estatisticas: estatisticasDuplo } = useMemo(() => {
    return calcularDuploGatilho13x(
      rounds,
      minGatilho,
      maxGatilho,
      40.0,
      alvoMin,
      limiteCasas
    );
  }, [rounds, minGatilho, maxGatilho, alvoMin, limiteCasas]);

  const pontoGraficoSelecionado = useMemo(() => {
    if (estatisticas.pontosCurvaAssertividade.length === 0) return null;
    if (!pontoGraficoSelecionadoId) {
      return estatisticas.pontosCurvaAssertividade[estatisticas.pontosCurvaAssertividade.length - 1] || null;
    }
    return estatisticas.pontosCurvaAssertividade.find((p) => p.id === pontoGraficoSelecionadoId) || estatisticas.pontosCurvaAssertividade[0];
  }, [pontoGraficoSelecionadoId, estatisticas.pontosCurvaAssertividade]);

  const ciclosFiltrados = useMemo(() => {
    if (filtroCiclos === 'com_rosa_4_tiros') {
      return ciclos.filter((c) => c.bateuRosaEmAte4Tiros);
    }
    if (filtroCiclos === 'super_rosa_50x') {
      return ciclos.filter((c) => c.bateuAlvo);
    }
    if (filtroCiclos === 'sem_rosa') {
      return ciclos.filter((c) => !c.bateuPeloMenosUmaRosa && c.status !== 'PENDENTE');
    }
    return ciclos;
  }, [ciclos, filtroCiclos]);

  const hasRequestedAdvisorRef = useRef(false);

  // Função para consultar a IA ou motor estatístico no backend
  const fetchAiAdvisor = async (forceRefresh = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minGatilho,
          maxGatilho,
          alvoMin,
          estatisticas,
          recentRounds: rounds.slice(0, 30),
          ultimoCiclo: ciclos[0] || null,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error(`Servidor respondeu com status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        setIsAiGenerated(!!data.isAiGenerated);
      } else {
        throw new Error(data.error || 'Falha ao processar resposta');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Falha na conexão');
    } finally {
      setAiLoading(false);
    }
  };

  // Carrega automaticamente uma consultoria quando carregar a página pela primeira vez
  useEffect(() => {
    if (rounds.length > 0 && !aiAnalysis && !aiLoading && !hasRequestedAdvisorRef.current) {
      hasRequestedAdvisorRef.current = true;
      fetchAiAdvisor(false);
    }
  }, [rounds.length, aiAnalysis, aiLoading]);

  // Cálculos da simulação de 2 mãos com proteção em 10x
  const custoPorTiro = apostaMao1 + apostaMao2;
  const custoTotalTiros = custoPorTiro * tirosSimulados;
  // Se bater a Mão 1 (2.00x) em 1 tiro:
  const retornoMao1Em1Tiro = apostaMao1 * alvoMao1;
  // Se bater a Mão 2 (10.00x) no tiro alvo:
  const retornoMao2Rosa10x = apostaMao2 * alvoMao2;
  // Lucro líquido se bater na casa esperada considerando todos os tiros anteriores:
  const lucroLiquidoSeBaterRosa10x = retornoMao2Rosa10x + retornoMao1Em1Tiro - custoTotalTiros;

  return (
    <div className="space-y-6">
      {/* Sub-abas de Navegação da Aba 6: Gatilho 13x */}
      <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Nova Sub-Aba Solicitada: Sniper 95% */}
          <button
            type="button"
            onClick={() => setSubAbaAtiva('sniper_95')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 ${
              subAbaAtiva === 'sniper_95'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-300/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="text-base leading-none animate-bounce">🎯</span>
            <div className="flex items-center gap-2">
              <span>Sub-aba: Sniper 95% (Máx 5 Tiros Rosa)</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                95% ASSERTIVIDADE
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSubAbaAtiva('monitor_duplo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 ${
              subAbaAtiva === 'monitor_duplo'
                ? 'bg-gradient-to-r from-amber-500 via-fuchsia-600 to-purple-600 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-300/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="text-base leading-none">⏳</span>
            <div className="flex items-center gap-2">
              <span>Monitor Duplo Gatilho (13x + Rosa &lt;40x)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSubAbaAtiva('estrategia_padrao')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subAbaAtiva === 'estrategia_padrao'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/30 ring-1 ring-fuchsia-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Estratégia Padrão &amp; Curva (≥50x)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
          <span className="text-amber-400 font-bold">⏳ Ampulheta Ativa:</span>
          <span>Sinalizando todas as velas 13x no sistema</span>
        </div>
      </div>

      {/* Ajustes dos Parâmetros do Gatilho (Compartilhado para as duas sub-abas) */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-bold text-white">Configurar Gatilho &amp; Alvo:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Intervalo do Gatilho */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Casa Gatilho:</span>
            <input
              type="number"
              step="0.1"
              value={minGatilho}
              onChange={(e) => setMinGatilho(Number(e.target.value))}
              className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-fuchsia-400"
            />
            <span className="text-slate-500">a</span>
            <input
              type="number"
              step="0.1"
              value={maxGatilho}
              onChange={(e) => setMaxGatilho(Number(e.target.value))}
              className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-fuchsia-400"
            />
          </div>

          {/* Alvo Mínimo */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Vela Alvo:</span>
            <select
              value={alvoMin}
              onChange={(e) => setAlvoMin(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono-num text-white cursor-pointer focus:outline-none focus:border-fuchsia-400"
            >
              <option value={30}>≥ 30.00x</option>
              <option value={50}>≥ 50.00x (Padrão)</option>
              <option value={70}>≥ 70.00x</option>
              <option value={100}>≥ 100.00x (Centena)</option>
            </select>
          </div>

          {/* Limite de Casas */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Janela Máx:</span>
            <select
              value={limiteCasas}
              onChange={(e) => setLimiteCasas(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono-num text-white cursor-pointer focus:outline-none focus:border-fuchsia-400"
            >
              <option value={20}>20 Casas</option>
              <option value={30}>30 Casas</option>
              <option value={45}>45 Casas (Padrão)</option>
              <option value={60}>60 Casas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Renderização Condicional da Sub-Aba */}
      {subAbaAtiva === 'sniper_95' ? (
        <Sniper95DuploGatilhoSection
          rounds={rounds}
          minGatilho={minGatilho}
          maxGatilho={maxGatilho}
          onSelectRound={onSelectRound}
        />
      ) : subAbaAtiva === 'monitor_duplo' ? (
        <MonitorDuploGatilhoSection
          rounds={rounds}
          ciclos={ciclosDuplo}
          estatisticas={estatisticasDuplo}
          minGatilho={minGatilho}
          maxGatilho={maxGatilho}
          alvoMin={alvoMin}
          onSelectRound={onSelectRound}
        />
      ) : (
        <>
          {/* 1. Header & Diagnóstico Estatístico: "Você tem razão?" */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#130f24] to-slate-900 border border-fuchsia-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/20 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-white" />
                GATILHO CASA {minGatilho.toFixed(0)}X A {maxGatilho.toFixed(0)}X
              </span>
              <span className="text-xs text-slate-400">
                Auditoria de Projeção para Velas Alvo ≥ {alvoMin.toFixed(0)}x
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Análise do Gatilho da Casa 13x (13.00x - 13.99x)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Testamos matematicamente a sua hipótese: quando sai uma vela entre 13.00x e 13.99x,
              quantas casas e minutos demoram para puxar uma vela ≥ 50x e quais rosas saem no caminho.
            </p>
          </div>

          {/* Veredito Visual em Destaque */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-fuchsia-500/30 flex flex-col items-start lg:items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
              Veredito da Análise (Dados Reais Hoje):
            </span>
            <div className="flex items-center gap-2">
              {estatisticas.veredito.nivelForca === 'ALTA' && (
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 animate-pulse shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SIM, VOCÊ TEM RAZÃO! (Alta Correlação)
                </span>
              )}
              {estatisticas.veredito.nivelForca === 'MODERADA' && (
                <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20">
                  <Flame className="w-4 h-4 text-amber-400" />
                  SIM, CORRELAÇÃO CONFIRMADA
                </span>
              )}
              {estatisticas.veredito.nivelForca === 'NEUTRA' && (
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  CORRELAÇÃO PARCIAL (Aguardar)
                </span>
              )}
              {estatisticas.veredito.nivelForca === 'BAIXA' && (
                <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  MOMENTO FRIO NESTE INTERVALO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 max-w-sm mt-1 text-left lg:text-right font-medium">
              {estatisticas.veredito.detalheComparativo}
            </p>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          {/* Taxa em até 20 casas */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-fuchsia-500/30">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Taxa em até 20 Casas
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-fuchsia-400 font-mono-num">
                {estatisticas.taxaEmAte20Casas}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                dos gatilhos
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono-num">
              Até 10 casas: <strong>{estatisticas.taxaEmAte10Casas}%</strong> | Até 30: <strong>{estatisticas.taxaEmAte30Casas}%</strong>
            </span>
          </div>

          {/* Média de Casas até a 50x */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Média de Casas (Rodadas)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono-num">
                {estatisticas.mediaCasasAteAlvo > 0 ? estatisticas.mediaCasasAteAlvo : '--'}
              </span>
              <span className="text-[10px] text-pink-400 font-semibold">
                casas
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono-num">
              Menor: {estatisticas.menorCasasAteAlvo} | Maior: {estatisticas.maiorCasasAteAlvo}
            </span>
          </div>

          {/* Média de Rosas no Caminho */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Rosas Antes da 50x
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-pink-400 font-mono-num">
                {estatisticas.mediaRosasIntermediarias}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                rosas médias
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              saem no caminho até estourar
            </span>
          </div>

          {/* Média em Minutos */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Tempo Médio até Alvo
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-num">
                {estatisticas.mediaMinutosAteAlvo > 0 ? `+${estatisticas.mediaMinutosAteAlvo}m` : '--'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                pós-gatilho
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono-num">
              Total de gatilhos: <strong>{estatisticas.totalGatilhos}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Ajustes dos Parâmetros do Gatilho */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-bold text-white">Configurar Gatilho & Alvo:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Intervalo do Gatilho */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Casa Gatilho:</span>
            <input
              type="number"
              step="0.1"
              value={minGatilho}
              onChange={(e) => setMinGatilho(Number(e.target.value))}
              className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-fuchsia-400"
            />
            <span className="text-slate-500">a</span>
            <input
              type="number"
              step="0.1"
              value={maxGatilho}
              onChange={(e) => setMaxGatilho(Number(e.target.value))}
              className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-num text-center text-white focus:outline-none focus:border-fuchsia-400"
            />
          </div>

          {/* Alvo Mínimo */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Vela Alvo:</span>
            <select
              value={alvoMin}
              onChange={(e) => setAlvoMin(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono-num text-white cursor-pointer focus:outline-none focus:border-fuchsia-400"
            >
              <option value={30}>≥ 30.00x</option>
              <option value={50}>≥ 50.00x (Padrão)</option>
              <option value={70}>≥ 70.00x</option>
              <option value={100}>≥ 100.00x (Centena)</option>
            </select>
          </div>

          {/* Limite de Casas */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Janela Máx:</span>
            <select
              value={limiteCasas}
              onChange={(e) => setLimiteCasas(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-mono-num text-white cursor-pointer focus:outline-none focus:border-fuchsia-400"
            >
              <option value={20}>20 Casas</option>
              <option value={30}>30 Casas</option>
              <option value={45}>45 Casas (Padrão)</option>
              <option value={60}>60 Casas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2.5 CONSULTORIA DE IA EM TEMPO REAL (GEMINI 3.8 FLASH) & GESTÃO DE 2 PROTEÇÕES */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/40 shadow-2xl relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display text-white tracking-tight">
                  Consultor de Estratégia IA (Gemini 3.8 Flash)
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {isAiGenerated ? 'Gemini 3.8 Flash Ativo' : 'Motor Estatístico'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Recomendações em tempo real: melhor momento de entrada, quantidade ideal de tiros e proteção em 10x.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAiAdvisor(true)}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'Consultando IA...' : 'Atualizar Análise IA'}</span>
          </button>
        </div>

        {aiLoading && !aiAnalysis ? (
          <div className="py-8 text-center text-indigo-300 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs font-semibold">
              A Inteligência Artificial está analisando o fluxo de velas e calculando a melhor janela...
            </span>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-4">
            {/* Grid 1: Momento Ideal + Quantidade de Tiros + Termômetro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Momento Ideal */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Melhor Momento para Entrar
                </span>
                <p className="text-sm font-bold text-white leading-snug">
                  {aiAnalysis.momentoIdeal}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Faixa focal: <strong className="text-indigo-300">{aiAnalysis.faixaCasasRecomendada}</strong>
                </span>
              </div>

              {/* Quantidade Ideal de Entradas */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                  Quantidade Ideal de Entradas (Tiros)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono-num">
                    {aiAnalysis.quantidadeEntradasIdeal} Tiros
                  </span>
                  <span className="text-xs text-slate-400">máximo consecutivo</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Evita o sangramento de banca e respeita o ciclo de repetição.
                </span>
              </div>

              {/* Termômetro e Confiança */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Termômetro do Momento
                </span>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {aiAnalysis.termometroMomento.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono-num font-bold text-indigo-300">
                    Confiança: {aiAnalysis.nivelConfiancaPercent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                  {aiAnalysis.justificativa}
                </p>
              </div>
            </div>

            {/* Grid 2: Gestão das 2 Mãos com a Proteção em 10x */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-fuchsia-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-fuchsia-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-fuchsia-400" />
                  Estratégia de 2 Proteções Recomendada pela IA:
                </span>
                <span className="text-[11px] text-slate-400 font-mono-num">
                  Como operar para pegar pelo menos 1 rosa com risco zero
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Mão 1: Proteção Rápida */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Mão 1: Proteção de Custo</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Auto-Cashout: {aiAnalysis.protecaoMao1.autoCashout.toFixed(2)}x
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {aiAnalysis.protecaoMao1.funcao}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Sugestão de aposta: <strong className="text-indigo-300">{aiAnalysis.protecaoMao1.valorSugerido}</strong>
                  </span>
                </div>

                {/* Mão 2: Proteção em 10x (ou Alvo Alto) */}
                <div className="p-3 rounded-lg bg-slate-900 border border-pink-500/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      Mão 2: Proteção em 10.00x (Rosa Garantida)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-pink-500/20 text-pink-300 border border-pink-500/40">
                      Auto-Cashout: {aiAnalysis.protecaoMao2.autoCashout.toFixed(2)}x
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {aiAnalysis.protecaoMao2.funcao}
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Sugestão de aposta: <strong className="text-pink-300">{aiAnalysis.protecaoMao2.valorSugerido}</strong>
                  </span>
                </div>
              </div>

              {/* Explicação Detalhada da Proteção em 10x */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-pink-950/30 to-purple-950/20 border border-pink-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-pink-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Por que a Proteção em 10.00x é a jogada mais inteligente?</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {aiAnalysis.estrategiaProtecao10x.comoExecutar}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono-num">
                  <span>Alvo Primário: <strong className="text-pink-400">≥ {aiAnalysis.estrategiaProtecao10x.alvoPrimario.toFixed(2)}x</strong></span>
                  <span>Expectativa Matemática: <strong className="text-emerald-400">{aiAnalysis.estrategiaProtecao10x.taxaEsperada}</strong></span>
                </div>
              </div>
            </div>

            {/* Dica de Ouro & Stop Loss Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block mb-0.5">Dica de Ouro da IA:</span>
                  <p className="text-[11px] text-slate-300">{aiAnalysis.dicaDeOuro}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300 block mb-0.5">Regra de Stop Loss:</span>
                  <p className="text-[11px] text-slate-300">{aiAnalysis.stopLossAlert}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 2.6 SIMULADOR INTERATIVO DE GESTÃO DE 2 MÃOS (Com Proteção em 10x) */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Simulador Interativo: Proteção em 10x com {tirosSimulados} Tiros
            </span>
            <span className="text-[11px] text-slate-500 font-mono-num">
              Altere os valores para ver o lucro real se a rosa bater
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Aposta Mão 1 */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Mão 1 (Proteção 2x):</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">R$</span>
                <input
                  type="number"
                  step="0.5"
                  value={apostaMao1}
                  onChange={(e) => setApostaMao1(Math.max(0.5, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono-num font-bold focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Aposta Mão 2 */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-pink-500/30">
              <span className="text-[10px] text-pink-300 block mb-1">Mão 2 (Alvo 10x):</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">R$</span>
                <input
                  type="number"
                  step="0.5"
                  value={apostaMao2}
                  onChange={(e) => setApostaMao2(Math.max(0.5, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-pink-300 font-mono-num font-bold focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            {/* Auto Cashout Mão 2 */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Alvo Mão 2:</span>
              <select
                value={alvoMao2}
                onChange={(e) => setAlvoMao2(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono-num font-bold cursor-pointer focus:outline-none focus:border-pink-400"
              >
                <option value={10}>10.00x (Proteção Rosa)</option>
                <option value={15}>15.00x</option>
                <option value={20}>20.00x</option>
                <option value={50}>50.00x (Super Rosa)</option>
              </select>
            </div>

            {/* Quantidade de Tiros */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Limite de Tiros:</span>
              <select
                value={tirosSimulados}
                onChange={(e) => setTirosSimulados(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono-num font-bold cursor-pointer focus:outline-none focus:border-purple-400"
              >
                <option value={2}>2 Tiros</option>
                <option value={3}>3 Tiros</option>
                <option value={4}>4 Tiros (Recomendado)</option>
                <option value={5}>5 Tiros</option>
              </select>
            </div>
          </div>

          {/* Resultado Financeiro da Simulação */}
          <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">
                Custo total em {tirosSimulados} tiros: <strong className="text-white font-mono-num">R$ {custoTotalTiros.toFixed(2)}</strong> (R$ {custoPorTiro.toFixed(2)} por tiro)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Proteção Mão 1 (2.00x): paga <strong className="text-indigo-300 font-mono-num">R$ {retornoMao1Em1Tiro.toFixed(2)}</strong>, cobrindo quase o tiro inteiro!
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Retorno Bruto da Rosa ({alvoMao2.toFixed(0)}x):
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono-num">
                + R$ {retornoMao2Rosa10x.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono-num">
                Lucro líquido no {tirosSimulados}º tiro: <strong className="text-emerald-300 font-mono-num">R$ {Math.max(0, lucroLiquidoSeBaterRosa10x).toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.7 GRÁFICO DE ASSERTIVIDADE DA ESTRATÉGIA & AUDITORIA DE VELAS QUE SAÍRAM */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-fuchsia-500/40 shadow-2xl relative overflow-hidden space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-fuchsia-500/20">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black font-display text-white tracking-tight">
                Gráfico de Assertividade da Estratégia (Gatilho 13x)
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Auditado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Curva histórica de acertos, taxa nos 4 tiros recomendados e menção detalhada de cada vela que saiu.
            </p>
          </div>

          {/* Seletor de Modo de Visualização */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setModoGrafico('linha_temporal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                modoGrafico === 'linha_temporal'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Curva Temporal</span>
            </button>
            <button
              type="button"
              onClick={() => setModoGrafico('por_tiro')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                modoGrafico === 'por_tiro'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Assertividade por Tiro</span>
            </button>
            <button
              type="button"
              onClick={() => setModoGrafico('top_velas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                modoGrafico === 'top_velas'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mural das Velas</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Métricas de Assertividade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Rosa (≥10x) em qualquer tiro */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-pink-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" />
                Pelo Menos 1 Rosa (≥10x)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-pink-400 font-mono-num">
                {estatisticas.taxaPeloMenosUmaRosa}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Garante o lucro alto da 2ª mão
            </span>
          </div>

          {/* Card 2: Rosa nos 4 Tiros Recomendados */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-purple-950/30">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500/20 text-[9px] font-black text-purple-300 rounded-bl uppercase">
              Recomendado
            </div>
            <div>
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-400" />
                Rosa nos 4 Tiros
              </span>
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono-num">
                {estatisticas.taxaRosaAte4Tiros}%
              </span>
            </div>
            <span className="text-[10px] text-purple-300 font-medium mt-1 block">
              Zona de menor risco de banca
            </span>
          </div>

          {/* Card 3: Super Rosa (≥50x) */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Flame className="w-3 h-3 text-emerald-400" />
                Super Rosa (≥{alvoMin}x)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-num">
                {estatisticas.taxaGeral}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Média de {estatisticas.mediaCasasAteAlvo} casas pós-13x
            </span>
          </div>

          {/* Card 4: Total de Velas Auditadas no Período */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Velas Auditadas nos Tiros
              </span>
              <div className="flex items-center gap-1 text-xs font-mono-num font-bold text-white mt-1">
                <span className="text-blue-400">{estatisticas.totalGeralVelasAuditadas.azuis} az</span>
                <span className="text-slate-600">/</span>
                <span className="text-purple-400">{estatisticas.totalGeralVelasAuditadas.roxas} rx</span>
                <span className="text-slate-600">/</span>
                <span className="text-pink-400">{estatisticas.totalGeralVelasAuditadas.rosas + estatisticas.totalGeralVelasAuditadas.superRosas50x} rs</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {estatisticas.totalGatilhos} ciclos de 13x no histórico
            </span>
          </div>
        </div>

        {/* VISÃO 1: GRÁFICO SVG DA CURVA DE ASSERTIVIDADE (LINHA DO TEMPO) */}
        {modoGrafico === 'linha_temporal' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-fuchsia-400" />
                    Evolução da Assertividade (% Acumulado ao Longo do Dia)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-pink-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    Taxa de Rosa (≥10x)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Taxa Alvo (≥{alvoMin}x)
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    (Clique no ponto para inspecionar as velas)
                  </span>
                </div>
              </div>

              {estatisticas.pontosCurvaAssertividade.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  Aguardando gatilhos na Casa 13x para traçar a curva de assertividade.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[600px]">
                    {(() => {
                      const pontos = estatisticas.pontosCurvaAssertividade;
                      const N = pontos.length;
                      const width = 800;
                      const height = 220;
                      const padLeft = 45;
                      const padRight = 30;
                      const padTop = 20;
                      const padBottom = 35;
                      const usableW = width - padLeft - padRight;
                      const usableH = height - padTop - padBottom;

                      const getX = (i: number) =>
                        padLeft + (N > 1 ? (i / (N - 1)) * usableW : usableW / 2);
                      const getY = (valPercent: number) =>
                        padTop + usableH * (1 - Math.max(0, Math.min(100, valPercent)) / 100);

                      // Coordenadas das curvas
                      const coordsRosa = pontos.map((p, i) => ({
                        x: getX(i),
                        y: getY(p.taxaAcumuladaRosa),
                        p,
                        idx: i,
                      }));
                      const coordsAlvo = pontos.map((p, i) => ({
                        x: getX(i),
                        y: getY(p.taxaAcumuladaAlvo),
                        p,
                        idx: i,
                      }));

                      const pathRosa = coordsRosa.reduce(
                        (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
                        ''
                      );
                      const pathAlvo = coordsAlvo.reduce(
                        (acc, curr, i) => (i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
                        ''
                      );

                      const areaRosa = coordsRosa.length > 0
                        ? `${pathRosa} L ${coordsRosa[coordsRosa.length - 1].x} ${padTop + usableH} L ${coordsRosa[0].x} ${padTop + usableH} Z`
                        : '';

                      return (
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="w-full h-auto select-none"
                        >
                          <defs>
                            <linearGradient id="gradRosaArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines Horizontais */}
                          {[100, 75, 50, 25, 0].map((level) => {
                            const y = getY(level);
                            return (
                              <g key={level}>
                                <line
                                  x1={padLeft}
                                  y1={y}
                                  x2={width - padRight}
                                  y2={y}
                                  stroke="#334155"
                                  strokeDasharray={level === 50 ? '3 3' : '2 4'}
                                  strokeWidth={level === 50 ? '1.5' : '0.8'}
                                  strokeOpacity={level === 50 ? 0.7 : 0.3}
                                />
                                <text
                                  x={padLeft - 8}
                                  y={y + 3}
                                  textAnchor="end"
                                  fill="#94a3b8"
                                  fontSize="9"
                                  fontFamily="monospace"
                                >
                                  {level}%
                                </text>
                              </g>
                            );
                          })}

                          {/* Área preenchida da Rosa */}
                          {areaRosa && (
                            <path d={areaRosa} fill="url(#gradRosaArea)" />
                          )}

                          {/* Linha Alvo (≥50x) */}
                          <path
                            d={pathAlvo}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Linha Rosa (≥10x) */}
                          <path
                            d={pathRosa}
                            fill="none"
                            stroke="#ec4899"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />

                          {/* Pontos Interativos no Gráfico */}
                          {coordsRosa.map((c) => {
                            const isSelected = pontoGraficoSelecionado?.id === c.p.id;
                            const isGreen50 = c.p.resultado === 'SUPER_ROSA_50X';
                            const isGreenRosa = c.p.resultado === 'ROSA_INTERMEDIARIA';

                            return (
                              <g
                                key={c.p.id}
                                className="cursor-pointer transition-all hover:scale-125"
                                onClick={() => setPontoGraficoSelecionadoId(c.p.id)}
                              >
                                {isSelected && (
                                  <circle
                                    cx={c.x}
                                    cy={c.y}
                                    r="10"
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="2"
                                    className="animate-ping"
                                  />
                                )}
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r={isSelected ? '6' : '4'}
                                  fill={isGreen50 ? '#10b981' : isGreenRosa ? '#ec4899' : '#64748b'}
                                  stroke="#0f172a"
                                  strokeWidth="2"
                                />
                                {/* Rótulo do horário ou do gatilho abaixo */}
                                <text
                                  x={c.x}
                                  y={height - 12}
                                  textAnchor="middle"
                                  fill={isSelected ? '#ffffff' : '#64748b'}
                                  fontSize="8"
                                  fontFamily="monospace"
                                  fontWeight={isSelected ? 'bold' : 'normal'}
                                >
                                  #{c.idx + 1} ({c.p.gatilhoMult.toFixed(1)}x)
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* PAINEL DE INSPEÇÃO: MENÇÃO NOMINAL DAS VELAS QUE SAÍRAM NESTE CICLO */}
            {pontoGraficoSelecionado && (
              <div className="p-4 rounded-xl bg-slate-950 border border-fuchsia-500/30 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono-num bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                      Gatilho: {pontoGraficoSelecionado.gatilhoMult.toFixed(2)}x
                    </span>
                    <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      às {pontoGraficoSelecionado.horario}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        pontoGraficoSelecionado.resultado === 'SUPER_ROSA_50X'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : pontoGraficoSelecionado.resultado === 'ROSA_INTERMEDIARIA'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {pontoGraficoSelecionado.resultado === 'SUPER_ROSA_50X'
                        ? 'GREEN SUPER ROSA (≥50x)'
                        : pontoGraficoSelecionado.resultado === 'ROSA_INTERMEDIARIA'
                        ? 'GREEN ROSA (≥10x)'
                        : 'SEM ROSA'}
                    </span>
                  </div>

                  <div className="text-right text-[11px] font-mono-num text-slate-400">
                    Assertividade até este ponto:{' '}
                    <strong className="text-pink-400">{pontoGraficoSelecionado.taxaAcumuladaRosa}% Rosa</strong> |{' '}
                    <strong className="text-emerald-400">{pontoGraficoSelecionado.taxaAcumuladaAlvo}% Alvo</strong>
                  </div>
                </div>

                {/* Velas que Saíram Mencionadas Rodada a Rodada */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Velas que saíram nos tiros após a {pontoGraficoSelecionado.gatilhoMult.toFixed(2)}x (Clique na vela para inspecionar):
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {pontoGraficoSelecionado.velasMencionadas.map((v) => {
                      const isSuperRosa = v.mult >= alvoMin;
                      const isRosa = v.mult >= 10.0 && v.mult < alvoMin;
                      const isRoxa = v.mult >= 2.0 && v.mult < 10.0;
                      const isTiroRecomendado = v.casa <= 4;

                      return (
                        <div
                          key={v.casa}
                          onClick={() => onSelectRound?.(v.round)}
                          className={`p-2 rounded-xl text-center cursor-pointer transition-all hover:scale-105 border ${
                            isSuperRosa
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                              : isRosa
                              ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md shadow-pink-500/20'
                              : isRoxa
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                          } ${isTiroRecomendado ? 'ring-1 ring-purple-500/40' : ''}`}
                          title={`Casa ${v.casa}: ${v.mult.toFixed(2)}x - Clique para ver round`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-0.5">
                            <span>{v.casa}º Tiro</span>
                            {isTiroRecomendado && (
                              <span className="text-[8px] text-purple-400 font-bold uppercase">4 Tiros</span>
                            )}
                          </div>
                          <span className="text-base font-black font-mono-num block">
                            {v.mult.toFixed(2)}x
                          </span>
                          <span className="text-[8px] font-bold uppercase block mt-0.5">
                            {isSuperRosa
                              ? 'SUPER ROSA'
                              : isRosa
                              ? 'ROSA 10x'
                              : isRoxa
                              ? 'PROTEÇÃO 2x'
                              : 'AZUL'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISÃO 2: ASSERTIVIDADE POR TIRO / CASA (1ª A 15ª CASA) */}
        {modoGrafico === 'por_tiro' && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-purple-400" />
                Frequência de Acertos por Casa / Tiro Pós-13x
              </span>
              <span className="text-[11px] text-purple-300 font-semibold">
                Destaque: Tiros 1 ao 4 cobrem {estatisticas.taxaRosaAte4Tiros}% das vitórias
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((casaNum) => {
                // Contar quantas vezes caiu Rosa ou Alvo exatamente nesta casa
                const acertosNestaCasa = ciclos.filter(
                  (c) => (c.primeiraRosa && c.primeiraRosa.casaRelativa === casaNum) || (c.bateuAlvo && c.casasAteAlvo === casaNum)
                );
                const count = acertosNestaCasa.length;
                const isZonaRecomendada = casaNum <= 4;

                return (
                  <div
                    key={casaNum}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isZonaRecomendada
                        ? 'bg-purple-950/30 border-purple-500/50 shadow-md shadow-purple-950/20'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 mb-1">
                      <span>{casaNum}ª Casa</span>
                      {isZonaRecomendada && (
                        <span className="text-[8px] font-black text-purple-400">★ RECOM</span>
                      )}
                    </div>
                    <span className="text-xl font-black text-white font-mono-num block">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-num block">
                      {estatisticas.totalGatilhos > 0
                        ? `${Math.round((count / estatisticas.totalGatilhos) * 100)}% dos ciclos`
                        : '0%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISÃO 3: MURAL DAS MAIORES VELAS PAGAS NA ESTRATÉGIA */}
        {modoGrafico === 'top_velas' && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                Mural das Maiores Velas que Saíram após o Gatilho 13x
              </span>
              <span className="text-[11px] text-slate-400 font-mono-num">
                Multiplicadores reais auditados hoje
              </span>
            </div>

            {estatisticas.rankingVelasMaisAltasPagas.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nenhuma vela ≥ 10.00x registrada após os gatilhos ainda.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {estatisticas.rankingVelasMaisAltasPagas.map((v, idx) => {
                  const is50x = v.mult >= alvoMin;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectRound?.(v.round)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 ${
                        is50x
                          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                          : 'bg-gradient-to-b from-pink-950/40 to-slate-900 border-pink-500/50 shadow-lg shadow-pink-950/30'
                      }`}
                      title={`Clique para inspecionar vela de ${v.mult.toFixed(2)}x`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>Top #{idx + 1}</span>
                        <span className="font-mono-num">{v.casa}ª Casa</span>
                      </div>
                      <span
                        className={`text-2xl font-black font-mono-num block ${
                          is50x ? 'text-emerald-400' : 'text-pink-400'
                        }`}
                      >
                        {v.mult.toFixed(2)}x
                      </span>
                      <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-center gap-1 font-mono-num">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{v.timeStr}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        Pós-13x de {v.gatilhoMult.toFixed(2)}x
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Comparativo de Assertividade: Por Casas vs Por Minutos vs Por Rosas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Painel A: Assertividade por Faixa de Casas (Rodadas) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
              1. Assertividade por Casas (Rodadas):
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Em qual distância a vela ≥ {alvoMin}x costuma cair após a vela 13.x:
            </p>

            <div className="space-y-2">
              {estatisticas.distribuicaoCasas.map((d) => (
                <div key={d.faixa} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono-num">
                    <span className="text-slate-300">{d.faixa}</span>
                    <span className="font-bold text-white">
                      {d.count} ({d.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(100, d.percent * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
            Mais frequente:{' '}
            <strong className="text-fuchsia-400">
              {estatisticas.rankingCasasExatas[0]
                ? `Casa ${estatisticas.rankingCasasExatas[0].casa} (${estatisticas.rankingCasasExatas[0].acertos} acertos)`
                : 'Calculando...'}
            </strong>
          </div>
        </div>

        {/* Painel B: Assertividade por Casas de Rosa Intermediárias */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              2. Casas de Rosa até o Alvo:
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Quantas rosas saem antes de estourar a vela ≥ {alvoMin}x:
            </p>

            <div className="space-y-2">
              {estatisticas.distribuicaoRosas.map((r) => (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono-num">
                    <span className="text-slate-300">{r.label}</span>
                    <span className="font-bold text-pink-400">
                      {r.count} ({r.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, r.percent * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
            Média do dia:{' '}
            <strong className="text-pink-300">
              {estatisticas.mediaRosasIntermediarias} rosas intermediárias
            </strong>
          </div>
        </div>

        {/* Painel C: Ranking dos Minutos Relativos Mais Assertivos */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              3. Minutos Pós-Gatilho Mais Assertivos:
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Intervalo de tempo (+minutos) após o gatilho 13.x com mais acertos:
            </p>

            <div className="space-y-1.5">
              {estatisticas.rankingMinutosRelativos.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Sem acertos registrados ainda.</p>
              ) : (
                estatisticas.rankingMinutosRelativos.map((m, idx) => (
                  <div
                    key={m.minutoOffset}
                    className="p-1.5 px-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-bold text-amber-300 font-mono-num flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      +{m.minutoOffset} min pós-13x
                    </span>
                    <span className="text-slate-400 font-mono-num">
                      <strong>{m.acertos}</strong> acertos ({m.taxa}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
            Estratégia Recomendada:{' '}
            <strong className="text-amber-300">
              {estatisticas.melhorEstrategiaSugerida.regra}
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Lista Auditada de Todas as Ocorrências da Casa 13x com Rosas Intermediárias */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-sm font-black uppercase text-white">
              Histórico Auditado de Gatilhos da Casa 13x ({ciclosFiltrados.length} de {ciclos.length}):
            </h3>
          </div>

          {/* Botões de Filtro */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFiltroCiclos('todos')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filtroCiclos === 'todos'
                  ? 'bg-fuchsia-600 text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({ciclos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCiclos('com_rosa_4_tiros')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroCiclos === 'com_rosa_4_tiros'
                  ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-500/20'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <span>Rosa nos 4 Tiros</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px]">
                {ciclos.filter((c) => c.bateuRosaEmAte4Tiros).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroCiclos('super_rosa_50x')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroCiclos === 'super_rosa_50x'
                  ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/20'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <span>Super Rosa ≥50x</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[10px]">
                {ciclos.filter((c) => c.bateuAlvo).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroCiclos('sem_rosa')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filtroCiclos === 'sem_rosa'
                  ? 'bg-rose-600 text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sem Rosa ({ciclos.filter((c) => !c.bateuPeloMenosUmaRosa && c.status !== 'PENDENTE').length})
            </button>
          </div>
        </div>

        {ciclosFiltrados.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">
              Nenhum gatilho corresponde ao filtro selecionado.
            </p>
            <button
              type="button"
              onClick={() => setFiltroCiclos('todos')}
              className="mt-2 text-xs text-fuchsia-400 underline font-bold cursor-pointer"
            >
              Ver todos os {ciclos.length} gatilhos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ciclosFiltrados.map((c, index) => {
              const isExpanded = cicloExpandidoId === c.id;

              return (
                <div
                  key={c.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                    c.status === 'GREEN'
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/60'
                      : c.status === 'PENDENTE'
                      ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Linha Resumo do Ciclo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Vela Gatilho 13.x */}
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onSelectRound?.(c.gatilhoRound)}
                        className="px-3 py-2 rounded-xl border border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300 font-black font-mono-num text-lg cursor-pointer hover:scale-105 transition-all shadow-md shadow-fuchsia-500/10"
                        title="Vela Gatilho - Clique para abrir detalhes"
                      >
                        {c.gatilhoMult.toFixed(2)}x
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {c.gatilhoTimeStr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-num">
                            Round #{c.gatilhoRound.externalId}
                          </span>
                          {c.bateuRosaEmAte4Tiros && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Rosa nos 4 Tiros ({c.primeiraRosa?.casaRelativa}ª Casa)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono-num mt-0.5">
                          Rosas no caminho: <strong className="text-pink-400">{c.rosasNoCaminho.length}</strong> |
                          Distância até alvo: <strong className="text-white">{c.casasAteAlvo} casas</strong> ({c.tempoAteAlvoStr})
                        </p>
                      </div>
                    </div>

                    {/* Seta e Vela Alvo */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />

                      {c.bateuAlvo && c.velaAlvo ? (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => onSelectRound?.(c.velaAlvo!)}
                            className="px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 font-black font-mono-num text-base cursor-pointer hover:scale-105 transition-all animate-pulse"
                            title="Vela Alvo Atingida - Clique para abrir detalhes"
                          >
                            {c.velaAlvo.result.toFixed(2)}x
                          </div>
                          <div className="text-left">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 block">
                              GREEN ({c.casasAteAlvo}ª casa)
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-num">
                              às {c.alvoTimeStr}
                            </span>
                          </div>
                        </div>
                      ) : c.status === 'PENDENTE' ? (
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 block animate-pulse">
                            EM ANDAMENTO ({c.casasAteAlvo} casas)
                          </span>
                          <span className="text-[10px] text-slate-500">Aguardando vela ≥ {alvoMin}x</span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700 block">
                            NÃO ATINGIU ({limiteCasas} casas)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono-num">
                            {c.rosasNoCaminho.length} rosas pagas
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setCicloExpandidoId(isExpanded ? null : c.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Ver detalhes de rosas no caminho"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* FITA DAS VELAS QUE SAÍRAM NOS TIROS (MENCIONADAS NOMINALMENTE) */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-purple-400" />
                        Velas que saíram nos tiros após a 13x (Tiro 1 em diante):
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono-num text-slate-400">
                        <span>Total neste ciclo:</span>
                        <span className="text-blue-400">{c.totalVelasAzuis} azuis</span>
                        <span className="text-purple-400">{c.totalVelasRoxas} roxas (2x+)</span>
                        <span className="text-pink-400">{c.totalVelasRosas + c.totalVelasSuperRosas} rosas</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                      {c.tirosIntermediarios.slice(0, 10).map((tiro, tIdx) => {
                        const casaNum = tIdx + 1;
                        const mult = tiro.result;
                        const isSuperRosa = mult >= alvoMin;
                        const isRosa = mult >= 10.0 && mult < alvoMin;
                        const isRoxa = mult >= 2.0 && mult < 10.0;
                        const is4Tiros = casaNum <= 4;

                        return (
                          <div
                            key={tIdx}
                            onClick={() => onSelectRound?.(tiro)}
                            className={`px-2 py-1 rounded-lg text-xs font-mono-num cursor-pointer transition-all hover:scale-105 border flex items-center gap-1 ${
                              isSuperRosa
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black shadow-md shadow-emerald-500/20'
                                : isRosa
                                ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-black shadow-md shadow-pink-500/20'
                                : isRoxa
                                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-blue-400'
                            } ${is4Tiros ? 'ring-1 ring-purple-500/30' : ''}`}
                            title={`Tiro #${casaNum}: ${mult.toFixed(2)}x - Clique para ver detalhes da rodada`}
                          >
                            <span className="text-[9px] text-slate-500 font-sans">
                              {casaNum}º:
                            </span>
                            <span className="font-bold">{mult.toFixed(2)}x</span>
                            {isSuperRosa && <Flame className="w-3 h-3 text-emerald-400 inline" />}
                            {isRosa && <Sparkles className="w-3 h-3 text-pink-400 inline" />}
                            {isRoxa && !isRosa && <Shield className="w-2.5 h-2.5 text-purple-400 inline" />}
                          </div>
                        );
                      })}
                      {c.tirosIntermediarios.length > 10 && (
                        <span className="text-[10px] text-slate-500 italic pl-1">
                          +{c.tirosIntermediarios.length - 10} velas seguintes...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos: Rosas Intermediárias & Linha do Tempo */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                      {/* Cartões de Rosas Intermediárias */}
                      <div>
                        <span className="text-xs font-bold text-pink-300 flex items-center gap-1 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                          Rosas Intermediárias Pagas até a Vela Alvo ({c.rosasNoCaminho.length}):
                        </span>

                        {c.rosasNoCaminho.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                            Nenhuma rosa intermediária (&lt; {alvoMin}x) saiu entre o gatilho e o alvo.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                            {c.rosasNoCaminho.map((r, rIdx) => (
                              <div
                                key={rIdx}
                                onClick={() => onSelectRound?.(r.round)}
                                className="p-2 rounded-xl bg-slate-950 border border-pink-500/30 hover:border-pink-500 text-center cursor-pointer transition-all hover:scale-105"
                                title={`Rosa #${rIdx + 1} - Clique para inspecionar`}
                              >
                                <span className="text-[9px] text-slate-400 block font-semibold">
                                  {r.casaRelativa}ª Casa
                                </span>
                                <span className="text-sm font-black text-pink-400 font-mono-num block">
                                  {r.mult.toFixed(2)}x
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono-num block">
                                  {r.timeStr}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Linha das Primeiras Rodadas Pós-Gatilho */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                          Sequência Visual das Próximas Rodadas Pós-Gatilho (1ª a {c.tirosIntermediarios.length}ª):
                        </span>
                        <div className="flex items-center gap-1 overflow-x-auto pb-1">
                          {c.tirosIntermediarios.map((t, tIdx) => {
                            const isRosa = t.result >= 10.0;
                            const isAlvo = t.result >= alvoMin;
                            const isRoxa = t.result >= 2.0 && t.result < 10.0;

                            return (
                              <div
                                key={tIdx}
                                onClick={() => onSelectRound?.(t)}
                                className={`px-2 py-1 rounded-md text-[10px] font-mono-num font-bold cursor-pointer shrink-0 border transition-all hover:scale-110 ${
                                  isAlvo
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                                    : isRosa
                                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                                    : isRoxa
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                }`}
                                title={`Casa ${tIdx + 1}: ${t.result.toFixed(2)}x às ${t.instant ? new Date(t.instant).toLocaleTimeString() : ''}`}
                              >
                                #{tIdx + 1}: {t.result.toFixed(2)}x
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
