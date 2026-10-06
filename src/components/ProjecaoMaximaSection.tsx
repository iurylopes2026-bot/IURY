import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  analisarQuebrasDeMaxima,
  QuebraMaximaItem,
} from '../utils/analysisEngine';
import {
  Crown,
  Shield,
  Flame,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProjecaoMaximaSectionProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const ProjecaoMaximaSection: React.FC<ProjecaoMaximaSectionProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [expandedQuebraId, setExpandedQuebraId] = useState<string | null>(null);

  const quebras = useMemo(() => {
    return analisarQuebrasDeMaxima(rounds);
  }, [rounds]);

  const quebraMaisRecente: QuebraMaximaItem | undefined = quebras[0];

  if (!quebras || quebras.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-400">
        Nenhuma quebra de máxima identificada nas velas carregadas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Principal: Anatomia da Última Quebra de Máxima */}
      {quebraMaisRecente && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d121d] to-slate-900 border border-pink-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-pink-400" />
                  MÁXIMA ATUAL DO DIA
                </span>
                <span className="text-slate-400 text-xs font-mono-num flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {quebraMaisRecente.timeStr}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
                  {quebraMaisRecente.novoMax.toFixed(2)}x
                </h2>
                <span className="text-xs text-slate-400 font-mono-num">
                  (Superou máxima anterior de{' '}
                  <strong className="text-slate-200">
                    {quebraMaisRecente.maxAnterior > 0
                      ? `${quebraMaisRecente.maxAnterior.toFixed(2)}x`
                      : '0.00x'}
                  </strong>
                  )
                </span>
              </div>
            </div>

            {/* Badges de Auditoria do Teto Pré-Quebra */}
            <div className="flex items-center gap-2 flex-wrap">
              {quebraMaisRecente.tetoAltoBatido && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-lg shadow-amber-500/10 animate-pulse">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span>👑 TETO ALTO BATIDO</span>
                </div>
              )}
              {quebraMaisRecente.protecaoAtingida && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold shadow-lg shadow-purple-500/10">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>🛡️ PROTEÇÃO ATINGIDA</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid de Métricas: Teto Pré-Quebra (10 minutos antes) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                Teto Rosa Pré-Quebra (-10m)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-pink-400 font-mono-num">
                  {quebraMaisRecente.valorTetoRosa.toFixed(2)}x
                </span>
                <span className="text-[10px] text-slate-500">
                  {quebraMaisRecente.veioDe10mRosa ? '(nos 10m)' : '(última anterior)'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                Proteção Roxa Pré-Quebra (-10m)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-purple-400 font-mono-num">
                  {quebraMaisRecente.valorProtecaoRoxa.toFixed(2)}x
                </span>
                <span className="text-[10px] text-slate-500">(teto 4x a 9.99x)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                Casas de Rosa Pós-Máxima
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-white font-mono-num">
                  {quebraMaisRecente.casasDeRosa.length}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  velas ≥10x pagas
                </span>
              </div>
            </div>
          </div>

          {/* Seção das Casas de Rosa Pós-Máxima */}
          {quebraMaisRecente.casasDeRosa.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Rastreamento das Casas de Rosa Pós-Quebra:
                </h4>
                <span className="text-[10px] text-slate-400 font-mono-num">
                  Sequência cronológica após {quebraMaisRecente.novoMax.toFixed(2)}x
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {quebraMaisRecente.casasDeRosa.map((casa) => (
                  <div
                    key={casa.round.uuid || casa.numeroCasa}
                    onClick={() => onSelectRound?.(casa.round)}
                    className={`shrink-0 p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-105 ${
                      casa.superouTetoRosa
                        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/80 border-pink-500/30 hover:border-pink-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-pink-300">
                        {casa.numeroCasa}ª Casa Rosa
                      </span>
                      <span className="font-mono-num">{casa.timeStr}</span>
                    </div>
                    <div className="text-base font-black text-pink-400 font-mono-num flex items-center gap-1">
                      {casa.multiplier.toFixed(2)}x
                      {casa.superouTetoRosa && (
                        <span title="Superou Teto Rosa!">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between gap-2">
                      <span>Espaço:</span>
                      <strong className="text-slate-300 font-mono-num">
                        {casa.distanciaTiros} tiros
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              Ainda não saiu nenhuma vela rosa após esta quebra de máxima. Monitorando em tempo real...
            </div>
          )}
        </div>
      )}

      {/* Lista de Todas as Quebras de Máxima do Dia */}
      {quebras.length > 1 && (
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
              Histórico de Quebras de Máxima do Dia ({quebras.length} quebras registradas)
            </h3>
            <span className="text-[11px] text-slate-500">Desde 00:00:01</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {quebras.slice(1).map((q) => {
              const isExpanded = expandedQuebraId === q.id;
              return (
                <div key={q.id} className="py-2.5">
                  <div
                    onClick={() => setExpandedQuebraId(isExpanded ? null : q.id)}
                    className="flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/40 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-num text-xs text-slate-400">{q.timeStr}</span>
                      <span className="text-sm font-extrabold text-pink-400 font-mono-num">
                        {q.novoMax.toFixed(2)}x
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (ant: {q.maxAnterior > 0 ? `${q.maxAnterior.toFixed(2)}x` : '0.00x'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.tetoAltoBatido && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          👑 Teto Batido
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono-num">
                        {q.casasDeRosa.length} rosas pagas
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pl-4 pr-2 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Teto Rosa -10m:</span>{' '}
                          <strong className="text-pink-400">{q.valorTetoRosa.toFixed(2)}x</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Proteção Roxa -10m:</span>{' '}
                          <strong className="text-purple-400">{q.valorProtecaoRoxa.toFixed(2)}x</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Total de Rosas:</span>{' '}
                          <strong className="text-white">{q.casasDeRosa.length}</strong>
                        </div>
                      </div>

                      {q.casasDeRosa.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                          {q.casasDeRosa.map((c) => (
                            <span
                              key={c.round.uuid || c.numeroCasa}
                              className="shrink-0 px-2 py-1 rounded bg-slate-900 border border-pink-500/20 text-[10px] font-mono-num text-pink-300"
                            >
                              {c.numeroCasa}ª: {c.multiplier.toFixed(2)}x ({c.timeStr})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
