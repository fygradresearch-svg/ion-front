'use client';

import { X, Shield, Book, Landmark, CheckCircle } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/95 backdrop-blur-md w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-black tracking-tight">Marco Regulatorio y Entidades</h2>
              <p className="text-emerald-100 text-sm font-medium">Información sobre normativas ambientales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-emerald-700/50 hover:bg-emerald-700 p-2 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section: ISO Regulations */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <Book className="w-5 h-5" />
              <h3 className="text-lg font-bold">Normativas ISO Relevantes</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="flex gap-3">
                  <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded text-xs h-fit">ISO 14001</span>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Sistema de Gestión Ambiental (SGA)</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Establece las herramientas para que las organizaciones controlen sus impactos ambientales y mejoren su comportamiento ambiental. Se enfoca en la prevención de la contaminación y el cumplimiento legal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="flex gap-3">
                  <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded text-xs h-fit">ISO 45001</span>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Seguridad y Salud en el Trabajo</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Crucial en zonas contaminadas para proteger a la comunidad y trabajadores. Asegura que los procesos de limpieza y mitigación sigan estándares de seguridad rigurosos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Involved Entities */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <Landmark className="w-5 h-5" />
              <h3 className="text-lg font-bold">Entidades Involucradas</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">OEFA (Organismo de Evaluación y Fiscalización Ambiental)</h4>
                  <p className="text-sm text-slate-600">Encargado de la fiscalización, supervisión y sanción en materia ambiental en el Perú.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">MINAM (Ministerio del Ambiente)</h4>
                  <p className="text-sm text-slate-600">Ente rector del sector ambiental que diseña y supervisa la política nacional del ambiente.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Gobiernos Locales (Municipalidades)</h4>
                  <p className="text-sm text-slate-600">Responsables de la gestión de residuos sólidos y fiscalización ambiental a nivel distrital.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Entendido
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
