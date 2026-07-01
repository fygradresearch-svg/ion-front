import * as XLSX from 'xlsx';
import { Alerta, WastePoint } from '@/types';

/**
 * Estas funciones intentan leer varios nombres de campo posibles para
 * "región/departamento" y "distrito", porque el shape exacto de Alerta
 * puede variar. Ajusta los nombres de campo aquí si en tu `types.ts`
 * los campos se llaman distinto (ej. NOMBDIST, DISTRITO, distrito).
 */
function getRegion(a: any): string {
    return a.NOMBDEP || a.DEPARTAMENTO || a.departamento || 'Sin región';
}

function getProvincia(a: any): string {
    return a.NOMBPROV || a.PROVINCIA || a.provincia || 'Sin provincia';
}

function getDistrito(a: any): string {
    return (
        a.NOMBDIST ||
        a.DISTRITO ||
        a.distrito ||
        a.NOMBPROV || // fallback: si no hay distrito, usamos provincia
        'Sin distrito'
    );
}

function getEstado(a: any): string {
    return a.ESTADO_DESC || a.estado || 'Sin estado';
}

function isAtendido(a: any): boolean {
    return String(getEstado(a)).toLowerCase().includes('atendido');
}

/** Distancia en km entre dos coordenadas (fórmula haversine) */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Los puntos IA (WastePoint) no traen distrito/región propios, solo lat/lng.
 * Como aproximación, se les asigna el distrito de la alerta OEFA más cercana.
 * Si no hay alertas cerca (o ninguna alerta cargada), cae en 'Zona sin distrito asignado'.
 * Idealmente el backend debería devolver el distrito directamente en cada punto IA.
 */
export function findNearestDistrito(point: { lat: number; lng: number }, alerts: Alerta[]): string {
    if (!alerts || alerts.length === 0) return 'Zona sin distrito asignado';

    let nearest: any = null;
    let nearestDist = Infinity;

    alerts.forEach((a: any) => {
        if (typeof a.LATITUD !== 'number' || typeof a.LONGITUD !== 'number') return;
        const dist = haversineKm(point.lat, point.lng, a.LATITUD, a.LONGITUD);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = a;
        }
    });

    return nearest ? getDistrito(nearest) : 'Zona sin distrito asignado';
}

/**
 * Categorías que puede devolver el modelo de IA (`prediction`), mapeadas
 * al código de colores de la NTP 900.058:2019 - Gestión de Residuos.
 * "no_detection" se excluye siempre del dashboard y del Excel: no es un
 * residuo confirmado, es una imagen donde el modelo no detectó nada.
 */
export const PREDICTION_META: Record<
    string,
    { label: string; color: string; textColor: string }
> = {
    hazardous: { label: 'Residuos peligrosos', color: '#dc2626', textColor: '#dc2626' }, // rojo
    general: { label: 'No aprovechables', color: '#1e293b', textColor: '#1e293b' }, // negro/slate
    organic: { label: 'Residuos orgánicos', color: '#92400e', textColor: '#92400e' }, // marrón
    recyclable: { label: 'Aprovechables', color: '#16a34a', textColor: '#16a34a' }, // verde
};

const EXCLUDED_PREDICTIONS = new Set(['no_detection']);

export function isVisiblePrediction(prediction: string | undefined | null): boolean {
    if (!prediction) return false;
    return !EXCLUDED_PREDICTIONS.has(prediction);
}

/** Puntos IA visibles en el dashboard: excluye los que no tuvieron detección */
export function getVisibleWastePoints(wastePoints: WastePoint[]): WastePoint[] {
    return wastePoints.filter((p) => isVisiblePrediction(p.prediction));
}

export function getPredictionMeta(prediction: string) {
    return (
        PREDICTION_META[prediction] || {
            label: prediction || 'Sin categoría',
            color: '#64748b',
            textColor: '#64748b',
        }
    );
}

export interface PredictionSummary {
    prediction: string;
    label: string;
    color: string;
    count: number;
}

