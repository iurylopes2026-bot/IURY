import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import { getCandleCategory, formatMultiplier, getMinuteAndSecond } from '../utils/candleUtils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Maximize2, Sparkles, Flame } from 'lucide-react';

interface TrendChartViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const TrendChartView: React.FC<TrendChartViewProps> = ({ rounds, onSelectRound }) => {
  const [windowSize, setWindowSize] = useState<number>(100);
  const [useLogScale, setUseLogScale] = useState<boolean>(true);

  // Prepare chronological data for the chart
  const chartData = useMemo(() => {
    // TipMiner returns newest first, so reverse to show progression from left to right
    const slice = rounds.slice(0, windowSize).reverse();

    // Calculate moving average of 5
    return slice.map((r, i, arr) => {
      const startIdx = Math.max(0, i - 4);
      const sub = arr.slice(startIdx, i + 1);
      const avg = sub.reduce((acc, curr) => acc + curr.result, 0) / sub.length;

      const cat = getCandleCategory(r.result);
      const { label } = getMinuteAndSecond(r.instant);
      const isGatilho13x = r.result >= 13.0 && r.result < 14.0;

      return {
        ...r,
        index: i + 1,
        timeLabel: label,
        multiplier: r.result,
        movingAvg: Number(avg.toFixed(2)),
        category: cat,
        isGatilho13x,
        dotColor: isGatilho13x
          ? '#f59e0b'
          : cat === 'pink'
          ? '#ec4899'
          : cat === 'purple'
          ? '#a855f7'
          : '#3b82f6',
      };
    });
  }, [rounds, windowSize]);

  return (
    <div className="space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Gráfico de Linha do Aviator</span>
          <span className="text-xs text-slate-400 hidden sm:inline font-mono-num">
            ({chartData.length} rodadas selecionadas)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Scale Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              id="chart-scale-log-btn"
              type="button"
              onClick={() => setUseLogScale(true)}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                useLogScale ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Escala Log (Recomendada)
            </button>
            <button
              id="chart-scale-linear-btn"
              type="button"
              onClick={() => setUseLogScale(false)}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                !useLogScale ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linear
            </button>
          </div>

          {/* Window size buttons */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 font-mono-num">
            {[30, 50, 100, 200].map((size) => (
              <button
                id={`chart-window-${size}-btn`}
                key={size}
                type="button"
                onClick={() => setWindowSize(size)}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  windowSize === size ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {size}r
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80 text-xs font-mono-num">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Azul (&lt;2x)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Roxo (2x a 9.99x)</span>
            </div>
            <div className="flex items-center gap-1.5 text-pink-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <span>Rosa (10x+)</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="text-xs">⏳</span>
              <span>Gatilho 13x (13.00x-13.99x)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
            <span>Média Móvel (5 rodadas)</span>
          </div>
        </div>

        {/* Responsive Recharts */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                scale={useLogScale ? 'log' : 'linear'}
                domain={useLogScale ? [0.9, 'auto'] : [0, 'auto']}
                allowDataOverflow={false}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `${val}x`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs font-mono-num space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-slate-800 pb-1">
                        <span>Rodada #{data.externalId}</span>
                        <span>{data.timeLabel}</span>
                      </div>

                      {data.isGatilho13x && (
                        <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black flex items-center gap-1">
                          <span>⏳</span>
                          <span>Gatilho Casa 13x Detectado</span>
                        </div>
                      )}

                      <div className="text-lg font-bold font-display" style={{ color: data.dotColor }}>
                        {formatMultiplier(data.multiplier)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Média Móvel: <span className="text-amber-300">{data.movingAvg}x</span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Reference lines for user thresholds */}
              <ReferenceLine y={2.0} stroke="#a855f7" strokeDasharray="4 4" label={{ value: '2x Roxo', fill: '#a855f7', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={10.0} stroke="#ec4899" strokeDasharray="4 4" label={{ value: '10x Rosa', fill: '#ec4899', fontSize: 10, position: 'right' }} />

              {/* Multiplier Line */}
              <Line
                type="monotone"
                dataKey="multiplier"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return null;
                  const isPink = payload.category === 'pink';
                  const is13x = payload.isGatilho13x;
                  return (
                    <g key={payload.uuid || payload.index}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={is13x ? 7 : isPink ? 5 : 3}
                        fill={payload.dotColor}
                        stroke={is13x ? '#fef08a' : '#0f172a'}
                        strokeWidth={is13x ? 2.5 : 1.5}
                        className={is13x ? 'animate-bounce' : isPink ? 'animate-pulse' : ''}
                      />
                      {is13x && (
                        <text
                          x={cx}
                          y={cy - 10}
                          textAnchor="middle"
                          fontSize="11"
                          className="select-none pointer-events-none"
                        >
                          ⏳
                        </text>
                      )}
                    </g>
                  );
                }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Moving average line */}
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
