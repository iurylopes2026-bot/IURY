import React, { useState, useMemo } from 'react';
import { CrashRound } from '../types';
import {
  detectarParesInvertidos,
  executarCiclosInvertidas,
  calcularMelhorDoSistema,
  calcularRadar30x,
  ParInvertido,
  CicloInvertida,
  formatBrTime,
} from '../utils/analysisEngine';
import {
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  Target,
  Shield,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  Radar,
  Percent,
  CircleDollarSign,
  Layers,
} from 'lucide-react';

interface VelasInvertidasViewProps {
  rounds: CrashRound[];
  onSelectRound?: (round: CrashRound) => void;
}

type SubAbaInvertida =
  | 'fixa'
  | 'sistema'
  | 'simulador'
  | 'radar30x'
  | 'gatilho_duplo';

export const VelasInvertidasView: React.FC<VelasInvertidasViewProps> = ({
  rounds,
  onSelectRound,
}) => {
  const [subAba, setSubAba] = useState<SubAbaInvertida>('fixa');

  // Inputs Financeiros das 2 Mãos
  const [v1Valor, setV1Valor] = useState<number>(10); // R$ 10,00 Proteção
  const [protecaoX, setProtecaoX] = useState<number>(2.0); // 2.00x
  const [v2Valor, setV2Valor] = useState<number>(5); // R$ 5,00 Alvo
  const [alvoY, setAlvoY] = useState<number>(10.0); // 10.00x

  // 1. Detecção dos pares invertidos: apenas azuis (< 2.00x), sem final .00 e intervalo <= 2 min
  const paresInvertidos = useMemo(() => {
    return detectarParesInvertidos(rounds);
  }, [rounds]);

  // 2. Intervalos Fixos (+70m, +80m, +90m, +100m)
  const intervalosFixa = [70, 80, 90, 100];

  // 3. Melhor do Sistema (varre 10m a 120m)
  const intervalosSistema = useMemo(() => {
    return calcularMelhorDoSistema(rounds, paresInvertidos, alvoY);
  }, [rounds, paresInvertidos, alvoY]);

  // 4. Execução dos Ciclos Fixa
  const resultadoFixa = useMemo(() => {
    return executarCiclosInvertidas(
      rounds,
      paresInvertidos,
      intervalosFixa,
      v1Valor,
      protecaoX,
      v2Valor,
      alvoY
    );
  }, [rounds, paresInvertidos, v1Valor, protecaoX, v2Valor, alvoY]);

  // 5. Execução dos Ciclos Melhor do Sistema
  const resultadoSistema = useMemo(() => {
    return executarCiclosInvertidas(
      rounds,
      paresInvertidos,
      intervalosSistema,
      v1Valor,
      protecaoX,
      v2Valor,
      alvoY
    );
  }, [rounds, paresInvertidos, intervalosSistema, v1Valor, protecaoX, v2Valor, alvoY]);

  // 6. Sub-aba Gatilho Duplo VIP (pares que atendem rosa antes e depois)
  const paresGatilhoDuplo = useMemo(() => {
    return paresInvertidos.filter((p) => p.atendeGatilhoDuploVip);
  }, [paresInvertidos]);

  const resultadoGatilhoDuplo = useMemo(() => {
    return executarCiclosInvertidas(
      rounds,
      paresGatilhoDuplo,
      intervalosFixa,
      v1Valor,
      protecaoX,
      v2Valor,
      alvoY
    );
  }, [rounds, paresGatilhoDuplo, v1Valor, protecaoX, v2Valor, alvoY]);

  // 7. Radar 30X (Estatísticas para 5x, 10x, 20x, 30x, 50x)
  const radarStats = useMemo(() => {
    return calcularRadar30x(rounds, paresInvertidos, intervalosFixa);
  }, [rounds, paresInvertidos]);

  // Escolhe quais ciclos exibir baseado na sub-aba
  const ciclosExibidos =
    subAba === 'sistema'
      ? resultadoSistema.ciclos
      : subAba === 'gatilho_duplo'
      ? resultadoGatilhoDuplo.ciclos
      : resultadoFixa.ciclos;

  const resultadoAtivo =
    subAba === 'sistema'
      ? resultadoSistema
      : subAba === 'gatilho_duplo'
      ? resultadoGatilhoDuplo
      : resultadoFixa;

  return (
    <div className="space-y-6">
      {/* Top Banner Financeiro & Resumo */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                MÓDULO FINANCEIRO
              </span>
              <span className="text-xs text-slate-400">
                Pares Decimais Invertidos (Exclusivo Velas Azuis &lt; 2.00x • Sem final .00)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Velas Invertidas & Gestão Real das 2 Mãos
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Regra Oficial: Exclusivo para Velas Azuis (&lt; 2.00x), desconsiderando velas com final .00 (ex: 1.00x, 2.00x). A Vela Base (ex: 1.46x) projeta a confirmação quando sua Vela Invertida (ex: 1.64x) surge em no máximo 2 minutos (≤ 120s).
            </p>
          </div>

          {/* Demonstrativos Financeiros Rápidos */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">LUCRO COMBINADO</span>
              <span
                className={`text-xl font-black font-mono-num ${
                  resultadoAtivo.saldoCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {resultadoAtivo.saldoCombinado >= 0 ? '+' : ''}R${' '}
                {resultadoAtivo.saldoCombinado.toFixed(2)}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-purple-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">ROI GERAL</span>
              <span
                className={`text-xl font-black font-mono-num ${
                  resultadoAtivo.roiCombinado >= 0 ? 'text-purple-300' : 'text-rose-400'
                }`}
              >
                {resultadoAtivo.roiCombinado >= 0 ? '+' : ''}
                {resultadoAtivo.roiCombinado}%
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">GREEN CICLOS</span>
              <span className="text-xl font-black text-cyan-400 font-mono-num">
                {resultadoAtivo.taxaGreenCiclos}%
              </span>
            </div>
          </div>
        </div>

        {/* Formulário de Gestão das 2 Mãos (Inputs de R$ e Multiplicadores) */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Mão 1: Proteção */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="font-semibold flex items-center gap-1 text-purple-300">
                <Shield className="w-3 h-3 text-purple-400" />
                1ª Mão (Proteção)
              </span>
              <span className="font-mono-num font-bold text-slate-200">{protecaoX.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono-num">R$</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={v1Valor}
                onChange={(e) => setV1Valor(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold font-mono-num focus:outline-none focus:border-purple-500 text-xs"
              />
              <select
                value={protecaoX}
                onChange={(e) => setProtecaoX(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-purple-300 font-bold focus:outline-none text-xs cursor-pointer"
              >
                <option value={1.5}>1.50x</option>
                <option value={2.0}>2.00x</option>
                <option value={2.5}>2.50x</option>
                <option value={3.0}>3.00x</option>
              </select>
            </div>
          </div>

          {/* Mão 2: Alvo */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="font-semibold flex items-center gap-1 text-pink-300">
                <Target className="w-3 h-3 text-pink-400" />
                2ª Mão (Alvo)
              </span>
              <span className="font-mono-num font-bold text-pink-300">{alvoY.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono-num">R$</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={v2Valor}
                onChange={(e) => setV2Valor(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold font-mono-num focus:outline-none focus:border-pink-500 text-xs"
              />
              <select
                value={alvoY}
                onChange={(e) => setAlvoY(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-pink-300 font-bold focus:outline-none text-xs cursor-pointer"
              >
                <option value={5.0}>5.00x</option>
                <option value={10.0}>10.00x</option>
                <option value={20.0}>20.00x</option>
                <option value={30.0}>30.00x</option>
              </select>
            </div>
          </div>

          {/* Demonstrativo: Só com 1 Proteção */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400">1. Só Proteção (M1 Isolada):</span>
            <div className="flex items-baseline justify-between mt-1 font-mono-num">
              <span
                className={`text-base font-extrabold ${
                  resultadoAtivo.saldoM1 >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {resultadoAtivo.saldoM1 >= 0 ? '+' : ''}R$ {resultadoAtivo.saldoM1.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500">Mão 1 única</span>
            </div>
          </div>

          {/* Demonstrativo: Só com a 2ª Mão */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400">2. Só Alvo (M2 Isolada):</span>
            <div className="flex items-baseline justify-between mt-1 font-mono-num">
              <span
                className={`text-base font-extrabold ${
                  resultadoAtivo.saldoM2 >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {resultadoAtivo.saldoM2 >= 0 ? '+' : ''}R$ {resultadoAtivo.saldoM2.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500">Mão 2 única</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação das 5 SUB-ABAS OBRIGATÓRIAS (Grid sem barra de rolagem) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full pb-2 border-b border-slate-800">
        {[
          { id: 'fixa', label: '1. Invertida Fixa (+70m..+100m)' },
          { id: 'sistema', label: `2. Melhor Sistema (+${intervalosSistema.join('m..+')}m)` },
          { id: 'simulador', label: '3. Simulador (Fixa vs Sist)' },
          { id: 'radar30x', label: '4. Radar 30X (Velas Acima)' },
          { id: 'gatilho_duplo', label: `5. Gatilho Duplo VIP (${paresGatilhoDuplo.length})` },
        ].map((tab) => {
          const isCurrent = subAba === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubAba(tab.id as SubAbaInvertida)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center ${
                isCurrent
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Sub-Abas */}

      {/* SUB-ABA 3: SIMULADOR (Comparativo Financeiro Fixa vs Sistema) */}
      {subAba === 'simulador' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-cyan-400" />
              Comparativo Financeiro Lado a Lado (Invertida Fixa vs Melhor do Sistema)
            </h3>
            <p className="text-xs text-slate-400">
              Análise comparativa direta executando as mesmas entradas com as 2 mãos (Proteção R$ {v1Valor} e Alvo R$ {v2Valor}).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Estratégia Fixa */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-extrabold text-white">Estratégia Fixa Padrão</h4>
                  <span className="text-xs text-slate-400 font-mono-num">+70m, +80m, +90m, +100m</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-500/20 text-cyan-300">
                  {resultadoFixa.taxaGreenCiclos}% Green
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Saldo M1 (Proteção):</span>
                  <strong className={resultadoFixa.saldoM1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {resultadoFixa.saldoM1.toFixed(2)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Saldo M2 (Alvo):</span>
                  <strong className={resultadoFixa.saldoM2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {resultadoFixa.saldoM2.toFixed(2)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lucro Líquido Combinado:</span>
                    <strong className={`text-base font-black ${resultadoFixa.saldoCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {resultadoFixa.saldoCombinado.toFixed(2)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">ROI Total:</span>
                    <strong className="text-sm font-bold text-purple-300">
                      {resultadoFixa.roiCombinado}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Melhor do Sistema */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-4 shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-extrabold text-cyan-300">Melhor do Sistema (Otimizado)</h4>
                  <span className="text-xs text-slate-400 font-mono-num">+{intervalosSistema.join('m, +')}m</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300">
                  {resultadoSistema.taxaGreenCiclos}% Green
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Saldo M1 (Proteção):</span>
                  <strong className={resultadoSistema.saldoM1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {resultadoSistema.saldoM1.toFixed(2)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Saldo M2 (Alvo):</span>
                  <strong className={resultadoSistema.saldoM2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {resultadoSistema.saldoM2.toFixed(2)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lucro Líquido Combinado:</span>
                    <strong className={`text-base font-black ${resultadoSistema.saldoCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {resultadoSistema.saldoCombinado.toFixed(2)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">ROI Total:</span>
                    <strong className="text-sm font-bold text-purple-300">
                      {resultadoSistema.roiCombinado}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 4: RADAR 30X (Estatísticas de quebra 5x, 10x, 20x, 30x, 50x) */}
      {subAba === 'radar30x' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radar className="w-4 h-4 text-pink-400" />
                Radar 30X (Velas Acima): Estatísticas de Quebra por Alvo
              </h3>
              <p className="text-xs text-slate-400">
                Taxa de acerto em cada uma das 4 entradas (+70m, +80m, +90m, +100m) e no ciclo completo para múltiplos alvos.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Alvo Multiplicador</th>
                  <th className="py-2.5 px-3">1ª Entr (+70m)</th>
                  <th className="py-2.5 px-3">2ª Entr (+80m)</th>
                  <th className="py-2.5 px-3">3ª Entr (+90m)</th>
                  <th className="py-2.5 px-3">4ª Entr (+100m)</th>
                  <th className="py-2.5 px-3 font-bold text-cyan-300">Taxa do Ciclo (1/4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {radarStats.map((r) => (
                  <tr key={r.alvo} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-extrabold text-pink-400 text-sm">{r.alvo}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{r.e1Taxa}%</span>{' '}
                      <span className="text-[10px] text-slate-500">({r.e1Acertos})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{r.e2Taxa}%</span>{' '}
                      <span className="text-[10px] text-slate-500">({r.e2Acertos})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{r.e3Taxa}%</span>{' '}
                      <span className="text-[10px] text-slate-500">({r.e3Acertos})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{r.e4Taxa}%</span>{' '}
                      <span className="text-[10px] text-slate-500">({r.e4Acertos})</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-cyan-300 text-sm">{r.cicloTaxa}%</span>
                        <span className="text-[10px] text-slate-500">({r.cicloAcertos} acertos)</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-ABA 5: GATILHO DUPLO VIP AVISO */}
      {subAba === 'gatilho_duplo' && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-center justify-between gap-3">
          <div>
            <strong className="block font-bold">Filtro Ultra-Restrito Ativo:</strong>
            <span>
              Mostrando apenas pares invertidos que possuem uma vela ≥ 30x até 10 minutos antes da Vela 1 E outra vela ≥ 30x até 10 minutos depois da Vela 2 ({paresGatilhoDuplo.length} pares encontrados).
            </span>
          </div>
          <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold shrink-0">
            {resultadoGatilhoDuplo.taxaGreenCiclos}% Green
          </span>
        </div>
      )}

      {/* Lista de Ciclos Invertidos com Auditoria Financeira */}
      {subAba !== 'simulador' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Auditoria de Pares Invertidos ({ciclosExibidos.length})
              </h3>

              {/* Badges de Regra */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Apenas Velas Azuis (&lt; 2.00x)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  Sem finais .00 (ex: 1.00x)
                </span>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-mono-num">
              Parada Imediata ao bater {alvoY.toFixed(2)}x
            </span>
          </div>

          {ciclosExibidos.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
              Nenhum par invertido encontrado com os filtros desta sub-aba hoje.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ciclosExibidos.map((ciclo) => {
                const isGreen = ciclo.statusCiclo === 'GREEN';
                const isLoss = ciclo.statusCiclo === 'LOSS';

                return (
                  <div
                    key={ciclo.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isGreen
                        ? 'bg-slate-950/90 border-emerald-500/40 shadow-md shadow-emerald-950/10'
                        : isLoss
                        ? 'bg-slate-950/90 border-rose-500/30'
                        : 'bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    {/* Header do Ciclo Invertido */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isGreen
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isLoss
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {isGreen ? <CheckCircle2 className="w-5 h-5" /> : isLoss ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                              PAR INVERTIDO:
                            </span>

                            {/* Vela 1 (Base) */}
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 px-2 py-1 rounded-lg text-xs font-mono-num shadow-sm">
                              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold">
                                BASE
                              </span>
                              <span className="font-extrabold text-cyan-300">
                                {ciclo.par.vela1.result.toFixed(2)}x
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                ({ciclo.par.tBaseStr || ciclo.par.tGatilhoStr})
                              </span>
                            </div>

                            <span className="text-cyan-400 font-bold text-xs">⇄</span>

                            {/* Vela 2 (Invertida) */}
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-purple-500/40 px-2 py-1 rounded-lg text-xs font-mono-num shadow-sm">
                              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold">
                                INVERTIDA
                              </span>
                              <span className="font-extrabold text-purple-300">
                                {ciclo.par.vela2.result.toFixed(2)}x
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                ({ciclo.par.tConfirmacaoStr || ciclo.par.tGatilhoStr})
                              </span>
                            </div>

                            {/* Intervalo e Distância */}
                            <span className="text-[11px] text-slate-300 font-mono-num bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Gap: <strong>{ciclo.par.gapSegundos}s</strong> (≤ 2 min)</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">
                                {ciclo.par.distanciaVelas && ciclo.par.distanciaVelas === 1
                                  ? 'Consecutivas'
                                  : `${ciclo.par.distanciaVelas || 1} velas de distância`}
                              </span>
                            </span>
                          </div>

                          {ciclo.par.atendeGatilhoDuploVip && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold inline-block">
                              👑 Gatilho Duplo VIP Atendido (≥30x até 10m antes da Base e depois da Invertida)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resultado Financeiro do Ciclo */}
                      <div className="flex items-center gap-2.5 font-mono-num text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Lucro Ciclo:</span>
                          <strong className={ciclo.lucroCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {ciclo.lucroCombinado >= 0 ? '+' : ''}R$ {ciclo.lucroCombinado.toFixed(2)}
                          </strong>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            isGreen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isLoss
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isGreen ? 'GREEN' : isLoss ? 'LOSS' : 'PENDENTE'}
                        </span>
                      </div>
                    </div>

                    {/* 4 Entradas da Invertida (Grid 2x2: duas em cima, duas em baixo) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {ciclo.entradas.map((e) => {
                        const isEGreen = e.status === 'GREEN';
                        const isELoss = e.status === 'LOSS';
                        const isAguardando = e.status === 'AGUARDANDO';
                        return (
                          <div
                            key={e.entradaNum}
                            className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 ${
                              isEGreen
                                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                                : isELoss
                                ? 'bg-rose-950/20 border-rose-500/30'
                                : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">
                                {e.entradaNum}ª Entrada (+{e.minutoOffset}m)
                              </span>
                              <span className="font-mono-num text-[11px] text-slate-300 font-semibold">
                                Horário: {e.tempoAlvoStr}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isEGreen
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : isELoss
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isEGreen
                                  ? `GREEN (Tiro ${e.tiroGreen})`
                                  : isELoss
                                  ? `LOSS (${e.tiros.length || 5} tiros)`
                                  : e.status}
                              </span>

                              <span
                                className={`font-mono-num text-[11px] font-bold ${
                                  e.lucroCombinado >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {e.lucroCombinado >= 0 ? '+' : ''}R$ {e.lucroCombinado.toFixed(2)}
                              </span>
                            </div>

                            {/* Tiros executados */}
                            <div className="pt-2 border-t border-slate-800/60">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                                <span>Velas Auditadas ({e.tiros.length}/5):</span>
                                {e.bateuProtecao && (
                                  <span className="text-purple-300 font-semibold flex items-center gap-0.5 text-[10px]">
                                    <Shield className="w-3 h-3 text-purple-400" />
                                    Prot. Paga
                                  </span>
                                )}
                              </div>
                              {e.tiros.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {e.tiros.map((t, idx) => {
                                    const hit = t.result >= alvoY;
                                    const prot = t.result >= protecaoX;
                                    return (
                                      <span
                                        key={t.uuid || idx}
                                        onClick={() => onSelectRound?.(t)}
                                        className={`px-2 py-1 rounded-lg font-mono-num text-[11px] cursor-pointer font-bold transition-transform hover:scale-105 ${
                                          hit
                                            ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 ring-1 ring-white/50'
                                            : prot
                                            ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                                            : 'bg-slate-800/90 text-slate-300 border border-slate-700/50 hover:bg-slate-700'
                                        }`}
                                        title={`Tiro ${idx + 1}: ${t.result.toFixed(2)}x (${formatBrTime(t.instant)}) - Clique para detalhar`}
                                      >
                                        {t.result.toFixed(2)}x
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : isAguardando ? (
                                <span className="text-[10px] text-slate-500 italic block py-0.5">
                                  Aguardando horário ({e.tempoAlvoStr})...
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic block py-0.5">
                                  Sem velas registradas neste intervalo.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
