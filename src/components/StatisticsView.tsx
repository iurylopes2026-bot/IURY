import React, { useMemo } from 'react';
import { CrashRound } from '../types';
import { groupRoundsByMinute, getCandleCategory, formatMultiplier } from '../utils/candleUtils';
import {
  Sparkles,
  Flame,
  BarChart3,
  Clock,
  Zap,
  Target,
  AlertCircle,
  Trophy,
} from 'lucide-react';

interface StatisticsViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ rounds, onSelectRound }) => {
  // Group by minute
  const minuteStats = useMemo(() => groupRoundsByMinute(rounds), [rounds]);

  // Top 5 minutes with most pink candles
  const topPinkMinutes = useMemo(() => {
    return [...minuteStats]
      .filter((m) => m.pinkCount > 0)
      .sort((a, b) => b.pinkCount - a.pinkCount || b.highestMultiplier - a.highestMultiplier)
      .slice(0, 6);
  }, [minuteStats]);

  // Multiplier brackets distribution
  const brackets = useMemo(() => {
    const buckets = [
      { label: '1.00x - 1.20x', min: 1.0, max: 1.2, count: 0, color: 'bg-blue-600' },
      { label: '1.21x - 1.50x', min: 1.21, max: 1.5, count: 0, color: 'bg-blue-500' },
      { label: '1.51x - 1.99x', min: 1.51, max: 1.99, count: 0, color: 'bg-blue-400' },
      { label: '2.00x - 4.99x', min: 2.0, max: 4.99, count: 0, color: 'bg-purple-500' },
      { label: '5.00x - 9.99x', min: 5.0, max: 9.99, count: 0, color: 'bg-purple-400' },
      { label: '10.00x - 49.99x', min: 10.0, max: 49.99, count: 0, color: 'bg-pink-500' },
      { label: '50.00x+', min: 50.0, max: Infinity, count: 0, color: 'bg-pink-400' },
    ];

    rounds.forEach((r) => {
      for (const b of buckets) {
        if (r.result >= b.min && r.result <= b.max) {
          b.count++;
          break;
        }
      }
    });

    const total = rounds.length || 1;
    return buckets.map((b) => ({
      ...b,
      percent: Number(((b.count / total) * 100).toFixed(1)),
    }));
  }, [rounds]);

  // Pink drought intervals (gaps between pink candles)
  const pinkGaps = useMemo(() => {
    const pinkIndices: number[] = [];
    rounds.forEach((r, idx) => {
      if (getCandleCategory(r.result) === 'pink') {
        pinkIndices.push(idx);
      }
    });

    if (pinkIndices.length < 2) {
      return { avgGap: 0, maxGap: 0, totalPinks: pinkIndices.length };
    }

    const gaps: number[] = [];
    for (let i = 0; i < pinkIndices.length - 1; i++) {
      gaps.push(pinkIndices[i + 1] - pinkIndices[i]);
    }

    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const max = Math.max(...gaps);

    return {
      avgGap: Number(avg.toFixed(1)),
      maxGap: max,
      totalPinks: pinkIndices.length,
    };
  }, [rounds]);

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Velas Rosa (10x+)</div>
            <div className="text-2xl font-black text-pink-400 font-display">
              {pinkGaps.totalPinks} <span className="text-xs font-normal text-slate-500">velas</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Intervalo Médio Rosa</div>
            <div className="text-2xl font-black text-purple-400 font-display">
              {pinkGaps.avgGap > 0 ? `A cada ${pinkGaps.avgGap} rodadas` : 'Sem dados suficientes'}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Maior Vácuo sem Rosa</div>
            <div className="text-2xl font-black text-amber-400 font-display">
              {pinkGaps.maxGap > 0 ? `${pinkGaps.maxGap} rodadas` : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* Top Minutes and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pagadores */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Minutos Pagadores (Mais Velas 10x+)
            </h3>
          </div>

          {topPinkMinutes.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhuma vela rosa identificada nas rodadas carregadas.
            </p>
          ) : (
            <div className="space-y-2.5">
              {topPinkMinutes.map((item, idx) => (
                <div
                  key={item.minute}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-pink-500/40 transition-colors font-mono-num"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-pink-400">
                        Minuto :{String(item.minute).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-slate-400">
                        Maior:{' '}
                        <span className="text-amber-300 font-semibold">
                          {formatMultiplier(item.highestMultiplier)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold">
                      {item.pinkCount}x Rosa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brackets Distribution */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Distribuição por Faixa de Multiplicador
            </h3>
          </div>

          <div className="space-y-3 font-mono-num text-xs">
            {brackets.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">{b.label}</span>
                  <span>
                    <strong className="text-white">{b.count}</strong> ({b.percent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(b.percent, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
