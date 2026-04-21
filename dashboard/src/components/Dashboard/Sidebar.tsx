import { BarChart3, Map as MapIcon, Filter, Info, Download, Navigation, ShieldAlert, Crosshair } from 'lucide-react';
import RankingList from './RankingList';
import { Alerta, RankingItem } from '@/types';

interface SidebarProps {
  stats: {
    total: number;
    atendidos: number;
    noAtendidos: number;
  };
  departments: string[];
  selectedDept: string | null;
  onSelectDept: (dept: string | null) => void;
  ranking: RankingItem[];
  onSelectRanking: (item: RankingItem) => void;
  gpsActive: boolean;
  onToggleGps: (active: boolean) => void;
}

export default function Sidebar({ 
  stats, departments, selectedDept, onSelectDept, ranking, onSelectRanking, gpsActive, onToggleGps 
}: SidebarProps) {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">EcoWatch Dash</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium tracking-wide">Reporta Residuos OEFA</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Modo GPS */}
        <section>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5" />
            Vigilancia en Tiempo Real
          </h2>
          <button 
            onClick={() => onToggleGps(!gpsActive)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              gpsActive 
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-200' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${gpsActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                <Crosshair className={`w-5 h-5 ${gpsActive ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Modo GPS Tracking</p>
                <p className={`text-[10px] font-medium ${gpsActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {gpsActive ? 'Activo y rastreando' : 'Desactivado'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${gpsActive ? 'bg-emerald-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all transform ${gpsActive ? 'left-5' : 'left-1'}`} />
            </div>
          </button>
        </section>

        {/* Filtros */}
        <section>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filtrar Región
          </h2>
          <select 
            value={selectedDept || ''} 
            onChange={(e) => onSelectDept(e.target.value || null)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todo el Perú</option>
            {departments.sort().map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </section>

        {/* Ranking List */}
        <RankingList items={ranking} onSelect={onSelectRanking} />
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
          onClick={() => alert('Función de exportación en desarrollo')}
        >
          <Download className="w-4 h-4" />
          Exportar Data
        </button>
      </div>
    </aside>
  );
}
