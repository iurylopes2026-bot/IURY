import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  calcularAnalisePosLimite100x,
  EventoPosLimite100x,
} from '../utils/analysisEngine';
import {
  Hourglass,
  Clock,
  Shield,
  Target,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  Crown,
} from 'lucide-react';

interface PosLimite100xSectionProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

export const PosLimite100xSection: React.FC<PosLimite100xSectionProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [limiteManual, setLimiteManual] = useState<number | undefined>(undefined);
  const [eventoExpandidoId, setEventoExpandidoId] = useState<string | null>(null);

  // Gestão das 2 mãos sugerida
  const [apostaMao1, setApostaMao1] = useState<number>(5.0);
  const [apostaMao2, setApostaMao2] = useState<number>(2.0);
  const [alvoMao1, setAlvoMao1] = useState<number>(2.0);
  const [alvoMao2, setAlvoMao2] = useState<number>(10.0);

  const stats = useMemo(() => {
    return calcularAnalisePosLimite100x(rounds, limiteManual);
  }, [rounds, limiteManual]);

  const custoPorTiro = apostaMao1 + apostaMao2;
  const retornoProtecao = apostaMao1 * alvoMao1;
  const lucroAlvoBatido = apostaMao2 * alvoMao2 + retornoProtecao - custoPorTiro;

  return (
    <div className="space-y-6">
      {/* 1. RADAR DE ENTRADA AO VIVO COM AMPULHETA (SE UMA 100X QUEBROU RECENTEMENTE) */}
      {stats.entradaAtivaAoVivo.ativa && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)] relative overflow-hidden animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
                <Hourglass className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                    ⏳ ENTRADA PÓS-LIMITE ATIVA
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono-num">
                    Vela Quebradora: {stats.entradaAtivaAoVivo.eventoQuebra?.mult100x.toFixed(2)}x
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black font-display text-white tracking-tight">
                  Quebra de Seca Severa ({stats.entradaAtivaAoVivo.eventoQuebra?.ausenciaRodadas} rodadas) — Janela de Ouro Aberta!
                </h3>
                <p className="text-xs text-amber-200/90 mt-1 max-w-3xl leading-relaxed">
                  O algoritmo do jogo acabou de pagar uma 100x após ultrapassar o limite do termômetro.
                  O sistema identificou a janela de <strong>Casas {stats.janelaDoSistema.casaInicial} a {stats.janelaDoSistema.casaFinal}</strong> como a zona de maior probabilidade para a primeira rosa!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-950/80 px-4 py-3 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Posição Atual:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black font-mono-num text-xs border border-amber-500/30">
                  Casa {stats.entradaAtivaAoVivo.casasPassadas} pós-100x
                </span>
              </div>
              <span className="text-xs font-black text-emerald-400">
                {stats.entradaAtivaAoVivo.dentroDaJanela
                  ? `TIRO ${stats.entradaAtivaAoVivo.tiroRecomendadoAtual} DE ${stats.janelaDoSistema.totalTiros} (DISPARAR AGORA!)`
                  : stats.entradaAtivaAoVivo.casasPassadas < stats.janelaDoSistema.casaInicial
                  ? 'Aguardando Casa de Respiro...'
                  : 'Janela de Ouro Encerrada'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono-num">
                Decorrido: {stats.entradaAtivaAoVivo.tempoDecorridoStr}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANNER EXPLICATIVO & CONTROLE DO LIMITE */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#120f24] to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-lg flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                ESTATÍSTICA SNIPER PÓS-LIMITE
              </span>
              <span className="text-xs text-slate-400">
                O que acontece no mercado imediatamente após quebrar uma seca severa de 100x?
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Análise Pós-Estouro do Termômetro (100x a 1000x)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Quando a ausência passa do limite crítico e a 100x finalmente sai, o sistema audita com quanto tempo vem a primeira rosa, quais multiplicadores são mais garantidos e qual o melhor intervalo de tiros.
            </p>
          </div>

          {/* Ajuste do Limite de Corte */}
          <div className="flex flex-col items-start lg:items-end bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Limite do Termômetro Auditado:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="40"
                max="250"
                value={limiteManual !== undefined ? limiteManual : stats.limiteRodadasUsado}
                onChange={(e) => setLimiteManual(Number(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono-num text-amber-300 font-bold text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400">rodadas</span>
              {limiteManual !== undefined && (
                <button
                  type="button"
                  onClick={() => setLimiteManual(undefined)}
                  className="text-[10px] text-amber-400 underline hover:text-amber-300 cursor-pointer"
                >
                  Auto ({stats.limiteRodadasUsado}r)
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              Quebras registradas hoje com seca &ge; {stats.limiteRodadasUsado}r: <strong>{stats.totalQuebrasAposLimite}</strong>
            </span>
          </div>
        </div>

        {/* 3. CARD DE OURO: INTERVALO ESCOLHIDO PELO SISTEMA */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-950 border border-amber-500/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                  🎯 INTERVALO ESCOLHIDO PELO SISTEMA
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Janela de Ouro: Casas {stats.janelaDoSistema.casaInicial} a {stats.janelaDoSistema.casaFinal} (+{stats.janelaDoSistema.minutoInicial}m a +{stats.janelaDoSistema.minutoFinal}m)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {stats.janelaDoSistema.justificativa}
              </p>
            </div>

            <div className="text-right shrink-0 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Assertividade da Janela</span>
              <span className="text-2xl font-black text-emerald-400 font-mono-num">
                {stats.janelaDoSistema.taxaAssertividade}%
              </span>
              <span className="text-[10px] text-slate-400 block">no histórico auditado</span>
            </div>
          </div>
        </div>

        {/* 4. GRID DE RESPOSTAS CLARAS ÀS DÚVIDAS DO USUÁRIO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {/* Card A: Com quanto tempo depois vem uma rosa? */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-pink-400" />
              Com quanto tempo vem uma Rosa?
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-num pt-1">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Média de Casas:</span>
                <span className="text-base font-black text-white">
                  {stats.mediaCasasAtePrimeiraRosa > 0 ? `${stats.mediaCasasAtePrimeiraRosa}ª casa` : '--'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Média de Tempo:</span>
                <span className="text-base font-black text-white">
                  {stats.mediaMinutosAtePrimeiraRosa > 0 ? `+${stats.mediaMinutosAtePrimeiraRosa} min` : '--'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
              <p>• Bate rosa em até 5 casas: <strong className="text-emerald-400 font-mono-num">{stats.taxaBateuRosaAte5Casas}%</strong></p>
              <p>• Bate rosa em até 10 casas: <strong className="text-emerald-400 font-mono-num">{stats.taxaBateuRosaAte10Casas}%</strong></p>
            </div>
          </div>

          {/* Card B: Quais são as rosas mais garantidas de sair? */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              Rosas Mais Garantidas de Sair:
            </span>
            <div className="space-y-1.5 pt-1">
              {stats.rosasMaisGarantidas.map((r) => (
                <div
                  key={r.faixa}
                  className={`flex items-center justify-between p-1.5 rounded text-xs font-mono-num ${
                    r.recomendadoMao2
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{r.label}</span>
                  <div className="flex items-center gap-1.5">
                    {r.recomendadoMao2 && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950">
                        TOP ALVO
                      </span>
                    )}
                    <span className="font-bold text-emerald-400">{r.probabilidade}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card C: Proteção Confortável Recomendada */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Proteção Confortável (Mão 1):
            </span>
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Auto Cashout Recomendado:</span>
                <span className="text-sm font-black text-emerald-400 font-mono-num">
                  {stats.protecaoConfortavel.autoCashoutSugerido.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Cobertura nos Tiros:</span>
                <span className="text-xs font-bold text-white font-mono-num">
                  {stats.protecaoConfortavel.taxaCobertura}% dos tiros batem &ge;2x
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              {stats.protecaoConfortavel.justificativa}
            </p>
          </div>
        </div>
      </div>

      {/* 5. CALCULADORA DUAL BET CONFIGURADA PARA PÓS-LIMITE */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-black font-display text-white">
              Gestão das 2 Mãos para Entradas Pós-Limite
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Mão 1 no 2.00x cobre o tiro | Mão 2 busca a rosa mais garantida ({alvoMao2.toFixed(0)}x)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">1ª Aposta (Proteção 2x)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">R$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={apostaMao1}
                onChange={(e) => setApostaMao1(Math.max(0.5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Auto Cashout Mão 1</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="1.1"
                value={alvoMao1}
                onChange={(e) => setAlvoMao1(Math.max(1.1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-xs text-slate-400">x</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">2ª Aposta (Alvo Rosa)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">R$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={apostaMao2}
                onChange={(e) => setApostaMao2(Math.max(0.5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-white focus:outline-none focus:border-pink-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Auto Cashout Mão 2</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="1"
                min="5"
                value={alvoMao2}
                onChange={(e) => setAlvoMao2(Math.max(5, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono-num text-pink-400 font-bold focus:outline-none focus:border-pink-400"
              />
              <span className="text-xs text-slate-400">x</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-num">
          <div>
            <span className="text-slate-400 block">Custo por Tiro:</span>
            <span className="font-bold text-white">R$ {custoPorTiro.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Se bater só a Proteção ({alvoMao1}x):</span>
            <span className={`font-bold ${retornoProtecao >= custoPorTiro ? 'text-emerald-400' : 'text-rose-400'}`}>
              Retorna R$ {retornoProtecao.toFixed(2)} (Saldo: {(retornoProtecao - custoPorTiro >= 0 ? '+' : '')}R$ {(retornoProtecao - custoPorTiro).toFixed(2)})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Lucro Líquido no Alvo ({alvoMao2}x):</span>
            <span className="font-black text-emerald-400 text-sm">
              + R$ {lucroAlvoBatido.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. HISTÓRICO COMPLETO DE QUEBRAS PÓS-LIMITE AUDITADAS NO DIA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Histórico de Quebras Pós-Limite ({stats.totalQuebrasAposLimite} ocorrências hoje)
            </h3>
            <p className="text-xs text-slate-400">
              Auditoria rodada a rodada de todas as velas &ge;100x que saíram após secas &ge;{stats.limiteRodadasUsado} rodadas.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 font-mono-num">
            {stats.totalComRosaNos15Tiros}/{stats.totalQuebrasAposLimite} Geraram Rosas nos primeiros 15 tiros
          </span>
        </div>

        {stats.eventos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Hourglass className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-sm font-semibold">Nenhuma quebra de 100x com seca &ge;{stats.limiteRodadasUsado} rodadas registrada hoje.</p>
            <p className="text-xs text-slate-500">O sistema monitorará automaticamente a próxima quebra.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.eventos.map((ev) => {
              const isExpanded = eventoExpandidoId === ev.id;

              return (
                <div
                  key={ev.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                >
                  {/* Linha Resumo da Quebra */}
                  <div
                    onClick={() => setEventoExpandidoId(isExpanded ? null : ev.id)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg font-mono-num font-black text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {ev.mult100x.toFixed(2)}x
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono-num">
                            {ev.time100xStr}
                          </span>
                          <span className="text-[10px] text-rose-400 font-mono-num font-bold">
                            • Seca Severa: {ev.ausenciaRodadas} rodadas ({ev.ausenciaTempoStr})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {ev.primeiraRosa ? (
                            <span>
                              1ª Rosa veio na <strong className="text-pink-400 font-mono-num">{ev.primeiraRosa.casa}ª casa</strong> (+{ev.primeiraRosa.minutosDepois}m) com <strong className="text-pink-300 font-mono-num">{ev.primeiraRosa.mult.toFixed(2)}x</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500">Nenhuma rosa nos primeiros 15 tiros pós-quebra</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                      {ev.bateuRosaNaJanelaDoSistema ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono-num">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          GREEN NA JANELA
                        </span>
                      ) : ev.primeiraRosa ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono-num">
                          Rosa na {ev.primeiraRosa.casa}ª Casa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Sem Rosa em 15
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos: Fita das 15 Rodadas Pós-Quebra */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 block mb-2">
                          Sequência das Primeiras 15 Rodadas Pós-100x:
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-mono-num">
                          {ev.tirosSequencia.map((t, tIdx) => {
                            const casaNum = tIdx + 1;
                            const isNaJanela =
                              casaNum >= stats.janelaDoSistema.casaInicial &&
                              casaNum <= stats.janelaDoSistema.casaFinal;

                            let colorClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                            if (t.result >= 10.0) {
                              colorClass = 'bg-pink-500/25 text-pink-200 border-pink-400 font-black shadow-sm';
                            } else if (t.result >= 2.0) {
                              colorClass = 'bg-purple-500/20 text-purple-200 border-purple-500/40 font-bold';
                            }

                            return (
                              <div
                                key={tIdx}
                                className={`px-2 py-1 rounded-md border text-[11px] flex flex-col items-center min-w-[50px] relative ${colorClass} ${
                                  isNaJanela ? 'ring-1 ring-amber-400/60' : ''
                                }`}
                              >
                                <span className="text-[8px] opacity-70 uppercase font-bold">
                                  {casaNum}ª
                                </span>
                                <span className="font-extrabold">{t.result.toFixed(2)}x</span>
                                {isNaJanela && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm" title="Dentro da Janela do Sistema" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>
                          Total de Rosas nos 15 tiros: <strong className="text-pink-400">{ev.totalRosasNos15Tiros}</strong> | Maior Rosa: <strong className="text-pink-300 font-mono-num">{ev.maiorRosaNos15Tiros > 0 ? `${ev.maiorRosaNos15Tiros.toFixed(2)}x` : '--'}</strong>
                        </span>
                        <span className="text-slate-400">
                          {ev.bateuRosaNaJanelaDoSistema
                            ? '✅ Acertou rosa dentro do intervalo sugerido de casas'
                            : '⚠️ Rosa fora da janela do sistema ou sem rosa imediata'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
