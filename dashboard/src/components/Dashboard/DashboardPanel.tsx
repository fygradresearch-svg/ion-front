'use client';

import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { X, FileSpreadsheet, BarChart3, LayoutDashboard, Recycle } from 'lucide-react';
import { Alerta, WastePoint } from '@/types';
import {
    buildDistritoResumen,
    buildHistogramBuckets,
    buildPredictionSummary,
    buildPredictionByDistrito,
    getVisibleWastePoints,
    PREDICTION_META,
    exportDashboardToExcel,
} from './DashboardExcel';

interface DashboardPanelProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: Alerta[];
    wastePoints: WastePoint[];
    stats: {
        total: number;
        atendidos: number;
        noAtendidos: number;
    };
}

const TOP_DISTRITOS = 12;

export default function DashboardPanel({ isOpen, onClose, alerts, wastePoints, stats }: DashboardPanelProps) {
    const resumen = useMemo(() => buildDistritoResumen(alerts), [alerts]);
    const histogramBuckets = useMemo(() => buildHistogramBuckets(resumen), [resumen]);

    const topDistritos = useMemo(
        () => resumen.slice(0, TOP_DISTRITOS).map((r) => ({
            name: r.distrito,
            Atendidos: r.atendidos,
            Pendientes: r.pendientes,
            total: r.total,
        })),
        [resumen]
    );

    // Puntos IA visibles: se excluyen los que salieron "no_detection"
    const visibleWastePoints = useMemo(() => getVisibleWastePoints(wastePoints), [wastePoints]);
    const predictionSummary = useMemo(() => buildPredictionSummary(wastePoints), [wastePoints]);
    const predictionByDistrito = useMemo(
        () => buildPredictionByDistrito(wastePoints, alerts, 8),
        [wastePoints, alerts]
    );
    const predictionKeysPresent = useMemo(
        () => Array.from(new Set(predictionByDistrito.flatMap((d) => Object.keys(d).filter((k) => k !== 'distrito' && k !== 'total')))),
        [predictionByDistrito]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-start justify-center bg-black/50 p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl mt-4 mb-8">

                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-none">Dashboard General</h2>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                {resumen.length} distritos con reportes registrados
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Cerrar dashboard"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center border border-slate-100">
                            <p className="text-lg sm:text-2xl font-black text-slate-800">{stats.total}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total puntos</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 text-center border border-emerald-100">
                            <p className="text-lg sm:text-2xl font-black text-emerald-600">{stats.atendidos}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Atendidos</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 sm:p-4 text-center border border-red-100">
                            <p className="text-lg sm:text-2xl font-black text-red-600">{stats.noAtendidos}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-red-500 uppercase tracking-wider">Pendientes</p>
                        </div>
                        <div className="bg-violet-50 rounded-xl p-3 sm:p-4 text-center border border-violet-100">
                            <p className="text-lg sm:text-2xl font-black text-violet-600">{visibleWastePoints.length}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-violet-500 uppercase tracking-wider">Puntos IA</p>
                        </div>
                    </div>

                    {/* Gráfico de barras: top distritos */}
                    {/*<section>*/}
                    {/*    <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">*/}
                    {/*        <BarChart3 className="w-3.5 h-3.5" />*/}
                    {/*        Distritos con más reportes (top {TOP_DISTRITOS})*/}
                    {/*    </h3>*/}
                    {/*    <div className="bg-white border border-slate-100 rounded-xl p-2 sm:p-4 h-64 sm:h-80">*/}
                    {/*        {topDistritos.length === 0 ? (*/}
                    {/*            <EmptyState text="No hay reportes por distrito todavía." />*/}
                    {/*        ) : (*/}
                    {/*            <ResponsiveContainer width="100%" height="100%">*/}
                    {/*                <BarChart data={topDistritos} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>*/}
                    {/*                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />*/}
                    {/*                    <XAxis*/}
                    {/*                        dataKey="name"*/}
                    {/*                        tick={{ fontSize: 10, fill: '#64748b' }}*/}
                    {/*                        angle={-40}*/}
                    {/*                        textAnchor="end"*/}
                    {/*                        interval={0}*/}
                    {/*                    />*/}
                    {/*                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />*/}
                    {/*                    <Tooltip*/}
                    {/*                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}*/}
                    {/*                    />*/}
                    {/*                    <Bar dataKey="Atendidos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />*/}
                    {/*                    <Bar dataKey="Pendientes" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />*/}
                    {/*                </BarChart>*/}
                    {/*            </ResponsiveContainer>*/}
                    {/*        )}*/}
                    {/*    </div>*/}
                    {/*</section>*/}

                    {/* Histograma: distribución de distritos por cantidad de puntos */}
                    {/*<section>*/}
                    {/*    <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">*/}
                    {/*        <BarChart3 className="w-3.5 h-3.5" />*/}
                    {/*        Histograma: distritos según cantidad de puntos*/}
                    {/*    </h3>*/}
                    {/*    <div className="bg-white border border-slate-100 rounded-xl p-2 sm:p-4 h-56 sm:h-64">*/}
                    {/*        <ResponsiveContainer width="100%" height="100%">*/}
                    {/*            <BarChart data={histogramBuckets} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>*/}
                    {/*                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />*/}
                    {/*                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />*/}
                    {/*                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />*/}
                    {/*                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />*/}
                    {/*                <Bar dataKey="count" radius={[4, 4, 0, 0]}>*/}
                    {/*                    {histogramBuckets.map((_, idx) => (*/}
                    {/*                        <Cell key={idx} fill="#10b981" fillOpacity={0.55 + idx * 0.1} />*/}
                    {/*                    ))}*/}
                    {/*                </Bar>*/}
                    {/*            </BarChart>*/}
                    {/*        </ResponsiveContainer>*/}
                    {/*    </div>*/}
                    {/*    <p className="text-[10px] text-slate-400 mt-2">*/}
                    {/*        Cada barra indica cuántos distritos tienen esa cantidad de puntos registrados (ej. &quot;1-5&quot; = número de distritos con entre 1 y 5 reportes).*/}
                    {/*    </p>*/}
                    {/*</section>*/}

                    {/* Puntos IA por categoría (código de colores NTP 900.058:2019) */}
                    <section>
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Recycle className="w-3.5 h-3.5" />
                            Puntos IA por categoría
                        </h3>
                        <div className="bg-white border border-slate-100 rounded-xl p-2 sm:p-4 h-56 sm:h-64">
                            {predictionSummary.length === 0 ? (
                                <EmptyState text="Todavía no hay puntos IA con detección válida." />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={predictionSummary} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {predictionSummary.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            Los puntos sin detección (&quot;no_detection&quot;) no se incluyen en el dashboard ni en el reporte.
                        </p>
                    </section>

                    {/* Categorías por distrito */}
                    <section>
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Recycle className="w-3.5 h-3.5" />
                            Categorías IA por distrito
                        </h3>
                        <div className="bg-white border border-slate-100 rounded-xl p-2 sm:p-4 h-64 sm:h-80">
                            {predictionByDistrito.length === 0 ? (
                                <EmptyState text="No hay puntos IA con distrito asignado todavía." />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={predictionByDistrito} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="distrito"
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            angle={-40}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                        {predictionKeysPresent.map((key, idx) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                stackId="cat"
                                                fill={(PREDICTION_META[key]?.color) || '#64748b'}
                                                name={PREDICTION_META[key]?.label || key}
                                                radius={idx === predictionKeysPresent.length - 1 ? [4, 4, 0, 0] : undefined}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {/* Leyenda manual con los colores NTP */}
                        <div className="flex flex-wrap gap-3 mt-2">
                            {predictionKeysPresent.map((key) => (
                                <span key={key} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                                    <span
                                        className="w-2.5 h-2.5 rounded-sm inline-block"
                                        style={{ backgroundColor: PREDICTION_META[key]?.color || '#64748b' }}
                                    />
                                    {PREDICTION_META[key]?.label || key}
                                </span>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            El distrito de cada punto IA se aproxima usando la alerta OEFA más cercana, ya que el punto en sí solo trae coordenadas.
                        </p>
                    </section>

                    {/* Exportar Excel */}
                    <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-700">Reporte Excel completo</p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                                Incluye resumen por distrito, una hoja por región y los puntos detectados por IA.
                            </p>
                        </div>
                        <button
                            onClick={() => exportDashboardToExcel(alerts, wastePoints)}
                            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-200"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Descargar Excel
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-medium">
            {text}
        </div>
    );
}