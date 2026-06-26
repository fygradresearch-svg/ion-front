'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, MapPin, CheckCircle } from 'lucide-react';
import { getCategoryInfo, formatConfidence } from '@/lib/wasteCategories';

interface CreatePointModalProps {
    lat: number;
    lng: number;
    onClose: () => void;
    onSuccess: (result: {
        image_url: string;
        prediction: { class: string; confidence: number };
    }) => void;
}

export default function CreatePointModal({ lat, lng, onClose, onSuccess }: CreatePointModalProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ class: string; confidence: number; image_url: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImage(file);
        setError(null);
        setResult(null);

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!selectedImage) {
            setError('Selecciona una imagen de evidencia');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('lat', lat.toString());
            formData.append('lng', lng.toString());
            formData.append('image', selectedImage);

            const response = await fetch('/api/create-point', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Error al crear el punto');
            }

            const prediction = data.prediction;
            setResult({
                class: prediction.class,
                confidence: prediction.confidence,
                image_url: data.image_url,
            });

            setTimeout(() => {
                onSuccess({ image_url: data.image_url, prediction });
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar el punto');
        } finally {
            setLoading(false);
        }
    };

    const category = result ? getCategoryInfo(result.class) : null;
    const confidencePercent = result ? formatConfidence(result.confidence) : 0;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-base">Registrar punto de residuos</h2>
                        <p className="text-violet-200 text-xs mt-0.5">Sube evidencia en la ubicación seleccionada</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
                        <div className="text-xs text-slate-600">
                            <span className="font-bold text-slate-800">Coordenadas: </span>
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                        </div>
                    </div>

                    <div
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer"
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
                            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 font-medium">Haz clic para subir imagen</p>
                                <p className="text-xs text-slate-400 mt-1">JPG, PNG (evidencia fotográfica)</p>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-red-600 text-xs">{error}</p>
                        </div>
                    )}

                    {result && category && (
                        <div
                            className="rounded-xl p-3 border animate-in fade-in"
                            style={{ backgroundColor: category.bg, borderColor: `${category.color}33` }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4" style={{ color: category.color }} />
                                <p className="text-xs font-bold text-slate-600 uppercase">Punto guardado y analizado</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{category.emoji}</span>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: category.color }}>{category.label}</p>
                                    <p className="text-xs text-slate-500">Confianza: {confidencePercent.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedImage || !!result}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analizando y guardando...
                            </>
                        ) : result ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                ¡Guardado!
                            </>
                        ) : (
                            '🔬 Analizar y guardar punto'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
