export const CATEGORY_INFO: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    general: { label: 'General', color: '#475569', bg: '#f1f5f9', emoji: '🗑️' },
    hazardous: { label: 'Peligroso', color: '#dc2626', bg: '#fef2f2', emoji: '☢️' },
    organic: { label: 'Orgánico', color: '#16a34a', bg: '#f0fdf4', emoji: '🌿' },
    recyclable: { label: 'Reciclable', color: '#2563eb', bg: '#eff6ff', emoji: '♻️' },
};

export function getCategoryInfo(className: string) {
    const key = className?.toLowerCase() ?? '';
    return CATEGORY_INFO[key] ?? {
        label: className || 'Desconocido',
        color: '#64748b',
        bg: '#f8fafc',
        emoji: '❓',
    };
}

export function formatConfidence(confidence: number) {
    return confidence <= 1 ? confidence * 100 : confidence;
}
