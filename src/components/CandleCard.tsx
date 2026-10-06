import React from 'react';
import { CrashRound } from '../types';
import { getCandleCategory, CANDLE_INFO, formatMultiplier, formatInstantTime } from '../utils/candleUtils';

interface CandleCardProps {
  round: CrashRound;
  index: number;
  isLatest?: boolean;
  onSelect?: (round: CrashRound) => void;
  showBorderPulse?: boolean;
}

export const CandleCard: React.FC<CandleCardProps> = React.memo(({
  round,
  index,
  isLatest = false,
  onSelect,
  showBorderPulse = true,
}) => {
  const category = getCandleCategory(round.result);
  const info = CANDLE_INFO[category];
  const timeFormatted = formatInstantTime(round.instant);
  const isGatilho13x = round.result >= 13.0 && round.result < 14.0;

  return (
    <div
      id={`candle-card-${round.externalId || index}`}
      onClick={() => onSelect?.(round)}
      className="group relative flex flex-col items-center cursor-pointer select-none transition-transform duration-150 hover:scale-[1.04] w-full"
      title={`${isGatilho13x ? '⏳ [GATILHO CASA 13x] ' : ''}Rodada #${round.externalId || index} • ${formatMultiplier(round.result)} às ${timeFormatted}`}
    >
      {/* Badge Flutuante de Ampulheta para Casa 13x */}
      {isGatilho13x && (
        <div
          className="absolute -top-2.5 z-20 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-amber-400 text-slate-950 font-black text-[9px] shadow-lg shadow-amber-500/40 border border-amber-200/60 flex items-center gap-1 animate-pulse"
          title="⏳ Vela Casa 13x detectada! Gatilho de análise ativado."
        >
          <span className="text-[11px] leading-none">⏳</span>
          <span className="hidden sm:inline font-mono-num font-extrabold tracking-tighter">13x</span>
        </div>
      )}

      {/* Top Colored Box (TipMiner Style) - Vela / Multiplicador */}
      <div
        className={`w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-t-xl rounded-b-sm border transition-shadow relative ${
          info.badgeBg
        } ${
          isGatilho13x
            ? 'border-amber-400/90 ring-2 ring-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
            : info.badgeBorder
        } ${
          isLatest && showBorderPulse
            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0b0e14] shadow-[0_0_15px_rgba(52,211,153,0.6)]'
            : info.glowColor
        }`}
      >
        {/* Multiplier Value */}
        <div className="flex items-center gap-0.5">
          {isGatilho13x && <span className="text-xs">⏳</span>}
          <span className="text-[14px] sm:text-[16px] font-black tracking-tight text-white leading-tight font-display drop-shadow-sm">
            {formatMultiplier(round.result)}
          </span>
        </div>
      </div>

      {/* Bottom Timestamp (Horário HH:mm:ss) */}
      <div className="w-full text-center py-1">
        <span className="text-[10px] sm:text-[11px] font-mono-num font-semibold text-slate-300 group-hover:text-white transition-colors">
          {timeFormatted}
        </span>
      </div>
    </div>
  );
});
