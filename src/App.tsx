import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CrashRound, BettingHouse, CandleCategory, ActiveTab } from './types';
import { getSavedHouses } from './data/houses';
import { fetchCrashRounds } from './services/api';
import { getCandleCategory, playPinkAlertSound } from './utils/candleUtils';
import {
  archiveRoundsForToday,
  getArchivedRounds,
  getTodayDateString,
  TimeFilterOptions,
} from './utils/dayArchive';
import { Header } from './components/Header';
import { MosaicoView } from './components/MosaicoView';
import { ProjecaoRapidaView } from './components/ProjecaoRapidaView';
import { ProjecaoLongaView } from './components/ProjecaoLongaView';
import { VelasInvertidasView } from './components/VelasInvertidasView';
import { Velas100xA1000xView } from './components/Velas100xA1000xView';
import { Gatilho13xView } from './components/Gatilho13xView';
import { Estrategia10xA50xView } from './components/Estrategia10xA50xView';
import { Estrategia7xA9xView } from './components/Estrategia7xA9xView';
import { TopGunAnalisadorView } from './components/TopGunAnalisadorView';
import { RoundModal } from './components/RoundModal';
import { DateTimeFilterModal } from './components/DateTimeFilterModal';
import { RoomMatcherModal } from './components/RoomMatcherModal';
import { AlertTriangle, RefreshCw, Flame, ArrowRight, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mosaico_maxima');
  const [houses, setHouses] = useState<BettingHouse[]>(() => getSavedHouses());
  const [activeHouseId, setActiveHouseId] = useState<string>(() => {
    const saved = getSavedHouses();
    const torre = saved.find((h) => h.id === 'torre_bet_grafico1');
    return torre ? torre.id : (saved[0]?.id || 'torre_bet_grafico1');
  });

  const [rounds, setRounds] = useState<CrashRound[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(5);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<CandleCategory | 'all'>('all');
  const [selectedRound, setSelectedRound] = useState<CrashRound | null>(null);

  // All-day mode & Time/Date Filter (padrão HOJE de 00:00:00 até o momento atual)
  const [allDayMode, setAllDayMode] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterOptions>({
    date: getTodayDateString(),
    startTime: '00:00:00',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [isRoomMatcherOpen, setIsRoomMatcherOpen] = useState<boolean>(false);

  // Keep track of latest round to detect incoming new pink rounds
  const lastKnownRoundUuid = useRef<string | null>(null);
  const isFirstLoad = useRef<boolean>(true);

  const activeHouse = useMemo(() => {
    return houses.find((h) => h.id === activeHouseId) || houses[0];
  }, [houses, activeHouseId]);

  useEffect(() => {
    if (!houses.some((h) => h.id === activeHouseId) && houses[0]) {
      setActiveHouseId(houses[0].id);
    }
  }, [houses, activeHouseId]);

  // Load rounds for active house
  const loadRounds = useCallback(
    async (silent = false, fresh = true) => {
      if (!silent) setLoading(true);
      setError(null);

      const house = houses.find((h) => h.id === activeHouseId) || houses[0];
      // Fetch with limit 30000, allDay=true, and date filter to pull complete history (00:00:01 until now)
      const result = await fetchCrashRounds(
        house.id,
        house.endpoint,
        30000,
        fresh,
        allDayMode,
        timeFilter.date,
        house.token
      );

      if (result.success && result.rounds.length > 0) {
        // Salva e mescla no histórico diário para manter todas as rodadas desde 00:00:00 até agora
        const mergedDayRounds = archiveRoundsForToday(house.id, result.rounds);
        setRounds(allDayMode ? mergedDayRounds : result.rounds);
        setLastUpdated(result.fetchedAt);

        // Check if a new round arrived
        const latest = result.rounds[0];
        if (
          !isFirstLoad.current &&
          lastKnownRoundUuid.current &&
          latest.uuid !== lastKnownRoundUuid.current
        ) {
          // A new round was added! Check if it's pink (10x+)
          if (getCandleCategory(latest.result) === 'pink' && soundEnabled) {
            playPinkAlertSound();
          }
        }

        lastKnownRoundUuid.current = latest.uuid;
        isFirstLoad.current = false;
      } else {
        // Fallback to local archive if offline or error
        const localArchived = getArchivedRounds(house.id, timeFilter.date);
        if (localArchived.length > 0) {
          setRounds(localArchived);
        } else if (!silent) {
          setError(result.error || 'Não foi possível carregar os dados desta casa de aposta.');
        }
      }

      setLoading(false);
    },
    [activeHouseId, houses, soundEnabled, allDayMode, timeFilter.date]
  );

  // Initial load or house switch
  useEffect(() => {
    isFirstLoad.current = true;
    lastKnownRoundUuid.current = null;
    loadRounds(false, true);
    setSecondsUntilRefresh(autoRefreshInterval);
  }, [activeHouseId, loadRounds, autoRefreshInterval]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          loadRounds(true, true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadRounds]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Navbar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        houses={houses}
        activeHouseId={activeHouseId}
        onSelectHouse={setActiveHouseId}
        loading={loading}
        onRefresh={() => {
          loadRounds(false, true);
          setSecondsUntilRefresh(autoRefreshInterval);
        }}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={(sec) => {
          setAutoRefreshInterval(sec);
          setSecondsUntilRefresh(sec);
        }}
        lastUpdated={lastUpdated}
        secondsUntilNextRefresh={secondsUntilRefresh}
        latestRound={rounds[0]}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Active Room Confirmation & Name Switcher Banner */}
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SALA ATIVA:
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1.5 font-display">
              {activeHouse?.name || 'Betfusion → GRAFICO 1'}
            </span>
            <span className="text-slate-500 font-mono-num text-[11px] hidden lg:inline">
              (ID: {activeHouse?.endpoint.split('/rounds/')[1]?.split('/history')[0] || ''})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRoomMatcherOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              title="Comparar com as velas do seu jogo e sincronizar automaticamente"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Sincronizar com Meu Jogo</span>
            </button>

            <span className="text-[11px] text-slate-400 font-semibold ml-1">Salas:</span>
            {houses.map((h) => {
              const isSelected = h.id === activeHouseId;
              return (
                <button
                  key={h.id}
                  id={`select-house-${h.id}`}
                  type="button"
                  onClick={() => setActiveHouseId(h.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{h.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-num animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block font-bold">Aviso de Conexão:</strong>
                <span>{error}</span>
              </div>
            </div>
            <button
              id="retry-fetch-rounds-btn"
              type="button"
              onClick={() => loadRounds(false, true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Initial Loading Skeleton */}
        {loading && rounds.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="relative">
              <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
              <Flame className="w-4 h-4 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Conectando com a API da {activeHouse?.name || 'Betfusion'}...
            </p>
            <p className="text-xs text-slate-500 font-mono-num">
              Carregando histórico do dia desde 00:00:00
            </p>
          </div>
        ) : (
          /* Render Active Tab View */
          <>
            {activeTab === 'mosaico_maxima' && (
              <MosaicoView
                rounds={rounds}
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                onSelectRound={setSelectedRound}
                onOpenFilterModal={() => setIsFilterModalOpen(true)}
                timeFilter={timeFilter}
                onClearTimeFilter={() =>
                  setTimeFilter({ date: getTodayDateString(), startTime: '00:00:00' })
                }
                onSetTimeFilter={setTimeFilter}
                allDayMode={allDayMode}
                onToggleAllDayMode={() => setAllDayMode(!allDayMode)}
                totalArchivedCount={rounds.length}
              />
            )}

            {activeTab === 'projecao_rapida' && (
              <ProjecaoRapidaView
                rounds={rounds}
                onSelectRound={setSelectedRound}
                houseName={activeHouse?.name || 'TORRE BET'}
              />
            )}

            {activeTab === 'projecao_longa' && (
              <ProjecaoLongaView
                rounds={rounds}
                onSelectRound={setSelectedRound}
                houseName={activeHouse?.name || 'TORRE BET'}
              />
            )}

            {activeTab === 'velas_invertidas' && (
              <VelasInvertidasView rounds={rounds} onSelectRound={setSelectedRound} />
            )}

            {activeTab === 'velas_100x_1000x' && (
              <Velas100xA1000xView rounds={rounds} onSelectRound={setSelectedRound} />
            )}

            {activeTab === 'gatilho_13x' && (
              <Gatilho13xView rounds={rounds} onSelectRound={setSelectedRound} />
            )}

            {activeTab === 'estrategia_10x_50x' && (
              <Estrategia10xA50xView rounds={rounds} onSelectRound={setSelectedRound} />
            )}

            {activeTab === 'estrategia_7x_9x' && (
              <Estrategia7xA9xView rounds={rounds} onSelectRound={setSelectedRound} />
            )}

            {activeTab === 'top_gun' && (
              <TopGunAnalisadorView rounds={rounds} onSelectRound={setSelectedRound} />
            )}
          </>
        )}
      </main>

      {/* Date and Time Filter Search Modal */}
      <DateTimeFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterOptions={timeFilter}
        onApply={(opts) => setTimeFilter(opts)}
        onReset={() =>
          setTimeFilter({ date: getTodayDateString(), startTime: '00:00:00' })
        }
        totalFilteredRounds={rounds.length}
        totalAllRounds={rounds.length}
      />

      {/* Room Matcher Modal */}
      <RoomMatcherModal
        isOpen={isRoomMatcherOpen}
        onClose={() => setIsRoomMatcherOpen(false)}
        activeHouseId={activeHouseId}
        onSelectHouse={setActiveHouseId}
      />

      {/* Round Inspection Modal */}
      <RoundModal round={selectedRound} onClose={() => setSelectedRound(null)} />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-[#07090e] py-3 text-center text-xs text-slate-500 font-mono-num">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-bold text-pink-400 font-display">MOSTRINHO</span>
            <span>• Mosaico Aviator em Tempo Real</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-blue-300">Azul (1,00x - 1,99x)</span>
            <span>•</span>
            <span className="text-purple-300">Roxo (2,00x - 9,99x)</span>
            <span>•</span>
            <span className="text-pink-400 font-semibold">Rosa (10,00x+)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
