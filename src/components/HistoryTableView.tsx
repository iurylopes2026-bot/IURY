import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import { getCandleCategory, CANDLE_INFO, formatMultiplier } from '../utils/candleUtils';
import { Search, Download, ArrowUpDown, Flame, Sparkles } from 'lucide-react';

interface HistoryTableViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const HistoryTableView: React.FC<HistoryTableViewProps> = ({ rounds, onSelectRound }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'instant' | 'result' | 'externalId'>('instant');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = [...rounds];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.externalId?.toLowerCase().includes(q) || r.uuid?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortField === 'result') {
        return sortDir === 'asc' ? a.result - b.result : b.result - a.result;
      }
      if (sortField === 'externalId') {
        return sortDir === 'asc'
          ? (a.externalId || '').localeCompare(b.externalId || '')
          : (b.externalId || '').localeCompare(a.externalId || '');
      }
      // default: instant time
      const tA = new Date(a.instant).getTime();
      const tB = new Date(b.instant).getTime();
      return sortDir === 'asc' ? tA - tB : tB - tA;
    });

    return list;
  }, [rounds, search, sortField, sortDir]);

  const handleSort = (field: 'instant' | 'result' | 'externalId') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = 'Rodada,Multiplicador,Categoria,Data_Hora,Temperatura,UUID\n';
    const rows = filtered
      .map((r) => {
        const cat = getCandleCategory(r.result);
        return `"${r.externalId}",${r.result},"${cat}","${r.instant}",${r.temperature || 0},"${r.uuid}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mostrinho_historico_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search & Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="table-search-input"
              type="text"
              placeholder="Filtrar por rodada ou UUID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 font-mono-num"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono-num">
            {filtered.length} {filtered.length === 1 ? 'linha' : 'linhas'}
          </span>
        </div>

        <button
          id="export-csv-btn"
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs font-mono-num border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('externalId')}>
                <div className="flex items-center gap-1">
                  <span>Rodada</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('result')}>
                <div className="flex items-center gap-1">
                  <span>Vela (Crash)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('instant')}>
                <div className="flex items-center gap-1">
                  <span>Horário / Minuto</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Temperatura</th>
              <th className="py-3 px-4">UUID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.slice(0, 150).map((round, idx) => {
              const cat = getCandleCategory(round.result);
              const info = CANDLE_INFO[cat];
              const d = new Date(round.instant);
              const timeStr = isNaN(d.getTime()) ? round.instant : d.toLocaleString('pt-BR');
              const is13x = round.result >= 13.0 && round.result < 14.0;

              return (
                <tr
                  key={round.uuid || idx}
                  onClick={() => onSelectRound?.(round)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    is13x ? 'bg-amber-500/10 hover:bg-amber-500/15' : ''
                  }`}
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${info.badgeBg} ${info.textColor} border ${info.badgeBorder}`}
                      >
                        {cat === 'pink' ? (
                          <Sparkles className="w-2.5 h-2.5" />
                        ) : (
                          <Flame className="w-2.5 h-2.5" />
                        )}
                        {info.colorName}
                      </span>
                      {is13x && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <span>⏳</span>
                          <span>13x Gatilho</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-200">#{round.externalId || '---'}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-sm font-bold font-display ${info.textColor}`}>
                      {formatMultiplier(round.result)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{timeStr}</td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {round.temperature !== undefined ? `${round.temperature}°` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] max-w-[120px] truncate">
                    {round.uuid}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
