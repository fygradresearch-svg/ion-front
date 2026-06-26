import { Alerta, WastePoint } from '@/types';

export interface DistrictCentroid {
    lat: number;
    lng: number;
}

export function buildDistrictCentroids(alerts: Alerta[]): Record<string, DistrictCentroid> {
    const groups: Record<string, { lat: number; lng: number; count: number }> = {};

    for (const alert of alerts) {
        if (!groups[alert.NOMBDIST]) {
            groups[alert.NOMBDIST] = { lat: 0, lng: 0, count: 0 };
        }
        groups[alert.NOMBDIST].lat += alert.LATITUD;
        groups[alert.NOMBDIST].lng += alert.LONGITUD;
        groups[alert.NOMBDIST].count += 1;
    }

    const result: Record<string, DistrictCentroid> = {};
    for (const [district, group] of Object.entries(groups)) {
        result[district] = {
            lat: group.lat / group.count,
            lng: group.lng / group.count,
        };
    }
    return result;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function assignWastePointsToDistrict(
    points: WastePoint[],
    district: string,
    centroids: Record<string, DistrictCentroid>,
    maxKm = 4
): WastePoint[] {
    const centroid = centroids[district];
    if (!centroid) return [];

    return points.filter(
        p => haversineKm(p.lat, p.lng, centroid.lat, centroid.lng) <= maxKm
    );
}

export function findNearestDistrict(
    lat: number,
    lng: number,
    centroids: Record<string, DistrictCentroid>,
    maxKm = 4
): string | null {
    let nearest: string | null = null;
    let minDist = Infinity;

    for (const [district, centroid] of Object.entries(centroids)) {
        const dist = haversineKm(lat, lng, centroid.lat, centroid.lng);
        if (dist < minDist && dist <= maxKm) {
            minDist = dist;
            nearest = district;
        }
    }
    return nearest;
}
