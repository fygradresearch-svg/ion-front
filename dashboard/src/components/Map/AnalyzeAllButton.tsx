'use client';

import { useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';

interface AnalyzeAllButtonProps {
    onAnalyzeAll: () => Promise<any>; // Cambiado de Promise<void> a Promise<any>
    totalPoints?: number;
}

const ARCGIS_BASE_URL = "https://pifa.oefa.gob.pe/arcgis/rest/services/CiudadanoAmb/alertarrss_WebVisor/MapServer/0";

export async function getAlertaImageUrl(objectId: number): Promise<string | null> {
    try {
        const url = `${ARCGIS_BASE_URL}/${objectId}/attachments?f=json`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.attachmentInfos && data.attachmentInfos.length > 0) {
            const attachmentId = data.attachmentInfos[0].id;
            return `${ARCGIS_BASE_URL}/${objectId}/attachments/${attachmentId}`;
        }
        return null;
    } catch (err) {
        console.error(`Error obteniendo attachment para ${objectId}`, err);
        return null;
    }
}
export default function AnalyzeAllButton({ onAnalyzeAll, totalPoints = 0 }: AnalyzeAllButtonProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleAnalyze = async () => {
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        setAnalysisStatus('analyzing');
        setMessage('Analizando todos los puntos del mapa...');

        try {
            await onAnalyzeAll();
            setAnalysisStatus('success');
            setMessage('✅ Análisis completado exitosamente');

            // Reset después de 3 segundos
            setTimeout(() => {
                setAnalysisStatus('idle');
                setMessage('');
            }, 3000);
        } catch (error) {
            setAnalysisStatus('error');
            setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error al analizar'}`);

            setTimeout(() => {
                setAnalysisStatus('idle');
                setMessage('');
            }, 4000);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getButtonStyles = () => {
        switch (analysisStatus) {
            case 'analyzing':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'success':
                return 'bg-emerald-500 hover:bg-emerald-600';
            case 'error':
                return 'bg-red-500 hover:bg-red-600';
            default:
                return 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600';
        }
    };

    const getIcon = () => {
        switch (analysisStatus) {
            case 'analyzing':
                return <Loader2 className="w-4 h-4 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-4 h-4" />;
            case 'error':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Search className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || totalPoints === 0}
                className={`
          px-4 py-2 rounded-lg text-white font-medium text-sm
          transition-all duration-200 shadow-lg hover:shadow-xl
          flex items-center gap-2
          ${getButtonStyles()}
          ${(isAnalyzing || totalPoints === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
            >
                {getIcon()}
                {isAnalyzing ? 'Analizando...' : '🔍 Analizar todo el mapa'}
            </button>

            {totalPoints > 0 && !isAnalyzing && analysisStatus === 'idle' && (
                <span className="text-xs text-gray-500">
          {totalPoints} puntos disponibles para analizar
        </span>
            )}

            {message && (
                <div className={`
          text-xs px-3 py-1 rounded-full
          ${analysisStatus === 'success' ? 'bg-emerald-100 text-emerald-700' : ''}
          ${analysisStatus === 'error' ? 'bg-red-100 text-red-700' : ''}
          ${analysisStatus === 'analyzing' ? 'bg-blue-100 text-blue-700' : ''}
        `}>
                    {message}
                </div>
            )}
        </div>
    );
}