// components/UI/ImageAnalysisModal.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import {
    X,
    Upload,
    Loader2,
    Camera,
    Trash2,
    Download,
    FileText,
    FileSpreadsheet,
    Printer,
    Share2,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    BarChart3,
    PieChart,
    FileJson,
    FileDown
} from 'lucide-react';

interface AnalysisResult {
    model2?: {
        category: string;
        confidence: number;
        probabilities: Record<string, number>;
        timestamp?: string;
        modelInfo?: {
            name: string;
            version: string;
            accuracy: number;
        };
    };
    error?: string;
}

interface ImageAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    alertId?: string;
}

// Datos simulados para el modelo 2 - Clasificación específica de residuos
const generateMockResults = (): AnalysisResult => {
    const categories = [
        { name: 'Plástico PET', prob: 0.92 },
        { name: 'Vidrio', prob: 0.03 },
        { name: 'Papel/Cartón', prob: 0.02 },
        { name: 'Metal', prob: 0.02 },
        { name: 'Orgánico', prob: 0.01 }
    ];

    const probabilities: Record<string, number> = {};
    categories.forEach(cat => {
        probabilities[cat.name] = cat.prob * 100;
    });

    return {
        model2: {
            category: categories[0].name,
            confidence: categories[0].prob * 100,
            probabilities: probabilities,
            timestamp: new Date().toISOString(),
            modelInfo: {
                name: 'ResNet-50 Fine-tuned',
                version: 'v2.1.0',
                accuracy: 94.7
            }
        }
    };
};

