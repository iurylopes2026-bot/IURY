import React, { useState, useMemo } from 'react';
import { CrashRound, CandleCategory } from '../types';
import { CandleCard } from './CandleCard';
import { getCandleCategory, formatMultiplier } from '../utils/candleUtils';
import {
  TimeFilterOptions,
  filterRoundsByDateTime,
  getTodayDateString,
  getYesterdayDateString,
} from '../utils/dayArchive';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Columns3,
  Calendar,
  Clock,
  RotateCcw,
  Layers,
  History,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { ProjecaoMaximaSection } from './ProjecaoMaximaSection';
import { PainelMaximasDoDia } from './PainelMaximasDoDia';

interface MosaicoViewProps {
  rounds: CrashRound[];
  activeFilter: CandleCategory | 'all';
  onSelectFilter: (filter: CandleCategory | 'all') => void;
  onSelectRound: (round: CrashRound) => void;
  onOpenFilterModal: () => void;
  timeFilter: TimeFilterOptions;
  onClearTimeFilter: () => void;
  onSetTimeFilter?: (options: TimeFilterOptions) => void;
  allDayMode: boolean;
  onToggleAllDayMode: () => void;
  totalArchivedCount: number;
}

export const MosaicoView: React.FC<MosaicoViewProps> = ({
  rounds,
  activeFilter,
  onSelectFilter,
  onSelectRound,
  onOpenFilterModal,
  timeFilter,
  onClearTimeFilter,
  onSetTimeFilter,
  allDayMode,
  onToggleAllDayMode,
  totalArchivedCount,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const [columnsPerRow, setColumnsPerRow] = useState<number>(15);
  const [orderMode, setOrderMode] = useState<'tipminer' | 'newestFirst'>(() => {
    try {
      const saved = localStorage.getItem('mosaico_order_mode');
      if (saved === 'tipminer' || saved === 'newestFirst') return saved;
    } catch {
      // ignore
    }
    return 'newestFirst';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [minMultiplier, setMinMultiplier] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(3000);

  // Check if time/date filter is active
  const hasActiveTimeFilter = Boolean(
    timeFilter.date ||
    timeFilter.startTime ||
    timeFilter.endTime ||
    (timeFilter.minuteExact !== null && timeFilter.minuteExact !== undefined)
  );

  const isTodayActive = !timeFilter.date || timeFilter.date === todayStr;
  const isYesterdayActive = timeFilter.date === yesterdayStr;

  // Apply time and date filter first
  const dateFilteredRounds = useMemo(() => {
    return filterRoundsByDateTime(rounds, timeFilter);
  }, [rounds, timeFilter]);

  // Quick statistics for the current dataset
  const stats = useMemo(() => {
    let blues = 0;
    let purples = 0;
    let pinks = 0;
    let max = 0;
    let lastPinkIndex = -1;

    dateFilteredRounds.forEach((r, idx) => {
      if (r.result > max) max = r.result;
      const cat = getCandleCategory(r.result);
      if (cat === 'blue') blues++;
      else if (cat === 'purple') purples++;
      else if (cat === 'pink') {
        pinks++;
        if (lastPinkIndex === -1) lastPinkIndex = idx;
      }
    });

    const total = dateFilteredRounds.length;
    return {
      total,
      blues,
      purples,
      pinks,
      bluePct: total > 0 ? ((blues / total) * 100).toFixed(1) : '0',
      purplePct: total > 0 ? ((purples / total) * 100).toFixed(1) : '0',
      pinkPct: total > 0 ? ((pinks / total) * 100).toFixed(1) : '0',
      max,
      lastPinkIndex,
    };
  }, [dateFilteredRounds]);

  // Filtered rounds based on search, multiplier, and category
  const filteredRounds = useMemo(() => {
    let list = [...dateFilteredRounds];

    // Category filter
    if (activeFilter !== 'all') {
      list = list.filter((r) => getCandleCategory(r.result) === activeFilter);
    }

    // Min Multiplier filter
    const minVal = parseFloat(minMultiplier);
    if (!isNaN(minVal) && minVal > 0) {
      list = list.filter((r) => r.result >= minVal);
    }

    // Search query (by round number / externalId)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.externalId?.toLowerCase().includes(q));
    }

    return list;
  }, [dateFilteredRounds, activeFilter, minMultiplier, searchQuery]);

  // Displayed rounds for fast rendering (slice to visibleCount to maintain 60 FPS)
  const displayedRounds = useMemo(() => {
    return filteredRounds.slice(0, visibleCount);
  }, [filteredRounds, visibleCount]);

  // Chunking into TipMiner rows
  const tipMinerRows = useMemo(() => {
    if (orderMode !== 'tipminer' || activeFilter !== 'all' || searchQuery || minMultiplier) {
      return null;
    }

    const rows: CrashRound[][] = [];
    const cols = columnsPerRow;

    for (let i = 0; i < displayedRounds.length; i += cols) {
      const chunk = displayedRounds.slice(i, i + cols);
      // Reverse so chronological left-to-right
      rows.push([...chunk].reverse());
    }

    return rows;
  }, [displayedRounds, columnsPerRow, orderMode, activeFilter, searchQuery, minMultiplier]);

  const latestRoundUuid = rounds[0]?.uuid;

  const handleSelectToday = () => {
    onSetTimeFilter?.({
      date: todayStr,
      startTime: '00:00:00',
      endTime: undefined,
      minuteExact: null,
    });
    setVisibleCount(5000);
  };

  const handleSelectYesterday = () => {
    onSetTimeFilter?.({
      date: yesterdayStr,
      startTime: '00:00:00',
      endTime: '23:59:59',
      minuteExact: null,
    });
    setVisibleCount(5000);
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Velas no Mosaico
            </span>
            <span className="text-lg font-bold text-white font-mono-num">{stats.total}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            {allDayMode ? 'Até 30.000 Velas' : 'Tempo Real'}
          </span>
        </div>

        <div className="p-3 bg-[#007ba2]/20 border border-[#0096c7]/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider block">
              Azuis (&lt; 2,00x)
            </span>
            <span className="text-lg font-bold text-white font-mono-num">
              {stats.blues} <span className="text-xs font-normal text-blue-300">({stats.bluePct}%)</span>
            </span>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#0096c7]" />
        </div>

        <div className="p-3 bg-[#7b1fa2]/20 border border-[#9c27b0]/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider block">
              Roxas (2,00x - 9,99x)
            </span>
            <span className="text-lg font-bold text-white font-mono-num">
              {stats.purples} <span className="text-xs font-normal text-purple-300">({stats.purplePct}%)</span>
            </span>
          </div>
          <div className="w-3 h-3 rounded-full bg-[#9c27b0]" />
        </div>

        <div className="p-3 bg-[#ba1b66]/20 border border-[#e91e63]/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-pink-300 uppercase tracking-wider block">
              Rosas (10,00x+)
            </span>
            <span className="text-lg font-bold text-white font-mono-num">
              {stats.pinks} <span className="text-xs font-normal text-pink-300">({stats.pinkPct}%)</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {stats.lastPinkIndex >= 0 && (
              <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-200">
                Há {stats.lastPinkIndex} rds
              </span>
            )}
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </div>
        </div>
      </div>

      {/* Date and Time Filter Active Indicator Banner */}
      {hasActiveTimeFilter && (
        <div className="px-4 py-2.5 bg-pink-950/40 border border-pink-500/40 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-pink-200">
            <Clock className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              Filtro ativo:{' '}
              <strong className="text-white">
                {timeFilter.startTime || '00:00:00'}
              </strong>{' '}
              até{' '}
              <strong className="text-white">
                {timeFilter.endTime || 'Horário Atual'}
              </strong>
              {timeFilter.date && (
                <span className="text-slate-300 ml-1.5">
                  • Data: <strong>{timeFilter.date}</strong>
                </span>
              )}
              {timeFilter.minuteExact !== null && timeFilter.minuteExact !== undefined && (
                <span className="text-cyan-300 ml-1.5">
                  • Minuto: <strong>:{String(timeFilter.minuteExact).padStart(2, '0')}</strong>
                </span>
              )}
              {' '}({filteredRounds.length} velas encontradas)
            </span>
          </div>

          <button
            type="button"
            onClick={onClearTimeFilter}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar
          </button>
        </div>
      )}

      {/* Painel de Máximas do Dia (Conforme Imagem TopGun) */}
      <PainelMaximasDoDia rounds={dateFilteredRounds} onSelectRound={onSelectRound} />

      {/* Seção Projeção de Máxima & Teto Pré-Quebra */}
      <ProjecaoMaximaSection rounds={dateFilteredRounds} onSelectRound={onSelectRound} />

      {/* Control Bar: Date/Time Filter Button, All-Day Mode, Category Filter & Search */}
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main Action Buttons: Hoje, Ontem, Pesquisar Horários & Datas + Modo Todo o Dia */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Today Button */}
            <button
              id="quick-today-btn"
              type="button"
              onClick={handleSelectToday}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isTodayActive && !timeFilter.startTime
                  ? 'bg-pink-600 text-white ring-2 ring-pink-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Carregar todas as velas de hoje desde 00:00:01 até o momento"
            >
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              <span>Hoje (00:00 - Agora)</span>
            </button>

            {/* Quick Yesterday Button */}
            <button
              id="quick-yesterday-btn"
              type="button"
              onClick={handleSelectYesterday}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isYesterdayActive
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                  : 'bg-slate-800 hover:bg-purple-900/40 text-purple-200 border border-purple-800/60'
              }`}
              title="Carregar todas as 4.000+ velas de ontem (00h às 24h)"
            >
              <History className="w-3.5 h-3.5 text-purple-300" />
              <span>Ontem (00h-24h)</span>
            </button>

            <button
              id="open-datetime-filter-btn"
              type="button"
              onClick={onOpenFilterModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                hasActiveTimeFilter && !isYesterdayActive
                  ? 'bg-pink-600 text-white ring-2 ring-pink-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4 text-pink-400" />
              <span>Filtro de Horários</span>
              {hasActiveTimeFilter && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
            </button>

            <button
              id="toggle-all-day-btn"
              type="button"
              onClick={onToggleAllDayMode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                allDayMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Exibir histórico completo do dia"
            >
              <Layers className="w-4 h-4 text-purple-300" />
              <span>Dia Completo ({totalArchivedCount || stats.total})</span>
            </button>
          </div>

          {/* Search by Round # and Min Multiplier */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-round-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar rodada (ex: 4742411)"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors font-mono-num"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <input
                id="min-mult-input"
                type="number"
                step="0.5"
                min="1"
                value={minMultiplier}
                onChange={(e) => setMinMultiplier(e.target.value)}
                placeholder="Min x (ex: 5)"
                className="w-24 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors font-mono-num"
              />
            </div>
          </div>
        </div>

        {/* Color Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/70 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 pr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Velas:
            </span>
            <button
              id="mosaico-filter-all-btn"
              type="button"
              onClick={() => onSelectFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({stats.total})
            </button>
            <button
              id="mosaico-filter-blue-btn"
              type="button"
              onClick={() => onSelectFilter('blue')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'blue'
                  ? 'bg-[#007ba2] text-white shadow-sm'
                  : 'bg-slate-800/80 text-blue-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0096c7]" />
              Azuis ({stats.blues})
            </button>
            <button
              id="mosaico-filter-purple-btn"
              type="button"
              onClick={() => onSelectFilter('purple')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'purple'
                  ? 'bg-[#7b1fa2] text-white shadow-sm'
                  : 'bg-slate-800/80 text-purple-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#9c27b0]" />
              Roxas ({stats.purples})
            </button>
            <button
              id="mosaico-filter-pink-btn"
              type="button"
              onClick={() => onSelectFilter('pink')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'pink'
                  ? 'bg-[#ba1b66] text-white shadow-sm'
                  : 'bg-slate-800/80 text-pink-300 hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#e91e63]" />
              Rosas ({stats.pinks})
            </button>
          </div>

          {/* Columns selector & Ordering */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Columns3 className="w-3.5 h-3.5 text-pink-400" />
                Colunas:
              </span>
              {[10, 12, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setColumnsPerRow(num)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-all ${
                    columnsPerRow === num
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num === 15 ? '15 (TipMiner)' : num}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                Ordem:
              </span>
              <button
                type="button"
                onClick={() => {
                  setOrderMode('tipminer');
                  try { localStorage.setItem('mosaico_order_mode', 'tipminer'); } catch {}
                }}
                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-all ${
                  orderMode === 'tipminer'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                TipMiner
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderMode('newestFirst');
                  try { localStorage.setItem('mosaico_order_mode', 'newestFirst'); } catch {}
                }}
                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-all ${
                  orderMode === 'newestFirst'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Recentes 1º
              </button>
            </div>

            {/* Quick Visible Count Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Mostrar:
              </span>
              {[300, 600, 1200, 2500].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setVisibleCount(num)}
                  className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-all ${
                    visibleCount === num && visibleCount < filteredRounds.length
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setVisibleCount(filteredRounds.length || 5000)}
                className={`px-2.5 py-0.5 rounded text-xs font-bold cursor-pointer transition-all ${
                  visibleCount >= filteredRounds.length
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm ring-1 ring-pink-400/50'
                    : 'bg-slate-800/80 text-purple-300 hover:text-white border border-purple-800/60'
                }`}
                title="Exibir todas as velas do dia (de 00:00:01 até agora)"
              >
                Todas ({filteredRounds.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Main Mosaico Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 overflow-x-auto shadow-xl">
        {filteredRounds.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">Nenhuma vela encontrada no período selecionado</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente ajustar o intervalo de horários ou redefinir os filtros.
            </p>
            {hasActiveTimeFilter && (
              <button
                type="button"
                onClick={onClearTimeFilter}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Ver todas as velas de 00:00:01 até Agora
              </button>
            )}
          </div>
        ) : tipMinerRows ? (
          /* TipMiner Row-by-Row Layout: Chronological Left-to-Right in each row */
          <div className="space-y-2 min-w-[960px]">
            {tipMinerRows.map((rowRounds, rowIdx) => (
              <div
                key={`row-${rowIdx}`}
                className="grid gap-1.5 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                  contentVisibility: 'auto',
                  containIntrinsicSize: '72px',
                }}
              >
                {rowRounds.map((round, colIdx) => (
                  <CandleCard
                    key={round.uuid || `${rowIdx}-${colIdx}`}
                    round={round}
                    index={rowIdx * columnsPerRow + colIdx}
                    isLatest={round.uuid === latestRoundUuid}
                    onSelect={onSelectRound}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Direct Continuous Grid Layout */
          <div
            className="grid gap-1.5 sm:gap-2 min-w-[700px]"
            style={{
              gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
            }}
          >
            {displayedRounds.map((round, idx) => (
              <CandleCard
                key={round.uuid || idx}
                round={round}
                index={idx}
                isLatest={round.uuid === latestRoundUuid}
                onSelect={onSelectRound}
              />
            ))}
          </div>
        )}

        {/* High-Performance Pagination & Progressive Loader Footer */}
        {filteredRounds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Exibindo <strong className="text-white font-mono-num">{displayedRounds.length}</strong> de{' '}
                <strong className="text-white font-mono-num">{filteredRounds.length}</strong> velas no Mosaico
              </span>
              {displayedRounds.length < filteredRounds.length && (
                <span className="text-[11px] text-pink-300 font-mono-num">
                  ({filteredRounds.length - displayedRounds.length} restantes)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {displayedRounds.length < filteredRounds.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(filteredRounds.length, prev + 300))}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    +300 Velas
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(filteredRounds.length, prev + 600))}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
                  >
                    +600 Velas
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(filteredRounds.length)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/50 text-purple-200 border border-purple-700/50 font-semibold transition-colors cursor-pointer"
                  >
                    Exibir Todas ({filteredRounds.length})
                  </button>
                </>
              ) : (
                filteredRounds.length > 300 && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(300)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                  >
                    Recolher para 300
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
