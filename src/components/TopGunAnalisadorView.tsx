import React, { useState, useEffect, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  TopGunFaixaConfig,
  TopGunSettings,
  TopGunSinal,
  TopGunEntrada,
  getSavedTopGunRules,
  saveTopGunRules,
  getSavedTopGunSettings,
  saveTopGunSettings,
  REGRAS_PADRAO_TOP_GUN,
  CONFIGURACAO_PADRAO_SETTINGS,
  processarTopGun,
  parseManualRoundsImport,
  formatSecondsToCountdown,
} from '../utils/topGunEngine';
import {
  Crosshair,
  Clock,
  Shield,
  Target,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Upload,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  X,
  FileText,
  Info,
} from 'lucide-react';

interface TopGunAnalisadorViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const TopGunAnalisadorView: React.FC<TopGunAnalisadorViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  // Relógio ao vivo atualizado a cada segundo
  const [agoraMs, setAgoraMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setAgoraMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Regras e configurações
  const [regras, setRegras] = useState<TopGunFaixaConfig[]>(() => getSavedTopGunRules());
  const [settings, setSettings] = useState<TopGunSettings>(() => getSavedTopGunSettings());

  // Rodadas extras adicionadas manualmente
  const [rodadasManuais, setRodadasManuais] = useState<CrashRound[]>([]);

  // Mesclar rodadas recebidas da API com as importadas manualmente
  const todasRodadas = useMemo(() => {
    if (rodadasManuais.length === 0) return rounds;
    const combinadas = [...rodadasManuais, ...rounds];
    // Remover duplicatas por externalId ou uuid
    const map = new Map<string, CrashRound>();
    for (const r of combinadas) {
      const key = r.externalId || r.uuid;
      if (!map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [rounds, rodadasManuais]);

  // Executar motor de estatísticas do Top Gun
  const stats = useMemo(() => {
    return processarTopGun(todasRodadas, regras, settings, agoraMs);
  }, [todasRodadas, regras, settings, agoraMs]);

  // Modais
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sinalSelecionado, setSinalSelecionado] = useState<TopGunSinal | null>(null);

  // Filtros da Fila de Entradas
  const [filtroFilaStatus, setFiltroFilaStatus] = useState<
    'TODAS' | 'ATIVAS' | 'PROXIMAS' | 'AGUARDANDO' | 'CONFERIDAS'
  >('TODAS');

  // Filtros do Histórico de Sinais
  const [filtroFaixa, setFiltroFaixa] = useState<string>('TODAS');
  const [filtroResultado, setFiltroResultado] = useState<
    'TODOS' | 'ACERTO' | 'ERRO' | 'EM_ANDAMENTO'
  >('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Rascunho para Modal de Configurações
  const [draftRegras, setDraftRegras] = useState<TopGunFaixaConfig[]>([]);
  const [draftSettings, setDraftSettings] = useState<TopGunSettings>(settings);

  useEffect(() => {
    if (isConfigModalOpen) {
      setDraftRegras(JSON.parse(JSON.stringify(regras)));
      setDraftSettings({ ...settings });
    }
  }, [isConfigModalOpen, regras, settings]);

  // Rascunho para Modal de Importação Manual
  const [importText, setImportText] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // Formatar data e hora atual do cabeçalho
  const dataAtualFormatada = useMemo(() => {
    const d = new Date(agoraMs);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const seg = String(d.getSeconds()).padStart(2, '0');
    return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${min}:${seg}` };
  }, [agoraMs]);

  // Fila de Entradas filtrada
  const filaFiltrada = useMemo(() => {
    return stats.filaEntradas.filter((e) => {
      if (filtroFilaStatus === 'ATIVAS') return e.status === 'ENTRADA_ATIVA';
      if (filtroFilaStatus === 'PROXIMAS') return e.status === 'ENTRADA_PROXIMA';
      if (filtroFilaStatus === 'AGUARDANDO')
        return e.status === 'AGUARDANDO' || e.status === 'AGUARDANDO_CONFERENCIA';
      if (filtroFilaStatus === 'CONFERIDAS') return e.status === 'CONFERIDO';
      return true;
    });
  }, [stats.filaEntradas, filtroFilaStatus]);

  // Histórico de Sinais filtrado
  const sinaisFiltrados = useMemo(() => {
    return stats.sinais.filter((s) => {
      if (filtroFaixa !== 'TODAS' && s.faixaId !== filtroFaixa) return false;
      if (filtroResultado === 'ACERTO' && !s.statusFinal.startsWith('ACERTO')) return false;
      if (filtroResultado === 'ERRO' && s.statusFinal !== 'ERRO') return false;
      if (
        filtroResultado === 'EM_ANDAMENTO' &&
        s.statusFinal !== 'EM_ANDAMENTO' &&
        s.statusFinal !== 'AGUARDANDO'
      )
        return false;

      if (buscaTexto.trim()) {
        const query = buscaTexto.toLowerCase();
        const bateuRodada = s.rodadaGeradora.toLowerCase().includes(query);
        const bateuMult = s.velaGeradora.toFixed(2).includes(query);
        const bateuFaixa = s.faixaLabel.toLowerCase().includes(query);
        if (!bateuRodada && !bateuMult && !bateuFaixa) return false;
      }
      return true;
    });
  }, [stats.sinais, filtroFaixa, filtroResultado, buscaTexto]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOPO: TOP GUN — ANALISADOR DE CASAS                                    */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40 shrink-0">
              <Crosshair className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-wider text-white uppercase flex items-center gap-2">
                  TOP GUN <span className="text-amber-400">—</span> ANALISADOR DE CASAS
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ESTATÍSTICA REAL
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Velas Geradoras</span>
                <span className="text-slate-600">•</span>
                <span>Janelas de Proteção P1 a P4</span>
                <span className="text-slate-600">•</span>
                <span>Conferência Automática</span>
              </p>
            </div>
          </div>

          {/* Relógio em Tempo Real e Botões de Controle */}
          <div className="flex flex-wrap items-center gap-3 font-mono-num">
            {/* Relógio Digital */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">{dataAtualFormatada.data}</span>
                <span className="text-slate-600">|</span>
                <span className="text-sm font-extrabold text-white">{dataAtualFormatada.hora}</span>
              </div>
            </div>

            {/* Botão Configurações do Admin */}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Configurar faixas, tempos e tolerâncias"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurar Regras</span>
            </button>

            {/* Botão Importar Dados Manualmente */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Colar rodadas manualmente (Rodada, Multiplicador, Horário)"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importar Dados</span>
            </button>
          </div>
        </div>

        {/* Seletor de Período Estatístico (Hoje, 24h, 7d, 30d, Tudo) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Período da Análise:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(
              [
                { id: 'hoje', label: 'Hoje' },
                { id: '24h', label: 'Últimas 24h' },
                { id: '7d', label: '7 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: 'tudo', label: 'Todo Histórico' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const updated = { ...settings, timeframe: t.id };
                  setSettings(updated);
                  saveTopGunSettings(updated);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  settings.timeframe === t.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CARDS SUPERIORES: SINAIS HOJE, ACERTOS, ERROS, ASSERTIVIDADE, ATIVAS   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono-num">
        {/* SINAIS HOJE */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            SINAIS OBSERVADOS
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalSinais}</span>
            <Target className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {stats.sinais.length} velas geradoras no total
          </span>
        </div>

        {/* ACERTOS */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
            ACERTOS
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              {stats.totalAcertos}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-500 mt-1 block">
            Pagos dentro da janela P1 a P4
          </span>
        </div>

        {/* ERROS */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/30 shadow-lg shadow-rose-950/20">
          <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
            ERROS
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-300">
              {stats.totalErros}
            </span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-[10px] text-rose-500 mt-1 block">Não pagaram no alvo</span>
        </div>

        {/* ASSERTIVIDADE */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-950/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
            ASSERTIVIDADE
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {stats.assertividade.toFixed(2)}%
            </span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-amber-500/90 mt-1 block">
            Fórmula: Acertos ÷ Total × 100
          </span>
        </div>

        {/* ENTRADAS ATIVAS */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-lg shadow-purple-950/20 col-span-2 sm:col-span-3 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
            ENTRADAS ATIVAS
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-300">
              {stats.entradasAtivasCount}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
          </div>
          <span className="text-[10px] text-purple-400/80 mt-1 block">
            Monitorando janela ao vivo
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PAINEL DE ENTRADAS AO VIVO & FILA ORGANIZADA                           */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              PAINEL DE ENTRADAS AO VIVO (FILA DE ENTRADAS)
            </h3>
            <p className="text-xs text-slate-400">
              Ordenação automática pelo horário mais próximo com contador regressivo em tempo real.
            </p>
          </div>

          {/* Filtros da Fila */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {(
              [
                { id: 'TODAS', label: `Todas (${stats.filaEntradas.length})` },
                {
                  id: 'ATIVAS',
                  label: `Ativas (${
                    stats.filaEntradas.filter((e) => e.status === 'ENTRADA_ATIVA').length
                  })`,
                },
                {
                  id: 'PROXIMAS',
                  label: `Próximas (${
                    stats.filaEntradas.filter((e) => e.status === 'ENTRADA_PROXIMA').length
                  })`,
                },
                {
                  id: 'AGUARDANDO',
                  label: `Aguardando (${
                    stats.filaEntradas.filter(
                      (e) => e.status === 'AGUARDANDO' || e.status === 'AGUARDANDO_CONFERENCIA'
                    ).length
                  })`,
                },
                {
                  id: 'CONFERIDAS',
                  label: `Conferidas (${
                    stats.filaEntradas.filter((e) => e.status === 'CONFERIDO').length
                  })`,
                },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFiltroFilaStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  filtroFilaStatus === st.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {filaFiltrada.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhuma entrada encontrada para este filtro na fila no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  <th className="py-2.5 px-3">Horário</th>
                  <th className="py-2.5 px-3">Casa / Faixa</th>
                  <th className="py-2.5 px-3">Vela Geradora</th>
                  <th className="py-2.5 px-3">Entrada</th>
                  <th className="py-2.5 px-3">Contador Regressivo</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filaFiltrada.slice(0, 50).map((e) => {
                  const isAtiva = e.status === 'ENTRADA_ATIVA';
                  const isProxima = e.status === 'ENTRADA_PROXIMA';
                  const isConferido = e.status === 'CONFERIDO';
                  const isAcerto = e.resultado === 'ACERTO';

                  return (
                    <tr
                      key={e.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isAtiva ? 'bg-purple-950/30' : isProxima ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Horário Programado */}
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {e.horarioProgramadoStr}
                      </td>

                      {/* Casa / Faixa */}
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {e.faixaLabel}
                        </span>
                      </td>

                      {/* Vela Geradora */}
                      <td className="py-2.5 px-3">
                        <span className="text-pink-400 font-bold">{e.velaGeradora.toFixed(2)}x</span>{' '}
                        <span className="text-slate-500 text-[10px]">
                          ({e.horarioGeradoraStr} • #{e.rodadaGeradora})
                        </span>
                      </td>

                      {/* Entrada / Proteção */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            e.label === 'P1'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : e.label === 'P2'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {e.label}
                        </span>{' '}
                        <span className="text-slate-400 text-[10px] hidden md:inline">
                          {e.label === 'P1' ? 'Proteção de Capital' : 'Segunda Proteção'}
                        </span>
                      </td>

                      {/* Contador Regressivo */}
                      <td className="py-2.5 px-3 font-bold">
                        {isAtiva ? (
                          <span className="text-red-400 font-black animate-pulse flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            EM ANDAMENTO
                          </span>
                        ) : e.tempoRestanteSegs > 0 ? (
                          <span
                            className={
                              isProxima
                                ? 'text-amber-400 font-black animate-pulse'
                                : 'text-slate-300'
                            }
                          >
                            ⏳ {formatSecondsToCountdown(e.tempoRestanteSegs)}
                          </span>
                        ) : (
                          <span className="text-slate-500">00:00:00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isAtiva ? (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-red-500/20 text-red-300 border border-red-500/40">
                            ENTRADA ATIVA
                          </span>
                        ) : isProxima ? (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            ENTRADA PRÓXIMA
                          </span>
                        ) : isConferido ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300">
                            CONFERIDO
                          </span>
                        ) : e.status === 'AGUARDANDO_CONFERENCIA' ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/20 text-indigo-300">
                            AGUARDANDO CONFERÊNCIA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800/80 text-slate-400">
                            AGUARDANDO
                          </span>
                        )}
                      </td>

                      {/* Resultado */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isConferido ? (
                          isAcerto ? (
                            <span className="text-emerald-400 font-black flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ACERTO ({e.velaEncontrada?.toFixed(2)}x)
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold flex items-center justify-end gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              ERRO
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 italic">Pendente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. PAINEL DE ASSERTIVIDADE POR FAIXA                                      */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              ASSERTIVIDADE POR FAIXA (GRÁFICO INDIVIDUAL COMPARATIVO)
            </h3>
            <p className="text-xs text-slate-400">
              Taxa de acerto global por faixa e desempenho comparativo de cada proteção (P1 × P2 ×
              P3 × P4).
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono-num">
            Alvo configurado: ≥{' '}
            <strong className="text-white">{settings.objetivoMultiplicador.toFixed(2)}x</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.values(stats.statsPorFaixa).map((f) => {
            return (
              <div
                key={f.faixaId}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 font-mono-num"
              >
                {/* Cabeçalho da Faixa */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      FAIXA {f.faixaLabel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({f.minMult.toFixed(2)}x até {f.maxMult.toFixed(2)}x)
                    </span>
                  </div>

                  {f.amostraPequena ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      AMOSTRA PEQUENA ({f.totalSinais}/{settings.minimoAmostras})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      {f.totalSinais} sinais
                    </span>
                  )}
                </div>

                {/* Barra de Assertividade Global da Faixa */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Assertividade Total:</span>
                    <span className="font-black text-white">
                      {f.assertividade.toFixed(2)}% ({f.acertos}A / {f.erros}E)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        f.assertividade >= 70
                          ? 'bg-emerald-500'
                          : f.assertividade >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(f.assertividade, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Comparação Entrada 1 × Entrada 2 (× P3 × P4) */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Taxa por Entrada (Ocorrência do Acerto):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-blue-400 block font-bold">P1 (Capital)</span>
                      <strong className="text-white">
                        {f.taxaPorEntrada.P1 ? f.taxaPorEntrada.P1.toFixed(1) : 0}%
                      </strong>
                      <span className="text-[9px] text-slate-500 block">
                        {f.acertosPorEntrada.P1 || 0} acertos
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-950 border border-pink-500/30">
                      <span className="text-[10px] text-pink-400 block font-bold">P2 (Segunda)</span>
                      <strong className="text-pink-300">
                        {f.taxaPorEntrada.P2 ? f.taxaPorEntrada.P2.toFixed(1) : 0}%
                      </strong>
                      <span className="text-[9px] text-pink-500/80 block">
                        {f.acertosPorEntrada.P2 || 0} acertos
                      </span>
                    </div>

                    {f.taxaPorEntrada.P3 !== undefined && f.taxaPorEntrada.P3 > 0 && (
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-purple-400 block font-bold">P3</span>
                        <strong className="text-white">{f.taxaPorEntrada.P3.toFixed(1)}%</strong>
                        <span className="text-[9px] text-slate-500 block">
                          {f.acertosPorEntrada.P3 || 0} acertos
                        </span>
                      </div>
                    )}

                    {f.taxaPorEntrada.P4 !== undefined && f.taxaPorEntrada.P4 > 0 && (
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-indigo-400 block font-bold">P4</span>
                        <strong className="text-white">{f.taxaPorEntrada.P4.toFixed(1)}%</strong>
                        <span className="text-[9px] text-slate-500 block">
                          {f.acertosPorEntrada.P4 || 0} acertos
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé da Faixa: Streaks e Melhor Proteção */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900 flex-wrap gap-1">
                  <span>
                    Melhor Proteção:{' '}
                    <strong className="text-amber-400 font-bold">{f.melhorProtecao}</strong>
                  </span>
                  <span>
                    Streaks:{' '}
                    <strong className="text-emerald-400">+{f.maiorSequenciaAcertos}</strong> /{' '}
                    <strong className="text-rose-400">-{f.maiorSequenciaErros}</strong>
                  </span>
                  <span>
                    Último:{' '}
                    <strong
                      className={
                        f.ultimoResultado === 'ACERTO'
                          ? 'text-emerald-400'
                          : f.ultimoResultado === 'ERRO'
                          ? 'text-rose-400'
                          : 'text-slate-500'
                      }
                    >
                      {f.ultimoResultado === 'ACERTO'
                        ? 'Acerto'
                        : f.ultimoResultado === 'ERRO'
                        ? 'Erro'
                        : '-'}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PAINEL DE PROTEÇÕES: "ONDE OS RESULTADOS FORAM ENCONTRADOS?"           */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-400" />
              PAINEL DE PROTEÇÕES: ONDE OS RESULTADOS FORAM ENCONTRADOS?
            </h3>
            <p className="text-xs text-slate-400">
              Distribuição percentual observada entre a 1ª Proteção de Capital (P1), a 2ª Proteção
              (P2), P3 e P4.
            </p>
          </div>
        </div>

        {/* Alerta de Conceito Estatístico */}
        <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 text-xs text-pink-200/90 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-pink-300 block font-bold mb-0.5">
              Objetivo de Análise: Foco na SEGUNDA PROTEÇÃO (P2)
            </strong>
            A estratégia foi projetada para avaliar se a segunda proteção apresenta um padrão de
            pagamento diferenciado, tratando a P1 primordialmente como proteção de capital.
          </div>
        </div>

        {/* 4 Cards de Proteção */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-num">
          {/* P1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">
              P1 — PROTEÇÃO DE CAPITAL
            </span>
            <div className="text-2xl font-black text-white">
              {stats.distribuicaoProtecoes.p1.percent.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${stats.distribuicaoProtecoes.p1.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              {stats.distribuicaoProtecoes.p1.count} acertos capturados
            </span>
          </div>

          {/* P2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-pink-500/50 shadow-md shadow-pink-950/20 space-y-2">
            <span className="text-[10px] uppercase font-bold text-pink-400 block">
              P2 — SEGUNDA PROTEÇÃO
            </span>
            <div className="text-2xl font-black text-pink-300">
              {stats.distribuicaoProtecoes.p2.percent.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${stats.distribuicaoProtecoes.p2.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-pink-400/90 block">
              {stats.distribuicaoProtecoes.p2.count} acertos capturados
            </span>
          </div>

          {/* P3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">
              P3 — TERCEIRA PROTEÇÃO
            </span>
            <div className="text-2xl font-black text-white">
              {stats.distribuicaoProtecoes.p3.percent.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${stats.distribuicaoProtecoes.p3.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              {stats.distribuicaoProtecoes.p3.count} acertos capturados
            </span>
          </div>

          {/* P4 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">
              P4 — QUARTA PROTEÇÃO
            </span>
            <div className="text-2xl font-black text-white">
              {stats.distribuicaoProtecoes.p4.percent.toFixed(1)}%
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${stats.distribuicaoProtecoes.p4.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              {stats.distribuicaoProtecoes.p4.count} acertos capturados
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. "QUEM ESTÁ MELHOR NO DIA?" / DESEMPENHO DO DIA                          */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              DESEMPENHO DO DIA (QUEM APRESENTA MAIOR EFICÁCIA HISTÓRICA)
            </h3>
            <p className="text-xs text-slate-400">
              Classificação estritamente estatística baseada nos dados observados hoje.
            </p>
          </div>
        </div>

        {/* Cards de Destaque Estatístico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-num text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              MAIOR ASSERTIVIDADE OBSERVADA HOJE
            </span>
            {stats.desempenhoDoDia.maiorAssertividadeObservada ? (
              <div>
                <span className="text-xl font-black text-emerald-400">
                  Faixa {stats.desempenhoDoDia.maiorAssertividadeObservada.faixaLabel} →{' '}
                  {stats.desempenhoDoDia.maiorAssertividadeObservada.taxa.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Baseado em {stats.desempenhoDoDia.maiorAssertividadeObservada.sinais} sinais
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Amostra insuficiente</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              MAIOR NÚMERO DE ACERTOS HOJE
            </span>
            {stats.desempenhoDoDia.maiorQuantidadeAcertos ? (
              <div>
                <span className="text-xl font-black text-amber-300">
                  Faixa {stats.desempenhoDoDia.maiorQuantidadeAcertos.faixaLabel} →{' '}
                  {stats.desempenhoDoDia.maiorQuantidadeAcertos.acertos} Acertos
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  De {stats.desempenhoDoDia.maiorQuantidadeAcertos.sinais} sinais observados
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Amostra insuficiente</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              MAIOR AMOSTRA REGISTRADA
            </span>
            {stats.desempenhoDoDia.maiorAmostra ? (
              <div>
                <span className="text-xl font-black text-white">
                  Faixa {stats.desempenhoDoDia.maiorAmostra.faixaLabel} →{' '}
                  {stats.desempenhoDoDia.maiorAmostra.sinais} Sinais
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Maior representatividade estatística
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Aguardando dados</span>
            )}
          </div>
        </div>

        {/* Tabela do Desempenho do Dia */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-num border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-2.5 px-3">Faixa</th>
                <th className="py-2.5 px-3">Sinais</th>
                <th className="py-2.5 px-3">Acertos</th>
                <th className="py-2.5 px-3">Erros</th>
                <th className="py-2.5 px-3">Assertividade</th>
                <th className="py-2.5 px-3">Melhor Entrada</th>
                <th className="py-2.5 px-3">Pior Entrada</th>
                <th className="py-2.5 px-3">Último Resultado</th>
                <th className="py-2.5 px-3 text-right">Status Amostral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.desempenhoDoDia.tabelaRanking.map((row) => (
                <tr key={row.faixaId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-amber-300">Faixa {row.faixaLabel}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">{row.sinais}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.acertos}</td>
                  <td className="py-2.5 px-3 text-rose-400">{row.erros}</td>
                  <td className="py-2.5 px-3 font-black text-white">
                    {row.assertividade.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-pink-300">{row.melhorEntrada}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.piorEntrada}</td>
                  <td className="py-2.5 px-3 font-semibold">
                    <span
                      className={
                        row.ultimoResultado === 'Acerto'
                          ? 'text-emerald-400'
                          : row.ultimoResultado === 'Erro'
                          ? 'text-rose-400'
                          : 'text-slate-500'
                      }
                    >
                      {row.ultimoResultado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.amostraPequena ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        AMOSTRA PEQUENA
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        RELEVANTE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. HISTÓRICO DETALHADO & CONFERÊNCIA INDIVIDUAL                           */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              HISTÓRICO DETALHADO E CONFERÊNCIA INDIVIDUAL DOS SINAIS
            </h3>
            <p className="text-xs text-slate-400">
              Auditoria de cada sinal gerado com conferência passo a passo das proteções P1 a P4.
            </p>
          </div>

          {/* Controles de Filtros e Busca */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Buscar rodada, vela..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
              />
            </div>

            {/* Filtro por Faixa */}
            <select
              value={filtroFaixa}
              onChange={(e) => setFiltroFaixa(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as Faixas</option>
              {regras.map((r) => (
                <option key={r.id} value={r.id}>
                  Faixa {r.label}
                </option>
              ))}
            </select>

            {/* Filtro por Resultado */}
            <select
              value={filtroResultado}
              onChange={(e) => setFiltroResultado(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos Resultados</option>
              <option value="ACERTO">Apenas Acertos</option>
              <option value="ERRO">Apenas Erros</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
            </select>
          </div>
        </div>

        {sinaisFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhum sinal correspondente encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {sinaisFiltrados.slice(0, 30).map((s) => {
              const isAcerto = s.statusFinal.startsWith('ACERTO');
              const isErro = s.statusFinal === 'ERRO';

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isAcerto
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isErro
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap font-mono-num">
                      <span className="text-xs font-black text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {s.faixaLabel}
                      </span>
                      <div>
                        <span className="text-xs text-slate-400">Vela Geradora:</span>{' '}
                        <strong className="text-sm font-black text-pink-400">
                          {s.velaGeradora.toFixed(2)}x
                        </strong>{' '}
                        <span className="text-xs text-slate-500">
                          (Rodada #{s.rodadaGeradora} às {s.horarioGeradoraStr})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAcerto ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono-num">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ACERTO NA {s.protecaoVencedora || 'P1'} ({s.velaVencedora?.toFixed(2)}x)
                        </span>
                      ) : isErro ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono-num">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ERRO NAS PROTEÇÕES
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 font-mono-num animate-pulse">
                          EM ANDAMENTO
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSinalSelecionado(s)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Ver ficha detalhada da conferência"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Ver Ficha</span>
                      </button>
                    </div>
                  </div>

                  {/* Entradas em linha compacta */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono-num">
                    {s.entradas.map((e) => {
                      const ehGanhadora = e.resultado === 'ACERTO';
                      return (
                        <div
                          key={e.posicao}
                          className={`p-2 rounded-lg border flex items-center justify-between ${
                            ehGanhadora
                              ? 'bg-emerald-950/40 border-emerald-500/60'
                              : e.resultado === 'ERRO'
                              ? 'bg-slate-900 border-slate-800 opacity-80'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                e.label === 'P1'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-pink-500/20 text-pink-300'
                              }`}
                            >
                              {e.label}
                            </span>
                            <span className="text-white font-bold">{e.horarioProgramadoStr}</span>
                          </div>
                          <div>
                            {e.status === 'CONFERIDO' ? (
                              ehGanhadora ? (
                                <span className="text-[10px] font-black text-emerald-400">
                                  ✓ {e.velaEncontrada?.toFixed(2)}x
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400">✗ Erro</span>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-500">Aguardando</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURAÇÃO DO ADMINISTRADOR                                    */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in">
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black font-display text-white">
                  CONFIGURAÇÕES DO ADMINISTRADOR (REGRAS E TEMPOS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
              {/* Parâmetros Globais */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Parâmetros de Conferência e Amostragem
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block font-semibold mb-1">
                      Multiplicador Alvo da Conferência:
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draftSettings.objetivoMultiplicador}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          objetivoMultiplicador: parseFloat(e.target.value) || 2.0,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Vela mínima para considerar Acerto (ex: 2.00x)
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold mb-1">
                      Tolerância da Janela (Segundos):
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={draftSettings.toleranciaJanelaSegundos}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          toleranciaJanelaSegundos: parseInt(e.target.value, 10) || 60,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Janela em torno do minuto programado
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold mb-1">
                      Mínimo de Sinais Relevantes:
                    </label>
                    <input
                      type="number"
                      value={draftSettings.minimoAmostras}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          minimoAmostras: parseInt(e.target.value, 10) || 10,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono-num focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Abaixo disso exibe alerta de amostra pequena
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabela de Associação de Tempos das Faixas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Associação de Tempos por Faixa (P1 a P4)
                  </h4>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    * Modificações têm efeito imediato
                  </span>
                </div>

                {/* Nota especial sobre as casas 17x e 18x */}
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs">
                  <strong>Atenção às Casas 17x e 18x:</strong> A configuração original permitia
                  inconsistências na associação de tempos. Você pode alterar os minutos da Entrada 1
                  e Entrada 2 diretamente nos campos abaixo sem modificar o código do sistema.
                </div>

                <div className="space-y-2">
                  {draftRegras.map((regra, rIdx) => {
                    const is17ou18 = regra.id === 'faixa_17x' || regra.id === 'faixa_18x';
                    return (
                      <div
                        key={regra.id}
                        className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          is17ou18
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="w-40 shrink-0">
                          <span className="text-sm font-black text-amber-300 block">
                            Faixa {regra.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono-num">
                            {regra.minMult}x até {regra.maxMult}x
                          </span>
                        </div>

                        {/* Entradas */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {regra.entradas.map((e, eIdx) => (
                            <div key={e.posicao} className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-400">
                                {e.label}:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={e.offsetMinutos}
                                  onChange={(ev) => {
                                    const val = parseInt(ev.target.value, 10) || 0;
                                    const copy = [...draftRegras];
                                    copy[rIdx].entradas[eIdx].offsetMinutos = val;
                                    setDraftRegras(copy);
                                  }}
                                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono-num text-xs focus:border-amber-400 focus:outline-none"
                                />
                                <span className="text-slate-500 text-[10px]">min</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal com Ações */}
            <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftRegras(JSON.parse(JSON.stringify(REGRAS_PADRAO_TOP_GUN)));
                  setDraftSettings(CONFIGURACAO_PADRAO_SETTINGS);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegras(draftRegras);
                    setSettings(draftSettings);
                    saveTopGunRules(draftRegras);
                    saveTopGunSettings(draftSettings);
                    setIsConfigModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPORTADOR MANUAL DE DADOS                                       */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black font-display text-white">
                  IMPORTAÇÃO MANUAL DE RODADAS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-cyan-200/90 leading-relaxed">
                <strong>Formato aceito:</strong> Você pode colar linhas contendo{' '}
                <code>Rodada Multiplicador Horário</code> (separados por espaço, tabulação ou quebras
                de linha).
                <div className="mt-2 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-300">
                  4157216 10,50 07:08:46
                  <br />
                  4157228 92,02 07:12:49
                  <br />
                  4157252 32,84 07:20:51
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Cole os dados das rodadas abaixo:
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Exemplo:&#10;4157216 10,50 07:08:46&#10;4157228 92,02 07:12:49"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {importStatusMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                  {importStatusMsg}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setImportText(`4157216 10,50 07:08:46\n4157228 92,02 07:12:49\n4157252 32,84 07:20:51`);
                }}
                className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Preencher com exemplo do teste
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseManualRoundsImport(importText);
                    if (parsed.length > 0) {
                      setRodadasManuais((prev) => [...parsed, ...prev]);
                      setImportStatusMsg(
                        `${parsed.length} rodadas importadas e processadas no analisador!`
                      );
                      setTimeout(() => {
                        setIsImportModalOpen(false);
                        setImportStatusMsg(null);
                        setImportText('');
                      }, 1200);
                    } else {
                      setImportStatusMsg('Nenhuma rodada válida encontrada no texto colado.');
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Processar e Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {sinalSelecionado && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in font-mono-num">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black font-display text-white">
                  FICHA DETALHADA DO SINAL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSinalSelecionado(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Informações da Vela Geradora */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  DADOS DA VELA GERADORA
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Faixa:</span>
                    <strong className="text-amber-300 font-black text-sm">
                      {sinalSelecionado.faixaLabel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Multiplicador:</span>
                    <strong className="text-pink-400 font-black text-sm">
                      {sinalSelecionado.velaGeradora.toFixed(2)}x
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Rodada:</span>
                    <strong className="text-white">#{sinalSelecionado.rodadaGeradora}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Horário:</span>
                    <strong className="text-white">{sinalSelecionado.horarioGeradoraStr}</strong>
                  </div>
                </div>
              </div>

              {/* Passo a Passo das Proteções P1 a P4 */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  CONFERÊNCIA DAS ENTRADAS E PROTEÇÕES
                </span>

                {sinalSelecionado.entradas.map((e) => {
                  const ehAcerto = e.resultado === 'ACERTO';
                  return (
                    <div
                      key={e.posicao}
                      className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                        ehAcerto
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : e.resultado === 'ERRO'
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              e.label === 'P1'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-pink-500/20 text-pink-300'
                            }`}
                          >
                            {e.label}
                          </span>
                          {e.nomeProtecao}
                        </span>
                        <span className="text-slate-300 font-bold">{e.horarioProgramadoStr}</span>
                      </div>

                      <div className="text-[11px] flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                        <span>Status: {e.status}</span>
                        {e.status === 'CONFERIDO' && (
                          <span
                            className={
                              ehAcerto ? 'text-emerald-400 font-black' : 'text-rose-400 font-bold'
                            }
                          >
                            {ehAcerto
                              ? `✓ Acerto: ${e.velaEncontrada?.toFixed(2)}x na rodada #${e.rodadaEncontrada}`
                              : '✗ Não pagou na janela'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resultado Consolidado */}
              <div
                className={`p-3.5 rounded-xl border text-center font-bold ${
                  sinalSelecionado.statusFinal.startsWith('ACERTO')
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : sinalSelecionado.statusFinal === 'ERRO'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                RESULTADO FINAL: {sinalSelecionado.statusFinal.replace('_', ' ')}
                {sinalSelecionado.tempoTotalSegs !== undefined && (
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                    Tempo até o resultado:{' '}
                    {formatSecondsToCountdown(sinalSelecionado.tempoTotalSegs)}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSinalSelecionado(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