export default function ImageAnalysisModal({ isOpen, onClose, alertId }: ImageAnalysisModalProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'html' | 'pdf'>('json');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Manejar arrastre
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleFileSelect(file);
            } else {
                setError('Por favor, solo sube imágenes (JPG, PNG, JPEG)');
            }
        }
    }, []);

    const handleFileSelect = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setError('La imagen es demasiado grande (máximo 10MB)');
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setAnalysisResult(null);
        setError(null);
        setExportSuccess(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) {
            setError('Por favor selecciona una imagen');
            return;
        }

        setLoading(true);
        setError(null);
        setAnalysisResult(null);
        setExportSuccess(false);

        try {
            // Simular análisis - Aquí iría la llamada a tu API real
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generar resultados simulados
            const result = generateMockResults();

            if (result.error) {
                setError(result.error);
            } else {
                setAnalysisResult(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al analizar la imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSelectedImage(null);
        setPreview(null);
        setAnalysisResult(null);
        setError(null);
        setExportSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Exportar resultados
    const handleExport = async (format: 'json' | 'csv' | 'html' | 'pdf') => {
        if (!analysisResult || !analysisResult.model2) {
            setError('No hay resultados para exportar');
            return;
        }

        setIsExporting(true);
        setExportSuccess(false);

        try {
            const exportData = {
                metadata: {
                    alertId: alertId || 'N/A',
                    analysisDate: new Date().toISOString(),
                    modelName: analysisResult.model2.modelInfo?.name || 'ResNet-50',
                    modelVersion: analysisResult.model2.modelInfo?.version || 'v2.1.0',
                    imageName: selectedImage?.name || 'unknown.jpg',
                    imageSize: selectedImage?.size ? `${(selectedImage.size / 1024).toFixed(2)} KB` : 'N/A',
                    timestamp: analysisResult.model2.timestamp || new Date().toISOString()
                },
                results: {
                    category: analysisResult.model2.category,
                    confidence: analysisResult.model2.confidence,
                    probabilities: analysisResult.model2.probabilities,
                    modelInfo: analysisResult.model2.modelInfo
                },
                summary: {
                    bestCategory: analysisResult.model2.category,
                    bestConfidence: analysisResult.model2.confidence,
                    modelUsed: analysisResult.model2.modelInfo?.name || 'ResNet-50'
                }
            };

            let content: string | Blob;
            let filename: string;
            let mimeType: string;

            switch (format) {
                case 'json':
                    content = JSON.stringify(exportData, null, 2);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.json`;
                    mimeType = 'application/json';
                    break;

                case 'csv':
                    content = generateCSV(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.csv`;
                    mimeType = 'text/csv';
                    break;

                case 'html':
                    content = generateHTMLReport(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.html`;
                    mimeType = 'text/html';
                    break;

                case 'pdf':
                    content = generateHTMLReport(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.html`;
                    mimeType = 'text/html';
                    break;

                default:
                    throw new Error('Formato no soportado');
            }

            // Descargar
            const blob = new Blob([content as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);

        } catch (err) {
            setError(`Error al exportar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Generar CSV
    const generateCSV = (data: any) => {
        const rows = [
            ['=== METADATOS ==='],
            ['Alerta ID', data.metadata.alertId],
            ['Fecha Análisis', data.metadata.analysisDate],
            ['Modelo', data.metadata.modelName],
            ['Versión', data.metadata.modelVersion],
            ['Imagen', data.metadata.imageName],
            ['Tamaño', data.metadata.imageSize],
            [],
            ['=== RESULTADOS ==='],
            ['Categoría', data.results.category],
            ['Confianza', `${data.results.confidence.toFixed(2)}%`],
            [],
            ['=== PROBABILIDADES ==='],
            ...Object.entries(data.results.probabilities).map(([cat, prob]) => [
                cat,
                `${(prob as number).toFixed(2)}%`
            ]),
            [],
            ['=== RESUMEN ==='],
            ['Mejor Categoría', data.summary.bestCategory],
            ['Confianza Máxima', `${data.summary.bestConfidence.toFixed(2)}%`],
            ['Modelo Usado', data.summary.modelUsed]
        ];

        return rows.map(row => row.join(',')).join('\n');
    };

    // Generar HTML Report
    const generateHTMLReport = (data: any) => {
        const getConfidenceColor = (confidence: number) => {
            if (confidence > 80) return '#10b981';
            if (confidence > 60) return '#f59e0b';
            if (confidence > 40) return '#f97316';
            return '#ef4444';
        };

        const getConfidenceEmoji = (confidence: number) => {
            if (confidence > 80) return '🟢';
            if (confidence > 60) return '🟡';
            if (confidence > 40) return '🟠';
            return '🔴';
        };

        const probabilitiesHTML = Object.entries(data.results.probabilities)
            .map(([cat, prob]) => `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 3px;">
                        <span>${cat}</span>
                        <span style="font-weight: 500;">${(prob as number).toFixed(2)}%</span>
                    </div>
                    <div style="width: 100%; background: #f3f4f6; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${Math.min((prob as number), 100)}%; height: 100%; background: ${getConfidenceColor(prob as number)}; border-radius: 3px; transition: width 0.5s;"></div>
                    </div>
                </div>
            `).join('');

        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte de Análisis - Residuos</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f8fafc;
                    color: #1e293b;
                    padding: 40px 20px;
                    line-height: 1.6;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #10b981, #3b82f6);
                    color: white;
                    padding: 40px 50px;
                }
                .header h1 { font-size: 28px; margin-bottom: 8px; }
                .header p { opacity: 0.9; font-size: 14px; }
                .badge {
                    display: inline-block;
                    background: rgba(255,255,255,0.2);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    margin-top: 8px;
                }
                .content { padding: 40px 50px; }
                .section {
                    margin-bottom: 32px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 24px;
                }
                .section:last-child { border-bottom: none; margin-bottom: 0; }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #0f172a;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .card {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .card-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
                .card-value { font-size: 18px; font-weight: 600; color: #0f172a; }
                .result-card {
                    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                    border: 2px solid #10b981;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    text-align: center;
                }
                .result-card .category {
                    font-size: 32px;
                    font-weight: 700;
                    color: #065f46;
                    margin-bottom: 4px;
                }
                .result-card .confidence {
                    font-size: 16px;
                    color: #059669;
                }
                .result-card .model-info {
                    font-size: 13px;
                    color: #64748b;
                    margin-top: 8px;
                }
                .probabilities-section {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                }
                .probabilities-section h4 {
                    font-size: 14px;
                    color: #475569;
                    margin-bottom: 12px;
                }
                .footer {
                    background: #f1f5f9;
                    padding: 20px 50px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                }
                .footer p { margin-bottom: 4px; }
                @media print {
                    body { background: white; padding: 0; }
                    .container { box-shadow: none; border-radius: 0; }
                    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                @media (max-width: 600px) {
                    .header { padding: 24px 20px; }
                    .content { padding: 24px 20px; }
                    .footer { padding: 16px 20px; }
                    .grid-2 { grid-template-columns: 1fr; }
                    .result-card .category { font-size: 24px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>♻️ Reporte de Análisis de Residuos</h1>
                    <p>Clasificación inteligente con IA - Alerta #${data.metadata.alertId}</p>
                    <span class="badge">${new Date(data.metadata.analysisDate).toLocaleString('es-PE')}</span>
                </div>

                <div class="content">
                    <!-- Resultado Principal -->
                    <div class="result-card">
                        <div class="category">${data.results.category}</div>
                        <div class="confidence">${getConfidenceEmoji(data.results.confidence)} Confianza: ${data.results.confidence.toFixed(2)}%</div>
                        <div class="model-info">
                            ${data.results.modelInfo?.name || 'ResNet-50'} v${data.results.modelInfo?.version || '2.1.0'} 
                            • Precisión: ${data.results.modelInfo?.accuracy || 94.7}%
                        </div>
                    </div>

                    <!-- Metadatos -->
                    <div class="section">
                        <h3 class="section-title">📋 Metadatos</h3>
                        <div class="grid-2">
                            <div class="card">
                                <div class="card-label">Alerta ID</div>
                                <div class="card-value">#${data.metadata.alertId}</div>
                            </div>
                            <div class="card">
                                <div class="card-label">Fecha Análisis</div>
                                <div class="card-value">${new Date(data.metadata.analysisDate).toLocaleString('es-PE')}</div>
                            </div>
                            <div class="card">
                                <div class="card-label">Modelo</div>
                                <div class="card-value">${data.metadata.modelName}</div>
                            </div>
                            <div class="card">
                                <div class="card-label">Imagen</div>
                                <div class="card-value" style="font-size: 14px;">${data.metadata.imageName}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Probabilidades -->
                    <div class="section">
                        <h3 class="section-title">📊 Distribución de Probabilidades</h3>
                        <div class="probabilities-section">
                            <h4>Probabilidad por categoría</h4>
                            ${probabilitiesHTML}
                        </div>
                    </div>

                    <!-- Resumen -->
                    <div class="section">
                        <h3 class="section-title">🎯 Resumen Ejecutivo</h3>
                        <div class="grid-2">
                            <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
                                <div class="card-label">Categoría Detectada</div>
                                <div class="card-value" style="color: #1e40af;">${data.summary.bestCategory}</div>
                            </div>
                            <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
                                <div class="card-label">Nivel de Confianza</div>
                                <div class="card-value" style="color: #059669;">${data.summary.bestConfidence.toFixed(2)}%</div>
                            </div>
                        </div>
                        <div style="margin-top: 12px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                            <p style="font-size: 14px; color: #92400e;">
                                💡 <strong>Recomendación:</strong> Basado en el análisis, se recomienda 
                                ${data.results.category.toLowerCase().includes('plástico') ? 'reciclar en plantas especializadas' :
            data.results.category.toLowerCase().includes('vidrio') ? 'llevar a centros de reciclaje de vidrio' :
                data.results.category.toLowerCase().includes('papel') ? 'separar para reciclaje de papel y cartón' :
                    'disponer según normativa local'}.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Reporte generado por Sistema de Gestión de Residuos Inteligente</p>
                    <p style="font-size: 10px;">${new Date().toISOString()}</p>
                </div>
            </div>
        </body>
        </html>`;
    };

    // Renderizar barra de probabilidades
    const renderProbabilityBar = (label: string, value: number) => {
        const percentage = Math.min(value, 100);
        const color = percentage > 80 ? 'bg-emerald-500' :
            percentage > 60 ? 'bg-yellow-500' :
                percentage > 40 ? 'bg-orange-500' :
                    'bg-red-500';

        return (
            <div key={label} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-500 font-medium">{value.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`${color} h-2 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>🧪</span> Análisis de Residuos
                            {alertId && (
                                <span className="text-sm font-normal text-white/80 ml-2">
                                    Alerta #{alertId}
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-white/80">Clasificación inteligente con IA - Modelo ResNet-50</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                    {/* Área de arrastre y subida */}
                    <div
                        ref={dropZoneRef}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center 
                            transition-all duration-300 cursor-pointer
                            ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-gray-300 hover:border-emerald-400 bg-gray-50/50 hover:bg-gray-50'}
                            ${preview ? 'p-2' : 'p-12'}
                        `}
                        onClick={() => !preview && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        {preview ? (
                            <div className="relative group">
                                <img
                                    src={preview}
                                    alt="Vista previa"
                                    className="max-h-72 mx-auto rounded-lg object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cambiar imagen
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClear();
                                        }}
                                        className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className={`
                                    w-20 h-20 mx-auto mb-4 rounded-full 
                                    flex items-center justify-center transition-all duration-300
                                    ${isDragging ? 'bg-emerald-100 scale-110' : 'bg-gray-100'}
                                `}>
                                    {isDragging ? (
                                        <Upload className="w-10 h-10 text-emerald-500 animate-bounce" />
                                    ) : (
                                        <Upload className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-gray-600 font-medium text-lg mb-1">
                                    {isDragging ? 'Suelta la imagen aquí' : 'Arrastra y suelta tu imagen'}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    o haz clic para seleccionar un archivo
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">📷 JPG</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">🖼️ PNG</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">📐 Max 10MB</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Acciones */}
                    {selectedImage && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="flex-1 min-w-[180px] bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analizando con IA...
                                    </>
                                ) : (
                                    <>
                                        <span>🔍</span> Analizar imagen
                                    </>
                                )}
                            </button>

                            {analysisResult && !analysisResult.error && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExport('json')}
                                        disabled={isExporting}
                                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        title="Exportar JSON"
                                    >
                                        <FileJson className="w-4 h-4" />
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        disabled={isExporting}
                                        className="px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        title="Exportar CSV"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('html')}
                                        disabled={isExporting}
                                        className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        title="Exportar HTML"
                                    >
                                        <FileText className="w-4 h-4" />
                                        HTML
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        disabled={isExporting}
                                        className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                                        title="Exportar PDF"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensaje de exportación exitosa */}
                    {exportSuccess && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-emerald-700 text-sm font-medium">¡Exportación completada con éxito!</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-600 font-medium text-sm">Error</p>
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Resultados */}
                    {analysisResult && analysisResult.model2 && (
                        <div className="mt-6 space-y-4">
                            {/* Tarjeta de resultado principal */}
                            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                            Resultado del análisis
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {analysisResult.model2.category}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                                            <span className="text-sm text-gray-500">Confianza</span>
                                            <span className="text-xl font-bold text-emerald-600">
                                                {analysisResult.model2.confidence.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-400">Modelo</p>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {analysisResult.model2.modelInfo?.name || 'ResNet-50'}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-400">Versión</p>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {analysisResult.model2.modelInfo?.version || 'v2.1.0'}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-400">Precisión</p>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {analysisResult.model2.modelInfo?.accuracy || 94.7}%
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-400">Alerta</p>
                                        <p className="text-sm font-semibold text-gray-700">
                                            #{alertId || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Probabilidades */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Distribución de probabilidades
                                </h4>
                                <div className="space-y-2">
                                    {Object.entries(analysisResult.model2.probabilities).map(([category, prob]) =>
                                        renderProbabilityBar(category, prob as number)
                                    )}
                                </div>
                            </div>

                            {/* Recomendaciones */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <h5 className="font-semibold text-amber-800 text-sm">Recomendación</h5>
                                        <p className="text-sm text-amber-700 mt-1">
                                            {analysisResult.model2.category.toLowerCase().includes('plástico') &&
                                                'El material identificado es plástico. Se recomienda separar para reciclaje en plantas especializadas.'}
                                            {analysisResult.model2.category.toLowerCase().includes('vidrio') &&
                                                'El material identificado es vidrio. Se recomienda llevar a centros de reciclaje de vidrio.'}
                                            {analysisResult.model2.category.toLowerCase().includes('papel') &&
                                                'El material identificado es papel/cartón. Se recomienda separar para reciclaje de papel y cartón.'}
                                            {analysisResult.model2.category.toLowerCase().includes('metal') &&
                                                'El material identificado es metal. Se recomienda reciclar en chatarrerías autorizadas.'}
                                            {analysisResult.model2.category.toLowerCase().includes('orgánico') &&
                                                'El material identificado es orgánico. Se recomienda compostaje o disposición adecuada.'}
                                            {!analysisResult.model2.category.toLowerCase().includes('plástico') &&
                                                !analysisResult.model2.category.toLowerCase().includes('vidrio') &&
                                                !analysisResult.model2.category.toLowerCase().includes('papel') &&
                                                !analysisResult.model2.category.toLowerCase().includes('metal') &&
                                                !analysisResult.model2.category.toLowerCase().includes('orgánico') &&
                                                'Se recomienda disponer según normativa local vigente.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Información adicional */}
                    {analysisResult && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span>🧠</span> IA con ResNet-50
                                </span>
                                <span className="flex items-center gap-1">
                                    <span>📊</span> Precisión {analysisResult.model2?.modelInfo?.accuracy || 94.7}%
                                </span>
                                <span className="flex items-center gap-1">
                                    <span>♻️</span> Promueve reciclaje
                                </span>
                                <span className="flex items-center gap-1">
                                    <span>📋</span> Exporta en 4 formatos
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}