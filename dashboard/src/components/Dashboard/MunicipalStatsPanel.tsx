'use client';

import Image from 'next/image';
import {
    MUNICIPAL_CATEGORIES,
    aggregateMunicipalStats,
    MunicipalStats,
    toMunicipalCategory,
} from '@/lib/municipalWaste';
import { buildDistrictCentroids, findNearestDistrict } from '@/lib/districtUtils';
import { Alerta, WastePoint } from '@/types';
import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

interface MunicipalStatsPanelProps {
    alerts: Alerta[];
    wastePoints: WastePoint[];
}

export default function MunicipalStatsPanel({ alerts, wastePoints }: MunicipalStatsPanelProps) {
    const centroids = useMemo(() => buildDistrictCentroids(alerts), [alerts]);

    const globalStats = useMemo(() => {
        const predictions = wastePoints.map(p => p.prediction);
        return aggregateMunicipalStats(predictions);
    }, [wastePoints]);

    const districtStats = useMemo(() => {
        const map: Record<string, MunicipalStats> = {};
        for (const point of wastePoints) {
            const district = findNearestDistrict(point.lat, point.lng, centroids);
            if (!district) continue;
            if (!map[district]) map[district] = aggregateMunicipalStats([]);
            const cat = map[district];
            const municipal = toMunicipalCategory(point.prediction);
            cat[municipal] += 1;
            cat.total += 1;
        }
        return Object.entries(map)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
    }, [wastePoints, centroids]);

    if (globalStats.total === 0 && wastePoints.length === 0) {
        return (
            <section className="mb-6">
                <h2 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Clasificación Municipal
                </h2>
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                    <p className="text-[10px] text-violet-600 leading-relaxed">
                        Registra puntos en el mapa para ver estadísticas por clasificación municipal.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-6">
            <h2 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                Clasificación Municipal
            </h2>

            <div className="grid grid-cols-2 gap-1.5 mb-4">
                {MUNICIPAL_CATEGORIES.map(cat => (
                    <div
                        key={cat.key}
                        className="rounded-lg p-2 border text-center flex flex-col items-center"
                        style={{ backgroundColor: cat.bg, borderColor: cat.border }}
                    >
                        <div className="relative w-8 h-8">
                            <Image
                                src={cat.tachoImage}
                                alt={`Tacho ${cat.tachoColor}`}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <p className="text-base font-black leading-none mt-0.5" style={{ color: cat.color }}>
                            {globalStats[cat.key]}
                        </p>
                        <p className="text-[8px] font-bold leading-tight mt-0.5" style={{ color: cat.color }}>
                            {cat.shortLabel}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}