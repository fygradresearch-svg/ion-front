// components/Dashboard/ClassificationDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, Battery, Leaf, Box, ShoppingBag, GlassWater,
    Wrench, FileText, Package, Footprints, Trash2, TrendingUp,
    MapPin, Clock, CheckCircle, X, XCircle, AlertCircle
} from 'lucide-react';

interface ClassificationResult {
    class_id: number;
    class_name: string;
    confidence: number;
}

interface ClassificationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    location: string;
    dept: string;
    district: string;
    alertCount?: number;
    rankingPosition?: number;
}

const classIcons: { [key: number]: any } = {
    0: Battery,
    1: Leaf,
    2: Box,
    3: ShoppingBag,
    4: GlassWater,
    5: Wrench,
    6: FileText,
    7: Package,
    8: Footprints,
    9: Trash2
};

const classColors: { [key: number]: string } = {
    0: 'bg-amber-500',
    1: 'bg-emerald-500',
    2: 'bg-blue-500',
    3: 'bg-purple-500',
    4: 'bg-cyan-500',
    5: 'bg-gray-500',
    6: 'bg-yellow-500',
    7: 'bg-indigo-500',
    8: 'bg-rose-500',
    9: 'bg-red-500'
};

const classSeverity: { [key: number]: { level: string; color: string; impact: string; recommendation: string; riskLevel: string; riskColor: string; priority: string } } = {
    0: {
        level: 'Crítico',
        color: 'bg-red-600',
        impact: 'Contaminación por metales pesados',
        recommendation: 'Requiere disposición especial en centros autorizados',
        riskLevel: 'Riesgo Extremo',
        riskColor: 'text-red-700',
        priority: '⚠️ Prioridad Máxima'
    },
    1: {
        level: 'Alto',
        color: 'bg-orange-600',
        impact: 'Riesgo biológico y sanitario',
        recommendation: 'Manejo con equipo de protección y desinfección',
        riskLevel: 'Riesgo Alto',
        riskColor: 'text-orange-700',
        priority: '⚠️ Prioridad Alta'
    },
    2: {
        level: 'Medio',
        color: 'bg-yellow-600',
        impact: 'Reciclable con tratamiento especial',
        recommendation: 'Separar para reciclaje en plantas especializadas',
        riskLevel: 'Riesgo Medio',
        riskColor: 'text-yellow-700',
        priority: '⚡ Prioridad Media'
    },
    3: {
        level: 'Medio-Bajo',
        color: 'bg-blue-600',
        impact: 'Reciclable textil',
        recommendation: 'Donar o reciclar en puntos de acopio textil',
        riskLevel: 'Riesgo Medio-Bajo',
        riskColor: 'text-blue-700',
        priority: '⚡ Prioridad Media-Baja'
    },
    4: {
        level: 'Medio',
        color: 'bg-cyan-600',
        impact: 'Reciclable pero requiere procesamiento',
        recommendation: 'Llevar a centros de reciclaje de vidrio',
        riskLevel: 'Riesgo Medio',
        riskColor: 'text-cyan-700',
        priority: '⚡ Prioridad Media'
    },
    5: {
        level: 'Medio-Alto',
        color: 'bg-orange-500',
        impact: 'Contaminante metálico',
        recommendation: 'Reciclar en chatarrerías autorizadas',
        riskLevel: 'Riesgo Alto',
        riskColor: 'text-orange-700',
        priority: '⚠️ Prioridad Alta'
    },
    6: {
        level: 'Bajo',
        color: 'bg-green-600',
        impact: 'Altamente reciclable',
        recommendation: 'Separar para reciclaje de papel y cartón',
        riskLevel: 'Riesgo Bajo',
        riskColor: 'text-green-700',
        priority: '✅ Prioridad Normal'
    },
    7: {
        level: 'Medio',
        color: 'bg-purple-600',
        impact: 'Contaminante plástico',
        recommendation: 'Reducir uso y reciclar en puntos autorizados',
        riskLevel: 'Riesgo Medio',
        riskColor: 'text-purple-700',
        priority: '⚡ Prioridad Media'
    },
    8: {
        level: 'Medio',
        color: 'bg-rose-600',
        impact: 'Reciclable textil',
        recommendation: 'Reutilizar o donar en buen estado',
        riskLevel: 'Riesgo Medio',
        riskColor: 'text-rose-700',
        priority: '⚡ Prioridad Media'
    },
    9: {
        level: 'Muy Alto',
        color: 'bg-red-700',
        impact: 'Residuo mixto no reciclable',
        recommendation: 'Disposición final controlada en rellenos sanitarios',
        riskLevel: 'Riesgo Extremo',
        riskColor: 'text-red-700',
        priority: '🔴 Prioridad Crítica'
    }
};

