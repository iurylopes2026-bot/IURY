import React, { useState } from 'react';
import { CrashRound } from '../types';
import { getCandleCategory, CANDLE_INFO, formatMultiplier } from '../utils/candleUtils';
import { X, Copy, Check, Flame, Sparkles, Clock, Hash, Thermometer } from 'lucide-react';

interface RoundModalProps {
  round: CrashRound | null;
  onClose: () => void;
}

export const RoundModal: React.FC<RoundModalProps> = ({ round, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!round) return null;

  const cat = getCandleCategory(round.result);
  const info = CANDLE_INFO[cat];
  const dateObj = new Date(round.instant);
  const formattedDate = isNaN(dateObj.getTime())
    ? round.instant
    : dateObj.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium',
      });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(round, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md p-5 rounded-2xl border bg-slate-900 shadow-2xl ${info.badgeBorder} ${info.glowColor}`}
      >
        {/* Close button */}
        <button
          id="close-round-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.badgeBg} border ${info.badgeBorder}`}
          >
            {cat === 'pink' ? (
              <Sparkles className="w-6 h-6 text-pink-400" />
            ) : (
              <Flame className={`w-6 h-6 ${info.textColor}`} />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Detalhes da Vela
            </div>
            <div className="text-sm font-bold text-white font-mono-num">
              {round.externalId ? `#${round.externalId}` : formattedDate}
            </div>
          </div>
        </div>

        {/* Big Multiplier Center Banner */}
        <div className={`p-4 mb-4 rounded-xl border text-center ${info.badgeBg} ${info.badgeBorder}`}>
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">
            Vela {info.colorName} ({info.label})
          </div>
          <div className={`text-4xl font-black font-display tracking-tight ${info.textColor}`}>
            {formatMultiplier(round.result)}
          </div>
        </div>

        {/* Key Attributes List */}
        <div className="space-y-2.5 text-xs font-mono-num mb-5">
          {round.externalId ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-400">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                Número da Rodada:
              </span>
              <span className="font-bold text-white">#{round.externalId}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Horário / Minuto:
            </span>
            <span className="font-semibold text-slate-200">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="flex items-center gap-2 text-slate-400">
              <Thermometer className="w-3.5 h-3.5 text-slate-500" />
              Temperatura TipMiner:
            </span>
            <span className="font-semibold text-slate-200">
              {round.temperature !== undefined ? `${round.temperature}°` : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-slate-500 mb-1 text-[10px] uppercase">UUID TipMiner:</div>
            <div className="text-[11px] text-slate-300 break-all select-all font-mono">
              {round.uuid}
            </div>
          </div>
        </div>

        {/* Action button: copy payload */}
        <button
          id="copy-round-json-btn"
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copiado para a Área de Transferência!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Dados JSON da Rodada</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
