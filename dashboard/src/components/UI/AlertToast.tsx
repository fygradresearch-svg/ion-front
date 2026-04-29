'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Navigation } from 'lucide-react';

interface AlertToastProps {
  show: boolean;
  onClose: () => void;
  message: string;
  onNotify?: () => void;
  onShowInfo?: () => void;
}

export default function AlertToast({ show, onClose, message, onNotify, onShowInfo }: AlertToastProps) {
  const [shouldPlaySound, setShouldPlaySound] = useState(false);

  useEffect(() => {
    if (show) {
      // Reproducir sonido de alerta (url pública)
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Bloqueo de audio:', e));
      
      // Aumentamos el tiempo a 15 segundos si hay botones de acción
      const timer = setTimeout(() => {
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right duration-500 max-w-sm w-full">
      <div className="bg-white border-2 border-red-500 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden relative">
        {/* Decorative background accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 animate-pulse"></div>
        
        <div className="flex items-start gap-4">
          <div className="bg-red-50 p-3 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-black text-red-700 leading-tight mb-1">
                ALERTA DE PROXIMIDAD
              </h3>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">
              {message}
            </p>

            {message.includes('mascarilla') && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
                <div className="bg-red-600 p-1.5 rounded-full">
                  <Navigation className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-black text-red-700 uppercase tracking-wide">
                  Usa Mascarilla: Zona de Riesgo
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Navigation className="w-3 h-3" />
              Radio Crítico (20 metros)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2 mt-2">
          <button 
            onClick={() => {
              onNotify?.();
              onClose();
            }}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg shadow-red-100 flex items-center justify-center gap-2"
          >
            Notificar a la Municipalidad
          </button>
          
          <button 
            onClick={onShowInfo}
            className="w-full bg-slate-100 text-slate-800 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Reglamentos & Entidades
          </button>
        </div>
      </div>
    </div>
  );
}