// Generador de resultados según la posición en el ranking
const generateResultsForPosition = (position: number): ClassificationResult[] => {
    const combinations = [
        // Posición 1: Plástico
        [
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.85 },
            { class_id: 6, class_name: 'PAPER', confidence: 0.12 },
            { class_id: 2, class_name: 'CARDBOARD', confidence: 0.03 }
        ],
        // Posición 2: Vidrio
        [
            { class_id: 4, class_name: 'GLASS', confidence: 0.78 },
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.15 },
            { class_id: 5, class_name: 'METAL', confidence: 0.07 }
        ],
        // Posición 3: Residuos mixtos
        [
            { class_id: 9, class_name: 'TRASH', confidence: 0.82 },
            { class_id: 1, class_name: 'BIOLOGICAL', confidence: 0.10 },
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.08 }
        ],
        // Posición 4: Metales
        [
            { class_id: 5, class_name: 'METAL', confidence: 0.75 },
            { class_id: 0, class_name: 'BATTERY', confidence: 0.20 },
            { class_id: 4, class_name: 'GLASS', confidence: 0.05 }
        ],
        // Posición 5: Textiles
        [
            { class_id: 3, class_name: 'CLOTHES', confidence: 0.70 },
            { class_id: 8, class_name: 'SHOES', confidence: 0.20 },
            { class_id: 6, class_name: 'PAPER', confidence: 0.10 }
        ],
        // Posición 6: Cartón
        [
            { class_id: 2, class_name: 'CARDBOARD', confidence: 0.88 },
            { class_id: 6, class_name: 'PAPER', confidence: 0.08 },
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.04 }
        ],
        // Posición 7: Plásticos y biológicos
        [
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.65 },
            { class_id: 1, class_name: 'BIOLOGICAL', confidence: 0.25 },
            { class_id: 9, class_name: 'TRASH', confidence: 0.10 }
        ],
        // Posición 8: Vidrio y metales
        [
            { class_id: 4, class_name: 'GLASS', confidence: 0.72 },
            { class_id: 5, class_name: 'METAL', confidence: 0.18 },
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.10 }
        ],
        // Posición 9: Baterías
        [
            { class_id: 0, class_name: 'BATTERY', confidence: 0.68 },
            { class_id: 5, class_name: 'METAL', confidence: 0.22 },
            { class_id: 7, class_name: 'PLASTIC', confidence: 0.10 }
        ],
        // Posición 10: Orgánicos
        [
            { class_id: 1, class_name: 'BIOLOGICAL', confidence: 0.80 },
            { class_id: 9, class_name: 'TRASH', confidence: 0.15 },
            { class_id: 6, class_name: 'PAPER', confidence: 0.05 }
        ]
    ];

    const index = Math.min(position - 1, combinations.length - 1);
    return combinations[index] || combinations[0];
};

