export type MunicipalCategory = 'peligrosos' | 'no_aprovechables' | 'organicos' | 'aprovechables';

export interface MunicipalCategoryInfo {
    key: MunicipalCategory;
    label: string;
    shortLabel: string;
    color: string;
    bg: string;
    border: string;
    emoji: string;
}

export const MUNICIPAL_CATEGORIES: MunicipalCategoryInfo[] = [
    {
        key: 'peligrosos',
        label: 'Residuos Peligrosos',
        shortLabel: 'Peligrosos',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        emoji: '☢️',
    },
    {
        key: 'no_aprovechables',
        label: 'Residuos No Aprovechables',
        shortLabel: 'No aprovechables',
        color: '#475569',
        bg: '#f1f5f9',
        border: '#cbd5e1',
        emoji: '🗑️',
    },
    {
        key: 'organicos',
        label: 'Residuos Orgánicos',
        shortLabel: 'Orgánicos',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        emoji: '🌿',
    },
    {
        key: 'aprovechables',
        label: 'Residuos Aprovechables',
        shortLabel: 'Aprovechables',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#bfdbfe',
        emoji: '♻️',
    },
];

export function toMunicipalCategory(yoloClass: string): MunicipalCategory {
    switch (yoloClass?.toLowerCase()) {
        case 'hazardous':
            return 'peligrosos';
        case 'general':
            return 'no_aprovechables';
        case 'organic':
            return 'organicos';
        case 'recyclable':
            return 'aprovechables';
        default:
            return 'no_aprovechables';
    }
}

export type MunicipalStats = Record<MunicipalCategory, number> & { total: number };

export function emptyMunicipalStats(): MunicipalStats {
    return {
        peligrosos: 0,
        no_aprovechables: 0,
        organicos: 0,
        aprovechables: 0,
        total: 0,
    };
}

export function aggregateMunicipalStats(predictions: string[]): MunicipalStats {
    const stats = emptyMunicipalStats();
    for (const p of predictions) {
        const cat = toMunicipalCategory(p);
        stats[cat] += 1;
        stats.total += 1;
    }
    return stats;
}

export function getMunicipalCategoryInfo(key: MunicipalCategory) {
    return MUNICIPAL_CATEGORIES.find(c => c.key === key)!;
}
