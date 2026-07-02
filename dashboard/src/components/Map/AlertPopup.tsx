'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alerta } from '@/types';
import ImageCarousel from './ImageCarousel';

// Configuración de categorías con colores específicos para cada tacho
const CATEGORY_INFO: Record<string, { label: string; color: string; bg: string; emoji: string; wasteTypes: string[] }> = {
    recyclable: {
        label: 'Residuos Aprovechables (Reciclables)',
        color: '#16a34a', // Verde
        bg: '#dcfce7',
        emoji: '♻️',
        wasteTypes: ['Papel', 'Cartón', 'Plástico', 'Vidrio', 'Metales', 'Textiles']
    },
    general: {
        label: 'Residuos No Aprovechables (Generales)',
        color: '#475569', // Negro/Gris oscuro
        bg: '#f1f5f9',
        emoji: '🗑️',
        wasteTypes: ['Papel higiénico', 'Pañales', 'Toallas sanitarias', 'Colillas', 'Residuos sanitarios']
    },
    organic: {
        label: 'Residuos Orgánicos',
        color: '#8B4513', // Marrón
        bg: '#fef3c7',
        emoji: '🌿',
        wasteTypes: ['Restos de comida', 'Cáscaras de frutas', 'Verduras', 'Residuos de jardín', 'Hojas']
    },
    hazardous: {
        label: 'Residuos Peligrosos',
        color: '#dc2626', // Rojo
        bg: '#fee2e2',
        emoji: '☢️',
        wasteTypes: ['Baterías', 'Pilas', 'Aceites usados', 'Pinturas', 'Químicos', 'Residuos hospitalarios']
    },
};

interface Prediction {
    class: string;
    confidence: number;
}

interface AlertPopupProps {
    alerta: Alerta;
}

export default function AlertPopup({ alerta }: AlertPopupProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Prediction | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!imageUrl) {
            setError('No hay imagen disponible para analizar');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // 1. Descargar la imagen desde el frontend (navegador)
            const imgResponse = await fetch(imageUrl);
            if (!imgResponse.ok) throw new Error('No se pudo descargar la imagen');
            const blob = await imgResponse.blob();

            // 2. Crear FormData con la imagen y coordenadas dummy
            const formData = new FormData();
            formData.append('image', blob, 'imagen.jpg');
            formData.append('lat', '0');
            formData.append('lng', '0');

            // 3. Enviar a tu backend
            const response = await fetch(`https://ion-back-production-495d.up.railway.app/create-point`, {
                method: 'POST',
                body: formData,
            });
                // const response = await fetch(`http://127.0.0.1:5000/create-point`, {
                //     method: 'POST',
                //     body: formData,
                // });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Error en el análisis');
            }

            setResult(data.prediction);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al analizar la imagen');
        } finally {
            setLoading(false);
        }
    };

    const categoryKey = result?.class?.toLowerCase() ?? '';
    const category = CATEGORY_INFO[categoryKey] ?? {
        label: result?.class ?? 'Desconocido',
        color: '#64748b',
        bg: '#f8fafc',
        emoji: '❓',
        wasteTypes: ['Sin clasificar']
    };

    const confidencePercent = result
        ? (result.confidence <= 1 ? result.confidence * 100 : result.confidence)
        : 0;

    return (
        <div style={{ fontFamily: 'sans-serif', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{alerta.ESTADO_DESC}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>#{alerta.OBJECTID}</span>
            </div>

            <div style={{ backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', margin: 0 }}><strong>{alerta.NOMBDIST}</strong></p>
                <p style={{ fontSize: '10px', margin: 0, color: '#64748b' }}>{alerta.NOMBPROV}, {alerta.NOMBDEP}</p>
            </div>

            <ImageCarousel objectId={alerta.OBJECTID} onImageUrlChange={setImageUrl} />

            <button
                onClick={handleAnalyze}
                disabled={loading || !imageUrl}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analizando con IA...
                    </>
                ) : (
                    '🔬 Analizar evidencia con IA'
                )}
            </button>

            {error && (
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    <p style={{ fontSize: '10px', color: '#dc2626', margin: 0 }}>{error}</p>
                </div>
            )}

            {result && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: category.bg, borderRadius: '8px', border: `2px solid ${category.color}` }}>
                    {/* Título del resultado */}
                    <div style={{
                        backgroundColor: category.color,
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '18px' }}>{category.emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{category.label}</span>
                    </div>

                    {/* Información del tacho */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '50px',
                            backgroundColor: category.color,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>
                            {category.emoji}
                        </div>
                        <div>
                            <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Tacho de color:</p>
                            <p style={{ fontSize: '12px', fontWeight: 'bold', color: category.color, margin: 0 }}>
                                {category.label.split('(')[0].trim()}
                            </p>
                        </div>
                    </div>

                    {/* Tipos de residuos */}


                    {/* Confianza */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '6px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b' }}>Confianza del análisis</span>
                            <span style={{ fontWeight: 'bold', color: category.color }}>{confidencePercent.toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    width: `${Math.min(confidencePercent, 100)}%`,
                                    height: '100%',
                                    backgroundColor: category.color,
                                    borderRadius: '3px',
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                    </div>

                    {/* Leyenda de colores */}
                    <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                    }}>
                        Punto registrado (IA)

                    </div>
                </div>
            )}

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <a
                    href={'https://www.gob.pe/institucion/oefa/institucional'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', fontWeight: 'bold' }}
                >
                    Ver Ficha Oficial ↗
                </a>
            </div>

            <div style={{ fontSize: '9px', backgroundColor: '#fef3c7', padding: '6px', borderRadius: '3px', borderLeft: '3px solid #d97706' }}>
                <p style={{ margin: '3px 0 2px 0', fontWeight: 'bold', color: '#92400e' }}>📋 MARCO LEGAL</p>
                <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>DL Nº1278: Ley de Gestión Integral de Residuos Sólidos</p>
                <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Modificado por DL N°1501</p>
                <p style={{ margin: '2px 0', lineHeight: '1.3', color: '#78350f' }}>Reglamento: DS Nº014-2017-MINAM</p>
            </div>
        </div>
    );
}