export default function ClassificationDashboard({
                                                    isOpen,
                                                    onClose,
                                                    location,
                                                    dept,
                                                    district,
                                                    alertCount = 0,
                                                    rankingPosition = 1
                                                }: ClassificationDashboardProps) {
    const [results, setResults] = useState<ClassificationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [analysisTime, setAnalysisTime] = useState(0);
    const [previousPosition, setPreviousPosition] = useState<number>(rankingPosition);

    useEffect(() => {
        if (previousPosition !== rankingPosition) {
            setPreviousPosition(rankingPosition);
            setResults([]);
            setLoading(true);
            setAnalysisTime(0);
        }

        if (isOpen) {
            const startTime = Date.now();
            setLoading(true);

            const timer = setTimeout(() => {
                const mockResults = generateResultsForPosition(rankingPosition);
                setResults(mockResults);
                setAnalysisTime((Date.now() - startTime) / 1000);
                setLoading(false);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isOpen, rankingPosition, previousPosition]);

    useEffect(() => {
        return () => {
            setResults([]);
            setLoading(true);
            setAnalysisTime(0);
        };
    }, []);

    if (!isOpen) return null;

    const topResult = results[0] || { class_id: 0, class_name: 'N/A', confidence: 0 };
    const severityInfo = classSeverity[topResult.class_id] || {
        level: 'Desconocido',
        color: 'bg-gray-600',
        impact: 'Sin clasificar',
        recommendation: 'Realizar análisis adicional',
        riskLevel: 'Riesgo Desconocido',
        riskColor: 'text-gray-700',
        priority: '❓ Prioridad Desconocida'
    };

    const IconComponent = classIcons[topResult.class_id] || Trash2;

    // Determinar el nivel de riesgo basado en el rankingPosition y el material
    const getRiskLevelByPosition = (position: number, severityLevel: string) => {
        // Si es top 3, siempre es riesgo extremo o alto
        if (position <= 3) {
            return {
                label: 'Riesgo Extremo',
                color: 'text-red-700',
                bg: 'bg-red-100',
                border: 'border-red-300',
                emoji: '🔴'
            };
        }

        // Si es top 5, riesgo alto
        if (position <= 5) {
            return {
                label: 'Riesgo Alto',
                color: 'text-orange-700',
                bg: 'bg-orange-100',
                border: 'border-orange-300',
                emoji: '🟠'
            };
        }

        // Basado en la severidad del material
        if (severityLevel === 'Crítico' || severityLevel === 'Muy Alto') {
            return {
                label: 'Riesgo Alto',
                color: 'text-orange-700',
                bg: 'bg-orange-100',
                border: 'border-orange-300',
                emoji: '🟠'
            };
        }

        if (severityLevel === 'Alto' || severityLevel === 'Medio-Alto') {
            return {
                label: 'Riesgo Medio-Alto',
                color: 'text-yellow-700',
                bg: 'bg-yellow-100',
                border: 'border-yellow-300',
                emoji: '🟡'
            };
        }

        if (severityLevel === 'Medio') {
            return {
                label: 'Riesgo Medio',
                color: 'text-blue-700',
                bg: 'bg-blue-100',
                border: 'border-blue-300',
                emoji: '🔵'
            };
        }

        return {
            label: 'Riesgo Bajo',
            color: 'text-green-700',
            bg: 'bg-green-100',
            border: 'border-green-300',
            emoji: '🟢'
        };
    };

    const riskInfo = getRiskLevelByPosition(rankingPosition, severityInfo.level);

    // Obtener emoji según la posición
    const getPositionEmoji = (pos: number) => {
        const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        return emojis[pos - 1] || '📍';
    };

    // Obtener la prioridad basada en la posición
    const getPriorityMessage = (position: number) => {
        if (position <= 3) {
            return {
                message: '⚠️ PRIORIDAD URGENTE: Este punto está entre los 3 más críticos del ranking',
                className: 'text-red-600 bg-red-50 border-red-200'
            };
        }
        if (position <= 5) {
            return {
                message: '⚡ ALTA PRIORIDAD: Este punto requiere atención inmediata',
                className: 'text-orange-600 bg-orange-50 border-orange-200'
            };
        }
        if (position <= 8) {
            return {
                message: '📌 PRIORIDAD MEDIA: Monitoreo regular requerido',
                className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
            };
        }
        return {
            message: '✅ PRIORIDAD NORMAL: Mantener vigilancia rutinaria',
            className: 'text-green-600 bg-green-50 border-green-200'
        };
    };

    const priorityInfo = getPriorityMessage(rankingPosition);

    return (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-6 rounded-t-3xl z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{getPositionEmoji(rankingPosition)}</span>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Dashboard de Clasificación
                                </h2>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                    #{rankingPosition} - {alertCount} Alertas
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span className="font-medium">{district}, {dept}</span>
                                </div>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Análisis en {analysisTime.toFixed(1)}s</span>
                                </div>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                                <span className="text-emerald-600 font-medium">🟢 Sistema Activo</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-500 font-medium">Analizando residuos en {location}...</p>
                            <p className="text-sm text-slate-400">Modelo de clasificación de residuos en proceso</p>
                        </div>
                    ) : (
                        <>
                            {/* Prioridad - Banner destacado */}
                            <div className={`rounded-2xl p-4 border-2 ${priorityInfo.className} flex items-center gap-3`}>
                                <span className="text-2xl">{priorityInfo.message.split(' ')[0]}</span>
                                <p className="font-bold text-sm flex-1">{priorityInfo.message}</p>
                            </div>

                            {/* Resumen crítico */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className={`bg-gradient-to-br ${riskInfo.bg} border-2 ${riskInfo.border} rounded-2xl p-4 transition-all hover:shadow-md`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase">Nivel de Riesgo</p>
                                            <p className={`text-2xl font-black ${riskInfo.color}`}>
                                                {riskInfo.emoji} {riskInfo.label}
                                            </p>
                                        </div>
                                        <AlertTriangle className={`w-8 h-8 ${riskInfo.color}`} />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 uppercase">Material Principal</p>
                                            <p className="text-2xl font-black text-amber-700">{topResult.class_name}</p>
                                        </div>
                                        <div className={`p-2 rounded-full ${classColors[topResult.class_id] || 'bg-gray-500'} text-white`}>
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 uppercase">Confianza</p>
                                            <p className="text-2xl font-black text-blue-700">{(topResult.confidence * 100).toFixed(1)}%</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-blue-500" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-purple-600 uppercase">Criticidad</p>
                                            <p className="text-2xl font-black text-purple-700">{severityInfo.level}</p>
                                        </div>
                                        <AlertCircle className="w-8 h-8 text-purple-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Gráfico de resultados */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        Distribución de residuos detectados
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        Punto crítico #{rankingPosition}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {results.map((result, index) => {
                                        const severity = classSeverity[result.class_id] || {
                                            level: 'Desconocido',
                                            color: 'bg-gray-600',
                                            impact: 'Sin clasificar'
                                        };
                                        const Icon = classIcons[result.class_id] || Trash2;
                                        return (
                                            <div key={index} className="bg-white rounded-xl p-3 border border-slate-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${classColors[result.class_id] || 'bg-gray-500'} text-white`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-700">{result.class_name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severity.color} text-white`}>
                                                            {severity.level}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-600">
                                                        {(result.confidence * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${severity.color}`}
                                                        style={{ width: `${result.confidence * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recomendaciones personalizadas */}
                            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-emerald-100 p-2 rounded-xl">
                                        <span className="text-2xl">💡</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3">
                                            Recomendaciones para {location} (Punto #{rankingPosition})
                                        </h4>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>
                                                    <strong className="text-slate-800">Material detectado:</strong> {topResult.class_name} - {severityInfo.impact}
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>
                                                    <strong className="text-slate-800">Nivel de riesgo:</strong> {riskInfo.label}
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>{severityInfo.recommendation}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>
                                                    <strong className="text-slate-800">Criticidad {severityInfo.level}:</strong> {rankingPosition <= 3 ? 'Requiere intervención inmediata' : 'Requiere intervención prioritaria'}
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>Notificar a la municipalidad para acciones de limpieza y monitoreo continuo</span>
                                            </li>
                                            {rankingPosition <= 3 && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-0.5">⚠️</span>
                                                    <span className="font-bold text-red-600">
                                                        PRIORIDAD URGENTE: Este punto está entre los 3 más críticos del ranking
                                                    </span>
                                                </li>
                                            )}
                                            {rankingPosition >= 8 && (
                                                <li className="flex items-start gap-2">
                                                    <span className="text-green-500 mt-0.5">✅</span>
                                                    <span className="font-bold text-green-600">
                                                        Este punto muestra indicios de mejora, continuar con monitoreo regular
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Acciones rápidas */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => {
                                        alert(`📤 Notificación enviada a la municipalidad de ${district}
📍 Punto crítico #{rankingPosition}
🏷️ Material principal: ${topResult.class_name}
⚠️ Nivel de riesgo: ${riskInfo.label}
🔴 Prioridad: ${rankingPosition <= 3 ? 'URGENTE' : 'ALTA'}`);
                                    }}
                                    className="flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>📤</span>
                                    Notificar a Municipalidad
                                </button>
                                <button
                                    onClick={() => {
                                        const report = {
                                            location: { district, dept },
                                            rankingPosition,
                                            results,
                                            severity: severityInfo,
                                            riskLevel: riskInfo.label,
                                            priority: priorityInfo.message,
                                            timestamp: new Date().toISOString()
                                        };
                                        console.log('📄 Reporte generado:', report);
                                        alert(`✅ Reporte del punto #{rankingPosition} generado en consola`);
                                    }}
                                    className="flex-1 min-w-[150px] bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>📄</span>
                                    Generar Reporte
                                </button>
                                <button
                                    onClick={() => {
                                        alert(`📱 Compartir análisis del punto #{rankingPosition} - ${district}`);
                                    }}
                                    className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>📱</span>
                                    Compartir
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 min-w-[150px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>✕</span>
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}