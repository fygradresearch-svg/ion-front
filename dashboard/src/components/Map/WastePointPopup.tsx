'use client';

import { WastePoint } from '@/types';
import { getCategoryInfo, formatConfidence } from '@/lib/wasteCategories';

export default function WastePointPopup({ point }: { point: WastePoint }) {
    const category = getCategoryInfo(point.prediction);
    const confidencePercent = formatConfidence(point.confidence);

    return (
        <div style={{ fontFamily: 'sans-serif', color: '#1e293b', minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#7c3aed' }}>Punto registrado (IA)</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>#{point.id}</span>
            </div>

            {point.image_url && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', backgroundColor: '#0f172a' }}>
                    <img
                        src={point.image_url}
                        alt="Evidencia"
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                        onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/400x300?text=Sin+imagen';
                        }}
                    />
                </div>
            )}

            <div style={{ padding: '10px', backgroundColor: category.bg, borderRadius: '8px', border: `1px solid ${category.color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>{category.emoji}</span>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', color: category.color, margin: 0 }}>
                            {category.label}
                        </p>
                        <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>
                            Clase: <strong>{point.prediction}</strong>
                        </p>
                    </div>
                </div>
                <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '6px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Confianza</span>
                        <span style={{ fontWeight: 'bold', color: category.color }}>{confidencePercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${Math.min(confidencePercent, 100)}%`,
                                height: '100%',
                                backgroundColor: category.color,
                                borderRadius: '3px',
                            }}
                        />
                    </div>
                </div>
            </div>

            <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '8px', marginBottom: 0 }}>
                📍 {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            </p>
        </div>
    );
}