/** Agrupa los puntos IA (ya filtrados) por categoría de predicción */
export function buildPredictionSummary(wastePoints: WastePoint[]): PredictionSummary[] {
    const visible = getVisibleWastePoints(wastePoints);
    const map = new Map<string, PredictionSummary>();

    visible.forEach((p) => {
        const meta = getPredictionMeta(p.prediction);
        if (!map.has(p.prediction)) {
            map.set(p.prediction, { prediction: p.prediction, label: meta.label, color: meta.color, count: 0 });
        }
        map.get(p.prediction)!.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export interface PredictionByDistrito {
    distrito: string;
    total: number;
    [predictionKey: string]: string | number; // ej. hazardous, general, recyclable, organic
}

/**
 * Agrupa los puntos IA visibles por distrito (asignado por cercanía a alertas)
 * y dentro de cada distrito cuenta cuántos hay de cada categoría.
 * Sirve para un gráfico de barras apiladas: distrito -> categorías.
 */
export function buildPredictionByDistrito(
    wastePoints: WastePoint[],
    alerts: Alerta[],
    topN = 8
): PredictionByDistrito[] {
    const visible = getVisibleWastePoints(wastePoints);
    const map = new Map<string, PredictionByDistrito>();

    visible.forEach((p) => {
        const distrito = findNearestDistrito(p, alerts);
        if (!map.has(distrito)) {
            map.set(distrito, { distrito, total: 0 });
        }
        const entry = map.get(distrito)!;
        entry[p.prediction] = ((entry[p.prediction] as number) || 0) + 1;
        entry.total = (entry.total as number) + 1;
    });

    return Array.from(map.values())
        .sort((a, b) => (b.total as number) - (a.total as number))
        .slice(0, topN);
}

export interface DistritoResumen {
    distrito: string;
    provincia: string;
    region: string;
    total: number;
    atendidos: number;
    pendientes: number;
}

/** Agrupa las alertas por distrito para el resumen y las gráficas */
export function buildDistritoResumen(alerts: Alerta[]): DistritoResumen[] {
    const map = new Map<string, DistritoResumen>();

    alerts.forEach((a) => {
        const distrito = getDistrito(a);
        const provincia = getProvincia(a);
        const region = getRegion(a);
        const key = `${region}|${provincia}|${distrito}`;

        if (!map.has(key)) {
            map.set(key, { distrito, provincia, region, total: 0, atendidos: 0, pendientes: 0 });
        }
        const entry = map.get(key)!;
        entry.total += 1;
        if (isAtendido(a)) entry.atendidos += 1;
        else entry.pendientes += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/** Bins de frecuencia: cuántos distritos caen en cada rango de cantidad de puntos */
export function buildHistogramBuckets(resumen: DistritoResumen[]) {
    const buckets = [
        { label: '1-5', min: 1, max: 5, count: 0 },
        { label: '6-10', min: 6, max: 10, count: 0 },
        { label: '11-20', min: 11, max: 20, count: 0 },
        { label: '21-40', min: 21, max: 40, count: 0 },
        { label: '41+', min: 41, max: Infinity, count: 0 },
    ];

    resumen.forEach((r) => {
        const bucket = buckets.find((b) => r.total >= b.min && r.total <= b.max);
        if (bucket) bucket.count += 1;
    });

    return buckets;
}

/** Genera y descarga el archivo Excel con un resumen general y una hoja por región */
export function exportDashboardToExcel(alerts: Alerta[], wastePoints: WastePoint[]) {
    const resumen = buildDistritoResumen(alerts);
    const wb = XLSX.utils.book_new();

    // --- Hoja: Resumen por distrito ---
    const resumenSheet = XLSX.utils.json_to_sheet(
        resumen.map((r) => ({
            Región: r.region,
            Provincia: r.provincia,
            Distrito: r.distrito,
            'Total puntos': r.total,
            Atendidos: r.atendidos,
            Pendientes: r.pendientes,
        }))
    );
    XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen por Distrito');

    // --- Una hoja por cada región (departamento) ---
    const regiones = Array.from(new Set(alerts.map((a: any) => getRegion(a))));
    regiones.forEach((region) => {
        const rows = alerts
            .filter((a: any) => getRegion(a) === region)
            .map((a: any) => ({
                Provincia: getProvincia(a),
                Distrito: getDistrito(a),
                Estado: getEstado(a),
                Latitud: a.LATITUD,
                Longitud: a.LONGITUD,
                OBJECTID: a.OBJECTID,
            }));

        if (rows.length === 0) return;

        const sheet = XLSX.utils.json_to_sheet(rows);
        // Los nombres de hoja en Excel no pueden superar 31 caracteres ni tener ciertos símbolos
        const safeName = region.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Region';
        XLSX.utils.book_append_sheet(wb, sheet, safeName);
    });

    // --- Hoja: Puntos detectados por IA (se excluyen los "no_detection") ---
    const visiblePoints = getVisibleWastePoints(wastePoints);
    if (visiblePoints.length > 0) {
        const iaSheet = XLSX.utils.json_to_sheet(
            visiblePoints.map((p) => ({
                ID: p.id,
                Latitud: p.lat,
                Longitud: p.lng,
                'Distrito (aprox.)': findNearestDistrito(p, alerts),
                Categoría: getPredictionMeta(p.prediction).label,
                'Predicción (raw)': p.prediction,
                'Confianza (%)': Math.round(p.confidence * 100),
                Imagen: p.image_url,
            }))
        );
        XLSX.utils.book_append_sheet(wb, iaSheet, 'Puntos IA');
    }

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `reporte-ecowatch-${fecha}.xlsx`);
}