'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Navigation } from 'lucide-react';

interface AlertToastProps {
  show: boolean;
  onClose: () => void;
  message: string;
}

export default function AlertToast({ show, onClose, message }: AlertToastProps) {
  const [shouldPlaySound, setShouldPlaySound] = useState(false);

  useEffect(() => {
    if (show) {
      // Reproducir sonido de alerta (url pública)
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Bloqueo de audio:', e));
      
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right duration-500">
      <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl p-5 flex items-start gap-4 max-w-sm overflow-hidden relative">
        {/* Decorative background accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
        
        <div className="bg-red-50 p-3 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-black text-red-700 leading-tight mb-1">
            ALERTA DE PROXIMIDAD
          </h3>
          <p className="text-sm font-semibold text-slate-600 line-clamp-2">
            {message}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
            <Navigation className="w-3 h-3" />
            Radio de 50 metros
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
