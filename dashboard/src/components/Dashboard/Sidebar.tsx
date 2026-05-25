import { BarChart3, Map as MapIcon, Filter, Info, Download, Navigation, ShieldAlert, Crosshair, AlertTriangle, X } from 'lucide-react';
import RankingList from './RankingList';
import { Alerta, RankingItem } from '@/types';

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
  onSelectRanking: (item: RankingItem) => void;
  gpsActive: boolean;
  onToggleGps: (active: boolean) => void;
  showHeatmap: boolean;
  onToggleHeatmap: (val: boolean) => void;
  showContaminationLayer: boolean;
  onToggleContaminationLayer: (val: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  stats, departments, provinces, selectedDept, selectedProv, onSelectDept, onSelectProv, ranking, onSelectRanking, gpsActive, onToggleGps, showHeatmap, onToggleHeatmap, showContaminationLayer, onToggleContaminationLayer,
  isOpen, onToggle
}: SidebarProps) {
  const porcentajeNoAtendidos = stats.total > 0 ? Math.round((stats.noAtendidos / stats.total) * 100) : 0;

  return (
    <aside className={[
      'bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xl',
      // Móvil: pantalla completa encima del mapa (abierto) o completamente invisible (cerrado)
      isOpen ? 'fixed inset-0 z-[9998] pt-14' : 'hidden',
      // Desktop: panel lateral, ancho animado
      'md:static md:inset-auto md:z-auto md:h-full md:flex md:flex-col',
      'md:transition-[width] md:duration-300 md:ease-in-out md:pt-0',
      isOpen ? 'md:w-80' : 'md:w-0',
    ].join(' ')}>
      <div className="p-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-6 h-6 text-emerald-600 shrink-0" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">EcoWatch Dash</h1>
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
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

        {/* Heatmap Junín */}
        <section>
          <h2 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5" />
            Análisis de Contaminación
          </h2>
          <button 
            onClick={() => onToggleHeatmap(!showHeatmap)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              showHeatmap 
                ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-200' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${showHeatmap ? 'bg-white/20' : 'bg-slate-100'}`}>
                <ShieldAlert className={`w-5 h-5 ${showHeatmap ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Mapa de Calor (Junín)</p>
                <p className={`text-[10px] font-medium ${showHeatmap ? 'text-red-100' : 'text-slate-400'}`}>
                  {showHeatmap ? 'Mercados Críticos' : 'Inactivo'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${showHeatmap ? 'bg-red-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all transform ${showHeatmap ? 'left-5' : 'left-1'}`} />
            </div>
          </button>
        </section>

        {/* Capa de Contaminación Sentinel-2 */}
        <section>
          <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5" />
            Detección Satelital
          </h2>
          <button 
            onClick={() => onToggleContaminationLayer(!showContaminationLayer)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              showContaminationLayer 
                ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-200' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${showContaminationLayer ? 'bg-white/20' : 'bg-slate-100'}`}>
                <ShieldAlert className={`w-5 h-5 ${showContaminationLayer ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Sentinel-2 (Zonas Remotas)</p>
                <p className={`text-[10px] font-medium ${showContaminationLayer ? 'text-blue-100' : 'text-slate-400'}`}>
                  {showContaminationLayer ? 'Zonas Críticas Detectadas' : 'Desactivado'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${showContaminationLayer ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all transform ${showContaminationLayer ? 'left-5' : 'left-1'}`} />
            </div>
          </button>
        </section>
        {/* Estado de Gestión */}
        <section>
          <h2 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Estado de Gestión
          </h2>
          <div className="w-full p-4 rounded-xl border bg-white border-slate-200 shadow-sm flex items-center gap-4">
            <div className="relative w-14 h-14 flex shrink-0 items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-red-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${porcentajeNoAtendidos}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">{porcentajeNoAtendidos}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">Puntos Críticos</p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight mt-1">
                Residuos reportados que no han sido gestionados por las entidades.
              </p>
            </div>
          </div>
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

          {selectedDept && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                Filtrar Provincia
              </h2>
              <select 
                value={selectedProv || ''} 
                onChange={(e) => onSelectProv(e.target.value || null)}
                className="w-full bg-emerald-50/50 border border-emerald-100 text-slate-900 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="">Todas las provincias</option>
                {provinces.sort().map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          )}
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
