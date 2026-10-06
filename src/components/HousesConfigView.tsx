import React, { useState } from 'react';
import { BettingHouse } from '../types';
import { testApiEndpoint } from '../services/api';
import {
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Activity,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface HousesConfigViewProps {
  houses: BettingHouse[];
  activeHouseId: string;
  onSelectHouse: (houseId: string) => void;
  onAddHouse: (house: BettingHouse) => void;
  onRemoveHouse: (houseId: string) => void;
}

export const HousesConfigView: React.FC<HousesConfigViewProps> = ({
  houses,
  activeHouseId,
  onSelectHouse,
  onAddHouse,
  onRemoveHouse,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency?: number;
    count?: number;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    if (!newUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    const res = await testApiEndpoint(newUrl.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const newId = `house_${Date.now()}`;
    const newHouse: BettingHouse = {
      id: newId,
      name: newName.trim(),
      game: 'Aviator',
      endpoint: newUrl.trim(),
      description: 'Casa de Aposta Personalizada',
      badgeColor: 'from-emerald-500 to-teal-600',
      isDefault: false,
    };
    onAddHouse(newHouse);
    onSelectHouse(newId);
    setNewName('');
    setNewUrl('');
    setTestResult(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Casas de Aposta & APIs TipMiner</h3>
              <p className="text-xs text-slate-400">
                Estrutura modular para conectar o Betfusion e qualquer nova casa de aposta.
              </p>
            </div>
          </div>

          <button
            id="open-add-house-btn"
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Casa / API</span>
          </button>
        </div>
      </div>

      {/* Add New House Form */}
      {showAddForm && (
        <div className="p-5 bg-slate-900/90 border border-pink-500/50 rounded-2xl shadow-xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-bold text-pink-400 uppercase tracking-wider">
              Cadastrar Nova Casa de Aposta
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome da Casa (ex: Betano, KTO, EstrelaBet):
              </label>
              <input
                id="new-house-name-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Betano Aviator"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL da API / Endpoint TipMiner:
              </label>
              <input
                id="new-house-url-input"
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://api.core.public.tipminer.com/v1/crash/rounds/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500 font-mono-num"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs font-mono-num flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {testResult.success
                    ? `Conexão bem sucedida! Latência: ${testResult.latency}ms | ${testResult.count} rodadas recebidas.`
                    : `Erro no teste: ${testResult.error}`}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="test-api-endpoint-btn"
              type="button"
              disabled={testing || !newUrl.trim()}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{testing ? 'Testando API...' : 'Testar Conexão'}</span>
            </button>

            <button
              id="save-new-house-btn"
              type="button"
              disabled={!newName.trim() || !newUrl.trim()}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar e Ativar Casa</span>
            </button>
          </div>
        </div>
      )}

      {/* Houses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {houses.map((house) => {
          const isActive = house.id === activeHouseId;

          return (
            <div
              key={house.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,0.25)] ring-1 ring-pink-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{house.name}</h4>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/40">
                        Ativa Agora
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{house.description}</p>
                </div>

                <div className="flex items-center gap-1">
                  {!house.isDefault && (
                    <button
                      id={`delete-house-${house.id}`}
                      type="button"
                      onClick={() => onRemoveHouse(house.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Excluir casa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Endpoint URL Display */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono-num text-slate-400 break-all mb-4">
                <span className="text-slate-600 block text-[9px] uppercase font-bold mb-0.5">
                  Endpoint API:
                </span>
                {house.endpoint}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono-num">
                  Jogo: <strong className="text-slate-300">{house.game}</strong>
                </span>

                {isActive ? (
                  <button
                    disabled
                    className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/40 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Em Exibição</span>
                  </button>
                ) : (
                  <button
                    id={`select-house-${house.id}`}
                    type="button"
                    onClick={() => onSelectHouse(house.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-pink-600 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ativar esta Casa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Developer note on modifying code */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200 block mb-1">
            Como adicionar mais casas diretamente no código:
          </strong>
          <span>
            Basta editar o arquivo <code className="text-pink-300 font-mono">/src/data/houses.ts</code>{' '}
            adicionando o nome e o endpoint da TipMiner no array{' '}
            <code className="text-purple-300 font-mono">DEFAULT_HOUSES</code>. O sistema reconhece
            automaticamente e carrega os dados em tempo real no Mosaico!
          </span>
        </div>
      </div>
    </div>
  );
};
