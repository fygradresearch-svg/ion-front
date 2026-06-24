// src/components/UI/ImageAnalysisModal.tsx
'use client';

import { useState, useRef } from 'react';
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
    CheckCircle
} from 'lucide-react';

interface AnalysisResult {
    model1?: {
        error: any;
        category: string;
        confidence: number;
        probabilities: Record<string, number>;
    };
    model2?: {
        error: any;
        category: string;
        confidence: number;
        probabilities: Record<string, number>;
    };
    error?: string;
}

interface ImageAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    alertId?: string;
}

export default function ImageAnalysisModal({ isOpen, onClose, alertId }: ImageAnalysisModalProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelType, setModelType] = useState<'both' | 'model1' | 'model2'>('both');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setAnalysisResult(null);
            setError(null);
            setExportSuccess(false);
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
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('modelType', modelType);

            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error en el análisis');
            }

            const result = await response.json();

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

    // Función para exportar resultados
    const handleExport = async (format: 'pdf' | 'excel' | 'json' | 'html') => {
        if (!analysisResult) {
            setError('No hay resultados para exportar');
            return;
        }

        setIsExporting(true);
        setExportSuccess(false);

        try {
            // Preparar datos para exportación
            const exportData = {
                metadata: {
                    alertId: alertId || 'N/A',
                    analysisDate: new Date().toISOString(),
                    modelType: modelType,
                    imageName: selectedImage?.name || 'unknown.jpg',
                    imageSize: selectedImage?.size ? `${(selectedImage.size / 1024).toFixed(2)} KB` : 'N/A',
                },
                results: analysisResult,
                summary: generateSummary(analysisResult)
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

                case 'html':
                    content = generateHTMLReport(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.html`;
                    mimeType = 'text/html';
                    break;

                case 'excel':
                    content = generateCSVReport(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.csv`;
                    mimeType = 'text/csv';
                    break;

                case 'pdf':
                    // Para PDF, usamos HTML y luego convertimos a PDF (simulación)
                    content = generateHTMLReport(exportData);
                    filename = `analisis-residuos-${alertId || 'reporte'}-${Date.now()}.html`;
                    mimeType = 'text/html';
                    break;

                default:
                    throw new Error('Formato no soportado');
            }

            // Descargar archivo
            const blob = new Blob(
                [content as BlobPart],
                { type: mimeType }
            );
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

    // Generar resumen de resultados
    const generateSummary = (result: AnalysisResult) => {
        const summary = {
            bestCategory: '',
            bestConfidence: 0,
            modelUsed: '',
            totalModels: 0
        };

        if (result.model1 && !result.model1.error) {
            summary.totalModels++;
            if (result.model1.confidence > summary.bestConfidence) {
                summary.bestConfidence = result.model1.confidence;
                summary.bestCategory = result.model1.category;
                summary.modelUsed = 'Modelo 1';
            }
        }

        if (result.model2 && !result.model2.error) {
            summary.totalModels++;
            if (result.model2.confidence > summary.bestConfidence) {
                summary.bestConfidence = result.model2.confidence;
                summary.bestCategory = result.model2.category;
                summary.modelUsed = 'Modelo 2';
            }
        }

        return summary;
    };

    // Generar reporte CSV
    const generateCSVReport = (data: any) => {
        const rows = [
            ['Metadata', 'Valor'],
            ['Alerta ID', data.metadata.alertId],
            ['Fecha Análisis', data.metadata.analysisDate],
            ['Modelo', data.metadata.modelType],
            ['Imagen', data.metadata.imageName],
            ['Tamaño', data.metadata.imageSize],
            [],
            ['Resultados', ''],
        ];

        // Agregar resultados del modelo 1
        if (data.results.model1 && !data.results.model1.error) {
            rows.push(['MODELO 1 - Clasificación General', '']);
            rows.push(['Categoría', data.results.model1.category]);
            rows.push(['Confianza', `${data.results.model1.confidence.toFixed(2)}%`]);
            rows.push(['Probabilidades', '']);
            Object.entries(data.results.model1.probabilities).forEach(([cat, prob]) => {
                rows.push([`  ${cat}`, `${(prob as number).toFixed(2)}%`]);
            });
            rows.push([]);
        }

        // Agregar resultados del modelo 2
        if (data.results.model2 && !data.results.model2.error) {
            rows.push(['MODELO 2 - Clasificación Específica', '']);
            rows.push(['Categoría', data.results.model2.category]);
            rows.push(['Confianza', `${data.results.model2.confidence.toFixed(2)}%`]);
            rows.push(['Probabilidades', '']);
            Object.entries(data.results.model2.probabilities).forEach(([cat, prob]) => {
                rows.push([`  ${cat}`, `${(prob as number).toFixed(2)}%`]);
            });
            rows.push([]);
        }

        // Resumen
        rows.push(['RESUMEN', '']);
        rows.push(['Mejor Categoría', data.summary.bestCategory]);
        rows.push(['Confianza Máxima', `${data.summary.bestConfidence.toFixed(2)}%`]);
        rows.push(['Modelo Usado', data.summary.modelUsed]);
        rows.push(['Total Modelos', data.summary.totalModels]);

        return rows.map(row => row.join(',')).join('\n');
    };

    // Generar reporte HTML
    const generateHTMLReport = (data: any) => {
        const getConfidenceColor = (confidence: number) => {
            if (confidence > 70) return '#10b981';
            if (confidence > 40) return '#f59e0b';
            return '#ef4444';
        };

        const model1HTML = data.results.model1 && !data.results.model1.error ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h3 style="color: #1e40af; margin-bottom: 12px;">🧠 Modelo 1: Clasificación General</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #6b7280;">Categoría</p>
                        <p style="font-weight: bold; color: #1e40af;">${data.results.model1.category}</p>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #6b7280;">Confianza</p>
                        <p style="font-weight: bold; color: ${getConfidenceColor(data.results.model1.confidence)};">${data.results.model1.confidence.toFixed(2)}%</p>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px;">
                    <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Probabilidades</p>
                    ${Object.entries(data.results.model1.probabilities).map(([cat, prob]) => `
                        <div style="margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                                <span>${cat}</span>
                                <span>${(prob as number).toFixed(2)}%</span>
                            </div>
                            <div style="width: 100%; background: #e5e7eb; height: 4px; border-radius: 2px; overflow: hidden;">
                                <div style="width: ${Math.min((prob as number), 100)}%; height: 100%; background: ${getConfidenceColor(prob as number)};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const model2HTML = data.results.model2 && !data.results.model2.error ? `
            <div style="background: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h3 style="color: #6b21a8; margin-bottom: 12px;">🧠 Modelo 2: Clasificación Específica</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #6b7280;">Categoría</p>
                        <p style="font-weight: bold; color: #6b21a8;">${data.results.model2.category}</p>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 6px;">
                        <p style="font-size: 12px; color: #6b7280;">Confianza</p>
                        <p style="font-weight: bold; color: ${getConfidenceColor(data.results.model2.confidence)};">${data.results.model2.confidence.toFixed(2)}%</p>
                    </div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px;">
                    <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Probabilidades</p>
                    ${Object.entries(data.results.model2.probabilities).map(([cat, prob]) => `
                        <div style="margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                                <span>${cat}</span>
                                <span>${(prob as number).toFixed(2)}%</span>
                            </div>
                            <div style="width: 100%; background: #e5e7eb; height: 4px; border-radius: 2px; overflow: hidden;">
                                <div style="width: ${Math.min((prob as number), 100)}%; height: 100%; background: ${getConfidenceColor(prob as number)};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte de Análisis - Residuos</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background: #f8fafc;
                    color: #1e293b;
                }
                .header {
                    background: linear-gradient(135deg, #10b981, #3b82f6);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
                .metadata {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                    border: 1px solid #e2e8f0;
                }
                .metadata-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .metadata-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 13px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .metadata-item:last-child { border-bottom: none; }
                .metadata-label { color: #64748b; }
                .metadata-value { font-weight: 500; }
                .summary {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                }
                .summary-item {
                    text-align: center;
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                }
                .summary-item .value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #059669;
                }
                .summary-item .label {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 4px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                }
                @media print {
                    body { background: white; padding: 20px; }
                    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .summary-item .value { color: #059669 !important; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Reporte de Análisis de Residuos</h1>
                <p>Alerta #${data.metadata.alertId} - ${new Date(data.metadata.analysisDate).toLocaleString('es-PE')}</p>
            </div>

            <div class="metadata">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #475569;">📋 Metadatos</h3>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">Alerta ID</span>
                        <span class="metadata-value">#${data.metadata.alertId}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Fecha Análisis</span>
                        <span class="metadata-value">${new Date(data.metadata.analysisDate).toLocaleString('es-PE')}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Modelo</span>
                        <span class="metadata-value">${data.metadata.modelType}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Imagen</span>
                        <span class="metadata-value">${data.metadata.imageName}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Tamaño</span>
                        <span class="metadata-value">${data.metadata.imageSize}</span>
                    </div>
                </div>
            </div>

            ${data.results.model1 && !data.results.model1.error ? model1HTML : ''}
            ${data.results.model2 && !data.results.model2.error ? model2HTML : ''}

            <div class="summary">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #065f46;">🎯 Resumen</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="value">${data.summary.bestCategory}</div>
                        <div class="label">Mejor Categoría</div>
                    </div>
                    <div class="summary-item">
                        <div class="value">${data.summary.bestConfidence.toFixed(2)}%</div>
                        <div class="label">Confianza Máxima</div>
                    </div>
                    <div class="summary-item">
                        <div class="value">${data.summary.modelUsed}</div>
                        <div class="label">Modelo Usado</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Reporte generado por Sistema de Gestión de Residuos Inteligente</p>
                <p style="font-size: 10px;">${new Date().toISOString()}</p>
            </div>
        </body>
        </html>`;
    };

    const renderProbabilityBar = (label: string, value: number, maxValue: number = 100) => {
        const percentage = Math.min((value / maxValue) * 100, 100);
        const color = percentage > 70 ? 'bg-emerald-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500';

        return (
            <div key={label} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-500">{value.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className={`${color} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    };

    const renderAnalysisResult = () => {
        if (!analysisResult) return null;

        if (analysisResult.error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{analysisResult.error}</p>
                </div>
            );
        }

        return (
            <div className="space-y-6 mt-4">
                {/* Modelo 1 */}
                {analysisResult.model1 && !analysisResult.model1.error && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 text-sm mb-2">🧠 Modelo 1: Clasificación General</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-500">Categoría</p>
                                <p className="font-bold text-blue-700">{analysisResult.model1.category}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-500">Confianza</p>
                                <p className="font-bold text-emerald-600">{analysisResult.model1.confidence.toFixed(2)}%</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Probabilidades</p>
                            {Object.entries(analysisResult.model1.probabilities).map(([category, prob]) =>
                                renderProbabilityBar(category, prob)
                            )}
                        </div>
                    </div>
                )}

                {/* Modelo 2 */}
                {analysisResult.model2 && !analysisResult.model2.error && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 text-sm mb-2">🧠 Modelo 2: Clasificación Específica</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-500">Categoría</p>
                                <p className="font-bold text-purple-700">{analysisResult.model2.category}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-500">Confianza</p>
                                <p className="font-bold text-emerald-600">{analysisResult.model2.confidence.toFixed(2)}%</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Probabilidades</p>
                            {Object.entries(analysisResult.model2.probabilities).map(([category, prob]) =>
                                renderProbabilityBar(category, prob)
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            🧪 Análisis de Residuos
                            {alertId && <span className="text-sm font-normal text-gray-500 ml-2">Alerta #{alertId}</span>}
                        </h2>
                        <p className="text-xs text-gray-500">Clasificación inteligente de residuos con IA</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Selector de modelo */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modelo de clasificación
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setModelType('both')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    modelType === 'both'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Ambos modelos
                            </button>
                            <button
                                onClick={() => setModelType('model1')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    modelType === 'model1'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Modelo 1
                            </button>
                            <button
                                onClick={() => setModelType('model2')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    modelType === 'model2'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Modelo 2
                            </button>
                        </div>
                    </div>

                    {/* Upload area */}
                    <div className="mb-4">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            {preview ? (
                                <div className="relative">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-h-64 mx-auto rounded-lg object-contain"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClear();
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">Haz clic para subir una imagen</p>
                                    <p className="text-gray-400 text-sm">JPG, PNG, JPEG (max 10MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions - Análisis y Exportación */}
                    {selectedImage && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="flex-1 min-w-[120px] bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                                        Analizando...
                                    </>
                                ) : (
                                    '🔍 Analizar imagen'
                                )}
                            </button>

                            {/* Botones de exportación - solo si hay resultados */}
                            {analysisResult && !analysisResult.error && (
                                <div className="flex gap-2 w-full mt-2">
                                    <button
                                        onClick={() => handleExport('json')}
                                        disabled={isExporting}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <FileText className="w-4 h-4" />
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        disabled={isExporting}
                                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('html')}
                                        disabled={isExporting}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <Printer className="w-4 h-4" />
                                        HTML
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        disabled={isExporting}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensaje de éxito en exportación */}
                    {exportSuccess && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 animate-in fade-in">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <p className="text-emerald-700 text-sm font-medium">¡Exportación completada con éxito!</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Resultados */}
                    {analysisResult && renderAnalysisResult()}

                    {/* Información adicional */}
                    {analysisResult && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">
                                📋 Los modelos de IA analizan la imagen en tiempo real utilizando redes neuronales
                                entrenadas para identificar diferentes tipos de residuos.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                                <span>🕒 Análisis instantáneo</span>
                                <span>🧠 IA entrenada con miles de imágenes</span>
                                <span>♻️ Promueve el reciclaje</span>
                                <span>📊 Exporta resultados en múltiples formatos</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}