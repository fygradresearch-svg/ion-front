'use client';

import { WastePoint } from '@/types';
import {getCategoryFromYolo, MUNICIPAL_CATEGORIES, MunicipalCategory} from "@/lib/municipalWaste";
// Asegúrate de que tu municipal.ts tenga esta estructura
export interface MunicipalCategoryInfo {
    key: MunicipalCategory;
    label: string;
    shortLabel: string;
    color: string;
    bg: string;
    border: string;
    emoji: string;
    tachoColor: string; // ← Este campo debe existir
    wasteTypes: string[]; // ← Este campo debe existir
}
export default function WastePointPopup({ point }: { point: WastePoint }) {
    // Obtener la información de la categoría municipal
    const categoryInfo = getCategoryFromYolo(point.prediction);
    const confidencePercent = point.confidence <= 1
        ? point.confidence * 100
        : point.confidence;

    return (
        <div style={{ fontFamily: 'sans-serif', color: '#1e293b', minWidth: '220px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '8px',
                marginBottom: '8px'
            }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#7c3aed' }}>
                    Punto registrado (IA)
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    #{point.id}
                </span>
            </div>

            {point.image_url && (
                <div style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    backgroundColor: '#0f172a'
                }}>
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

            {/* Resultado de clasificación */}
            <div style={{
                padding: '10px',
                backgroundColor: categoryInfo.bg,
                borderRadius: '8px',
                border: `2px solid ${categoryInfo.color}`
            }}>
                {/* Header con el color del tacho */}
                <div style={{
                    backgroundColor: categoryInfo.color,
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '18px' }}>{categoryInfo.emoji}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {categoryInfo.label}
                    </span>
                </div>

                {/* Información del tacho */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px',
                    backgroundColor: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    border: `1px solid ${categoryInfo.border}`
                }}>
                    {/* Representación del tacho */}
                    <div style={{
                        width: '40px',
                        height: '50px',
                        backgroundColor: categoryInfo.color,
                        borderRadius: '4px 4px 6px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}>
                        {categoryInfo.emoji}
                    </div>
                    <div>
                        <p style={{ fontSize: '9px', color: '#64748b', margin: 0 }}>
                            Tacho de color:
                        </p>
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: categoryInfo.color,
                            margin: 0
                        }}>
                            {categoryInfo.tachoColor}
                        </p>
                        <p style={{
                            fontSize: '9px',
                            color: '#64748b',
                            margin: '2px 0 0 0'
                        }}>
                            YOLO: <strong>{point.prediction}</strong>
                        </p>
                    </div>
                </div>

                {/* Tipos de residuos que van en este tacho */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: `1px solid ${categoryInfo.border}`
                }}>
                    <p style={{
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        margin: '0 0 4px'
                    }}>
                        🗑️ Residuos que corresponden:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {categoryInfo.wasteTypes.map((type, index) => (
                            <span key={index} style={{
                                fontSize: '8px',
                                backgroundColor: categoryInfo.bg,
                                color: categoryInfo.color,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                border: `1px solid ${categoryInfo.color}33`
                            }}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Barra de confianza */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    border: `1px solid ${categoryInfo.border}`
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        marginBottom: '4px'
                    }}>
                        <span style={{ color: '#64748b' }}>Confianza</span>
                        <span style={{ fontWeight: 'bold', color: categoryInfo.color }}>
                            {confidencePercent.toFixed(1)}%
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        backgroundColor: '#e2e8f0',
                        height: '6px',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div
                            style={{
                                width: `${Math.min(confidencePercent, 100)}%`,
                                height: '100%',
                                backgroundColor: categoryInfo.color,
                                borderRadius: '3px',
                                transition: 'width 0.5s ease'
                            }}
                        />
                    </div>
                </div>

                {/* Leyenda de colores (compacta) */}
                <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: `1px solid ${categoryInfo.border}`
                }}>

                </div>
            </div>

            <p style={{
                fontSize: '9px',
                color: '#94a3b8',
                marginTop: '8px',
                marginBottom: 0
            }}>
                📍 {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            </p>
        </div>
    );
}