import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  CicloDuploGatilhoItem,
  EstatisticasDuploGatilho,
} from '../utils/analysisEngine';
import {
  Target,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Award,
  Layers,
  BarChart3,
  Shield,
  ArrowRight,
  Zap,
  TrendingUp,
  Activity,
  Filter,
  Eye,
  Calendar,
  Compass,
} from 'lucide-react';

interface MonitorDuploGatilhoSectionProps {
  rounds: CrashRound[];
  ciclos: CicloDuploGatilhoItem[];
  estatisticas: EstatisticasDuploGatilho;
  minGatilho: number;
  maxGatilho: number;
  alvoMin: number;
  onSelectRound?: (round: CrashRound) => void;
}

export const MonitorDuploGatilhoSection: React.FC<MonitorDuploGatilhoSectionProps> = ({
  rounds,
  ciclos,
  estatisticas,
  minGatilho,
  maxGatilho,
  alvoMin,
  onSelectRound,
}) => {
  const [cicloExpandidoId, setCicloExpandidoId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'confirmou_segunda_rosa' | 'bateu_50x' | 'pagou_50x_direto'>('todos');

  const ciclosFiltrados = useMemo(() => {
    if (filtroStatus === 'confirmou_segunda_rosa') {
      return ciclos.filter((c) => c.temSegundaRosa && c.isPrimeiraRosaAbaixo40x);
    }
    if (filtroStatus === 'bateu_50x') {
      return ciclos.filter((c) => c.bateu50x);
    }
    if (filtroStatus === 'pagou_50x_direto') {
      return ciclos.filter((c) => c.isPrimeiraRosa50xMais);
    }
    return ciclos;
  }, [ciclos, filtroStatus]);

  const gatilhoAtivo = estatisticas.gatilhoAtivoAgora;

  return (
    <div className="space-y-6">
      {/* 1. Radar em Tempo Real com Ampulheta (⏳) */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        gatilhoAtivo?.ativo
          ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-fuchsia-950/60 border-amber-500/60 shadow-2xl shadow-amber-500/20'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg ${
              gatilhoAtivo?.ativo
                ? 'bg-gradient-to-br from-amber-400 to-fuchsia-600 text-slate-950 ring-4 ring-amber-400/30 animate-pulse'
                : 'bg-slate-800 text-amber-300 border border-slate-700'
            }`}>
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <span>⏳ SINALIZADOR DE AMPULHETA</span>
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {gatilhoAtivo?.ativo ? 'OPERAÇÃO EM ANDAMENTO' : 'RADAR EM TEMPO REAL ATIVO'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black font-display text-white">
                {gatilhoAtivo?.ativo ? gatilhoAtivo.alertaTexto : 'Monitoramento Automático da Casa 13x'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {gatilhoAtivo?.ativo
                  ? 'O sistema detectou um gatilho 13x recente. Siga as instruções do passo a passo abaixo para operar com máxima segurança!'
                  : 'Assim que sair uma vela de 13.00x a 13.99x em qualquer gráfico, o sistema acionará automaticamente a contagem com a ampulheta ⏳ para aguardar a 1ª rosa (<40x).'}
              </p>
            </div>
          </div>

          {gatilhoAtivo?.ativo && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 text-center shrink-0">
              <span className="text-[10px] font-bold text-amber-300 uppercase block">
                {gatilhoAtivo.passo === 'AGUARDANDO_ROSA_1' ? 'Passo 1 de 2' : 'Passo 2 de 2 (ARMADO!)'}
              </span>
              <span className="text-xl font-black text-white font-mono-num block">
                {gatilhoAtivo.tirosDecorridos}º Tiro
              </span>
              <span className="text-[10px] text-slate-400 block">
                {gatilhoAtivo.passo === 'AGUARDANDO_ROSA_1' ? 'Aguardando 1ª Rosa' : 'Entrada Armada!'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Diagnóstico de Segurança: Os Dois Gatilhos Funcionam Juntos? */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card A: Confiabilidade do Gatilho Duplo */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#151a2d] border border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              SEGURANÇA DOS 2 GATILHOS
            </span>
            <span className="text-xs font-black text-emerald-400 uppercase">
              Nível {estatisticas.comparativoSeguranca.nivelSeguranca}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-black font-display text-white">
              {estatisticas.taxaConfirmacaoSegundaRosa}%
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              taxa de confirmação pós-rosa &lt;40x
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {estatisticas.comparativoSeguranca.diagnostico}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-num">
            <span className="text-slate-400">13x Sozinha: <strong className="text-white">{estatisticas.comparativoSeguranca.assertividade13xIsolada}%</strong></span>
            <span className="text-emerald-400 font-bold">➔ Duplo: <strong className="text-emerald-300 font-black">{estatisticas.taxaConfirmacaoSegundaRosa}%</strong> (+{estatisticas.comparativoSeguranca.diferencaGanho}%)</span>
          </div>
        </div>

        {/* Card B: Até quantas casas ela solta a próxima vela rosa? */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e1329] border border-pink-500/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-400" />
              INTERVALO ENTRE ROSAS
            </span>
            <span className="text-xs font-mono-num text-pink-300 font-bold">
              {estatisticas.totalConfirmouSegundaRosa} de {estatisticas.totalPrimeiraRosaAbaixo40x} ciclos
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-black font-display text-white">
              {estatisticas.mediaCasasAteSegundaRosa}
            </span>
            <span className="text-xs text-pink-400 font-bold">
              casas em média após a 1ª rosa &lt;40x
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Em <strong className="text-pink-300 font-bold">{estatisticas.taxaSegundaRosaEmAte3Casas}%</strong> das vezes a próxima rosa sai em <strong>até 3 casas</strong> (e {estatisticas.taxaSegundaRosaEmAte4Casas}% em até 4 casas)!
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono-num text-[11px]">
            <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Até 2 Casas</span>
              <span className="text-pink-300 font-bold">{estatisticas.taxaSegundaRosaEmAte2Casas}%</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Até 3 Casas</span>
              <span className="text-pink-300 font-bold">{estatisticas.taxaSegundaRosaEmAte3Casas}%</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Até 4 Casas</span>
              <span className="text-pink-300 font-bold">{estatisticas.taxaSegundaRosaEmAte4Casas}%</span>
            </div>
          </div>
        </div>

        {/* Card C: Onde e quando saem os 50x+ com mais tranquilidade? */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1f1911] border border-amber-500/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              ZONA DE TRANQUILIDADE 50X+
            </span>
            <span className="text-xs font-mono-num text-amber-300 font-bold">
              {estatisticas.totalAtingiram50x} velas ≥50x
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-black font-display text-white">
              {estatisticas.melhorCasaRosaTranquila.faixaRecomendada}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {estatisticas.melhorCasaRosaTranquila.justificativa}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Azuis no caminho: <strong className="text-amber-300 font-mono-num">~{estatisticas.melhorCasaRosaTranquila.azuisMediosNoCaminho}</strong></span>
            <span className="text-amber-400 font-bold">Assertividade: <strong className="text-white font-mono-num">{estatisticas.melhorCasaRosaTranquila.taxaAcerto}%</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Distribuição Exata de Casas da 2ª Rosa e Melhores Horários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Esquerdo: Histograma de Casas para a Próxima Rosa */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Distribuição de Casas para a Próxima Rosa
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono-num">
              Pós-Rosa &lt;40x
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Mostra em qual tiro/casa após a 1ª rosa (&lt; 40x) ela costuma pagar a 2ª rosa:
          </p>

          <div className="space-y-2.5">
            {estatisticas.distribuicaoCasasSegundaRosa.map((item) => (
              <div key={item.casa} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono-num">
                  <span className="font-bold text-slate-300">
                    {item.casa}ª Casa pós-rosa {item.casa === 1 ? '(Colada/Imediata)' : item.casa === 2 ? '(Alternada)' : ''}
                  </span>
                  <span className="font-bold text-pink-400">
                    {item.count} vezes ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-600 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(4, item.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito: Melhores Horários para os 50x+ */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Melhores Horários do Dia para os 50x+
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase">
              HORÁRIOS DE OURO
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Ranking das faixas horárias e minutos com maior volume de super velas (≥50x):
          </p>

          <div className="space-y-2.5">
            {estatisticas.rankingFaixasHorarias50x.slice(0, 4).map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono-num font-bold text-sm flex items-center justify-center border border-amber-500/30">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="text-sm font-black text-white font-mono-num block">
                      {f.faixa}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Espera média: {f.mediaEsperaCasas} casas
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-400 font-mono-num block">
                    {f.total} velas 50x+
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {f.taxa}% do total
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Minutos Mais Frequentes */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              Minutos do Relógio mais frequentes para 50x+:
            </span>
            <div className="flex flex-wrap gap-2">
              {estatisticas.rankingMinutosRelogio50x.map((m, mIdx) => (
                <span
                  key={mIdx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-mono-num text-xs font-bold flex items-center gap-1"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  Minuto :{String(m.minuto).padStart(2, '0')} ({m.total}x)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Auditoria dos Ciclos de Duplo Gatilho */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white font-display flex items-center gap-2">
              <span>Auditoria Completa dos Ciclos Duplos</span>
              <span className="text-xs font-mono-num font-normal text-slate-400">
                ({ciclosFiltrados.length} ciclos auditados)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe a linha do tempo exata: Gatilho 13x ➔ 1ª Rosa (&lt;40x) ➔ Próxima Rosa ou 50x+
            </p>
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'todos' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({ciclos.length})
            </button>
            <button
              onClick={() => setFiltroStatus('confirmou_segunda_rosa')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'confirmou_segunda_rosa'
                  ? 'bg-pink-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2ª Rosa Confirmada
            </button>
            <button
              onClick={() => setFiltroStatus('bateu_50x')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'bateu_50x'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bateu 50x+
            </button>
            <button
              onClick={() => setFiltroStatus('pagou_50x_direto')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroStatus === 'pagou_50x_direto'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              50x Direto
            </button>
          </div>
        </div>

        {ciclosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm italic">
            Nenhum ciclo encontrado com o filtro selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            {ciclosFiltrados.map((c) => {
              const isExpanded = cicloExpandidoId === c.id;

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    c.status === 'CONFIRMADO_DUPLO_GREEN'
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                      : c.status === 'PAGOU_50X_DIRETO'
                      ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-500/70'
                      : c.status === 'CONFIRMOU_PROXIMA_ROSA'
                      ? 'bg-pink-950/20 border-pink-500/40 hover:border-pink-500/70'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  {/* Linha do Fluxo Visual dos 3 Eventos */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      {/* 1. Gatilho 13x */}
                      <div
                        onClick={() => onSelectRound?.(c.gatilho13xRound)}
                        className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/60 text-center cursor-pointer hover:scale-105 transition-all shadow-md shadow-amber-500/10"
                        title="Vela Gatilho 13x - Clique para detalhar"
                      >
                        <span className="text-[10px] font-bold text-amber-300 block flex items-center justify-center gap-1">
                          <span>⏳ Gatilho 13x</span>
                        </span>
                        <span className="text-base font-black text-white font-mono-num block">
                          {c.gatilho13xMult.toFixed(2)}x
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-num block">
                          {c.gatilho13xTimeStr}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

                      {/* 2. 1ª Rosa (<40x) */}
                      {c.temPrimeiraRosa && c.primeiraRosaRound ? (
                        <div
                          onClick={() => onSelectRound?.(c.primeiraRosaRound!)}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer hover:scale-105 transition-all shadow-md ${
                            c.isPrimeiraRosaAbaixo40x
                              ? 'bg-pink-950/60 border-pink-500/70 shadow-pink-500/10'
                              : 'bg-purple-950/60 border-purple-500/70'
                          }`}
                          title="1ª Rosa pós-13x - Clique para detalhar"
                        >
                          <span className="text-[10px] font-bold text-pink-300 block">
                            1ª Rosa ({c.casas13xAtePrimeiraRosa}ª casa)
                          </span>
                          <span className="text-base font-black text-pink-400 font-mono-num block">
                            {c.primeiraRosaMult?.toFixed(2)}x
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-num block">
                            {c.primeiraRosaTimeStr}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                          Sem rosa dentro do limite
                        </div>
                      )}

                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

                      {/* 3. Próxima Rosa / 50x+ */}
                      {c.temSegundaRosa && c.segundaRosaRound ? (
                        <div
                          onClick={() => onSelectRound?.(c.segundaRosaRound!)}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer hover:scale-105 transition-all shadow-md ${
                            c.segundaRosaRound.result >= alvoMin
                              ? 'bg-emerald-950/60 border-emerald-500/70 shadow-emerald-500/20'
                              : 'bg-pink-950/60 border-pink-500/60'
                          }`}
                          title="Próxima Rosa - Clique para detalhar"
                        >
                          <span className="text-[10px] font-bold text-emerald-300 block">
                            2ª Rosa ({c.casasAposPrimeiraRosa}ª casa pós-rosa)
                          </span>
                          <span className="text-base font-black text-emerald-400 font-mono-num block">
                            {c.segundaRosaMult?.toFixed(2)}x
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-num block">
                            {c.segundaRosaTimeStr}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                          Aguardando / Sem 2ª rosa
                        </div>
                      )}
                    </div>

                    {/* Status & Botão de Expansão */}
                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      {c.grauTranquilidade50x && (
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                          c.grauTranquilidade50x === 'ULTRA_TRANQUILA'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : c.grauTranquilidade50x === 'TRANQUILA'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {c.grauTranquilidade50x.replace('_', ' ')}
                        </span>
                      )}

                      <button
                        onClick={() => setCicloExpandidoId(isExpanded ? null : c.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Ocultar Fita' : 'Ver Fita de Velas'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Fita de Velas Expandida */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1.5">
                          Velas entre a 1ª Rosa e a 2ª Rosa / 50x+:
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {c.velasAposRosa1.map((v, vIdx) => {
                            const isRosa = v.result >= 10.0;
                            const is50x = v.result >= alvoMin;
                            const isRoxa = v.result >= 2.0 && v.result < 10.0;
                            const is13 = v.result >= 13.0 && v.result < 14.0;

                            return (
                              <div
                                key={vIdx}
                                onClick={() => onSelectRound?.(v)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-num font-bold cursor-pointer shrink-0 border transition-all hover:scale-110 flex items-center gap-1 ${
                                  is50x
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                                    : isRosa
                                    ? 'bg-pink-500/25 text-pink-300 border-pink-500/60'
                                    : isRoxa
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                }`}
                                title={`Tiro ${vIdx + 1}: ${v.result.toFixed(2)}x às ${v.instant ? new Date(v.instant).toLocaleTimeString() : ''}`}
                              >
                                {is13 && <span>⏳</span>}
                                <span>#{vIdx + 1}: {v.result.toFixed(2)}x</span>
                              </div>
                            );
                          })}
                        </div>
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
