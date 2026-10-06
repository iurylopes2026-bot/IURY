import React from 'react';
import { BettingHouse, CrashRound, ActiveTab } from '../types';
import { getCandleCategory, CANDLE_INFO } from '../utils/candleUtils';
import {
  Flame,
  LayoutGrid,
  Zap,
  Sparkles,
  ArrowLeftRight,
  Crown,
  Crosshair,
  Target,
  Building2,
  RotateCw,
  Clock,
  Radio,
  Award,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  houses: BettingHouse[];
  activeHouseId: string;
  onSelectHouse: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number; // in seconds (0 = off)
  onChangeAutoRefresh: (seconds: number) => void;
  lastUpdated: string;
  secondsUntilNextRefresh: number;
  latestRound?: CrashRound;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  houses,
  activeHouseId,
  onSelectHouse,
  loading,
  onRefresh,
  autoRefreshInterval,
  onChangeAutoRefresh,
  lastUpdated,
  secondsUntilNextRefresh,
  latestRound,
}) => {
  const activeHouse = houses.find((h) => h.id === activeHouseId) || houses[0];
  const latestCategory = latestRound ? getCandleCategory(latestRound.result) : null;
  const latestInfo = latestCategory ? CANDLE_INFO[latestCategory] : null;

  return (
    <header className="sticky top-0 z-40 bg-[#0b0e14]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Level: Brand, House Switcher & Live Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-pink-400/40">
              <Flame className="w-6 h-6 text-white animate-bounce" style={{ animationDuration: '2.5s' }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0b0e14]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-wider bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  MOSTRINHO
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  v1.0 Aviator
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mosaico de Velas & Análise de Gráficos em Tempo Real
              </p>
            </div>
          </div>

          {/* Controls: House Select & Auto-Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Betting House Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              <label htmlFor="betting-house-select" className="sr-only">Casa de Aposta</label>
              <select
                id="betting-house-select"
                value={activeHouseId}
                onChange={(e) => onSelectHouse(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Latest Crash Quick Pill */}
            {latestRound && latestInfo && (
              <div
                title={`Última rodada capturada: #${latestRound.externalId}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono-num font-bold ${latestInfo.badgeBg} ${latestInfo.badgeBorder} ${latestInfo.textColor}`}
              >
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span className="text-[10px] opacity-80">ÚLTIMA:</span>
                <span>{latestRound.result.toFixed(2)}x</span>
              </div>
            )}

            {/* Auto-Refresh Timer Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="auto-refresh-select" className="text-[11px] text-slate-400 hidden sm:inline">Auto:</label>
              <select
                id="auto-refresh-select"
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value={3} className="bg-slate-900">3 seg (Ultra)</option>
                <option value={5} className="bg-slate-900">5 seg</option>
                <option value={10} className="bg-slate-900">10 seg</option>
                <option value={30} className="bg-slate-900">30 seg</option>
                <option value={0} className="bg-slate-900">Pausado</option>
              </select>
              {autoRefreshInterval > 0 && (
                <span className="w-4 text-center font-mono text-[10px] text-pink-400 font-bold">
                  {secondsUntilNextRefresh}s
                </span>
              )}
            </div>

            {/* Live Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 text-xs font-mono-num font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">AO VIVO</span>
            </div>

            {/* Manual Refresh Button */}
            <button
              id="header-refresh-btn"
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Atualizar dados agora"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Level: Abas Principais de Análise (Grid sem barra de rolagem) */}
        <div className="pt-2.5 space-y-2">
          <nav className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 w-full" aria-label="Abas de Análise">
            {/* Aba 1: Mosaico & Máxima */}
            <button
              type="button"
              onClick={() => onSelectTab('mosaico_maxima')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'mosaico_maxima'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] ring-1 ring-pink-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-pink-400" />
              <span className="truncate">1. Mosaico</span>
            </button>

            {/* Aba 2: Projeção Rápida */}
            <button
              type="button"
              onClick={() => onSelectTab('projecao_rapida')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'projecao_rapida'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
              <span className="truncate">2. Proj. Rápida</span>
            </button>

            {/* Aba 3: Projeção Longa VIP */}
            <button
              type="button"
              onClick={() => onSelectTab('projecao_longa')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'projecao_longa'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-300" />
              <span className="truncate">3. Proj. Longa</span>
            </button>

            {/* Aba 4: Velas Invertidas */}
            <button
              type="button"
              onClick={() => onSelectTab('velas_invertidas')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'velas_invertidas'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
              <span className="truncate">4. Invertidas</span>
            </button>

            {/* Aba 5: Velas 100x a 1000x */}
            <button
              type="button"
              onClick={() => onSelectTab('velas_100x_1000x')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'velas_100x_1000x'
                  ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span className="truncate">5. 100x-1000x</span>
            </button>

            {/* Aba 6: Gatilho Casa 13x (≥50x) */}
            <button
              type="button"
              onClick={() => onSelectTab('gatilho_13x')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'gatilho_13x'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0 text-fuchsia-300" />
              <span className="truncate">6. Gatilho 13x</span>
            </button>

            {/* Aba 7: 10X A 50X */}
            <button
              type="button"
              onClick={() => onSelectTab('estrategia_10x_50x')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'estrategia_10x_50x'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span className="truncate">7. 10X A 50X</span>
            </button>

            {/* Aba 8: 7X A 9X */}
            <button
              type="button"
              onClick={() => onSelectTab('estrategia_7x_9x')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'estrategia_7x_9x'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0 text-purple-300" />
              <span className="truncate">8. 7X A 9X</span>
            </button>

            {/* Aba 9: Top Gun - Analisador de Casas */}
            <button
              type="button"
              onClick={() => onSelectTab('top_gun')}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
                activeTab === 'top_gun'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-700 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span className="truncate">9. Top Gun</span>
            </button>
          </nav>



          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-num px-1">
            <span className="text-slate-500">Módulo Ativo: <strong className="text-slate-300 capitalize">{activeTab.replace('_', ' ')}</strong></span>
            <span>Última leitura: <strong className="text-slate-200">{lastUpdated || 'Carregando...'}</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
