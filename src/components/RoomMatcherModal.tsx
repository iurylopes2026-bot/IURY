import React, { useState, useEffect } from 'react';
import { getCandleCategory } from '../utils/candleUtils';
import { Check, Search, RefreshCw, Radio, Zap, X, ShieldAlert, Sparkles } from 'lucide-react';

interface RoomStatus {
  id: string;
  name: string;
  pid: string;
  recentMultipliers: Array<{
    uuid?: string;
    result: number;
    instant?: string;
  }>;
}

interface RoomMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHouseId: string;
  onSelectHouse: (id: string) => void;
}

export const RoomMatcherModal: React.FC<RoomMatcherModalProps> = ({
  isOpen,
  onClose,
  activeHouseId,
  onSelectHouse,
}) => {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const fetchRoomsStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms-status?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
        setLastCheckTime(
          new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Bahia' })
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoomsStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter or match rooms
  const parsedSearch = searchVal
    .replace(/x/gi, '')
    .split(/[,;\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const scoredRooms = rooms.map((r) => {
    const mults = r.recentMultipliers.map((m) => m.result);
    let matchCount = 0;
    if (parsedSearch.length > 0) {
      for (const target of parsedSearch) {
        if (mults.some((v) => Math.abs(v - target) <= 0.05)) {
          matchCount++;
        }
      }
    }
    return {
      ...r,
      isMatch: parsedSearch.length > 0 && matchCount > 0,
      matchCount,
    };
  });

  // Sort matched rooms first
  scoredRooms.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Sincronizar com seu Jogo
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Torre Bet Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Localize exatamente em qual sala do Aviator sua conta da Torre Bet está conectada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Instructions */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Digite 1 ou 2 velas que saíram na sua tela agora (ex: 4.12 ou 5.23)..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              7 Salas do Aviator monitoradas em tempo real
              {lastCheckTime && (
                <span className="text-slate-500 ml-1">({lastCheckTime})</span>
              )}
            </span>
            <button
              type="button"
              onClick={fetchRoomsStatus}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Salas
            </button>
          </div>
        </div>

        {/* Room List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {loading && rooms.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Consultando as velas de todas as salas...</p>
            </div>
          ) : (
            scoredRooms.map((r) => {
              const isCurrent = r.id === activeHouseId;
              return (
                <div
                  key={r.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    r.isMatch
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : isCurrent
                      ? 'bg-slate-800/90 border-slate-600'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-display">
                        {r.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Conectada Agora
                        </span>
                      )}
                      {r.isMatch && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/30 text-amber-200 border border-amber-500/50 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          Combina com sua tela!
                        </span>
                      )}
                    </div>

                    {/* Multipliers preview */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-semibold mr-1">
                        Últimas:
                      </span>
                      {r.recentMultipliers.length > 0 ? (
                        r.recentMultipliers.map((m, idx) => {
                          const cat = getCandleCategory(m.result);
                          const color =
                            cat === 'pink'
                              ? 'bg-pink-600/30 text-pink-300 border-pink-500/40'
                              : cat === 'purple'
                              ? 'bg-purple-600/30 text-purple-300 border-purple-500/40'
                              : 'bg-blue-600/30 text-blue-300 border-blue-500/40';
                          return (
                            <span
                              key={m.uuid || idx}
                              className={`px-2 py-0.5 rounded-lg border text-xs font-mono-num font-bold ${color}`}
                            >
                              {m.result.toFixed(2)}x
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Aguardando próxima rodada...
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectHouse(r.id);
                      onClose();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                      isCurrent
                        ? 'bg-slate-700 text-slate-300 hover:text-white'
                        : r.isMatch
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Sala Ativa
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5" />
                        Conectar nesta Sala
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Por que existem 7 salas?</strong> No Brasil, a Spribe e a PlayFiver distribuem os jogadores da Torre Bet entre diferentes instâncias do Aviator. Ao comparar as últimas 2 velas da sua tela acima, você escolhe exatamente a sala em que está jogando.
          </span>
        </div>
      </div>
    </div>
  );
};
