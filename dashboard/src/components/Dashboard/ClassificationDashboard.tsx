'use client';

import { useMemo } from 'react';
import { X, MapPin, Loader2, BarChart3, AlertTriangle } from 'lucide-react';
import { Alerta } from '@/types';
import {
    MUNICIPAL_CATEGORIES,
    aggregateMunicipalStats,
    MunicipalStats,
    toMunicipalCategory,
    getMunicipalCategoryInfo,
} from '@/lib/municipalWaste';
import { WastePoint } from '@/types';
import { formatConfidence } from '@/lib/wasteCategories';

interface ClassificationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    district: string;
    dept: string;
    alerts: Alerta[];
    wastePoints: WastePoint[];
    alertCount?: number;
    rankingPosition?: number;
}

export default function ClassificationDashboard({
    isOpen,
    onClose,
    district,
    dept,
    alerts,
    wastePoints,
    alertCount = 0,
    rankingPosition = 1,
}: ClassificationDashboardProps) {
    const analyzedPoints = useMemo(() => {
        return alerts
            .filter(a => a.NOMBDIST === district)
            .map(p => ({
                source: 'created' as const,
                id: p.OBJECTID,
                lat: p.LATITUD,
                lng: p.LONGITUD,
                prediction: (p as any).prediction || 'general',
                confidence: (p as any).confidence || 0,
                image_url: (p as any).image_url,
            }));
    }, [alerts, district]);

    const stats = useMemo(() => {
        return aggregateMunicipalStats(analyzedPoints.map(r => r.prediction));
    }, [analyzedPoints]);

    const loading = false;
    const error = null;
    const progress = { current: 0, total: 0, message: '' };

    if (!isOpen) return null;

    const dominantCategory = stats
        ? MUNICIPAL_CATEGORIES.reduce((best, cat) =>
            (stats[cat.key] > stats[best.key] ? cat : best), MUNICIPAL_CATEGORIES[0])
        : null;

    const progressPercent = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:fade-in duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-4 rounded-t-3xl z-10">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xl sm:text-2xl">
                                    {['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][rankingPosition - 1] || '📍'}
                                </span>
                                <h2 className="text-base sm:text-xl font-black text-slate-900 truncate">
                                    Resumen Municipal
                                </h2>
                                <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0">
                                    #{rankingPosition}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-medium truncate">{district}, {dept}</span>
                                <span className="text-slate-300">·</span>
                                <span>{alertCount} puntos de residuos</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                            <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                            <p className="text-slate-700 font-bold text-sm sm:text-base text-center">
                                Analizando puntos en {district}...
                            </p>
                            <p className="text-xs text-slate-400 mt-1 text-center">{progress.message}</p>
                            {progress.total > 0 && (
                                <div className="w-full max-w-xs mt-4">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>{progress.current} / {progress.total}</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    ) : stats && stats.total === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                            <p className="text-slate-600 text-sm font-medium">
                                No se encontraron puntos con imagen para analizar en este distrito.
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                Registra puntos en el mapa o verifica que las alertas tengan evidencia fotográfica.
                            </p>
                        </div>
                    ) : stats && (
                        <>
                            {/* Resumen general */}
                            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">
                                    Resumen General del Distrito
                                </p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900">
                                    {stats.total} <span className="text-base font-bold text-slate-500">puntos analizados</span>
                                </p>
                                {dominantCategory && stats[dominantCategory.key] > 0 && (
                                    <p className="text-xs text-slate-600 mt-2">
                                        Predominio: <strong style={{ color: dominantCategory.color }}>
                                            {dominantCategory.emoji} {dominantCategory.label}
                                        </strong> ({stats[dominantCategory.key]} — {((stats[dominantCategory.key] / stats.total) * 100).toFixed(0)}%)
                                    </p>
                                )}
                            </div>

                            {/* Clasificación municipal */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    Clasificación Municipal
                                </h3>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {MUNICIPAL_CATEGORIES.map(cat => {
                                        const count = stats[cat.key];
                                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                        return (
                                            <div
                                                key={cat.key}
                                                className="rounded-xl p-3 border"
                                                style={{ backgroundColor: cat.bg, borderColor: cat.border }}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-lg">{cat.emoji}</span>
                                                    <p className="text-[10px] font-bold leading-tight" style={{ color: cat.color }}>
                                                        {cat.shortLabel}
                                                    </p>
                                                </div>
                                                <p className="text-2xl font-black" style={{ color: cat.color }}>{count}</p>
                                                <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-500 mt-1">{pct.toFixed(0)}%</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Detalle de puntos */}
                            {analyzedPoints.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                        Detalle de puntos ({analyzedPoints.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {analyzedPoints.map((point, idx) => {
                                            const cat = getMunicipalCategoryInfo(toMunicipalCategory(point.prediction));
                                            const conf = formatConfidence(point.confidence);
                                            return (
                                                <div
                                                    key={`${point.source}-${point.id}-${idx}`}
                                                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 border border-slate-100"
                                                >
                                                    {point.image_url && (
                                                        <img
                                                            src={point.image_url}
                                                            alt=""
                                                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-200"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-slate-500">
                                                            {point.source === 'created' ? '📍 Registrado' : '🏛️ OEFA'} #{point.id}
                                                        </p>
                                                        <p className="text-xs font-bold truncate" style={{ color: cat.color }}>
                                                            {cat.emoji} {cat.shortLabel}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                        {conf.toFixed(0)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
                            >
                                Cerrar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
