import React from 'react';
import { RoundStats, CandleCategory } from '../types';
import { formatMultiplier } from '../utils/candleUtils';
import { Flame, Sparkles, TrendingUp, Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';

interface StatsBarProps {
  stats: RoundStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeFilter: CandleCategory | 'all';
  onSelectFilter: (filter: CandleCategory | 'all') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  soundEnabled,
  onToggleSound,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* 3 Main Color Candles Badges as per User Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Velas Azuis */}
        <button
          id="filter-blue-candles"
          type="button"
          onClick={() => onSelectFilter(activeFilter === 'blue' ? 'all' : 'blue')}
          className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
            activeFilter === 'blue'
              ? 'bg-blue-950/90 border-blue-400 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : 'bg-slate-900/80 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-950/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Velas Azuis
              </div>
              <div className="text-xs text-slate-400 font-mono-num">1.00x até 1.99x</div>
            </div>
          </div>
          <div className="text-right font-mono-num">
            <div className="text-xl font-black text-blue-400 font-display">
              {stats.bluePercent}%
            </div>
            <div className="text-xs text-slate-400">{stats.blueCount} rodadas</div>
          </div>
        </button>

        {/* Velas Roxas */}
        <button
          id="filter-purple-candles"
          type="button"
          onClick={() => onSelectFilter(activeFilter === 'purple' ? 'all' : 'purple')}
          className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
            activeFilter === 'purple'
              ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : 'bg-slate-900/80 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Velas Roxas
              </div>
              <div className="text-xs text-slate-400 font-mono-num">2.00x até 9.99x</div>
            </div>
          </div>
          <div className="text-right font-mono-num">
            <div className="text-xl font-black text-purple-400 font-display">
              {stats.purplePercent}%
            </div>
            <div className="text-xs text-slate-400">{stats.purpleCount} rodadas</div>
          </div>
        </button>

        {/* Velas Rosa */}
        <button
          id="filter-pink-candles"
          type="button"
          onClick={() => onSelectFilter(activeFilter === 'pink' ? 'all' : 'pink')}
          className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
            activeFilter === 'pink'
              ? 'bg-pink-950/90 border-pink-400 ring-2 ring-pink-500/60 shadow-[0_0_25px_rgba(236,72,153,0.4)]'
              : 'bg-slate-900/80 border-pink-500/40 hover:border-pink-500 hover:bg-pink-950/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600/25 border border-pink-500/50 flex items-center justify-center text-pink-400 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-pink-300 uppercase tracking-wider flex items-center gap-1">
                Velas Rosa
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              </div>
              <div className="text-xs text-slate-400 font-mono-num">10.00x até 999k+</div>
            </div>
          </div>
          <div className="text-right font-mono-num">
            <div className="text-xl font-black text-pink-400 font-display">
              {stats.pinkPercent}%
            </div>
            <div className="text-xs text-slate-400">{stats.pinkCount} rodadas</div>
          </div>
        </button>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono-num">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Total */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500 uppercase">Total:</span>
            <span className="font-bold text-white">{stats.total} rodadas</span>
          </div>

          {/* Maior Vela */}
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500 uppercase">Maior Vela:</span>
            <span className="font-bold text-amber-300 font-display text-sm">
              {formatMultiplier(stats.maxMultiplier)}
            </span>
          </div>

          {/* Média */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500 uppercase">Média:</span>
            <span className="font-bold text-slate-200">
              {formatMultiplier(stats.averageMultiplier)}
            </span>
          </div>

          {/* Distância da última Rosa */}
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-slate-500 uppercase">Última Rosa:</span>
            <span
              className={`font-bold ${
                stats.lastPinkDistance > 20
                  ? 'text-pink-400 font-extrabold animate-pulse'
                  : 'text-slate-300'
              }`}
            >
              há {stats.lastPinkDistance} {stats.lastPinkDistance === 1 ? 'rodada' : 'rodadas'}
            </span>
          </div>

          {/* Sequência Atual */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500 uppercase">Sequência:</span>
            <span className="font-semibold text-slate-200">
              {stats.currentStreak.count}x{' '}
              <span
                className={
                  stats.currentStreak.category === 'pink'
                    ? 'text-pink-400'
                    : stats.currentStreak.category === 'purple'
                    ? 'text-purple-400'
                    : 'text-blue-400'
                }
              >
                {stats.currentStreak.category === 'pink'
                  ? 'Rosa'
                  : stats.currentStreak.category === 'purple'
                  ? 'Roxa'
                  : 'Azul'}
              </span>
            </span>
          </div>
        </div>

        {/* Sound toggle button */}
        <button
          id="toggle-sound-alert-btn"
          type="button"
          onClick={onToggleSound}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-pink-950/40 border-pink-500/60 text-pink-300 hover:bg-pink-900/40'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Alerta sonoro de Vela Rosa ligado' : 'Alerta sonoro desligado'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] font-semibold">Alerta Rosa Ativo</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Sem Som</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
