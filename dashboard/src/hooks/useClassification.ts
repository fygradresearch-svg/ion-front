// hooks/useClassification.ts
'use client';

import { useState, useCallback } from 'react';

interface ClassificationResult {
    class_id: number;
    class_name: string;
    confidence: number;
}

const classLabels = {
    0: "BATTERY",
    1: "BIOLOGICAL",
    2: "CARDBOARD",
    3: "CLOTHES",
    4: "GLASS",
    5: "METAL",
    6: "PAPER",
    7: "PLASTIC",
    8: "SHOES",
    9: "TRASH"
};

const classSeverity = {
    0: { level: 'Crítico', impact: 'Alto impacto ambiental por metales pesados' },
    1: { level: 'Alto', impact: 'Riesgo biológico y sanitario' },
    2: { level: 'Medio', impact: 'Reciclable con tratamiento especial' },
    3: { level: 'Medio-Bajo', impact: 'Reciclable textil' },
    4: { level: 'Medio', impact: 'Reciclable pero requiere procesamiento' },
    5: { level: 'Medio-Alto', impact: 'Contaminante metálico' },
    6: { level: 'Bajo', impact: 'Altamente reciclable' },
    7: { level: 'Medio', impact: 'Contaminante plástico' },
    8: { level: 'Medio', impact: 'Reciclable textil' },
    9: { level: 'Muy Alto', impact: 'Residuo mixto no reciclable' }
};

export function useClassification() {
    const [isLoading, setIsLoading] = useState(false);

    const classifyImage = useCallback(async (imageData: string | File) => {
        setIsLoading(true);
        try {
            // Aquí va la integración con tu modelo TensorFlow
            // Ejemplo de simulación
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockResults: ClassificationResult[] = [
                { class_id: 7, class_name: 'PLASTIC', confidence: 0.85 },
                { class_id: 6, class_name: 'PAPER', confidence: 0.12 },
                { class_id: 2, class_name: 'CARDBOARD', confidence: 0.03 }
            ];

            // Calcular criticidad general
            // @ts-ignore
            const severity = classSeverity[mockResults[0].class_id];
            const criticalityScore = mockResults.reduce((acc, r) => {
                // @ts-ignore
                const s = classSeverity[r.class_id];
                const weights = { 'Crítico': 5, 'Muy Alto': 4, 'Alto': 3, 'Medio-Alto': 2.5, 'Medio': 2, 'Medio-Bajo': 1.5, 'Bajo': 1 };
                return acc + (weights[s?.level as keyof typeof weights] || 1) * r.confidence;
            }, 0);

            return {
                results: mockResults,
                topResult: mockResults[0],
                severity: severity,
                criticalityScore: criticalityScore,
                totalConfidence: mockResults.reduce((acc, r) => acc + r.confidence, 0)
            };
        } catch (error) {
            console.error('Error en clasificación:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { classifyImage, isLoading };
}