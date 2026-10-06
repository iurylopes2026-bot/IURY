import React, { useState } from 'react';
import { CrashRound } from '../types';
import { groupRoundsByMinute, getCandleCategory, formatMultiplier, CANDLE_INFO } from '../utils/candleUtils';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';

interface MinutesMatrixProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const MinutesMatrix: React.FC<MinutesMatrixProps> = ({ rounds, onSelectRound }) => {
  const minuteStats = groupRoundsByMinute(rounds);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  const activeMinuteData = selectedMinute !== null ? minuteStats[selectedMinute] : null;

  return (
    <div className="space-y-4">
      {/* Header instructions & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-white">Matriz TipMiner de Minutos (00 a 59)</span>
          <span className="text-xs text-slate-400 hidden md:inline">
            — Identifique padrões de horários e velas pagadoras
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-num">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Azul (&lt;2x)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            Roxo (2x-9x)
          </span>
          <span className="flex items-center gap-1.5 text-pink-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            Rosa (10x+)
          </span>
        </div>
      </div>

      {/* Grid of 60 minutes (00 to 59) */}
      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1.5 sm:gap-2">
        {minuteStats.map((item) => {
          const hasPink = item.pinkCount > 0;
          const hasPurple = item.purpleCount > 0;
          const has13x = item.rounds.some((r) => r.result >= 13.0 && r.result < 14.0);
          const count = item.rounds.length;
          const isSelected = selectedMinute === item.minute;

          // Border / background based on contents
          let bgClass = 'bg-slate-900/40 border-slate-800/80 text-slate-400';
          if (hasPink) {
            bgClass = 'bg-pink-950/40 border-pink-500/70 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.25)]';
          } else if (hasPurple) {
            bgClass = 'bg-purple-950/30 border-purple-500/50 text-purple-300';
          } else if (count > 0) {
            bgClass = 'bg-blue-950/20 border-blue-500/30 text-blue-300';
          }

          return (
            <button
              id={`minute-cell-${item.minute}`}
              key={item.minute}
              type="button"
              onClick={() => setSelectedMinute(isSelected ? null : item.minute)}
              className={`relative flex flex-col items-center justify-between p-2 rounded-lg border transition-all duration-150 cursor-pointer min-h-[64px] ${bgClass} ${
                has13x ? 'border-amber-400/60 ring-1 ring-amber-400/40' : ''
              } ${
                isSelected ? 'ring-2 ring-pink-400 scale-105 z-10' : 'hover:border-slate-600'
              }`}
            >
              {/* Minute label */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold font-mono-num flex items-center gap-0.5">
                  :{String(item.minute).padStart(2, '0')}
                  {has13x && (
                    <span className="text-[10px]" title="Vela 13x (Gatilho) detectada neste minuto!">
                      ⏳
                    </span>
                  )}
                </span>
                {hasPink && (
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" title="Vela Rosa encontrada!" />
                )}
              </div>

              {/* Mini candles dots */}
              <div className="flex flex-wrap gap-1 justify-center my-1 max-w-[42px]">
                {item.rounds.slice(0, 4).map((r, rIdx) => {
                  const cat = getCandleCategory(r.result);
                  const color =
                    cat === 'pink' ? 'bg-pink-400' : cat === 'purple' ? 'bg-purple-400' : 'bg-blue-400';
                  return <span key={rIdx} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
                })}
                {item.rounds.length > 4 && (
                  <span className="text-[8px] text-slate-400">+{item.rounds.length - 4}</span>
                )}
              </div>

              {/* Bottom Highest Multiplier or count */}
              <div className="w-full text-center">
                {count > 0 ? (
                  <span
                    className={`text-[10px] font-extrabold font-mono-num ${
                      hasPink ? 'text-pink-300' : hasPurple ? 'text-purple-300' : 'text-slate-400'
                    }`}
                  >
                    {item.highestMultiplier > 0 ? formatMultiplier(item.highestMultiplier) : `${count}v`}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-600">-</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Minute Inspection Drawer */}
      {activeMinuteData && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-sm font-bold font-mono-num border border-pink-500/30">
                Minuto :{String(activeMinuteData.minute).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {activeMinuteData.rounds.length} rodadas registradas
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMinute(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Fechar
            </button>
          </div>

          {activeMinuteData.rounds.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Nenhuma rodada registrada neste minuto no histórico recente.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {activeMinuteData.rounds.map((round, idx) => {
                const cat = getCandleCategory(round.result);
                const info = CANDLE_INFO[cat];
                const d = new Date(round.instant);
                const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR');

                return (
                  <button
                    key={round.uuid || idx}
                    type="button"
                    onClick={() => onSelectRound?.(round)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-102 ${info.badgeBg} ${info.badgeBorder}`}
                  >
                    <div>
                      <div className={`text-sm font-bold font-display ${info.textColor}`}>
                        {formatMultiplier(round.result)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-num">
                        #{round.externalId || '---'}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono-num">
                      <div>{timeStr.slice(3)}</div>
                      <ChevronRight className="w-3 h-3 text-slate-500 ml-auto mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
