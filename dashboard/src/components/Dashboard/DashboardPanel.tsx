'use client';

import { useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { X, FileSpreadsheet, LayoutDashboard, Recycle, MapPin, CheckCircle, FileText } from 'lucide-react';
import { Alerta, WastePoint } from '@/types';
import {
    buildDistritoResumen,
    buildPredictionSummary,
    buildPredictionByDistrito,
    getVisibleWastePoints,
    PREDICTION_META,
    exportDashboardToExcel,
} from './DashboardExcel';
import { exportDashboardToPdf } from './DashboardPdf';

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
    selectedDept: string | null;
    selectedProv: string | null;
}

const TOP_DISTRITOS = 8;

export default function DashboardPanel({ isOpen, onClose, alerts, wastePoints, stats, selectedDept, selectedProv }: DashboardPanelProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            await exportDashboardToPdf(stats, selectedDept, selectedProv, alerts);
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    const resumen = useMemo(() => buildDistritoResumen(alerts), [alerts]);
    const topDistritos = useMemo(
        () => resumen.slice(0, TOP_DISTRITOS).map((r) => ({
            name: r.distrito,
            Atendidos: r.atendidos,
            Pendientes: r.pendientes,
        })),
        [resumen]
    );

    const visibleWastePoints = useMemo(() => getVisibleWastePoints(wastePoints), [wastePoints]);
    const predictionSummary = useMemo(() => buildPredictionSummary(wastePoints), [wastePoints]);
    const predictionByDistrito = useMemo(
        () => buildPredictionByDistrito(wastePoints, alerts, 6),
        [wastePoints, alerts]
    );
    const predictionKeysPresent = useMemo(
        () => Array.from(new Set(predictionByDistrito.flatMap((d) => Object.keys(d).filter((k) => k !== 'distrito' && k !== 'total')))),
        [predictionByDistrito]
    );

    const totalPredictions = predictionSummary.reduce((sum, p) => sum + p.count, 0);

    return (
        <aside
            className={`
                fixed md:relative inset-0 md:inset-auto z-[3000] md:z-auto
                shrink-0 bg-white md:border-l border-slate-200
                h-full overflow-y-auto overflow-x-hidden
                shadow-2xl md:shadow-none
                transition-all duration-300 ease-in-out
                ${isOpen 
                    ? 'w-full md:w-[420px] lg:w-[460px] opacity-100' 
                    : 'w-0 md:w-0 opacity-0 pointer-events-none md:border-l-0'
                }
            `}
        >
            <div className="w-[min(100vw,420px)] lg:w-[460px] h-full flex flex-col shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                            <LayoutDashboard className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 leading-none">Indicadores generales</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Cerrar dashboard"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 sm:p-5 space-y-6">

                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Total de alertas" value={stats.total} percent={100} color="text-slate-800" />
                        <StatCard
                            label="Atendidas"
                            value={stats.atendidos}
                            percent={stats.total ? Math.round((stats.atendidos / stats.total) * 100) : 0}
                            color="text-emerald-600"
                        />
                        <StatCard
                            label="Pendientes"
                            value={stats.noAtendidos}
                            percent={stats.total ? Math.round((stats.noAtendidos / stats.total) * 100) : 0}
                            color="text-amber-600"
                        />
                    </div>

                    {/* Donut: clasificación de residuos por IA */}
                    <section id="pdf-chart-classification" className="bg-white p-2 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Recycle className="w-3.5 h-3.5" />
                            Clasificación municipal de residuos
                        </h3>
                        {predictionSummary.length === 0 ? (
                            <EmptyState text="Todavía no hay puntos IA con detección válida." />
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="h-40 w-40 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={predictionSummary}
                                                dataKey="count"
                                                nameKey="label"
                                                innerRadius={38}
                                                outerRadius={64}
                                                paddingAngle={2}
                                            >
                                                {predictionSummary.map((entry, idx) => (
                                                    <Cell key={idx} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ fontSize: 15, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <ul className="flex-1 space-y-2">
                                    {predictionSummary.map((entry) => (
                                        <li key={entry.label} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-2 font-medium text-slate-600">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                {entry.label}
                                            </span>
                                            <span className="font-bold text-slate-800 tabular-nums">
                                                {entry.count} ({totalPredictions ? Math.round((entry.count / totalPredictions) * 100) : 0}%)
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </section>


                    {/* Barra apilada: categorías IA por distrito */}
                    <section id="pdf-chart-distritos" className="bg-white p-2 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Recycle className="w-3.5 h-3.5" />
                            Categorías IA por distrito
                        </h3>
                        <div className="bg-white border border-slate-100 rounded-xl p-2 sm:p-3 h-64">
                            {predictionByDistrito.length === 0 ? (
                                <EmptyState text="No hay puntos IA con distrito asignado todavía." />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={predictionByDistrito} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="distrito"
                                            tick={{ fontSize: 13, fill: '#64748b' }}
                                            angle={-40}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis tick={{ fontSize: 13, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }} />
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
                        <div className="flex flex-wrap gap-3 mt-2">
                            {predictionKeysPresent.map((key) => (
                                <span key={key} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
                                    <span
                                        className="w-2.5 h-2.5 rounded-sm inline-block"
                                        style={{ backgroundColor: PREDICTION_META[key]?.color || '#64748b' }}
                                    />
                                    {PREDICTION_META[key]?.label || key}
                                </span>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            El distrito de cada punto IA se aproxima usando la alerta OEFA más cercana.
                        </p>
                    </section>

                    {/* Donut: Estado de Atención por Municipalidad */}
                    {/*<section id="pdf-chart-atencion" className="bg-white p-2 rounded-xl">*/}
                    {/*    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">*/}
                    {/*        <CheckCircle className="w-3.5 h-3.5" />*/}
                    {/*        Estado de Atención por Municipalidad*/}
                    {/*    </h3>*/}
                    {/*    {stats.total === 0 ? (*/}
                    {/*        <EmptyState text="Todavía no hay alertas registradas." />*/}
                    {/*    ) : (*/}
                    {/*        <div className="flex items-center gap-4">*/}
                    {/*            <div className="h-40 w-40 shrink-0">*/}
                    {/*                <ResponsiveContainer width="100%" height="100%">*/}
                    {/*                    <PieChart>*/}
                    {/*                        <Pie*/}
                    {/*                            data={[*/}
                    {/*                                { name: 'Atendidos', value: stats.atendidos, color: '#10b981' },*/}
                    {/*                                { name: 'Pendientes', value: stats.noAtendidos, color: '#f59e0b' }*/}
                    {/*                            ]}*/}
                    {/*                            dataKey="value"*/}
                    {/*                            nameKey="name"*/}
                    {/*                            innerRadius={38}*/}
                    {/*                            outerRadius={64}*/}
                    {/*                            paddingAngle={2}*/}
                    {/*                        >*/}
                    {/*                            <Cell fill="#10b981" stroke="none" />*/}
                    {/*                            <Cell fill="#f59e0b" stroke="none" />*/}
                    {/*                        </Pie>*/}
                    {/*                        <Tooltip*/}
                    {/*                            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }}*/}
                    {/*                        />*/}
                    {/*                    </PieChart>*/}
                    {/*                </ResponsiveContainer>*/}
                    {/*            </div>*/}
                    {/*            <ul className="flex-1 space-y-2">*/}
                    {/*                <li className="flex items-center justify-between text-xs">*/}
                    {/*                    <span className="flex items-center gap-2 font-medium text-slate-600">*/}
                    {/*                        <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 bg-emerald-500" />*/}
                    {/*                        Atendidos*/}
                    {/*                    </span>*/}
                    {/*                    <span className="font-bold text-slate-800 tabular-nums">*/}
                    {/*                        {stats.atendidos} ({stats.total ? Math.round((stats.atendidos / stats.total) * 100) : 0}%)*/}
                    {/*                    </span>*/}
                    {/*                </li>*/}
                    {/*                <li className="flex items-center justify-between text-xs">*/}
                    {/*                    <span className="flex items-center gap-2 font-medium text-slate-600">*/}
                    {/*                        <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 bg-amber-500" />*/}
                    {/*                        Pendientes*/}
                    {/*                    </span>*/}
                    {/*                    <span className="font-bold text-slate-800 tabular-nums">*/}
                    {/*                        {stats.noAtendidos} ({stats.total ? Math.round((stats.noAtendidos / stats.total) * 100) : 0}%)*/}
                    {/*                    </span>*/}
                    {/*                </li>*/}
                    {/*            </ul>*/}
                    {/*        </div>*/}
                    {/*    )}*/}
                    {/*</section>*/}

                    {/* Exportar Reportes */}
                    <section className="flex flex-col gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-700">Exportar Reportes</p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">
                                Descarga los datos y gráficos detallados del estado ambiental.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => exportDashboardToExcel(alerts, wastePoints)}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl shadow-sm cursor-pointer"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Descargar Excel
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isGeneratingPdf}
                                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 transition-colors text-white text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl shadow-sm cursor-pointer"
                            >
                                <FileText className="w-4 h-4" />
                                {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </aside>
    );
}


function StatCard({ label, value, percent, color }: { label: string; value: number; percent: number; color: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <p className={`text-base sm:text-lg font-black ${color}`}>{value}</p>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
            <p className="text-[9px] text-slate-400">{percent}%</p>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-medium text-center px-4">
            {text}
        </div>
    );
}