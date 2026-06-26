// municipal.ts

export type MunicipalCategory = 'peligrosos' | 'no_aprovechables' | 'organicos' | 'aprovechables';

export interface MunicipalCategoryInfo {
    key: MunicipalCategory;
    label: string;
    shortLabel: string;
    color: string;
    bg: string;
    border: string;
    emoji: string;
    tachoColor: string; // Color del tacho según la normativaResultado YOLOv8


    wasteTypes: string[]; // Tipos de residuos que van en cada tacho
}

export const MUNICIPAL_CATEGORIES: MunicipalCategoryInfo[] = [
    {
        key: 'peligrosos',
        label: 'Residuos Peligrosos',
        shortLabel: 'Peligrosos',
        color: '#dc2626', // Rojo
        bg: '#fef2f2',
        border: '#fecaca',
        emoji: '☢️',
        tachoColor: 'Rojo',
        wasteTypes: ['Baterías', 'Pilas', 'Aceites usados', 'Pinturas', 'Químicos', 'Residuos hospitalarios']
    },
    {
        key: 'no_aprovechables',
        label: 'Residuos No Aprovechables',
        shortLabel: 'No aprovechables',
        color: '#475569', // Negro/Gris oscuro
        bg: '#f1f5f9',
        border: '#cbd5e1',
        emoji: '🗑️',
        tachoColor: 'Negro',
        wasteTypes: ['Papel higiénico', 'Pañales', 'Toallas sanitarias', 'Colillas', 'Residuos sanitarios']
    },
    {
        key: 'organicos',
        label: 'Residuos Orgánicos',
        shortLabel: 'Orgánicos',
        color: '#8B4513', // Marrón
        bg: '#fef3c7',
        border: '#fde68a',
        emoji: '🌿',
        tachoColor: 'Marrón',
        wasteTypes: ['Restos de comida', 'Cáscaras de frutas', 'Verduras', 'Residuos de jardín', 'Hojas']
    },
    {
        key: 'aprovechables',
        label: 'Residuos Aprovechables (Reciclables)',
        shortLabel: 'Aprovechables',
        color: '#16a34a', // Verde
        bg: '#dcfce7',
        border: '#bbf7d0',
        emoji: '♻️',
        tachoColor: 'Verde',
        wasteTypes: ['Papel', 'Cartón', 'Plástico', 'Vidrio', 'Metales', 'Textiles']
    },
];

/**
 * Convierte una clase de YOLO a categoría municipal
 */
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

/**
 * Crea estadísticas vacías de municipales
 */
export function emptyMunicipalStats(): MunicipalStats {
    return {
        peligrosos: 0,
        no_aprovechables: 0,
        organicos: 0,
        aprovechables: 0,
        total: 0,
    };
}

/**
 * Agrega estadísticas a partir de predicciones
 */
export function aggregateMunicipalStats(predictions: string[]): MunicipalStats {
    const stats = emptyMunicipalStats();
    for (const p of predictions) {
        const cat = toMunicipalCategory(p);
        stats[cat] += 1;
        stats.total += 1;
    }
    return stats;
}

/**
 * Obtiene la información de una categoría municipal
 */
export function getMunicipalCategoryInfo(key: MunicipalCategory): MunicipalCategoryInfo {
    const info = MUNICIPAL_CATEGORIES.find(c => c.key === key);
    if (!info) {
        throw new Error(`Categoría municipal no encontrada: ${key}`);
    }
    return info;
}

/**
 * Obtiene la información de una categoría municipal a partir de una clase YOLO
 */
export function getCategoryFromYolo(yoloClass: string): MunicipalCategoryInfo {
    const category = toMunicipalCategory(yoloClass);
    return getMunicipalCategoryInfo(category);
}

/**
 * Verifica si una categoría existe
 */
export function isValidCategory(key: string): key is MunicipalCategory {
    return MUNICIPAL_CATEGORIES.some(c => c.key === key);
}

/**
 * Obtiene todas las categorías como objeto clave-valor
 */
export const MUNICIPAL_CATEGORIES_MAP: Record<MunicipalCategory, MunicipalCategoryInfo> =
    MUNICIPAL_CATEGORIES.reduce((acc, cat) => {
        acc[cat.key] = cat;
        return acc;
    }, {} as Record<MunicipalCategory, MunicipalCategoryInfo>);