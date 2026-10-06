import React, { useState } from 'react';
import { TimeFilterOptions, getTodayDateString, getYesterdayDateString } from '../utils/dayArchive';
import {
  Calendar,
  Clock,
  Filter,
  X,
  RotateCcw,
  Check,
  Flame,
  Sparkles,
  ChevronRight,
  History,
} from 'lucide-react';

interface DateTimeFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: TimeFilterOptions;
  onApply: (options: TimeFilterOptions) => void;
  onReset: () => void;
  totalFilteredRounds: number;
  totalAllRounds: number;
}

export const DateTimeFilterModal: React.FC<DateTimeFilterModalProps> = ({
  isOpen,
  onClose,
  filterOptions,
  onApply,
  onReset,
  totalFilteredRounds,
  totalAllRounds,
}) => {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const [date, setDate] = useState<string>(filterOptions.date || today);
  const [startTime, setStartTime] = useState<string>(filterOptions.startTime || '00:00:00');
  const [endTime, setEndTime] = useState<string>(filterOptions.endTime || '');
  const [minuteExact, setMinuteExact] = useState<string>(
    filterOptions.minuteExact !== null && filterOptions.minuteExact !== undefined
      ? String(filterOptions.minuteExact)
      : ''
  );

  if (!isOpen) return null;

  // Shortcuts
  const setQuickRange = (start: string, end: string, targetDate?: string) => {
    if (targetDate) setDate(targetDate);
    setStartTime(start);
    setEndTime(end);
  };

  const handleApply = () => {
    onApply({
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      minuteExact: minuteExact !== '' ? parseInt(minuteExact, 10) : null,
      minMultiplier: filterOptions.minMultiplier,
      maxMultiplier: filterOptions.maxMultiplier,
    });
    onClose();
  };

  const handleReset = () => {
    setDate(today);
    setStartTime('00:00:00');
    setEndTime('');
    setMinuteExact('');
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-display">
                Pesquisar Horários e Datas
              </h2>
              <p className="text-xs text-slate-400 font-mono-num">
                Filtrar velas de Hoje, Ontem ou datas anteriores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            Data das Rodadas:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 font-mono-num"
            />
            <button
              type="button"
              onClick={() => {
                setDate(today);
                setStartTime('00:00:01');
                setEndTime('');
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                date === today
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => {
                setDate(yesterday);
                setStartTime('00:00:00');
                setEndTime('23:59:59');
              }}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                date === yesterday
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Buscar todas as velas de ontem (00h às 24h)"
            >
              <History className="w-3.5 h-3.5" />
              Ontem
            </button>
          </div>
        </div>

        {/* Time Interval: Start and End Time */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Faixa de Horário (Horário de Brasília):
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Horário Inicial (De):</span>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00:01"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono-num"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Horário Final (Até):</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="Horário atual (ex: 14:00:00)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono-num"
              />
            </div>
          </div>
        </div>

        {/* Quick Range Shortcuts */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Atalhos Rápidos:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuickRange('00:00:01', '', today)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-pink-600/30 hover:border-pink-500/50 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
            >
              Hoje: 00:00:01 até Agora
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('00:00:00', '23:59:59', yesterday)}
              className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-600/50 hover:border-purple-500/50 border border-purple-700/60 text-xs font-medium text-purple-200 transition-all cursor-pointer"
            >
              Ontem: Dia Inteiro (00h-24h)
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('00:00:00', '06:00:00')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
            >
              Madrugada (00h-06h)
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('06:00:00', '12:00:00')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
            >
              Manhã (06h-12h)
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('12:00:00', '18:00:00')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
            >
              Tarde (12h-18h)
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('18:00:00', '23:59:59')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all cursor-pointer"
            >
              Noite (18h-24h)
            </button>
          </div>
        </div>

        {/* Filter by exact minute */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Filtrar por Minuto Específico:
            </label>
            {minuteExact !== '' && (
              <button
                type="button"
                onClick={() => setMinuteExact('')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Limpar minuto
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="59"
              value={minuteExact}
              onChange={(e) => setMinuteExact(e.target.value)}
              placeholder="Ex: 15 (apenas velas no minuto :15)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono-num"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Filtro
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
