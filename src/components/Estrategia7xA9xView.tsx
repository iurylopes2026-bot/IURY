import React, { useState, useMemo, useEffect } from 'react';
import { CrashRound } from '../types';
import {
  calcularEstrategia7xA9x,
  CicloEstrategia7xA9x,
  TentativaEtapa,
  ModoGatilhoEstrategia,
  RankingIntervaloRepeticao,
  formatBrTime,
  getRoundTime,
} from '../utils/analysisEngine';
import {
  Shield,
  Target,
  Hourglass,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Layers,
  Crosshair,
  Sliders,
  RotateCcw,
  Scale,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Radio,
  Timer,
  Award,
  RefreshCw,
  Percent,
} from 'lucide-react';

interface Estrategia7xA9xViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const Estrategia7xA9xView: React.FC<Estrategia7xA9xViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  // =========================================================================
  // ESTADOS APLICADOS (RODAM O CÁLCULO PESADO)
  // =========================================================================
  const [appliedApostaProtecao, setAppliedApostaProtecao] = useState<number>(5.0);
  const [appliedProtecaoEscolhida, setAppliedProtecaoEscolhida] = useState<number>(2.0);
  const [appliedApostaAtaque, setAppliedApostaAtaque] = useState<number>(2.0);
  const [appliedAlvoEscolhido, setAppliedAlvoEscolhido] = useState<number>(7.5);
  const [appliedMaxTentativas, setAppliedMaxTentativas] = useState<number>(4);
  const [appliedModoGatilho, setAppliedModoGatilho] =
    useState<ModoGatilhoEstrategia>('REPETICAO_ROSA_10M');
  const [appliedMinutosJanela, setAppliedMinutosJanela] = useState<number>(10);

  // =========================================================================
  // ESTADOS DE RASCUNHO (DRAFT - RESPOSTA INSTANTÂNEA AO DIGITAR SEM LAG!)
  // =========================================================================
  const [draftApostaProtecao, setDraftApostaProtecao] = useState<number>(5.0);
  const [draftProtecaoEscolhida, setDraftProtecaoEscolhida] = useState<number>(2.0);
  const [draftApostaAtaque, setDraftApostaAtaque] = useState<number>(2.0);
  const [draftAlvoEscolhido, setDraftAlvoEscolhido] = useState<number>(7.5);
  const [draftMaxTentativas, setDraftMaxTentativas] = useState<number>(4);
  const [draftModoGatilho, setDraftModoGatilho] =
    useState<ModoGatilhoEstrategia>('REPETICAO_ROSA_10M');
  const [draftMinutosJanela, setDraftMinutosJanela] = useState<number>(10);

  // Verificar se há alterações pendentes de recálculo
  const temModificacoesPendentes = useMemo(() => {
    return (
      draftApostaProtecao !== appliedApostaProtecao ||
      draftProtecaoEscolhida !== appliedProtecaoEscolhida ||
      draftApostaAtaque !== appliedApostaAtaque ||
      draftAlvoEscolhido !== appliedAlvoEscolhido ||
      draftMaxTentativas !== appliedMaxTentativas ||
      draftModoGatilho !== appliedModoGatilho ||
      draftMinutosJanela !== appliedMinutosJanela
    );
  }, [
    draftApostaProtecao,
    appliedApostaProtecao,
    draftProtecaoEscolhida,
    appliedProtecaoEscolhida,
    draftApostaAtaque,
    appliedApostaAtaque,
    draftAlvoEscolhido,
    appliedAlvoEscolhido,
    draftMaxTentativas,
    appliedMaxTentativas,
    draftModoGatilho,
    appliedModoGatilho,
    draftMinutosJanela,
    appliedMinutosJanela,
  ]);

  // Função para aplicar os valores e disparar o recálculo
  const aplicarRecalculo = () => {
    setAppliedApostaProtecao(draftApostaProtecao);
    setAppliedProtecaoEscolhida(draftProtecaoEscolhida);
    setAppliedApostaAtaque(draftApostaAtaque);
    setAppliedAlvoEscolhido(draftAlvoEscolhido);
    setAppliedMaxTentativas(draftMaxTentativas);
    setAppliedModoGatilho(draftModoGatilho);
    setAppliedMinutosJanela(draftMinutosJanela);
  };

  // Função para aplicar um intervalo específico do ranking de 1 a 5 ou recuperação
  const aplicarIntervaloRanking = (item: RankingIntervaloRepeticao, usarSegundaTentativa: boolean = false) => {
    const minutos = usarSegundaTentativa && item.segundaTentativaRecuperacao
      ? item.segundaTentativaRecuperacao.minutosSegundaTentativa
      : item.minutos;

    let modo: ModoGatilhoEstrategia = 'REPETICAO_ROSA_10M';
    if (item.tipoGatilho === '100X_1H') modo = 'REPETICAO_100X_1H';
    else if (item.tipoGatilho === 'INDEPENDENTE') modo = 'HIBRIDA_SNIPER';

    setDraftMinutosJanela(minutos);
    setDraftModoGatilho(modo);
    setAppliedMinutosJanela(minutos);
    setAppliedModoGatilho(modo);
  };

  const handleKeyDownRecalcular = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      aplicarRecalculo();
    }
  };

  // Filtro de Auditoria
  const [filtroStatus, setFiltroStatus] = useState<
    'TODOS' | 'GREENS' | 'LOSS' | 'EM_ANDAMENTO'
  >('TODOS');
  const [cicloExpandidoId, setCicloExpandidoId] = useState<string | null>(null);

  // Cronômetro para o próximo giro
  const [segundosCronometro, setSegundosCronometro] = useState<number>(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosCronometro((prev) => {
        if (prev <= 1) return 18;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const latestRoundUuid = rounds[0]?.uuid;
  useEffect(() => {
    setSegundosCronometro(18);
  }, [latestRoundUuid]);

  // =========================================================================
  // MOTOR DE CÁLCULO ESTATÍSTICO (DEPENDENDO APENAS DOS VALORES APLICADOS)
  // =========================================================================
  const stats = useMemo(() => {
    return calcularEstrategia7xA9x(
      rounds,
      appliedAlvoEscolhido,
      appliedMaxTentativas,
      appliedProtecaoEscolhida,
      appliedApostaProtecao,
      appliedApostaAtaque,
      appliedModoGatilho,
      appliedMinutosJanela
    );
  }, [
    rounds,
    appliedAlvoEscolhido,
    appliedMaxTentativas,
    appliedProtecaoEscolhida,
    appliedApostaProtecao,
    appliedApostaAtaque,
    appliedModoGatilho,
    appliedMinutosJanela,
  ]);

  const ciclosFiltrados = useMemo(() => {
    if (filtroStatus === 'TODOS') return stats.ciclos;
    if (filtroStatus === 'GREENS') return stats.ciclos.filter((c) => c.status === 'GREEN');
    if (filtroStatus === 'LOSS') return stats.ciclos.filter((c) => c.status === 'LOSS');
    return stats.ciclos.filter((c) => c.status === 'EM_ANDAMENTO');
  }, [stats.ciclos, filtroStatus]);

  // Último ciclo concluído para exibir quando o radar estiver em espera
  const ultimoCicloGeral = stats.ciclos[0];

  // Relógio em tempo real para contagem regressiva precisa dos ciclos e entradas (início e término)
  const [agoraMs, setAgoraMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setAgoraMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderCronometroTentativa = (etapa: TentativaEtapa) => {
    if (etapa.status === 'DISPENSADA') {
      return (
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-mono-num">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Dispensada (Green no 1º disparo)
        </span>
      );
    }

    if (etapa.status === 'GREEN') {
      return (
        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1 font-mono-num">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          Finalizada com Green {etapa.tiroGreen ? `(Tiro ${etapa.tiroGreen})` : ''}
        </span>
      );
    }

    if (etapa.status === 'LOSS') {
      return (
        <span className="text-[11px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 flex items-center gap-1 font-mono-num">
          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          Finalizada (Não pagou nesta janela)
        </span>
      );
    }

    // Tempo restante ou decorrido
    const segsAteInicio = Math.max(0, Math.floor((etapa.tempoInicioMs - agoraMs) / 1000));
    const segsAteFim = Math.max(0, Math.floor((etapa.tempoFimMs - agoraMs) / 1000));

    if (agoraMs < etapa.tempoInicioMs) {
      const mins = Math.floor(segsAteInicio / 60);
      const secs = segsAteInicio % 60;
      const fmt = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      return (
        <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5 font-mono-num">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          Inicia em {fmt}
        </span>
      );
    }

    if (agoraMs >= etapa.tempoInicioMs && agoraMs <= etapa.tempoFimMs) {
      const mins = Math.floor(segsAteFim / 60);
      const secs = segsAteFim % 60;
      const fmt = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      return (
        <span className="text-[11px] font-black text-purple-200 bg-purple-600/30 px-2.5 py-0.5 rounded border border-purple-400 flex items-center gap-1.5 font-mono-num animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          ENTRADA ATIVA: Termina em {fmt}
        </span>
      );
    }

    return (
      <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono-num">
        Finalizada
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* CABEÇALHO DA ESTRATÉGIA COM SELEÇÃO DO MODELO DE REPETIÇÃO               */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Estratégia de Repetição Temporal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Pós-Rosa (10 min) & 100x (1 hora)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide">
              REPETIÇÃO TEMPORAL DE VELAS ALTAS & GESTÃO DUPLA
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              Detecta quando uma vela rosa (≥10x) ou extrema (≥100x) é disparada e projeta a janela
              exata de repetição no tempo futuro (média de 10 minutos após a rosa ou 1 hora após
              100x), executando entradas com Mão de Proteção (X) e Mão de Alvo (Y).
            </p>
          </div>

          {/* BOTÃO DE RECALCULAR EM DESTAQUE NO TOPO */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={aplicarRecalculo}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                temModificacoesPendentes
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black animate-pulse shadow-emerald-500/30 scale-105 hover:brightness-110'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110'
              }`}
            >
              <Zap className={`w-4 h-4 ${temModificacoesPendentes ? 'text-slate-950 animate-bounce' : 'text-amber-300'}`} />
              {temModificacoesPendentes
                ? '⚡ RECALCULAR COM NOVOS VALORES (CLIQUE AQUI)'
                : '⚡ RECALCULAR EM TEMPO REAL'}
            </button>
          </div>
        </div>

        {/* SELETOR DO MODO DE REPETIÇÃO */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setDraftModoGatilho('REPETICAO_ROSA_10M');
              setDraftMinutosJanela(10);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
              draftModoGatilho === 'REPETICAO_ROSA_10M'
                ? 'bg-pink-950/40 border-pink-400 shadow-md shadow-pink-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-pink-300 flex items-center gap-1.5">
                🌸 REPETIÇÃO PÓS-ROSA (~10 MIN)
              </span>
              {draftModoGatilho === 'REPETICAO_ROSA_10M' && (
                <span className="w-2 h-2 rounded-full bg-pink-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Gatilho: Vela Rosa (≥10x) aciona janela aos +10 minutos com tolerância de ±2 min.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setDraftModoGatilho('REPETICAO_100X_1H');
              setDraftMinutosJanela(60);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
              draftModoGatilho === 'REPETICAO_100X_1H'
                ? 'bg-purple-950/40 border-purple-400 shadow-md shadow-purple-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-300 flex items-center gap-1.5">
                🚀 REPETIÇÃO 100X (1 HORA)
              </span>
              {draftModoGatilho === 'REPETICAO_100X_1H' && (
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Gatilho: Vela Extrema (≥100x) aciona janela temporal aos +60 minutos (1 hora depois).
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setDraftModoGatilho('HIBRIDA_SNIPER');
              setDraftMinutosJanela(10);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
              draftModoGatilho === 'HIBRIDA_SNIPER'
                ? 'bg-emerald-950/40 border-emerald-400 shadow-md shadow-emerald-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-300 flex items-center gap-1.5">
                ⚡ HÍBRIDA (ROSA 10M + 100X 1H)
              </span>
              {draftModoGatilho === 'HIBRIDA_SNIPER' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Combina os dois gatilhos: rosas a 10 min e velas 100x a 1 hora consecutiva.
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANÁLISE HISTÓRICA DO DIA: COMPROVAÇÃO DA TESE DE REPETIÇÃO               */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Comprovação Estatística: Repetições Reais Registradas Hoje na Mesa
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono-num">
            {stats.metricasRepeticao.totalRosasAnalisadas} velas rosas analisadas hoje
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-num">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              TEMPO MÉDIO DE REPETIÇÃO:
            </span>
            <div className="text-lg font-black text-pink-400">
              {stats.metricasRepeticao.tempoMedioRepeticaoRosasMin} min
            </div>
            <span className="text-[10px] text-slate-500">Média entre rosas</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              REPETIÇÃO ATÉ 12 MIN:
            </span>
            <div className="text-lg font-black text-emerald-400">
              {stats.metricasRepeticao.taxaRepeticaoAte12Min}%
            </div>
            <span className="text-[10px] text-slate-500">Zona dos 10 minutos</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              REPETIÇÃO 100X (1 HORA):
            </span>
            <div className="text-lg font-black text-purple-400">
              {stats.metricasRepeticao.taxaRepeticao100x1Hora}%
            </div>
            <span className="text-[10px] text-slate-500">Janela de 45m a 75m</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              TOTAL 100X NO DIA:
            </span>
            <div className="text-lg font-black text-amber-400">
              {stats.metricasRepeticao.totalRosas100xAnalisadas} velas
            </div>
            <span className="text-[10px] text-slate-500">Velas extremas</span>
          </div>
        </div>

        {/* FAIXAS DE MINUTOS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono-num">
          {stats.metricasRepeticao.distribuicaoMinutos.map((dist, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
            >
              <span className="text-slate-400">{dist.faixa}:</span>
              <span className="font-bold text-white">
                {dist.pct}% ({dist.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOVO: PADRÃO IDEAL CRIADO PELO SISTEMA & RANKING DOS MELHORES INTERVALOS */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-indigo-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                Padrão Ideal do Sistema
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Top 5 Intervalos & Modo Recuperação
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Melhores Intervalos para Entradas & 2ª Tentativa de Recuperação
            </h3>
            <p className="text-xs text-slate-400 max-w-3xl">
              Calculado matematicamente com base em todas as rodadas do dia. Escolha e aplique com um clique
              o padrão ideal independente de horário fixo, ou ative a <strong>2ª Tentativa</strong> para recuperar
              o investimento em caso de atraso da vela.
            </p>
          </div>

          {/* DESTAQUE DO CAMPEÃO */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-left font-mono-num">
              <span className="text-[10px] text-amber-400 uppercase font-black block">
                🥇 1º LUGAR (CAMPEÃO GERAL)
              </span>
              <div className="text-base font-black text-white">
                {stats.metricasRepeticao.intervaloCampeao.minutos} Minutos ({stats.metricasRepeticao.intervaloCampeao.percentualAcerto}% Acerto)
              </div>
              <button
                type="button"
                onClick={() => aplicarIntervaloRanking(stats.metricasRepeticao.intervaloCampeao, false)}
                className="mt-1 px-3 py-1 text-[11px] font-black uppercase rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all cursor-pointer shadow flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Aplicar 1º Lugar ({stats.metricasRepeticao.intervaloCampeao.minutos} min)
              </button>
            </div>
          </div>
        </div>

        {/* CARDS DO RANKING: 1º AO 5º LUGAR */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 font-mono-num">
          {stats.metricasRepeticao.rankingIntervalos.map((item) => {
            const isSelected = appliedMinutosJanela === item.minutos;
            const medalColors =
              item.posicao === 1
                ? 'from-amber-500/20 via-slate-950 to-slate-950 border-amber-400/60 text-amber-300'
                : item.posicao === 2
                ? 'from-slate-400/20 via-slate-950 to-slate-950 border-slate-400/60 text-slate-200'
                : item.posicao === 3
                ? 'from-amber-700/20 via-slate-950 to-slate-950 border-amber-600/60 text-amber-400'
                : 'from-slate-900 via-slate-950 to-slate-950 border-slate-800 text-slate-400';

            const badgeColor =
              item.posicao === 1
                ? 'bg-amber-500 text-slate-950'
                : item.posicao === 2
                ? 'bg-slate-300 text-slate-950'
                : item.posicao === 3
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300';

            return (
              <div
                key={item.posicao}
                className={`p-3.5 rounded-xl border bg-gradient-to-b flex flex-col justify-between space-y-3 transition-all ${medalColors} ${
                  isSelected ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/40' : ''
                }`}
              >
                {/* CABEÇALHO DO CARD */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeColor}`}>
                      {item.posicao}º LUGAR
                    </span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
                        ATIVO
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-black text-white flex items-baseline gap-1">
                    <span>{item.minutos} min</span>
                    <span className="text-xs font-semibold text-slate-400 font-sans">
                      ({item.faixaTexto.split('(')[0].trim()})
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assertividade:</span>
                    <span className="text-base font-black text-emerald-400">
                      {item.percentualAcerto}%
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans mt-2 leading-relaxed">
                    {item.recomendacao}
                  </p>
                </div>

                {/* BLOCO DA 2ª TENTATIVA DE RECUPERAÇÃO */}
                {item.segundaTentativaRecuperacao && (
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-cyan-400" />
                        2ª Tentativa:
                      </span>
                      <span className="font-black text-emerald-400">
                        {item.segundaTentativaRecuperacao.percentualRecuperacao}% Acum.
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-white">
                      Entrar aos {item.segundaTentativaRecuperacao.minutosSegundaTentativa} min
                    </div>

                    <p className="text-[9px] text-slate-400 font-sans leading-tight">
                      {item.segundaTentativaRecuperacao.justificativa}
                    </p>

                    <button
                      type="button"
                      onClick={() => aplicarIntervaloRanking(item, true)}
                      className="w-full mt-1 px-2 py-1 rounded text-[10px] font-black uppercase bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Usar 2ª Tentativa ({item.segundaTentativaRecuperacao.minutosSegundaTentativa}m)
                    </button>
                  </div>
                )}

                {/* BOTÃO DE APLICAR O INTERVALO */}
                <button
                  type="button"
                  onClick={() => aplicarIntervaloRanking(item, false)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-white hover:text-emerald-300'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isSelected ? 'INTERVALO ATIVO' : `APLICAR ${item.minutos} MIN`}
                </button>
              </div>
            );
          })}
        </div>

        {/* EXPLICAÇÃO DO MODO DE RECUPERAÇÃO EM CASO DE LOSS NO 1º DISPARO */}
        <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-indigo-300 block mb-0.5">
                Como Funciona a 2ª Tentativa para Recuperar o Investimento:
              </span>
              <p className="text-[11px] text-slate-400">
                Se a primeira entrada não pagar na janela principal (ex: 10 min), o sistema não faz martingales cegos.
                Ele aguarda o ciclo seguinte de maturação da mesa (ex: aos 15 min), onde a assertividade acumulada
                salta para até <strong>89% a 95%</strong> com as 2 mãos (Proteção em 2.00x garantindo o estorno e Alvo alto no lucro).
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const campeao = stats.metricasRepeticao.intervaloCampeao;
                aplicarIntervaloRanking(campeao, false);
              }}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Resetar para Padrão Ideal
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. AMPULHETA DE ENTRADA & RADAR AO VIVO                                   */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                stats.radarAoVivo.ativo
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Hourglass className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display text-white uppercase tracking-wider">
                  Ampulheta de Entrada & Radar Ao Vivo
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-black uppercase ${
                    stats.radarAoVivo.ativo
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {stats.radarAoVivo.ativo ? '● SINAL ATIVO' : '○ MONITORANDO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronizado diretamente com a mesa em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono-num text-xs">
            <span className="text-slate-400">Assertividade do Dia:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {stats.taxaAssertividade}% GREEN
            </span>
          </div>
        </div>

        {/* ÁREA PRINCIPAL DO RADAR */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider font-mono-num ${
                  stats.radarAoVivo.ativo
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : stats.metricasRepeticao.ultimoGatilhoRosa?.minutosRestantes &&
                      stats.metricasRepeticao.ultimoGatilhoRosa.minutosRestantes > 0
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {stats.radarAoVivo.ativo
                  ? '🚨 JANELA DE REPETIÇÃO ATIVA AGORA'
                  : stats.metricasRepeticao.ultimoGatilhoRosa?.minutosRestantes &&
                    stats.metricasRepeticao.ultimoGatilhoRosa.minutosRestantes > 0
                  ? `⏳ CONTAGEM REGRESSIVA (FALTAM ${stats.metricasRepeticao.ultimoGatilhoRosa.minutosRestantes} MIN)`
                  : '⚪ RADAR EM ESPERA (SEM ENTRADA ATIVA)'}
              </span>

              <span className="text-xs font-bold text-purple-300 font-mono-num">
                TENTATIVAS: {appliedMaxTentativas} TIROS MÁXIMOS
              </span>
            </div>

            {/* SE TEM ENTRADA ATIVA */}
            {stats.radarAoVivo.ativo ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/60 flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg text-xl font-black font-mono-num bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-md">
                    {stats.radarAoVivo.roundGatilho
                      ? `${stats.radarAoVivo.roundGatilho.result.toFixed(2)}x`
                      : 'ROSA'}
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-white font-mono-num">
                      Gatilho às{' '}
                      {stats.radarAoVivo.roundGatilho
                        ? formatBrTime(getRoundTime(stats.radarAoVivo.roundGatilho))
                        : '--:--:--'}
                    </div>
                    <div className="text-xs text-emerald-300 font-semibold">
                      • {stats.radarAoVivo.mensagem}
                    </div>
                    <div className="text-xs font-black text-amber-400 font-mono-num mt-0.5">
                      Em andamento (Tentativa {stats.radarAoVivo.tiroAtual} de {appliedMaxTentativas})
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-xs font-mono-num text-emerald-200 flex items-center gap-2 flex-wrap">
                  <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>🎯 PONTO DE ENTRADA:</strong>{' '}
                    {stats.radarAoVivo.textoCerteza ||
                      'Janela aberta! Entrar na próxima rodada com as 2 mãos configuradas!'}
                  </span>
                </div>
              </div>
            ) : (
              /* SE NÃO TEM ENTRADA ATIVA */
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-200">
                  {stats.radarAoVivo.mensagem}
                </h3>
                <p className="text-xs text-slate-400">
                  {stats.radarAoVivo.recomendacao}
                </p>

                {stats.metricasRepeticao.ultimoGatilhoRosa && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-sm font-black font-mono-num bg-pink-950/60 text-pink-300 border border-pink-500/40">
                      {stats.metricasRepeticao.ultimoGatilhoRosa.mult.toFixed(2)}x
                    </span>
                    <div className="text-xs font-mono-num">
                      <span className="text-slate-300 font-semibold block">
                        Vela Rosa às {stats.metricasRepeticao.ultimoGatilhoRosa.timeStr} (há{' '}
                        {stats.metricasRepeticao.ultimoGatilhoRosa.minutosPassados} min)
                      </span>
                      <span className="text-purple-300">
                        {stats.metricasRepeticao.ultimoGatilhoRosa.minutosRestantes > 0
                          ? `Janela prevista para daqui a ${stats.metricasRepeticao.ultimoGatilhoRosa.minutosRestantes} minutos`
                          : 'Janela anterior finalizada. Aguardando novo sinal de repetição.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CRONÔMETRO REGRESSIVO DO GIRO */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Giro do Aviator:
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono-num ${
                  stats.radarAoVivo.ativo ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {stats.radarAoVivo.ativo ? `⏳ ${segundosCronometro}s` : `${segundosCronometro}s`}
              </span>
            </div>

            <div className="w-32 bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  stats.radarAoVivo.ativo
                    ? 'bg-gradient-to-r from-amber-400 to-purple-500'
                    : 'bg-slate-700'
                }`}
                style={{ width: `${(segundosCronometro / 18) * 100}%` }}
              />
            </div>

            <span className="text-[10px] text-slate-500 font-mono-num">
              Mesa: {rounds.length} rodadas auditadas
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PAINEL FINANCEIRO COM 2 MÃOS DE PROTEÇÃO (X & Y) & BOTÃO RECALCULAR   */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Painel Financeiro com 2 Mãos de Proteção (X & Y)
            </h3>
            <p className="text-xs text-slate-400">
              Digite os valores livremente nos campos. Clique no botão amarelo{' '}
              <strong className="text-amber-300 font-bold">RECALCULAR</strong> para atualizar toda a
              mesa sem travamentos.
            </p>
          </div>

          {/* BOTÃO RECALCULAR NO CABEÇALHO DO PAINEL */}
          <div className="flex items-center gap-2">
            {temModificacoesPendentes && (
              <span className="text-[11px] text-amber-300 font-bold animate-pulse hidden sm:inline">
                ⚠️ Modificações pendentes!
              </span>
            )}
            <button
              type="button"
              onClick={aplicarRecalculo}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                temModificacoesPendentes
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 animate-bounce shadow-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Recalcular
            </button>
          </div>
        </div>

        {/* INPUTS DAS 2 MÃOS (X & Y) E AJUSTES DE REPETIÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1ª MÃO: PROTEÇÃO (X) */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                1ª MÃO: PROTEÇÃO (X)
              </span>
              <span className="text-[10px] text-blue-300 font-mono-num bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Taxa de Acerto: {stats.resumoFinanceiroMao1.taxaAcerto}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  VALOR POR VELA (R$)
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                  <span className="text-xs text-slate-400 mr-1 font-mono-num">R$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={draftApostaProtecao}
                    onChange={(e) => setDraftApostaProtecao(Number(e.target.value))}
                    onKeyDown={handleKeyDownRecalcular}
                    className="w-full bg-transparent text-sm font-bold text-white font-mono-num focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  SAÍDA PROTEÇÃO (X)
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                  <input
                    type="number"
                    step="0.1"
                    min="1.2"
                    value={draftProtecaoEscolhida}
                    onChange={(e) => setDraftProtecaoEscolhida(Number(e.target.value))}
                    onKeyDown={handleKeyDownRecalcular}
                    className="w-full bg-transparent text-sm font-bold text-blue-400 font-mono-num focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1 font-mono-num">x</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Recupera o custo total do tiro no cashout selecionado, blindando a banca.
            </p>
          </div>

          {/* 2ª MÃO: ALVO (Y) */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-pink-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-pink-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-pink-400" />
                2ª MÃO: ALVO ALTO (Y)
              </span>
              <span className="text-[10px] text-pink-300 font-mono-num bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                Alvo {draftAlvoEscolhido.toFixed(1)}x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  VALOR POR VELA (R$)
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-pink-400">
                  <span className="text-xs text-slate-400 mr-1 font-mono-num">R$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={draftApostaAtaque}
                    onChange={(e) => setDraftApostaAtaque(Number(e.target.value))}
                    onKeyDown={handleKeyDownRecalcular}
                    className="w-full bg-transparent text-sm font-bold text-white font-mono-num focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  MULTIPLICADOR ALVO (Y)
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-pink-400">
                  <input
                    type="number"
                    step="0.5"
                    min="3.0"
                    max="100.0"
                    value={draftAlvoEscolhido}
                    onChange={(e) => setDraftAlvoEscolhido(Number(e.target.value))}
                    onKeyDown={handleKeyDownRecalcular}
                    className="w-full bg-transparent text-sm font-bold text-pink-400 font-mono-num focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1 font-mono-num">x</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Busca alavancagem alta (7.5x a 10x ou 100x) parando as entradas imediatamente ao bater.
            </p>
          </div>
        </div>

        {/* CONTROLES ADICIONAIS: MAX TIROS & JANELA DE TEMPO */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-num">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-purple-400" />
              Máximo de Tentativas (Tiros):
            </span>
            <div className="flex items-center gap-1">
              {[2, 3, 4].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraftMaxTentativas(t)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    draftMaxTentativas === t
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {t} Tiros
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-pink-400" />
                Tempo de Entrada (Janela Exata de 1 Minuto):
              </span>
              <span className="text-[10px] text-slate-400 block">
                As {draftMaxTentativas} tentativas são executadas juntas dentro deste mesmo minuto indicado.
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[3, 5, 8, 10, 15, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDraftMinutosJanela(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    draftMinutosJanela === m
                      ? 'bg-pink-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  +{m}m
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 focus-within:border-pink-400">
                <input
                  type="number"
                  min="1"
                  max="180"
                  step="1"
                  value={draftMinutosJanela}
                  onChange={(e) => setDraftMinutosJanela(Math.max(1, Number(e.target.value)))}
                  onKeyDown={handleKeyDownRecalcular}
                  className="w-12 bg-transparent text-center font-bold text-white text-xs focus:outline-none"
                  title="Digite qualquer tempo em minutos (ex: 3, 5, 10, 15, 60)"
                />
                <span className="text-slate-400 font-bold text-[11px]">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 CARDS GRANDES DE RESULTADO FINANCEIRO CONSOLIDADO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono-num">
          {/* CARD 1: SÓ COM 1ª PROTEÇÃO */}
          <div className="p-4 rounded-xl bg-slate-950 border-2 border-cyan-500/50 flex flex-col justify-between space-y-4 shadow-lg shadow-cyan-950/20">
            <div>
              <div className="flex items-center justify-between text-xs text-cyan-400 font-black mb-1">
                <span>1. SÓ COM 1ª PROTEÇÃO</span>
                <span className="text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  1ª MÃO ({appliedProtecaoEscolhida.toFixed(2)}x)
                </span>
              </div>

              <div
                className={`text-2xl sm:text-3xl font-black ${
                  stats.resumoFinanceiroMao1.saldoLiquido >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {stats.resumoFinanceiroMao1.saldoLiquido >= 0 ? '+' : ''}
                R$ {stats.resumoFinanceiroMao1.saldoLiquido.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Total Apostado:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroMao1.totalApostado.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retorno Bruto:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroMao1.retornoBruto.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Acerto:</span>
                <span className="text-cyan-300 font-bold">
                  {stats.resumoFinanceiroMao1.taxaAcerto}% ({stats.resumoFinanceiroMao1.acertos}/
                  {stats.resumoFinanceiroMao1.totalTentativas})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ROI da Proteção:</span>
                <span
                  className={`font-bold ${
                    stats.resumoFinanceiroMao1.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stats.resumoFinanceiroMao1.roi >= 0 ? '+' : ''}
                  {stats.resumoFinanceiroMao1.roi}%
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: SÓ COM A 2ª MÃO */}
          <div className="p-4 rounded-xl bg-slate-950 border-2 border-pink-500/50 flex flex-col justify-between space-y-4 shadow-lg shadow-pink-950/20">
            <div>
              <div className="flex items-center justify-between text-xs text-pink-400 font-black mb-1">
                <span>2. SÓ COM A 2ª MÃO</span>
                <span className="text-[10px] bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/30">
                  2ª MÃO (ALVO {appliedAlvoEscolhido.toFixed(1)}x)
                </span>
              </div>

              <div
                className={`text-2xl sm:text-3xl font-black ${
                  stats.resumoFinanceiroMao2.saldoLiquido >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {stats.resumoFinanceiroMao2.saldoLiquido >= 0 ? '+' : ''}
                R$ {stats.resumoFinanceiroMao2.saldoLiquido.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Total Apostado:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroMao2.totalApostado.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retorno Bruto:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroMao2.retornoBruto.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Velas {appliedAlvoEscolhido.toFixed(1)}x+:</span>
                <span className="text-pink-300 font-bold">
                  {stats.resumoFinanceiroMao2.taxaAcerto}% ({stats.resumoFinanceiroMao2.acertos}/
                  {stats.resumoFinanceiroMao2.totalTentativas})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ROI do Alvo:</span>
                <span
                  className={`font-bold ${
                    stats.resumoFinanceiroMao2.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stats.resumoFinanceiroMao2.roi >= 0 ? '+' : ''}
                  {stats.resumoFinanceiroMao2.roi}%
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: GERAL COMBINADO (ESTRATÉGIA COMPLETA) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-[#151a2e] to-slate-950 border-2 border-emerald-400 flex flex-col justify-between space-y-4 shadow-xl shadow-emerald-950/30">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-400 font-black mb-1">
                <span>3. GERAL COMBINADO</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/40">
                  ESTRATÉGIA COMPLETA
                </span>
              </div>

              <div
                className={`text-2xl sm:text-3xl font-black ${
                  stats.resumoFinanceiroConsolidado.saldoLiquido >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {stats.resumoFinanceiroConsolidado.saldoLiquido >= 0 ? '+' : ''}
                R$ {stats.resumoFinanceiroConsolidado.saldoLiquido.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Apostado Consolidado:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroConsolidado.totalApostado.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retorno Consolidado:</span>
                <span className="text-slate-200 font-bold">
                  R$ {stats.resumoFinanceiroConsolidado.retornoBruto.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Placar de Entradas:</span>
                <span className="font-black text-emerald-400">
                  🟢 {stats.resumoFinanceiroConsolidado.placarGreens} • 🔴{' '}
                  {stats.resumoFinanceiroConsolidado.placarLoss}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ROI Final da Estratégia:</span>
                <span
                  className={`font-black ${
                    stats.resumoFinanceiroConsolidado.roiFinal >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {stats.resumoFinanceiroConsolidado.roiFinal >= 0 ? '+' : ''}
                  {stats.resumoFinanceiroConsolidado.roiFinal}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUGESTÃO INTELIGENTE COM BOTÃO DE APLICAÇÃO */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Sugestão Inteligente: Combos Calculados pelo Histórico
            </span>
            <span className="text-[10px] text-slate-400 font-mono-num">
              Otimização estatística nas {rounds.length} velas do dia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">PROTEÇÃO CAMPEÃ (X)</span>
              <span className="text-sm font-bold text-white font-mono-num">
                {stats.melhorOpcaoProtecao.recomendado.toFixed(2)}x
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono-num">
                {stats.melhorOpcaoProtecao.taxaAcertoDia}% de acerto hoje
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">REPETIÇÃO PROJETADA</span>
              <span className="text-sm font-bold text-pink-300 font-mono-num">
                {stats.metricasRepeticao.tempoMedioRepeticaoRosasMin} min pós-rosa
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono-num font-bold">
                Taxa Real: {stats.taxaAssertividade}% ({stats.resumoFinanceiroConsolidado.placarGreens}G / {stats.resumoFinanceiroConsolidado.placarLoss}L)
              </span>
              <span className="text-[9px] text-slate-500 block font-mono-num">
                Freq. Rosas até 12m: {stats.metricasRepeticao.taxaRepeticaoAte12Min}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 block mb-0.5">APLICAR COMBO IDEAL</span>
              <button
                type="button"
                onClick={() => {
                  setDraftProtecaoEscolhida(2.0);
                  setDraftAlvoEscolhido(7.5);
                  setDraftApostaProtecao(5.0);
                  setDraftApostaAtaque(2.0);
                  setDraftModoGatilho('REPETICAO_ROSA_10M');
                  setDraftMinutosJanela(10);
                  // Aplica imediatamente
                  setAppliedProtecaoEscolhida(2.0);
                  setAppliedAlvoEscolhido(7.5);
                  setAppliedApostaProtecao(5.0);
                  setAppliedApostaAtaque(2.0);
                  setAppliedModoGatilho('REPETICAO_ROSA_10M');
                  setAppliedMinutosJanela(10);
                }}
                className="w-full mt-1 px-3 py-1.5 rounded-md text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:brightness-110 transition-all cursor-pointer"
              >
                APLICAR (2.00x / 7.50x - 10 MIN)
              </button>
            </div>
          </div>

          {/* ESCLARECIMENTO ESTATÍSTICO: REPETIÇÃO DE ROSAS VS ENTRADAS COM 2ª TENTATIVA */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Por que a frequência geral é de {stats.metricasRepeticao.taxaRepeticaoAte12Min}% e como a 2ª Tentativa protege seu saldo:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O aviso de <strong>{stats.metricasRepeticao.taxaRepeticaoAte12Min}%</strong> indica que velas rosas surgem com altíssima frequência na mesa em até 12 minutos. Porém, em apostas reais, se a entrada disparar apenas no minuto 10 e a rosa pagar no minuto 14, uma estratégia simples ficaria negativa. Por isso, a rotina foi calibrada com <strong>2ª Tentativa de Recuperação</strong>: se o primeiro minuto não pagar, a 2ª tentativa entra no tempo subsequente garantindo a captura do green e preservando a banca.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ENTRADAS E SEU TEMPO (CICLOS DE REPETIÇÃO COM 1ª E 2ª TENTATIVAS)       */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Entradas e seu Tempo de Entrar (Ciclos de Repetição com 2ª Tentativa)
            </h3>
            <p className="text-xs text-slate-400">
              Minutos projetados, cronômetro regressivo da entrada ao vivo e acompanhamento da 1ª e 2ª tentativa de recuperação.
            </p>
          </div>

          {/* Filtros de Auditoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {(['TODOS', 'GREENS', 'LOSS', 'EM_ANDAMENTO'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroStatus === st
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {ciclosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Hourglass className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">Nenhum ciclo encontrado para o filtro selecionado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ciclosFiltrados.map((c) => {
              const isExpanded = cicloExpandidoId === c.id;

              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all shadow-md"
                >
                  {/* Linha Resumo do Ciclo */}
                  <div
                    onClick={() => setCicloExpandidoId(isExpanded ? null : c.id)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-xl font-mono-num font-black text-sm border ${
                          c.multGatilho >= 100
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                        }`}
                      >
                        {c.multGatilho.toFixed(2)}x
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono-num">
                            Gatilho às {c.timeGatilhoStr}
                          </span>
                          <span className="text-[11px] text-purple-300 font-mono-num">
                            • {c.descricaoGatilho}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {c.status === 'GREEN' && c.tiroGreen ? (
                            <span className="text-emerald-400 font-bold">
                              Green na Tentativa {c.tiroGreen} de {appliedMaxTentativas} com vela{' '}
                              {c.velaGreen?.result.toFixed(2)}x
                            </span>
                          ) : c.status === 'LOSS' ? (
                            <span className="text-rose-400 font-semibold">
                              Stop após {appliedMaxTentativas} tentativas na janela
                            </span>
                          ) : (
                            <span className="text-amber-300 font-semibold">
                              Em andamento (Tentativa {c.tiros.length + 1} de {appliedMaxTentativas})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                      {c.status === 'GREEN' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono-num">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {c.recuperouNaSegunda
                            ? `GREEN NA 2ª TENTATIVA (+R$ ${c.lucroSimulado.toFixed(2)})`
                            : `GREEN NA 1ª TENTATIVA TIRO ${c.tiroGreen} (+R$ ${c.lucroSimulado.toFixed(2)})`}
                        </span>
                      ) : c.status === 'LOSS' ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono-num">
                          <XCircle className="w-3.5 h-3.5" />
                          LOSS APÓS 2 TENTATIVAS (R$ {c.lucroSimulado.toFixed(2)})
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-lg text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 font-mono-num animate-pulse">
                          <Hourglass className="w-3.5 h-3.5" />
                          EM ANDAMENTO
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* APRESENTAÇÃO CONCISA: MINUTOS, TENTATIVAS E CRONÔMETRO AO VIVO (1ª E 2ª TENTATIVAS) */}
                  <div className="p-3.5 bg-slate-900/80 border-t border-slate-800 space-y-2.5 font-mono-num">
                    {/* 1ª TENTATIVA */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          1ª TENTATIVA
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-sm font-black text-white">
                            Minuto {c.minutosProjecao}m
                          </span>
                          <span className="text-xs text-slate-400">
                            ({c.primeiraTentativa.horarioPrevistoStr})
                          </span>
                        </div>
                        {renderCronometroTentativa(c.primeiraTentativa)}
                      </div>

                      {/* Tiros da 1ª Tentativa */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mr-0.5">
                          Tiros ({c.primeiraTentativa.tiros.length}/{appliedMaxTentativas}):
                        </span>
                        {c.primeiraTentativa.tiros.length === 0 ? (
                          <span className="text-xs text-slate-600 italic">Aguardando início...</span>
                        ) : (
                          c.primeiraTentativa.tiros.map((t) => (
                            <span
                              key={t.numero}
                              className={`px-2 py-0.5 rounded text-xs font-black ${
                                t.ehGreen
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                  : t.bateuProtecao
                                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                              title={`Tiro ${t.numero} às ${t.horaStr} • ${t.mult.toFixed(2)}x`}
                            >
                              T{t.numero}: {t.mult.toFixed(2)}x
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2ª TENTATIVA (RECUPERAÇÃO) */}
                    <div
                      className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                        c.segundaTentativa.status === 'GREEN'
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                          : c.segundaTentativa.status === 'DISPENSADA'
                          ? 'bg-slate-950/50 border-slate-800/60 opacity-75'
                          : c.segundaTentativa.status === 'EM_ANDAMENTO'
                          ? 'bg-purple-950/30 border-purple-400 animate-pulse'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                          2ª TENTATIVA (RECUPERAÇÃO)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-pink-400" />
                          <span className="text-sm font-black text-white">
                            Minuto {c.minutosSegundaTentativa}m
                          </span>
                          <span className="text-xs text-slate-400">
                            ({c.segundaTentativa.horarioPrevistoStr})
                          </span>
                        </div>
                        {renderCronometroTentativa(c.segundaTentativa)}
                      </div>

                      {/* Tiros da 2ª Tentativa */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mr-0.5">
                          Tiros ({c.segundaTentativa.tiros.length}/{appliedMaxTentativas}):
                        </span>
                        {c.segundaTentativa.status === 'DISPENSADA' ? (
                          <span className="text-xs text-emerald-400/90 font-bold">
                            Dispensada (Green alcançado na 1ª tentativa)
                          </span>
                        ) : c.segundaTentativa.tiros.length === 0 ? (
                          <span className="text-xs text-slate-600 italic">
                            {c.primeiraTentativa.status === 'LOSS'
                              ? 'Aguardando início da 2ª tentativa...'
                              : 'Em espera'}
                          </span>
                        ) : (
                          c.segundaTentativa.tiros.map((t) => (
                            <span
                              key={t.numero}
                              className={`px-2 py-0.5 rounded text-xs font-black ${
                                t.ehGreen
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                  : t.bateuProtecao
                                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                              title={`2ª Tentativa - Tiro ${t.numero} às ${t.horaStr} • ${t.mult.toFixed(2)}x`}
                            >
                              T{t.numero}: {t.mult.toFixed(2)}x
                            </span>
                          ))
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
