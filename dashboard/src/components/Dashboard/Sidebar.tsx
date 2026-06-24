// components/Dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import {
  Layers, AlertTriangle,
  CheckCircle, XCircle, Globe, TrendingUp,
  Menu, X, ChevronDown, ChevronRight,
  Filter
} from 'lucide-react';
import RankingList from './RankingList';
import { RankingItem } from '@/types';

interface SidebarProps {
  stats: {
    total: number;
    atendidos: number;
    noAtendidos: number;
  };
  departments: string[];
  provinces: string[];
  selectedDept: string | null;
  selectedProv: string | null;
  onSelectDept: (dept: string | null) => void;
  onSelectProv: (prov: string | null) => void;
  ranking: RankingItem[];
  onSelectRanking: (item: RankingItem, index: number) => void;
  onClassifyLocation: (item: RankingItem, index: number) => void;
  gpsActive: boolean;
  onToggleGps: (active: boolean) => void;
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  showContaminationLayer: boolean;
  onToggleContaminationLayer: (show: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
                                  stats,
                                  departments,
                                  provinces,
                                  selectedDept,
                                  selectedProv,
                                  onSelectDept,
                                  onSelectProv,
                                  ranking,
                                  onSelectRanking,
                                  onClassifyLocation,
                                  gpsActive,
                                  onToggleGps,
                                  showHeatmap,
                                  onToggleHeatmap,
                                  showContaminationLayer,
                                  onToggleContaminationLayer,
                                  isOpen,
                                  onToggle
                                }: SidebarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);

  return (
      <>
        {/* Overlay móvil */}
        {isOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onToggle}
            />
        )}

        <aside
            className={`
                    fixed md:relative z-50 h-full bg-white border-r border-slate-200 
                    transition-all duration-300 ease-in-out overflow-y-auto
                    ${isOpen ? 'left-0 w-80' : '-left-80 md:left-0 md:w-0 md:overflow-hidden'}
                `}
        >
          <div className="p-4 md:p-6 min-w-[280px] md:min-w-[320px]">
            {/* Header del sidebar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-slate-900 leading-none">
                    Vigilancia Ambiental
                  </h1>
                  <span className="text-[10px] text-slate-400 font-medium">
                                    Sistema de Monitoreo
                                </span>
                </div>
              </div>
              <button
                  onClick={onToggle}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-lg font-black text-slate-800">{stats.total}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-lg font-black text-emerald-600">{stats.atendidos}</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Atendidos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-lg font-black text-red-600">{stats.noAtendidos}</p>
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Pendientes</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors"
              >
                            <span className="flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" />
                                Filtros
                            </span>
                {filtersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {filtersOpen && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Departamento
                      </label>
                      <select
                          value={selectedDept || ''}
                          onChange={(e) => onSelectDept(e.target.value || null)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      >
                        <option value="">Todos</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {selectedDept && provinces.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Provincia
                          </label>
                          <select
                              value={selectedProv || ''}
                              onChange={(e) => onSelectProv(e.target.value || null)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                          >
                            <option value="">Todas</option>
                            {provinces.map(prov => (
                                <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>
                    )}
                  </div>
              )}
            </div>


            {/* Ranking de puntos críticos */}
            <RankingList
                items={ranking}
                onSelect={onSelectRanking}
                onClassify={onClassifyLocation}
            />
          </div>
        </aside>
      </>
  );
}