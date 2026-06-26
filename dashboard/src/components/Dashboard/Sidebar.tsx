// components/Dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import {
    Layers, AlertTriangle,
    CheckCircle, XCircle, Globe, TrendingUp,
    Menu, X, ChevronDown, ChevronRight,
    Filter, MapIcon, ShieldAlert
} from 'lucide-react';
import RankingList from './RankingList';
import MunicipalStatsPanel from './MunicipalStatsPanel';
import { RankingItem, Alerta, WastePoint } from '@/types';

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
    gpsActive: boolean;
    onToggleGps: (active: boolean) => void;
    showHeatmap: boolean;
    onToggleHeatmap: (show: boolean) => void;
    showContaminationLayer: boolean;
    onToggleContaminationLayer: (show: boolean) => void;
    isOpen: boolean;
    onToggle: () => void;
    alerts: Alerta[];
    wastePoints: WastePoint[];
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
                                    gpsActive,
                                    onToggleGps,
                                    showHeatmap,
                                    onToggleHeatmap,
                                    showContaminationLayer,
                                    onToggleContaminationLayer,
                                    isOpen,
                                    onToggle,
                                    alerts,
                                    wastePoints,
                                }: SidebarProps) {
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [layersOpen, setLayersOpen] = useState(true);

    return (
        <>
            {/* Overlay móvil */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[1999] md:hidden"
                    onClick={onToggle}
                />
            )}

            <aside
                className={`
                    fixed md:relative z-[2000] md:z-50 h-full bg-white border-r border-slate-200 
                    transition-all duration-300 ease-in-out overflow-y-auto
                    ${isOpen ? 'left-0 w-[min(100vw,20rem)]' : '-left-full md:left-0 md:w-0 md:overflow-hidden'}
                `}
            >
                {/* ✅ Ajuste de padding y tamaño mínimo */}
                <div className="p-3 sm:p-4 md:p-6 min-w-[260px] sm:min-w-[280px] md:min-w-[320px] max-w-full">
                    {/* Header del sidebar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-500 p-1.5 rounded-lg">
                                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                                    Vigilancia Ambiental
                                </h1>
                                <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium">
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

                    {/* ✅ Stats: en móvil 2 columnas (total + atendidos) y pendientes abajo, o 3 columnas con textos más pequeños */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        <div className="bg-slate-50 rounded-xl p-2 sm:p-3 text-center border border-slate-100">
                            <p className="text-base sm:text-lg font-black text-slate-800">{stats.total}</p>
                            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-2 sm:p-3 text-center border border-emerald-100">
                            <p className="text-base sm:text-lg font-black text-emerald-600">{stats.atendidos}</p>
                            <p className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Atendidos</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-2 sm:p-3 text-center border border-red-100">
                            <p className="text-base sm:text-lg font-black text-red-600">{stats.noAtendidos}</p>
                            <p className="text-[8px] sm:text-[9px] font-bold text-red-500 uppercase tracking-wider">Pendientes</p>
                        </div>
                    </div>

                    <MunicipalStatsPanel alerts={alerts} wastePoints={wastePoints} />

                    {/* ✅ Botón de mapa de calor con mejor espaciado en móvil */}
                    <section className="mb-4 sm:mb-6">
                        <h2 className="text-[8px] sm:text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 sm:mb-4 flex items-center gap-2">
                            <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            Análisis de Contaminación
                        </h2>
                        <button
                            onClick={() => onToggleHeatmap(!showHeatmap)}
                            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                                showHeatmap
                                    ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${showHeatmap ? 'bg-white/20' : 'bg-slate-100'}`}>
                                    <ShieldAlert className={`w-4 h-4 sm:w-5 sm:h-5 ${showHeatmap ? 'text-white' : 'text-slate-500'}`} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs sm:text-sm font-bold">Mapa de Calor (Junín)</p>
                                    <p className={`text-[8px] sm:text-[10px] font-medium ${showHeatmap ? 'text-red-100' : 'text-slate-400'}`}>
                                        {showHeatmap ? 'Mercados Críticos' : 'Inactivo'}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-8 h-5 sm:w-10 sm:h-6 rounded-full relative transition-colors ${showHeatmap ? 'bg-red-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 sm:top-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white transition-all transform ${showHeatmap ? 'left-4 sm:left-5' : 'left-0.5 sm:left-1'}`} />
                            </div>
                        </button>
                    </section>

                    {/* Filtros */}
                    <div className="mb-4 sm:mb-6">
                        <button
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className="w-full flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3 hover:text-slate-700 transition-colors"
                        >
                <span className="flex items-center gap-2">
                  <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Filtros
                </span>
                            {filtersOpen ? <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </button>

                        {filtersOpen && (
                            <div className="space-y-2 sm:space-y-3">
                                <div>
                                    <label className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 sm:mb-1.5">
                                        Departamento
                                    </label>
                                    <select
                                        value={selectedDept || ''}
                                        onChange={(e) => onSelectDept(e.target.value || null)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    >
                                        <option value="">Todos</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedDept && provinces.length > 0 && (
                                    <div>
                                        <label className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 sm:mb-1.5">
                                            Provincia
                                        </label>
                                        <select
                                            value={selectedProv || ''}
                                            onChange={(e) => onSelectProv(e.target.value || null)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
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
                    />
                </div>
            </aside>
        </>
    );
}